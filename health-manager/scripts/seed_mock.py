"""Idempotently (re)build the mock database with representative sample data.

Run with:  uv run python scripts/seed_mock.py
Wipes data/health.mock.db and refills it so the UI has something to show in
demo / mock mode. The real database (data/health.db) is never touched.
"""

from __future__ import annotations

import random
import datetime
from pathlib import Path

from health_manager.db import HealthDB

APP_ROOT = Path(__file__).resolve().parent.parent
MOCK_DB = APP_ROOT / "data" / "health.mock.db"

# Seeded RNG so the demo dataset is stable across re-runs.
rng = random.Random(2026)

# Food pools: (food, calories, quantity, carbs_g, protein_g, fat_g).
BREAKFASTS = [
    ("牛奶麦片", 320, "1碗", 45, 12, 6),
    ("燕麦粥", 350, "1碗", 60, 8, 5),
    ("豆浆油条", 400, "1份", 55, 12, 18),
    ("面包牛奶", 300, "1份", 40, 10, 8),
    ("小米粥", 280, "1碗", 55, 5, 2),
    ("鸡蛋三明治", 400, "1个", 45, 18, 20),
    ("粥配咸蛋", 250, "1碗", 50, 8, 4),
    ("煎饼果子", 450, "1份", 60, 12, 16),
]
LUNCHES = [
    ("牛肉面", 600, "1大碗", 70, 25, 18),
    ("排骨饭", 700, "1份", 80, 35, 25),
    ("炸鸡套餐", 800, "1份", 70, 45, 45),
    ("鱼香肉丝盖饭", 650, "1份", 85, 30, 22),
    ("牛肉饭", 620, "1份", 75, 35, 18),
    ("意面", 550, "1盘", 80, 20, 18),
    ("卤肉饭", 700, "1份", 80, 35, 25),
    ("宫保鸡丁盖饭", 680, "1份", 78, 32, 24),
    ("寿司拼盘", 520, "1份", 70, 22, 14),
]
DINNERS = [
    ("鸡胸肉沙拉", 670, "1盘", 35, 55, 28),
    ("清炒时蔬", 650, "1盘", 30, 10, 40),
    ("火锅", 900, "1顿", 60, 50, 55),
    ("蔬菜沙拉", 700, "1盘", 40, 15, 45),
    ("三文鱼", 1000, "1份", 20, 60, 65),
    ("烤鸡", 700, "1份", 30, 65, 35),
    ("牛排", 800, "1份", 25, 65, 50),
    ("清蒸鱼", 520, "1条", 8, 55, 28),
    ("番茄牛肉煲", 620, "1锅", 35, 45, 30),
]
SNACKS = [
    ("苹果", 120, "1个", 30, 0, 0),
    ("香蕉", 105, "1根", 27, 1, 0),
    ("酸奶", 150, "1杯", 18, 8, 3),
    ("坚果", 200, "1把", 8, 6, 16),
    ("黑咖啡", 5, "1杯", 1, 0, 0),
]
# Curated, more narrative entries for "today" so the demo's focal day reads well.
TODAY = [
    ("breakfast", "牛奶麦片", 320, "1碗", 45, 12, 6),
    ("breakfast", "鸡蛋", 140, "2个", 1, 12, 10),
    ("lunch", "牛肉面", 600, "1大碗", 70, 25, 18),
    ("snack", "苹果", 120, "1个", 30, 0, 0),
    ("dinner", "鸡胸肉沙拉", 670, "1盘", 35, 55, 28),
]


