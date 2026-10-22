"""One-shot import of the legacy health-profile dataset into the app store.

Reads the exam CSVs and the single-file journal under
Design/reference/health-profile/refine_data, then writes:

- lab rows into lab_results with recomputed abnormal flags
- imaging and pathology rows aggregated per date and type into imaging_findings
- the journal split into per-date files under data/journal

Prints a verification report: row counts, rows beyond the dictionary extreme
bounds, and rows whose recomputed flag disagrees with the source flag. Runs
once - a settings flag guards accidental re-runs.

Run with:  uv run python scripts/import_legacy.py
"""

from __future__ import annotations

import csv
import re
import sqlite3
from datetime import datetime
from pathlib import Path

from health_manager.analytes import (
    ANALYTES,
    check_extreme,
    judge_flag,
    normalize_analyte,
    ref_text,
)
from health_manager.db import HealthDB
from health_manager.journal import JournalStore

APP_ROOT = Path(__file__).resolve().parent.parent
LEGACY = APP_ROOT / "Design" / "reference" / "health-profile" / "refine_data"
CSV_DIR = LEGACY / "health_data" / "csv_output"
JOURNAL_MD = LEGACY / "health_journal.md"
DB_PATH = APP_ROOT / "data" / "health.db"
JOURNAL_DIR = APP_ROOT / "data" / "journal"

# exam_血压 duplicates the vitals already living in daily_metrics, skip it
SKIP_FILES = {"exam_血压.csv"}
IMAGING_CATEGORIES = {"腹部超声", "肾穿病理", "CT检查"}

# Urine and blood share some analyte names in the source; name-level
# normalization prefers the blood variant, so scope these by folder group
SCOPED_NAMES = {
    ("尿液检查", "红细胞计数"): "尿红细胞计数",
    ("尿液检查", "白细胞"): "尿白细胞",
}

# The preamble of the legacy journal holds undated background - it becomes the
# earliest entry, anchored at the biopsy date which predates every section
PREAMBLE_DATE = "2020-10-13"
PREAMBLE_TITLE = "病史基础"

_FLAG_MAP = {
    "HIGH": "H", "H": "H", "↑": "H", "偏高": "H",
    "LOW": "L", "L": "L", "↓": "L", "偏低": "L",
}

_JOURNAL_HEADING_RE = re.compile(r"^### (\d{4}-\d{2}(?:-\d{2})?)\s*(.*)$")


def _pf(raw: str | None) -> float | None:
    """Parse a CSV number, treating blanks and text dirt as missing."""
    s = (raw or "").strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _source_flag(raw: str | None) -> str | None:
    """Normalize the source abnormal flag, e.g. HIGH or ↑, to H/L/None."""
    s = (raw or "").strip()
    return _FLAG_MAP.get(s.upper()) or _FLAG_MAP.get(s)


