#!/usr/bin/env python3
"""
通用健康指标趋势图生成工具

支持绘制单个或多个指标的趋势图，自动从 CSV 文件读取数据。

用法:
    # 画单个指标
    python3 scripts/viz/plot_trends.py --指标 肌酐

    # 画多个指标（使用子图）
    python3 scripts/viz/plot_trends.py --指标 肌酐 尿酸 --title 肾功能指标

    # 指定科目
    python3 scripts/viz/plot_trends.py --指标 尿蛋白 --科目 尿蛋白定量

    # 保存自定义路径
    python3 scripts/viz/plot_trends.py --指标 肌酐 --output custom/path.png
"""

import csv
import argparse
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# 设置中文字体
plt.rcParams["font.sans-serif"] = ["Arial Unicode MS", "SimHei", "STHeiti"]
plt.rcParams["axes.unicode_minus"] = False

# CSV 文件路径映射
CSV_FILES = {
    "肾功能": "health-profile/refine_data/health_data/csv_output/生化检查/exam_肾功能.csv",
    "尿蛋白定量": "health-profile/refine_data/health_data/csv_output/尿液检查/exam_尿蛋白定量.csv",
    "尿蛋白": "health-profile/refine_data/health_data/csv_output/尿液检查/exam_尿蛋白.csv",
    "血脂": "health-profile/refine_data/health_data/csv_output/生化检查/exam_血脂.csv",
    "肝功能": "health-profile/refine_data/health_data/csv_output/生化检查/exam_肝功能.csv",
    "血常规": "health-profile/refine_data/health_data/csv_output/血液常规/exam_血常规.csv",
    "电解质": "health-profile/refine_data/health_data/csv_output/生化检查/exam_电解质.csv",
}

# 参考范围配置
REFERENCE_RANGES = {
    "肌酐": (57, 97, "umol/L"),
    "血肌酐": (57, 97, "umol/L"),
    "血肌酐(Scr)": (57, 97, "umol/L"),
    "尿素": (3.1, 8.0, "mmol/L"),
    "尿酸": (208, 428, "umol/L"),
    "24小时尿蛋白": (0, 150, "mg/24h"),
}


def load_csv_data(csv_path: str, analyte: str) -> List[Tuple[datetime, float, str]]:
    """从 CSV 文件加载指定指标的数据

    Args:
        csv_path: CSV 文件路径
        analyte: 指标名称

    Returns:
        [(日期, 数值, 备注)] 列表
    """
    data = []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 匹配指标名称（模糊匹配）
                if analyte.lower() in row["analyte"].lower() and row["value_num"]:
                    try:
                        date = datetime.strptime(row["date"], "%Y-%m-%d")
                        value = float(row["value_num"])
                        note = row.get("note", "")
                        data.append((date, value, note))
                    except (ValueError, TypeError):
                        continue
    except FileNotFoundError:
        print(f"错误: 找不到文件 {csv_path}")
        sys.exit(1)

    # 按日期排序
    data.sort(key=lambda x: x[0])
    return data


def find_analyte_data(
    analyte_name: str, category: str = None
) -> Tuple[List[Tuple[datetime, float, str]], str]:
    """查找指标数据

    Args:
        analyte_name: 指标名称
        category: 指定科目（可选）

    Returns:
        (数据列表, 单位)
    """
    # 如果指定了科目，只在该科目中查找
    if category:
        csv_path = CSV_FILES.get(category)
        if not csv_path:
            print(f"错误: 未找到科目 '{category}' 的 CSV 文件")
            sys.exit(1)

        data = load_csv_data(csv_path, analyte_name)
        if data:
            note = data[0][2]
            unit = note.split()[-1] if note and note.strip() else ""
            return data, unit

        print(f"警告: 在 {category} 中未找到指标 '{analyte_name}'")
        return [], ""

    # 在所有 CSV 文件中查找
    for cat_name, csv_path in CSV_FILES.items():
        data = load_csv_data(csv_path, analyte_name)
        if data:
            note = data[0][2]
            unit = note.split()[-1] if note and note.strip() else ""
            return data, unit

    print(f"错误: 未找到指标 '{analyte_name}'")
    print(f"可用的科目: {', '.join(CSV_FILES.keys())}")
    sys.exit(1)


def plot_single_indicator(
    analyte_name: str,
    data: List[Tuple[datetime, float, str]],
    unit: str,
    output_path: Path | str,
):
    """绘制单个指标的趋势图

    Args:
        analyte_name: 指标名称
        data: 数据列表 [(日期, 数值, 备注)]
        unit: 单位
        output_path: 输出路径
    """
    dates = [d[0] for d in data]
    values = [d[1] for d in data]
    notes = [d[2] for d in data]

    # 创建图表
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.plot(dates, values, marker="o", linewidth=2, markersize=6, color="#E63946")

    # 添加参考范围线
    ref_range = REFERENCE_RANGES.get(analyte_name)
    if ref_range:
        low, high, ref_unit = ref_range
        ax.axhline(
            y=high,
            color="red",
            linestyle="--",
            linewidth=1,
            label=f"正常上限 ({high} {ref_unit})",
        )
        ax.axhline(
            y=low,
            color="green",
            linestyle="--",
            linewidth=1,
            label=f"正常下限 ({low} {ref_unit})",
        )

    # 设置标题和标签
    ax.set_title(f"{analyte_name} 变化趋势", fontsize=16, fontweight="bold")
    ax.set_xlabel("日期", fontsize=12)
    ax.set_ylabel(f"{analyte_name} ({unit})", fontsize=12)

    # 添加数据标签（只标注异常值）
    if ref_range:
        low, high, _ = ref_range
        for i, (date, value, note) in enumerate(data):
            if value > high or value < low:
                label = f"{value:.1f}"
                if note and note.strip():
                    label += f"\n{note}"
                ax.annotate(
                    label,
                    (date, value),
                    textcoords="offset points",
                    xytext=(0, 15),
                    ha="center",
                    fontsize=8,
                    bbox=dict(boxstyle="round,pad=0.3", facecolor="yellow", alpha=0.7),
                )

    # 设置图例
    ax.legend(loc="upper right")
    ax.grid(True, alpha=0.3)
    plt.gcf().autofmt_xdate()
    plt.tight_layout()

    # 保存图片
    plt.savefig(str(output_path), dpi=300, bbox_inches="tight")
    print(f"✓ 图表已保存: {output_path}")


