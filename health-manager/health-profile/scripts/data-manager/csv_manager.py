#!/usr/bin/env python3
"""
CSV 健康数据管理工具
功能：查询、添加、删除 CSV 数据（带验证）
"""

import csv
import os
import yaml
from datetime import datetime
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).resolve().parents[3]
CSV_DIR = PROJECT_ROOT / "health-profile/refine_data/health_data/csv_output"
RULES_FILE = PROJECT_ROOT / "health-profile/scripts/data-manager/validation_rules.yaml"


def _find_csv_path(category: str) -> Path | None:
    """在 csv_output 的子文件夹中查找 exam_{category}.csv"""
    target = f"exam_{category}.csv"
    for subdir in CSV_DIR.iterdir():
        if subdir.is_dir():
            candidate = subdir / target
            if candidate.exists():
                return candidate
    fallback = CSV_DIR / target
    if fallback.exists():
        return fallback
    return None


def load_validation_rules():
    """加载验证规则"""
    if not os.path.exists(RULES_FILE):
        print(f"警告: 未找到验证规则文件 {RULES_FILE}")
        return {}

    with open(RULES_FILE, "r", encoding="utf-8") as f:
        try:
            rules = yaml.safe_load(f)
            return rules or {}
        except yaml.YAMLError as e:
            print(f"错误: 验证规则文件格式不正确 - {e}")
            return {}


def validate_numeric(value, rules, analyte):
    """验证数值是否在合理范围内"""
    if value is None or value == "":
        return True, None  # 空值通过

    try:
        num_val = float(value)
    except (ValueError, TypeError):
        return False, f"数值 '{value}' 不是有效的数字"

    # 检查上限
    if "max_value" in rules:
        max_val = rules["max_value"]
        if num_val > max_val:
            unit = rules.get("unit", "")
            msg = rules.get(
                "message", f"值 {num_val}{unit} 超过合理上限 {max_val}{unit}"
            )
            return False, msg

    # 检查下限
    if "min_value" in rules:
        min_val = rules["min_value"]
        if num_val < min_val:
            unit = rules.get("unit", "")
            msg = rules.get(
                "message", f"值 {num_val}{unit} 低于合理下限 {min_val}{unit}"
            )
            return False, msg

    return True, None


def validate_qualitative(value, rules):
    """验证定性值是否在白名单中"""
    if value is None or value == "":
        return True, None  # 空值通过

    if "允许值" not in rules:
        return True, None  # 没有白名单规则则通过

    allowed_values = rules["允许值"]
    if value not in allowed_values:
        msg = rules.get("message", f"定性值 '{value}' 不在允许的值列表中")
        return False, msg

    return True, None