def load_exam_rows() -> list[dict]:
    """All exam rows with their folder group attached, imaging included."""
    rows = []
    for path in sorted(CSV_DIR.rglob("exam_*.csv")):
        if path.name in SKIP_FILES:
            continue
        with open(path, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                row["group"] = path.parent.name
                rows.append(row)
    return rows


def split_imaging(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split exam rows into lab rows and imaging rows by their category."""
    lab = [r for r in rows if r["category"].strip() not in IMAGING_CATEGORIES]
    imaging = [r for r in rows if r["category"].strip() in IMAGING_CATEGORIES]
    return lab, imaging


def aggregate_imaging(rows: list[dict]) -> list[dict]:
    """Fold imaging rows into one finding per date and exam type.

    Source rows carry one sub-item per line, the aggregated finding keeps
    every sub-item as an analyte-and-value line so the original wording
    survives.
    """
    grouped: dict[tuple[str, str], list[str]] = {}
    for r in rows:
        date = r["date"].strip()
        key = (date, r["category"].strip())
        if r.get("value_num"):
            value = f"{r['value_num'].strip()}{(' ' + r['unit'].strip()) if r.get('unit') else ''}"
        else:
            value = (r.get("value_text") or "").strip()
        grouped.setdefault(key, []).append(f"{r['analyte'].strip()}：{value}")
    return [
        {"date": date, "exam_type": exam_type, "finding_text": "\n".join(lines)}
        for (date, exam_type), lines in sorted(grouped.items())
    ]


def prepare_lab_row(row: dict) -> dict:
    """Normalize one exam row into a lab record with a recomputed flag.

    - Row-level unit and reference range win, the dictionary only fills gaps
    - The source flag is kept as srcFlag for the mismatch report, the stored
      flag is always the recomputed one
    """
    std = (
        SCOPED_NAMES.get((row["group"], row["analyte"].strip()))
        or normalize_analyte(row["analyte"])
        or row["analyte"].strip()
    )
    info = ANALYTES.get(std)
    ref_low = _pf(row.get("ref_low"))
    ref_high = _pf(row.get("ref_high"))
    if ref_low is None and info is not None:
        ref_low = info.ref_low
    if ref_high is None and info is not None:
        ref_high = info.ref_high
    unit = (row.get("unit") or "").strip() or (info.unit if info else None)
    value_num = _pf(row.get("value_num"))
    value_text = (row.get("value_text") or "").strip() or None
    return {
        "date": row["date"].strip(),
        "specimen": (row.get("specimen") or "").strip() or None,
        "category": info.group if info else row["group"],
        "analyte": std,
        "value_num": value_num,
        "value_text": value_text,
        "unit": unit,
        "ref_low": ref_low,
        "ref_high": ref_high,
        "ref_text": (row.get("ref_text") or "").strip() or ref_text(ref_low, ref_high),
        "abnormal_flag": judge_flag(value_num, ref_low, ref_high),
        "note": (row.get("note") or "").strip() or None,
        "src_flag": _source_flag(row.get("abnormal_flag")),
    }


def split_journal(text: str) -> tuple[str, list[dict]]:
    """Split the legacy journal into its preamble and dated entries.

    - Headings like ### 2026-09-29 标题 start a new entry
    - Month-only dates get -01 appended so file names stay YYYY-MM-DD
    - Lines before the first heading form the preamble
    """
    preamble: list[str] = []
    entries: list[dict] = []
    current: dict | None = None
    for line in text.splitlines():
        m = _JOURNAL_HEADING_RE.match(line)
        if m:
            date = m.group(1)
            date = date if len(date) == 10 else f"{date}-01"
            current = {"date": date, "title": m.group(2).strip(), "body": []}
            entries.append(current)
        elif current is not None:
            current["body"].append(line)
        else:
            preamble.append(line)
    for e in entries:
        e["content"] = "\n".join(e["body"]).strip("\n")
    preamble_text = "\n".join(preamble).strip("\n")
    # drop the doc-level headings that only structure the original file
    preamble_text = "\n".join(
        l for l in preamble_text.splitlines()
        if not re.match(r"^#{1,2} (健康日志|病例记录)", l)
    ).strip("\n")
    return preamble_text, entries


def _setting(key: str) -> str | None:
    with sqlite3.connect(str(DB_PATH)) as conn:
        row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None


def _mark_imported() -> None:
    with sqlite3.connect(str(DB_PATH)) as conn:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES ('disease_imported', ?)",
            (datetime.now().isoformat(),),
        )


def main() -> None:
    if _setting("disease_imported") is not None:
        print("跳过：settings 里已有 disease_imported 标记，本次导入只允许跑一次")
        return

    db = HealthDB(DB_PATH)
    rows = load_exam_rows()
    lab_rows, imaging_rows = split_imaging(rows)
    lab_records = [prepare_lab_row(r) for r in lab_rows]

    unknown = sorted({r["analyte"] for r in lab_records if r["analyte"] not in ANALYTES})
    extremes = [
        r for r in lab_records
        if r["value_num"] is not None
        and _beyond_bound(r)
    ]
    mismatches = [
        r for r in lab_records if r["abnormal_flag"] != r["src_flag"]
    ]

    for r in lab_records:
        db.record_lab_result(
            date=r["date"],
            specimen=r["specimen"],
            category=r["category"],
            analyte=r["analyte"],
            value_num=r["value_num"],
            value_text=r["value_text"],
            unit=r["unit"],
            ref_low=r["ref_low"],
            ref_high=r["ref_high"],
            ref_text=r["ref_text"],
            abnormal_flag=r["abnormal_flag"],
            note=r["note"],
        )

    imaging_records = aggregate_imaging(imaging_rows)
    for r in imaging_records:
        db.record_imaging_finding(r["date"], r["exam_type"], r["finding_text"])

    preamble, entries = split_journal(JOURNAL_MD.read_text(encoding="utf-8"))
    store = JournalStore(JOURNAL_DIR)
    for e in entries:
        store.write(e["date"], e["content"], e["title"] or None)
    if preamble:
        store.write(PREAMBLE_DATE, preamble, PREAMBLE_TITLE)

    _mark_imported()

    print(f"源 exam 数据行 {len(rows)} 行，exam_血压.csv 属体征数据未读入")
    print(f"化验入库 {len(lab_records)} 行，影像聚合 {len(imaging_records)} 条，病历 {len(entries) + 1} 篇")
    if unknown:
        print(f"未入字典的指标名 {len(unknown)} 个：{'、'.join(unknown[:20])}")
    print(f"超出字典极值 {len(extremes)} 行：")
    for r in extremes[:10]:
        print(f"  {r['date']} {r['analyte']} {r['value_num']}")
    print(f"重算标记与化验单标记不一致 {len(mismatches)} 行：")
    for r in mismatches[:30]:
        print(f"  {r['date']} {r['analyte']} 单据 {r['src_flag'] or '无'} → 重算 {r['abnormal_flag'] or '无'}")


def _beyond_bound(record: dict) -> bool:
    """Whether a value crosses its dictionary extreme bound."""
    try:
        check_extreme(record["analyte"], record["value_num"])
    except ValueError:
        return True
    return False


if __name__ == "__main__":
    main()