def plot_multiple_indicators(
    indicators: List[str], title: str, output_path: Path | str
):
    """绘制多个指标的趋势图（子图形式）

    Args:
        indicators: 指标名称列表
        title: 图表总标题
        output_path: 输出路径
    """
    n = len(indicators)
    fig, axes = plt.subplots(n, 1, figsize=(14, 5 * n))
    if n == 1:
        axes = [axes]

    for idx, analyte_name in enumerate(indicators):
        data, unit = find_analyte_data(analyte_name)
        if not data:
            print(f"警告: 未找到指标 '{analyte_name}' 的数据，跳过")
            continue

        dates = [d[0] for d in data]
        values = [d[1] for d in data]

        ax = axes[idx]
        ax.plot(
            dates, values, marker="o", linewidth=2, markersize=6, label=analyte_name
        )

        # 添加参考范围线
        ref_range = REFERENCE_RANGES.get(analyte_name)
        if ref_range:
            low, high, ref_unit = ref_range
            ax.axhline(y=high, color="red", linestyle="--", linewidth=1, alpha=0.5)
            ax.axhline(y=low, color="green", linestyle="--", linewidth=1, alpha=0.5)

        ax.set_ylabel(f"{analyte_name} ({unit})", fontsize=11)
        ax.legend(loc="upper right")
        ax.grid(True, alpha=0.3)

        if idx == 0:
            ax.set_title(title, fontsize=16, fontweight="bold")
        if idx == n - 1:
            ax.set_xlabel("日期", fontsize=12)

        plt.gcf().autofmt_xdate()

    plt.tight_layout()
    plt.savefig(str(output_path), dpi=300, bbox_inches="tight")
    print(f"✓ 图表已保存: {output_path}")


def print_statistics(data: List[Tuple[datetime, float, str]], analyte_name: str):
    """打印统计信息"""
    if not data:
        return

    values = [d[1] for d in data]
    min_value = min(values)
    max_value = max(values)
    avg_value = sum(values) / len(values)

    print(f"\n{'=' * 60}")
    print(f"指标: {analyte_name}")
    print(f"数据点数: {len(values)}")
    print(
        f"最高值: {max_value:.1f} (日期: {max(data, key=lambda x: x[1])[0].strftime('%Y-%m-%d')})"
    )
    print(
        f"最低值: {min_value:.1f} (日期: {min(data, key=lambda x: x[1])[0].strftime('%Y-%m-%d')})"
    )
    print(f"平均值: {avg_value:.1f}")

    ref_range = REFERENCE_RANGES.get(analyte_name)
    if ref_range:
        low, high, unit = ref_range
        print(f"正常范围: {low}-{high} {unit}")
        above_normal = sum(1 for v in values if v > high)
        below_normal = sum(1 for v in values if v < low)
        normal = sum(1 for v in values if low <= v <= high)
        print(f"正常值: {normal} 次")
        print(f"高于正常: {above_normal} 次")
        print(f"低于正常: {below_normal} 次")

    print(f"{'=' * 60}")


def main():
    parser = argparse.ArgumentParser(
        description="生成健康指标趋势图",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--指标", nargs="+", required=True, help="指标名称（可指定多个）"
    )
    parser.add_argument("--科目", help="指定科目（可选）")
    parser.add_argument(
        "--title", help="图表标题（多指标时使用）", default="健康指标趋势"
    )
    parser.add_argument(
        "--output", help="输出路径（默认: health-profile/charts/{指标名}_trend.png）"
    )

    args = parser.parse_args()

    # 创建输出目录
    output_dir = Path("health-profile/charts")
    output_dir.mkdir(parents=True, exist_ok=True)

    indicators = args.指标

    # 单个指标
    if len(indicators) == 1:
        analyte_name = indicators[0]
        data, unit = find_analyte_data(analyte_name, args.科目)

        if not data:
            print(f"错误: 未找到指标 '{analyte_name}' 的数据")
            sys.exit(1)

        # 默认输出路径
        if not args.output:
            output_path = output_dir / f"{analyte_name}_trend.png"
        else:
            output_path = Path(args.output)

        # 绘制图表
        plot_single_indicator(analyte_name, data, unit, output_path)
        print_statistics(data, analyte_name)

    # 多个指标
    else:
        # 默认输出路径
        if not args.output:
            output_path = output_dir / "multi_indicator_trends.png"
        else:
            output_path = Path(args.output)

        plot_multiple_indicators(indicators, args.title, output_path)


if __name__ == "__main__":
    main()
