"""
SQLite persistence for health metrics.

Two tables:
- profile: single-row table storing static attributes like height
- daily_metrics: one row per date, holding weight / blood pressure / heart rate

Schema versioning via PRAGMA user_version enables automatic migration on app
startup — users updating the app get schema changes applied transparently.
On first launch (v0 → v1) existing CSV data is imported without modifying the
original file.
"""

from __future__ import annotations

import csv
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .log import log

_SCHEMA_V1 = """
CREATE TABLE IF NOT EXISTS profile (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    height      REAL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_metrics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL UNIQUE,
    weight      REAL,
    systolic    INTEGER,
    diastolic   INTEGER,
    heart_rate  INTEGER,
    note        TEXT,
    created_at  TEXT NOT NULL
);
"""

_HEART_RATE_RE = re.compile(r"心率(\d+)")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class HealthDB:
    """SQLite-backed health metric store."""

    # Ranges are sanity bounds to catch absurd input, not medical norms
    _RANGES = {
        "weight": (20, 300),
        "systolic": (60, 250),
        "diastolic": (40, 200),
        "heart_rate": (30, 250),
        "height": (50, 250),
    }

    def __init__(self, db_path: Path, csv_path: Path | None = None) -> None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(db_path))
        self._conn.row_factory = sqlite3.Row
        self._migrate(csv_path)
        log("INFO", "db_ready", path=str(db_path))

    # --- Schema migration ---------------------------------------------------

    def _migrate(self, csv_path: Path | None) -> None:
        """Apply schema migrations based on PRAGMA user_version."""
        version = self._conn.execute("PRAGMA user_version").fetchone()[0]

        if version < 1:
            self._conn.executescript(_SCHEMA_V1)
            self._conn.execute("PRAGMA user_version = 1")
            if csv_path and csv_path.exists():
                count = self._import_csv(csv_path)
                log("INFO", "db_migrated", version=1, csv_imported=count)
            else:
                log("INFO", "db_migrated", version=1, csv_imported=0)
            self._conn.commit()

    def _import_csv(self, csv_path: Path) -> int:
        """Import existing daily_metrics.csv data. Original file stays untouched."""
        imported = 0
        with open(csv_path, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                date = (row.get("日期") or "").strip()
                if not date:
                    continue
                weight = _parse_float(row.get("体重(kg)"))
                systolic = _parse_int(row.get("收缩压(高压)"))
                diastolic = _parse_int(row.get("舒张压(低压)"))
                note = (row.get("备注") or "").strip()
                heart_rate = None
                m = _HEART_RATE_RE.search(note)
                if m:
                    heart_rate = int(m.group(1))
                self._conn.execute(
                    "INSERT OR IGNORE INTO daily_metrics "
                    "(date, weight, systolic, diastolic, heart_rate, note, created_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (date, weight, systolic, diastolic, heart_rate, note, _now()),
                )
                imported += 1
        return imported

    # --- Profile ------------------------------------------------------------

    def set_profile(self, height: float) -> None:
        """Upsert height into the single-row profile table."""
        self._validate("height", height)
        self._conn.execute(
            "INSERT INTO profile (id, height, updated_at) VALUES (1, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET height = excluded.height, "
            "updated_at = excluded.updated_at",
            (height, _now()),
        )
        self._conn.commit()

    def get_profile(self) -> dict | None:
        row = self._conn.execute(
            "SELECT height, updated_at FROM profile WHERE id = 1"
        ).fetchone()
        if not row or row["height"] is None:
            return None
        return {"height": row["height"], "updatedAt": row["updated_at"]}

    # --- Daily metrics ------------------------------------------------------

    def record_weight(self, date: str, weight: float, note: str | None = None) -> dict:
        """Record body weight for a date. Returns current + previous + change."""
        self._validate("weight", weight)
        prev = self._latest("weight", date)
        self._upsert_metric(date, weight=weight, note=note)
        return self._diff("weight", weight, prev)

    def record_blood_pressure(
        self,
        date: str,
        systolic: int,
        diastolic: int,
        heart_rate: int | None = None,
        note: str | None = None,
    ) -> dict:
        """Record blood pressure and optional heart rate. Returns comparison."""
        self._validate("systolic", systolic)
        self._validate("diastolic", diastolic)
        if heart_rate is not None:
            self._validate("heart_rate", heart_rate)
        prev = self._latest("bp", date)
        fields: dict = {"systolic": systolic, "diastolic": diastolic}
        if heart_rate is not None:
            fields["heart_rate"] = heart_rate
        if note:
            fields["note"] = note
        self._upsert_metric(date, **fields)
        return self._diff_bp(systolic, diastolic, heart_rate, prev)

    def get_latest(self, metric: str | None = None) -> dict | None:
        """Return the most recent metric record. Optional filter by type."""
        if metric == "weight":
            row = self._conn.execute(
                "SELECT * FROM daily_metrics WHERE weight IS NOT NULL "
                "ORDER BY date DESC LIMIT 1"
            ).fetchone()
        elif metric == "blood_pressure":
            row = self._conn.execute(
                "SELECT * FROM daily_metrics WHERE systolic IS NOT NULL "
                "ORDER BY date DESC LIMIT 1"
            ).fetchone()
        else:
            row = self._conn.execute(
                "SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 1"
            ).fetchone()
        return _row_to_dict(row) if row else None

    def get_all_metrics(self) -> list[dict]:
        """Return all daily metric records ordered by date (for charting)."""
        rows = self._conn.execute(
            "SELECT * FROM daily_metrics ORDER BY date ASC"
        ).fetchall()
        return [_row_to_dict(r) for r in rows]

    # --- Snapshot for WebSocket push ---------------------------------------

    def get_snapshot(self) -> dict:
        """Return full state for the frontend: profile + all metrics."""
        return {"profile": self.get_profile(), "metrics": self.get_all_metrics()}

    # --- Internal helpers ---------------------------------------------------

    def _validate(self, name: str, value: float) -> None:
        lo, hi = self._RANGES[name]
        if not (lo <= value <= hi):
            raise ValueError(f"{name}值 {value} 超出合理范围 {lo}-{hi}")

    def _latest(self, kind: str, before_date: str) -> sqlite3.Row | None:
        """Fetch the previous record of a given kind before a date."""
        if kind == "weight":
            return self._conn.execute(
                "SELECT * FROM daily_metrics "
                "WHERE weight IS NOT NULL AND date < ? ORDER BY date DESC LIMIT 1",
                (before_date,),
            ).fetchone()
        return self._conn.execute(
            "SELECT * FROM daily_metrics "
            "WHERE systolic IS NOT NULL AND date < ? ORDER BY date DESC LIMIT 1",
            (before_date,),
        ).fetchone()

    def _upsert_metric(self, date: str, **fields) -> None:
        """Insert or update a daily metric row by date."""
        row = self._conn.execute(
            "SELECT id FROM daily_metrics WHERE date = ?", (date,)
        ).fetchone()
        if row:
            set_clauses = ", ".join(f"{k} = ?" for k in fields)
            values = list(fields.values()) + [row["id"]]
            self._conn.execute(
                f"UPDATE daily_metrics SET {set_clauses} WHERE id = ?", values
            )
        else:
            cols = ["date", "created_at"] + list(fields.keys())
            placeholders = ", ".join("?" for _ in cols)
            values = [date, _now()] + list(fields.values())
            self._conn.execute(
                f"INSERT INTO daily_metrics ({', '.join(cols)}) "
                f"VALUES ({placeholders})",
                values,
            )
        self._conn.commit()

    @staticmethod
    def _diff(field: str, current: float, prev: sqlite3.Row | None) -> dict:
        """Build a comparison result for a single numeric metric."""
        result: dict = {"current": current}
        if prev and prev[field] is not None:
            result["previous"] = prev[field]
            result["previousDate"] = prev["date"]
            result["change"] = round(current - prev[field], 1)
        return result

    @staticmethod
    def _diff_bp(
        systolic: int,
        diastolic: int,
        heart_rate: int | None,
        prev: sqlite3.Row | None,
    ) -> dict:
        """Build a comparison result for blood pressure + heart rate."""
        result: dict = {"systolic": systolic, "diastolic": diastolic}
        if heart_rate is not None:
            result["heartRate"] = heart_rate
        if prev and prev["systolic"] is not None:
            result["prevSystolic"] = prev["systolic"]
            result["prevDiastolic"] = prev["diastolic"]
            result["previousDate"] = prev["date"]
            result["systolicChange"] = systolic - prev["systolic"]
            result["diastolicChange"] = diastolic - prev["diastolic"]
        return result

    def close(self) -> None:
        self._conn.close()


# --- Module-level helpers --------------------------------------------------


def _parse_float(val: str | None) -> float | None:
    s = (val or "").strip()
    return float(s) if s else None


def _parse_int(val: str | None) -> int | None:
    s = (val or "").strip()
    return int(s) if s else None


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "date": row["date"],
        "weight": row["weight"],
        "systolic": row["systolic"],
        "diastolic": row["diastolic"],
        "heartRate": row["heart_rate"],
        "note": row["note"],
    }
