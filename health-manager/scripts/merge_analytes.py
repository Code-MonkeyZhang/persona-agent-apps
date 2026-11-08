"""One-time migration merging duplicate analyte rows in lab_results.

Applies the 2026-11 dedup pass to a health database: renames merged-away
analyte names onto their kept names, converts fraction-scale rows to percent,
cleans five known data issues, and recomputes flags where reference lines
were corrected. Run once per database, after analytes.py is updated.

Usage: uv run python scripts/merge_analytes.py <path-to-health.db>
"""

from __future__ import annotations

import shutil
import sqlite3
import sys
from pathlib import Path

from health_manager.analytes import judge_flag

# Rename-only merges: deleted name -> kept name.
RENAMES = {
    "24小时尿总蛋白": "24小时尿蛋白",
    "比重": "尿比密",
    "亚硝酸盐": "尿亚硝酸盐",
    "尿酸盐": "尿酸结晶",
    "红细胞比积": "红细胞比容",
}

# Rename-only merges whose stale unit field must clear because every
# recorded value on that line is qualitative text.
RENAMES_CLEAR_UNIT = {
    "胆红素": "尿胆红素",
    "葡萄糖": "尿葡萄糖",
    "尿白细胞": "白细胞酯酶",
    "潜血": "尿潜血",
}

# Rename plus fraction-to-percent conversion: deleted name -> kept name.
CONVERT_RENAMES = {
    "RBC体积分布宽度": "红细胞分布宽度变异系数",
    "RBC体积分布宽度变异系数": "红细胞分布宽度变异系数",
    "中性粒细胞百分比": "中性粒细胞百分数",
    "单核细胞百分比": "单核细胞百分数",
    "嗜碱性粒细胞百分比": "嗜碱性粒细胞百分数",
    "嗜酸性粒细胞百分比": "嗜酸性粒细胞百分数",
    "淋巴细胞百分比": "淋巴细胞百分数",
}


def fmt(value: float) -> str:
    """Trim a trailing .0 so recomputed ref text matches the legacy style."""
    f = float(value)
    return str(int(f)) if f.is_integer() else str(f)


def ref_text(low, high) -> str | None:
    """Legacy ref text style: 40-75 two-sided, <150 upper-bound only."""
    if low is not None and high is not None:
        return f"{fmt(low)}-{fmt(high)}"
    if high is not None:
        return f"<{fmt(high)}"
    return None


def scale(value):
    """Multiply a nullable numeric column by one hundred, rounded clean."""
    return None if value is None else round(value * 100, 4)


def recompute_flag(cur, row_id: int) -> None:
    """Rejudge one row against its (already corrected) stored range."""
    cur.execute(
        "SELECT value_num, ref_low, ref_high FROM lab_results WHERE id=?",
        (row_id,),
    )
    v, lo, hi = cur.fetchone()
    cur.execute(
        "UPDATE lab_results SET abnormal_flag=? WHERE id=?",
        (judge_flag(v, lo, hi), row_id),
    )


