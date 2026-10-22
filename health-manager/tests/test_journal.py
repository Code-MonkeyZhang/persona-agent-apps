"""Tests for the per-date journal store."""

from health_manager.journal import JournalStore


def test_write_read_and_list(tmp_path):
    store = JournalStore(tmp_path / "journal", tmp_path / "snapshots")
    store.write("2026-09-29", "复查，肌酐 106。", "肾内科复诊")
    store.write("2026-08-30", "复查，肌酐 107。", "肾内科复查")

    entries = store.list_entries()
    assert [e["date"] for e in entries] == ["2026-09-29", "2026-08-30"]
    assert entries[0]["title"] == "肾内科复诊"
    assert entries[0]["content"].startswith("# 肾内科复诊")

    full = store.read("2026-09-29")
    assert full is not None
    assert "肌酐 106" in full["content"]
    assert store.read("2020-01-01") is None


def test_write_keeps_existing_heading_without_title(tmp_path):
    store = JournalStore(tmp_path / "journal")
    store.write("2026-01-01", "# 自己写好的标题\n\n正文")
    entry = store.read("2026-01-01")
    assert entry["title"] == "自己写好的标题"
    assert entry["content"].count("#") == 1


def test_snapshots_keep_newest_five(tmp_path):
    store = JournalStore(tmp_path / "journal", tmp_path / "snapshots", keep=5)
    for i in range(8):
        store.write("2026-01-01", f"第 {i} 版")
    files = sorted((tmp_path / "snapshots" / "2026-01-01").glob("*.md"))
    assert len(files) == 5
    assert store.read("2026-01-01")["content"] == "第 7 版"


def test_mock_store_without_snapshots(tmp_path):
    store = JournalStore(tmp_path / "journal", snapshot_root=None)
    store.write("2026-01-01", "v1")
    store.write("2026-01-01", "v2")
    assert store.read("2026-01-01")["content"] == "v2"
    assert not (tmp_path / "journal_snapshots").exists()


def test_bad_date_rejected(tmp_path):
    store = JournalStore(tmp_path / "journal")
    for bad in ("../escape", "2026-1-1", "not-a-date"):
        try:
            store.write(bad, "x")
        except ValueError:
            pass
        else:
            raise AssertionError(f"{bad} should be rejected")
    assert store.list_entries() == []


def test_basics_lives_outside_timeline(tmp_path):
    store = JournalStore(tmp_path / "journal", tmp_path / "snapshots")
    store.write("2026-09-29", "复查。", "肾内科复查")
    store.write_basics("# 病史基础\n\n过敏史：无")

    assert store.read_basics() is not None
    assert "过敏史" in store.read_basics()["content"]
    # The reserved entry never joins the dated timeline.
    assert [e["date"] for e in store.list_entries()] == ["2026-09-29"]


def test_basics_absent_returns_none(tmp_path):
    store = JournalStore(tmp_path / "journal")
    assert store.read_basics() is None


def test_basics_overwrite_snapshots_old_version(tmp_path):
    store = JournalStore(tmp_path / "journal", tmp_path / "snapshots", keep=5)
    store.write_basics("v1")
    store.write_basics("v2")
    files = sorted((tmp_path / "snapshots" / "basics").glob("*.md"))
    assert len(files) == 1
    assert store.read_basics()["content"] == "v2"