def main() -> None:
    if MOCK_DB.exists():
        MOCK_DB.unlink()
    db = HealthDB(MOCK_DB)

    # --- Basics: height + weight trend + blood pressure ---
    db.set_name("张宇")
    db.set_profile(175)
    for date, w in [
        ("2026-06-10", 73.5), ("2026-06-17", 73.1), ("2026-06-24", 72.8),
        ("2026-07-01", 72.9), ("2026-07-08", 72.5), ("2026-07-15", 72.3),
        ("2026-07-22", 71.8), ("2026-07-29", 71.5), ("2026-08-05", 71.2),
    ]:
        db.record_weight(date, w)
    db.record_blood_pressure("2026-06-24", 122, 78, 68)
    db.record_blood_pressure("2026-07-22", 128, 82, 70)
    db.record_blood_pressure("2026-08-05", 145, 92, 75)

    # --- Fitness: strength progress + workout diary ---
    for date, v in [("2026-06-15", 80), ("2026-06-29", 85), ("2026-07-13", 90),
                    ("2026-07-27", 95), ("2026-08-04", 100)]:
        db.record_strength(date, "深蹲", "最大重量", v, "kg", category="下半身")
    for date, v in [("2026-06-15", 50), ("2026-07-13", 55), ("2026-08-03", 60)]:
        db.record_strength(date, "自由卧推", "最大重量", v, "kg", category="上半身")
    for date, v in [("2026-06-20", 18), ("2026-07-18", 22), ("2026-08-02", 25)]:
        db.record_strength(date, "俯卧撑", "最多次数", v, "reps", category="上半身")
    for date, v in [("2026-06-20", 8), ("2026-07-18", 10), ("2026-08-02", 12)]:
        db.record_strength(date, "引体向上", "最多次数", v, "reps", category="上半身")
    for date, v in [("2026-06-22", 35), ("2026-07-20", 40), ("2026-08-03", 45)]:
        db.record_strength(date, "高位下拉", "最大重量", v, "kg", category="上半身")
    for date, v in [("2026-06-22", 8), ("2026-07-20", 10), ("2026-08-03", 12)]:
        db.record_strength(date, "哑铃侧平举", "最大重量", v, "kg", category="上半身")
    for date, v in [("2026-06-25", 15), ("2026-07-23", 17.5), ("2026-08-04", 20)]:
        db.record_strength(date, "哑铃上举", "最大重量", v, "kg", category="上半身")
    for date, v in [("2026-06-28", 250), ("2026-07-26", 280), ("2026-08-05", 300)]:
        db.record_strength(date, "爬楼梯", "单次消耗", v, "kcal", category="有氧")

    db.record_workout("2026-08-03", "深蹲", sets=5, reps=5, weight=95, calories=320, feeling="感觉稳")
    db.record_workout("2026-08-03", "自由卧推", sets=4, reps=8, weight=60, calories=200)
    db.record_workout("2026-08-04", "引体向上", sets=4, reps=8, calories=150, feeling="感觉吃力")
    db.record_workout("2026-08-05", "高位下拉", sets=4, reps=10, weight=45, calories=180, feeling="感觉不错")
    db.record_workout("2026-08-05", "哑铃上举", sets=3, reps=10, weight=20, calories=120)

    # Spread workout history across June–July for the contribution graph.
    # ~3 sessions per week, two compound exercises each, with calorie estimates.
    workout_templates = [
        (("自由卧推", 4, 8, 50, 220), ("俯卧撑", 4, 20, None, 100)),
        (("引体向上", 4, 8, None, 150), ("高位下拉", 4, 10, 35, 120)),
        (("哑铃侧平举", 3, 12, 8, 80), ("哑铃上举", 3, 10, 15, 100)),
        (("深蹲", 5, 5, 80, 300), ("爬楼梯", None, None, None, 250)),
    ]
    d = datetime.date(2026, 6, 2)
    end = datetime.date(2026, 7, 31)
    week_idx = 0
    while d <= end:
        ds = d.isoformat()
        for exercise, sets, reps, weight, cal in workout_templates[week_idx % len(workout_templates)]:
            db.record_workout(ds, exercise, sets=sets, reps=reps, weight=weight, calories=cal)
        d += datetime.timedelta(days=2)
        week_idx += 1

    # --- Diet: ~5 weeks of generated history from 2026-07-01 to 08-04, plus today ---
    db.set_diet_goal(2000)
    start = datetime.date(2026, 7, 1)
    end = datetime.date(2026, 8, 4)
    d = start
    while d <= end:
        ds = d.isoformat()
        for meal, pool in (
            ("breakfast", BREAKFASTS),
            ("lunch", LUNCHES),
            ("dinner", DINNERS),
        ):
            food, cal, qty, c, p, f = rng.choice(pool)
            db.record_diet(ds, food, cal, meal, qty, c, p, f)
        if rng.random() < 0.35:
            food, cal, qty, c, p, f = rng.choice(SNACKS)
            db.record_diet(ds, food, cal, "snack", qty, c, p, f)
        d += datetime.timedelta(days=1)
    for meal, food, cal, qty, c, p, f in TODAY:
        db.record_diet("2026-08-05", food, cal, meal, qty, c, p, f)

    snap = db.get_snapshot()
    print(f"mock db seeded at {MOCK_DB}")
    print(f"  metrics={len(snap['basics']['metrics'])} "
          f"strength={len(snap['fitness']['strengthRecords'])} "
          f"workouts={len(snap['fitness']['workouts'])} "
          f"diet={len(snap['diet']['entries'])} goal={snap['diet']['goal']}")


if __name__ == "__main__":
    main()