def migrate(db_path: Path) -> None:
    backup = db_path.with_suffix(db_path.suffix + ".bak-20261107-merge")
    shutil.copy2(db_path, backup)
    print(f"[{db_path}] backup -> {backup.name}")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    total = 0

    for old, new in RENAMES.items():
        cur.execute("UPDATE lab_results SET analyte=? WHERE analyte=?", (new, old))
        print(f"  rename {old} -> {new}: {cur.rowcount}")
        total += cur.rowcount

    for old, new in RENAMES_CLEAR_UNIT.items():
        cur.execute(
            "UPDATE lab_results SET analyte=?, unit=NULL WHERE analyte=?",
            (new, old),
        )
        print(f"  rename+clear unit {old} -> {new}: {cur.rowcount}")
        total += cur.rowcount

    for old, new in CONVERT_RENAMES.items():
        cur.execute(
            """UPDATE lab_results
               SET analyte=?, value_num=round(value_num*100,4),
                   ref_low=round(ref_low*100,4), ref_high=round(ref_high*100,4),
                   unit='%'
               WHERE analyte=?""",
            (new, old),
        )
        print(f"  convert x100 {old} -> {new}: {cur.rowcount}")
        total += cur.rowcount
        cur.execute(
            """SELECT id, ref_low, ref_high FROM lab_results
               WHERE analyte=? AND (ref_low IS NOT NULL OR ref_high IS NOT NULL)""",
            (new,),
        )
        for row_id, lo, hi in cur.fetchall():
            cur.execute(
                "UPDATE lab_results SET ref_text=? WHERE id=?", (ref_text(lo, hi), row_id)
            )

    # 红细胞比容 kept its name but older rows sit on the fraction scale.
    cur.execute(
        """UPDATE lab_results
           SET value_num=round(value_num*100,4),
               ref_low=round(ref_low*100,4), ref_high=round(ref_high*100,4),
               unit='%'
           WHERE analyte='红细胞比容' AND (unit IS NULL OR unit='')"""
    )
    print(f"  convert x100 in place 红细胞比容 fraction rows: {cur.rowcount}")
    total += cur.rowcount
    cur.execute(
        """SELECT id, ref_low, ref_high FROM lab_results
           WHERE analyte='红细胞比容' AND ref_high IS NOT NULL"""
    )
    for row_id, lo, hi in cur.fetchall():
        cur.execute("UPDATE lab_results SET ref_text=? WHERE id=?", (ref_text(lo, hi), row_id))

    # 比重 carried one text-only value; give the merged line a numeric point.
    cur.execute(
        """UPDATE lab_results SET value_num=1.03
           WHERE analyte='尿比密' AND value_num IS NULL AND value_text='1.030'"""
    )
    print(f"  numeric fix 尿比密 text 1.030: {cur.rowcount}")

    # Reference-line cleanups with flag recomputation.
    cur.execute(
        """SELECT id FROM lab_results
           WHERE analyte='24小时尿蛋白' AND ref_high=120"""
    )
    ids = [r[0] for r in cur.fetchall()]
    cur.execute(
        """UPDATE lab_results SET ref_high=150, ref_text='<150'
           WHERE analyte='24小时尿蛋白' AND ref_high=120"""
    )
    print(f"  ref fix 24小时尿蛋白 120 -> 150: {cur.rowcount}")
    for row_id in ids:
        recompute_flag(cur, row_id)

    cur.execute(
        """SELECT id FROM lab_results
           WHERE analyte='红细胞分布宽度变异系数' AND ref_low=11 AND ref_high=11"""
    )
    ids = [r[0] for r in cur.fetchall()]
    cur.execute(
        """UPDATE lab_results SET ref_high=15, ref_text='11-15'
           WHERE analyte='红细胞分布宽度变异系数' AND ref_low=11 AND ref_high=11"""
    )
    print(f"  ref fix 红细胞分布宽度变异系数 11-11 -> 11-15: {cur.rowcount}")
    for row_id in ids:
        recompute_flag(cur, row_id)

    cur.execute(
        """UPDATE lab_results SET ref_low=NULL, ref_high=NULL, ref_text=NULL
           WHERE analyte='尿酸结晶' AND unit='/HP'"""
    )
    print(f"  ref clear 尿酸结晶 /HP rows: {cur.rowcount}")

    conn.commit()

    orphans = [o for o in list(RENAMES) + list(RENAMES_CLEAR_UNIT) + list(CONVERT_RENAMES)
               if (cur.execute("SELECT COUNT(*) FROM lab_results WHERE analyte=?", (o,)).fetchone()[0])]
    print(f"  rows touched: {total} | leftover merged-away names: {orphans or 'none'}")
    conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: merge_analytes.py <health.db>")
    migrate(Path(sys.argv[1]))
