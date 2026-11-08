"""Tests for the analyte dictionary: normalization, flagging, extremes."""

from health_manager.analytes import (
    check_extreme,
    judge_flag,
    normalize_analyte,
    num,
    ref_text,
)

import pytest


def test_normalize_aliases_and_brackets():
    assert normalize_analyte("Scr") == "肌酐"
    assert normalize_analyte("血肌酐") == "肌酐"
    assert normalize_analyte("血肌酐(Scr)") == "肌酐"
    assert normalize_analyte("BUN") == "尿素"
    assert normalize_analyte("  肌酐 ") == "肌酐"
    assert normalize_analyte("完全不认识的指标") is None
    assert normalize_analyte("") is None


def test_normalize_scoped_blood_and_urine_names():
    # bare spoken names prefer the blood count variants
    assert normalize_analyte("白细胞") == "白细胞计数"
    assert normalize_analyte("WBC") == "白细胞计数"
    assert normalize_analyte("红细胞计数") == "红细胞计数"
    assert normalize_analyte("尿白细胞") == "白细胞酯酶"
    assert normalize_analyte("尿红细胞") == "尿红细胞计数"


def test_judge_flag_boundaries():
    assert judge_flag(106, 57, 97) == "H"
    assert judge_flag(50, 57, 97) == "L"
    assert judge_flag(97, 57, 97) is None
    assert judge_flag(None, 57, 97) is None
    assert judge_flag(3.0, None, None) is None
    assert judge_flag(200, None, 150) == "H"


def test_check_extreme():
    check_extreme("肌酐", 106)
    with pytest.raises(ValueError):
        check_extreme("肌酐", 3000)
    # analytes without bounds pass through
    check_extreme("不认识的指标", 1e9)


def test_number_and_ref_text_formatting():
    assert num(106.0) == "106"
    assert num(1.04) == "1.04"
    assert ref_text(57, 97) == "57-97"
    assert ref_text(None, 150) == "≤150"
    assert ref_text(3.9, None) == "≥3.9"
    assert ref_text(None, None) is None


def test_dictionary_payload_shape():
    from health_manager.analytes import ANALYTES, GROUP_ORDER, dictionary_payload

    payload = dictionary_payload()
    assert payload["groups"] == list(GROUP_ORDER)
    assert set(payload["items"]) == set(ANALYTES)

    creatinine = payload["items"]["肌酐"]
    assert creatinine["g"] == "生化检查"
    assert creatinine["s"] == "肾功能"
    assert creatinine["u"] == "umol/L"
    assert "Scr" in creatinine["a"]
    assert creatinine["r"] == "57-97"
    assert (creatinine["lo"], creatinine["hi"]) == (57, 97)

    group, members = payload["subs"]["肾功能"]
    assert group == "生化检查"
    assert "肌酐" in members

    upper_only = payload["items"]["总胆固醇"]
    assert upper_only["lo"] is None and upper_only["r"] == "≤5.18"
