"""One-time cleanup of same-day duplicate lab rows with identical values.

Keeps a single row per (analyte, date) group whose value_num and value_text
are identical across the group. The keeper is the row whose unit and
reference bounds match the dictionary entry best, ties go to the lowest id.
Groups with differing values are legitimate same-day records and stay
untouched, as do analytes outside the dictionary such as the blood-type
rows. The write path itself is left unchanged by design.

Usage: uv run python scripts/dedup_lab_results.py <path-to-health.db>
"""

from __future__ import annotations

import shutil
import sqlite3
import sys
from pathlib import Path

from health_manager.analytes import ANALYTES, Analyte


def _score(row: sqlite3.Row, entry: Analyte) -> int:
    """Keeper score: one point per field matching the dictionary entry."""
    score = 0
    if (row["unit"] or None) == (entry.unit or None):
        score += 1
    if row["ref_low"] == entry.ref_low:
        score += 1
    if row["ref_high"] == entry.ref_high:
        score += 1
    return score


def migrate(db_path: Path) -> None:
    backup = db_path.with_suffix(db_path.suffix + ".bak-20261108-dedup")
    shutil.copy2(db_path, backup)
    print(f"[{db_path}] backup -> {backup.name}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    before = cur.execute("SELECT COUNT(*) FROM lab_results").fetchone()[0]

    groups = cur.execute(
        "SELECT analyte, date, COUNT(*) c FROM lab_results "
        "GROUP BY analyte, date HAVING c > 1"
    ).fetchall()

    deleted = 0
    cleaned = 0
    remaining: list[str] = []
    for g in groups:
        entry = ANALYTES.get(g["analyte"])
        if entry is None:
            remaining.append(f"{g['analyte']} {g['date']} x{g['c']} (outside dictionary)")
            continue
        rows = cur.execute(
            "SELECT * FROM lab_results WHERE analyte = ? AND date = ? ORDER BY id",
            (g["analyte"], g["date"]),
        ).fetchall()
        values = {(r["value_num"], r["value_text"]) for r in rows}
        if len(values) > 1:
            remaining.append(f"{g['analyte']} {g['date']} x{g['c']} (differing values)")
            continue
        keeper = max(rows, key=lambda r: (_score(r, entry), -r["id"]))
        doomed = [r["id"] for r in rows if r["id"] != keeper["id"]]
        cur.executemany("DELETE FROM lab_results WHERE id = ?", [(i,) for i in doomed])
        deleted += len(doomed)
        cleaned += 1
        print(f"  cleaned {g['analyte']} {g['date']}: kept {keeper['id']}, removed {doomed}")

    conn.commit()
    after = cur.execute("SELECT COUNT(*) FROM lab_results").fetchone()[0]
    conn.close()

    print(f"rows: {before} -> {after} | identical groups cleaned: {cleaned} | rows removed: {deleted}")
    if remaining:
        print("multi-row groups kept as-is:")
        for line in remaining:
            print(f"  {line}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: dedup_lab_results.py <health.db>")
    migrate(Path(sys.argv[1]))