def validate_input(data, rules_dict):
    """验证输入数据"""
    errors = []

    # 检查必填项
    required_fields = rules_dict.get("required_fields", [])
    for field in required_fields:
        if field not in data or data[field] == "":
            errors.append(f"缺少必填项: {field}")

    # 获取检测项目和数值
    analyte = data.get("analyte", "")
    value_num = data.get("value_num", "")
    value_text = data.get("value_text", "")

    # 检查是否为文本类型（不需要单位）
    if "text_only" in rules_dict:
        text_items = rules_dict["text_only"]["项目列表"]
        if analyte in text_items:
            # 文本类型项目不需要验证单位
            if data.get("unit", ""):
                errors.append(f"文本类项目 '{analyte}' 不需要单位")
        else:
            # 非文本类型必须有单位或数值
            if not value_num and not value_text:
                errors.append(f"必须提供 value_num 或 value_text")

    # 检查是否为比值类型（不需要单位）
    if "ratio_only" in rules_dict:
        ratio_items = rules_dict["ratio_only"]["项目列表"]
        if analyte in ratio_items:
            if data.get("unit", ""):
                errors.append(f"比值类项目 '{analyte}' 不需要单位")

    # 如果有数值，验证数值合理性
    if value_num and value_num != "":
        # 在各个分类规则中查找
        found_rule = False
        for category, items in rules_dict.items():
            if category in [
                "required_fields",
                "text_only",
                "ratio_only",
                "generic_numeric_limits",
            ]:
                continue
            if not isinstance(items, dict):
                continue
            if analyte in items:
                found_rule = True
                valid, msg = validate_numeric(value_num, items[analyte], analyte)
                if not valid:
                    errors.append(f"❌ {msg}")
                break

        # 如果没找到具体规则，尝试通用规则
        if not found_rule and "generic_numeric_limits" in rules_dict:
            generic_rules = rules_dict["generic_numeric_limits"]
            if analyte in generic_rules:
                valid, msg = validate_numeric(
                    value_num, generic_rules[analyte], analyte
                )
                if not valid:
                    errors.append(f"❌ {msg}")

    # 如果有定性值，验证格式
    if value_text and value_text != "":
        # 尿液分析中的特殊处理（潜血、白细胞、尿蛋白）
        if "urine_chem_range" in rules_dict:
            urine_chem_rules = rules_dict["urine_chem_range"]
            if analyte in urine_chem_rules:
                valid, msg = validate_qualitative(value_text, urine_chem_rules[analyte])
                if not valid:
                    errors.append(f"❌ {msg}")
            else:
                # 尿液分析中的其他项目
                for category in ["urinalysis_qualitative"]:
                    if category not in rules_dict:
                        continue
                    if analyte in ["潜血", "白细胞", "尿蛋白"]:
                        valid, msg = validate_qualitative(
                            value_text, rules_dict[category]
                        )
                        if not valid:
                            errors.append(f"❌ {msg}")
                        break

        # 其他定性值验证（尿蛋白定性、尿沉渣）
        for category in ["urine_protein_plus", "urine_sediment"]:
            if category not in rules_dict:
                continue
            if analyte in ["尿蛋白"]:
                valid, msg = validate_qualitative(value_text, rules_dict[category])
                if not valid:
                    errors.append(f"❌ {msg}")
                break
            if analyte in ["镜下红细胞", "镜下白细胞"]:
                valid, msg = validate_qualitative(value_text, rules_dict[category])
                if not valid:
                    errors.append(f"❌ {msg}")
                break

        # 血型验证
        if analyte in ["ABO血型", "Rh血型"]:
            blood_rules = rules_dict.get("blood_group", {})
            rule_key = "ABO血型" if "ABO" in analyte else "Rh血型"
            if rule_key in blood_rules:
                valid, msg = validate_qualitative(value_text, blood_rules[rule_key])
                if not valid:
                    errors.append(f"❌ {msg}")

    return errors


def list_categories():
    """列出所有科目"""
    files = []
    for subdir in sorted(CSV_DIR.iterdir()):
        if subdir.is_dir():
            for f in sorted(subdir.iterdir()):
                if f.name.startswith("exam_") and f.name.endswith(".csv"):
                    files.append(f)
        elif subdir.name.startswith("exam_") and subdir.name.endswith(".csv"):
            files.append(subdir)
    print("\n可用科目:")
    for f in files:
        name = f.name[5:-4]
        folder = f.parent.name if f.parent != CSV_DIR else ""
        label = f"  - {name} ({folder})" if folder else f"  - {name}"
        print(label)
    return [f.name[5:-4] for f in files]


def view_data(category, limit=10):
    """查看某科目的数据"""
    csv_path = _find_csv_path(category)
    if not csv_path:
        print(f"错误: 不存在科目 '{category}' 的 CSV 文件")
        return

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"\n{category} (共 {len(rows)} 条)")
    print("-" * 60)
    for i, row in enumerate(rows[-limit:], 1):
        print(
            f"{i}. {row.get('date', '')} | {row.get('analyte', '')} | {row.get('value_num', '')} {row.get('unit', '')}"
        )
    print("-" * 60)


