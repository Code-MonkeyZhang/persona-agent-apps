"""Tests for the one-shot legacy import's pure functions."""

BLOOD_ROW = {
    "date": "2026-09-29", "specimen": "血清", "category": "肾功能",
    "analyte": "肌酐", "value_num": "106", "value_text": "", "unit": "umol/L",
    "ref_low": "57", "ref_high": "97", "ref_text": "57-97",
    "abnormal_flag": "HIGH", "note": "", "group": "生化检查",
}

URINE_RBC_ROW = {
    "date": "2026-09-29", "specimen": "", "category": "尿液分析",
    "analyte": "红细胞计数", "value_num": "26", "value_text": "", "unit": "个/uL",
    "ref_low": "0", "ref_high": "25", "ref_text": "0-25",
    "abnormal_flag": "HIGH", "note": "", "group": "尿液检查",
}


def test_prepare_lab_row_normalizes_and_recomputes(import_legacy):
    row = import_legacy.prepare_lab_row(BLOOD_ROW)
    assert row["analyte"] == "肌酐"
    assert row["category"] == "生化检查"
    assert row["abnormal_flag"] == "H"
    assert row["src_flag"] == "H"


def test_prepare_scoped_urine_rbc(import_legacy):
    row = import_legacy.prepare_lab_row(URINE_RBC_ROW)
    # the urine folder scope must beat the name-level blood mapping
    assert row["analyte"] == "尿红细胞计数"
    assert row["category"] == "尿液检查"
    assert row["abnormal_flag"] == "H"


def test_prepare_fills_missing_refs_from_dictionary(import_legacy):
    row = dict(BLOOD_ROW, ref_low="", ref_high="", ref_text="")
    prepared = import_legacy.prepare_lab_row(row)
    assert prepared["ref_low"] == 57
    assert prepared["ref_high"] == 97
    assert prepared["ref_text"] == "57-97"


def test_aggregate_imaging_groups_by_date_and_type(import_legacy):
    rows = [
        {"date": "2020-10-13", "category": "腹部超声", "analyte": "超声所见",
         "value_num": "", "value_text": "未见明显异常", "unit": ""},
        {"date": "2020-10-13", "category": "腹部超声", "analyte": "右肾大小",
         "value_num": "10.7 x 4.9", "value_text": "", "unit": "cm"},
        {"date": "2020-10-13", "category": "CT检查", "analyte": "胸部CT平扫",
         "value_num": "", "value_text": "未见异常", "unit": ""},
    ]
    findings = import_legacy.aggregate_imaging(rows)
    assert len(findings) == 2
    by_type = {f["exam_type"]: f for f in findings}
    ultrasound = by_type["腹部超声"]
    assert "超声所见：未见明显异常" in ultrasound["finding_text"]
    assert "右肾大小：10.7 x 4.9 cm" in ultrasound["finding_text"]
    assert "未见异常" in by_type["CT检查"]["finding_text"]


JOURNAL_MD = """# 健康日志

## 个人基本信息

- 血型: O 型

## 病例记录 (按时间倒序)

### 2026-09-29 医院（复查）

肌酐 106。

### 2021-02 医院（历史汇总）

历史内容。

### 2020-10-17 医院（首次确诊）

确诊内容。
"""


def test_split_journal(import_legacy):
    preamble, entries = import_legacy.split_journal(JOURNAL_MD)
    assert "血型" in preamble
    assert "健康日志" not in preamble
    assert "病例记录" not in preamble
    assert [e["date"] for e in entries] == ["2026-09-29", "2021-02-01", "2020-10-17"]
    assert entries[0]["title"] == "医院（复查）"
    assert "肌酐 106" in entries[0]["content"]
