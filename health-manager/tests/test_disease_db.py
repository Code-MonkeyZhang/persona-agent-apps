"""Tests for the disease tables in HealthDB."""

from health_manager.db import HealthDB


def make_db(tmp_path):
    return HealthDB(tmp_path / "test.db")


def test_lab_record_returns_previous_comparison(tmp_path):
    db = make_db(tmp_path)
    first = db.record_lab_result(
        date="2026-08-30", category="生化检查", analyte="肌酐",
        value_num=107, unit="umol/L", ref_low=57, ref_high=97, abnormal_flag="H",
    )
    assert "prevValueNum" not in first

    second = db.record_lab_result(
        date="2026-09-29", category="生化检查", analyte="肌酐",
        value_num=106, unit="umol/L", ref_low=57, ref_high=97, abnormal_flag="H",
    )
    assert second["prevValueNum"] == 107
    assert second["prevDate"] == "2026-08-30"


def test_update_recomputes_flag(tmp_path):
    db = make_db(tmp_path)
    row = db.record_lab_result(
        date="2026-09-29", category="生化检查", analyte="肌酐",
        value_num=106, ref_low=57, ref_high=97, abnormal_flag="H",
    )
    fixed = db.update_lab_result(row["id"], value_num=90)
    assert fixed["valueNum"] == 90
    assert fixed["abnormalFlag"] is None

    # patching an unrelated field leaves the value and flag untouched
    noted = db.update_lab_result(row["id"], note="复查")
    assert noted["valueNum"] == 90
    assert noted["abnormalFlag"] is None

    assert db.update_lab_result(999, value_num=1) is None


def test_history_and_delete(tmp_path):
    db = make_db(tmp_path)
    for date, value in (("2026-03-08", 108), ("2026-08-30", 107), ("2026-09-29", 106)):
        db.record_lab_result(
            date=date, category="生化检查", analyte="肌酐",
            value_num=value, ref_low=57, ref_high=97, abnormal_flag="H",
        )
    assert [r["valueNum"] for r in db.get_lab_history("肌酐")] == [108, 107, 106]
    assert [r["valueNum"] for r in db.get_lab_history("肌酐", limit=2)] == [107, 106]

    assert db.delete_lab_result(2) is True
    assert db.delete_lab_result(2) is False
    assert len(db.get_lab_history("肌酐")) == 2


def test_imaging_entries_and_snapshot(tmp_path):
    db = make_db(tmp_path)
    db.record_imaging_finding("2020-10-13", "肾穿病理", "IgA 肾病 Lee IV 级")
    db.record_imaging_finding("2026-10-10", "腹部超声", "双肾形态正常")

    all_rows = db.get_imaging_entries()
    assert [r["examType"] for r in all_rows] == ["肾穿病理", "腹部超声"]
    assert [r["date"] for r in db.get_imaging_entries("腹部超声")] == ["2026-10-10"]

    snap = db.get_snapshot()
    assert set(snap["disease"]) == {"labResults", "imagingFindings"}
    assert len(snap["disease"]["imagingFindings"]) == 2