def add_data(category, data):
    """添加新数据（带验证）"""
    csv_path = _find_csv_path(category)
    if not csv_path:
        print(f"错误: 不存在科目 '{category}' 的 CSV 文件")
        return False

    # 加载验证规则
    rules_dict = load_validation_rules()

    # 验证数据
    errors = validate_input(data, rules_dict)
    if errors:
        print("\n❌ 数据验证失败：")
        for error in errors:
            print(f"  {error}")
        print("\n请检查输入后重试。")
        return False

    # 验证通过，读取现有数据
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # 生成新的 result_id
    max_id = max((int(row["result_id"]) for row in rows), default=0)
    data["result_id"] = max_id + 1

    # 添加新行
    rows.append(data)

    fieldnames_list = list(fieldnames) if fieldnames else []
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_list)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ 已添加: {data.get('date', '')} | {data.get('analyte', '')}")
    return True


def add_general_data(category=None):
    """通用添加数据交互函数"""
    if not category:
        list_categories()
        category = input("请输入要添加数据的科目名称: ").strip()

    csv_path = _find_csv_path(category)
    if not csv_path:
        print(f"错误: 找不到科目 '{category}' 的 CSV 文件")
        return

    # 读取表头以确定需要输入的字段
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

    if not fieldnames:
        print("错误: CSV 文件没有表头")
        return

    print(f"\n正在向 [{category}] 添加数据")
    print("提示: 直接回车可跳过非必填项")

    data = {}
    # 自动字段和不需要用户输入的字段
    auto_fields = ["result_id", "category", "specimen"]
    # specimen 可以让用户输，但通常一个表可能固定？先暂定让用户输，除非想做更智能的默认值
    # 这里为了通用性，除了 result_id，其他都尝试让用户填，或者给默认空

    # 常用字段的输入提示优化
    prompts = {
        "date": "日期 (YYYY-MM-DD)",
        "analyte": "项目名称 (如: 血肌酐)",
        "value_num": "数值结果 (数字)",
        "value_text": "定性结果 (文本/阴阳性)",
        "unit": "单位",
        "ref_text": "参考范围文本",
        "abnormal_flag": "异常标记 (L/H)",
        "specimen": "标本类型 (如: 血清/尿液)",
        "note": "备注",
    }

    current_date = datetime.now().strftime("%Y-%m-%d")

    for field in fieldnames:
        if field == "result_id":
            continue

        # 自动填充 category
        if field == "category":
            data[field] = category
            continue

        prompt_text = prompts.get(field, field)

        # 日期提供默认值
        if field == "date":
            user_input = input(f"{prompt_text} [默认: {current_date}]: ").strip()
            data[field] = user_input if user_input else current_date
        else:
            user_input = input(f"{prompt_text}: ").strip()
            data[field] = user_input

    # 调用通用的添加逻辑（包含验证）
    add_data(category, data)


def main():
    print("=" * 50)
    print("  CSV 健康数据管理工具（带验证）")
    print("=" * 50)

    # 检查验证规则文件
    rules = load_validation_rules()
    if rules:
        print(f"✓ 已加载验证规则: {RULES_FILE}")
    else:
        print(f"⚠ 未找到验证规则文件，数据验证功能已禁用")

    while True:
        print("\n命令:")
        print("  l - 列出所有科目")
        print("  v [科目名] - 查看数据 (如: v 肾功能)")
        print("  a [科目名] - 添加数据 (如: a 肾功能)")
        print("  s [关键词] - 搜索 (如: s 白蛋白)")
        print("  t - 统计信息")
        print("  q - 退出")

        cmd = input("\n请输入命令: ").strip()

        if cmd == "q":
            break
        elif cmd == "l":
            list_categories()
        elif cmd.startswith("v "):
            category = cmd[2:].strip()
            view_data(category)
        elif cmd.startswith("a"):
            # 支持 'a' 或 'a 肾功能'
            parts = cmd.split(maxsplit=1)
            category = parts[1].strip() if len(parts) > 1 else None
            add_general_data(category)
        elif cmd.startswith("s "):
            keyword = cmd[2:].strip()
            search_data(keyword)
        elif cmd == "t":
            show_stats()
        elif cmd == "v":
            list_categories()
            category = input("输入科目名称: ")
            view_data(category)


if __name__ == "__main__":
    main()
