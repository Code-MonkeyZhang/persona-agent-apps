# OCR 流程指南

本指南介绍如何使用 GLM-OCR 模型将医疗文档转换为结构化的 Markdown 文本，并对输出结果进行清理和规范化处理。

## 1. 概述

本系统使用 **GLM-OCR** 作为 OCR 引擎，

## 2. OCR 处理流程

### 2.1 准备工作

**Python 环境**:
本项目使用 `uv` 进行依赖管理。请确保在运行脚本前同步环境：

```bash
# 在项目根目录执行
uv sync
```

**模型文件**:
确保 `health-profile/scripts/ocr/model/` 目录下包含完整的 GLM-OCR 模型文件。如果没有,使用 `modelscope download --model ZhipuAI/GLM-OCR --local_dir health-profile/scripts/ocr/model` 这个命令进行下载

### 2.2 使用 OCR 脚本

**运行方式**:

```bash
# 从项目根目录运行
python3 health-profile/scripts/ocr/process_ocr.py
```

**脚本功能**:

- 自动扫描 `health-profile/raw_data/` 目录下的所有文件
- 支持格式: .jpg, .jpeg, .png, .bmp, .pdf
- 自动跳过已处理的文件
- 将结果输出到 `health-profile/rawdata2markdown/` 目录

## 8. 后续数据处理

OCR流程结束之后, 所以结果都会以md文件的形式保存在 `health-profile/rawdata2markdown/`, 接下来你要根据下面的指示,对每一个md文件进行处理,进行数据提取和录入. 如果内容太多可以分批次进行, 不要使用脚本.

1. **人工校对**: 检查 OCR 输出的准确性，修正识别错误
2. **数据提取**: 从表格中提取关键指标数据
3. 根据
4. **CSV 录入**: 使用 `health-profile/scripts/data-manager/csv_manager.py` 脚本将数据录入到 `health-profile/refine_data/health_data/csv_output/` 的对应分类子文件夹中（血液常规、尿液检查、生化检查等），这个脚本的使用方法可以在 `health-profile/scripts/data-manager/README.md` 中找到
5. **健康日志更新**: 更新 `health-profile/refine_data/health_journal.md`，记录诊断变更和治疗方案调整
6. 录入结束之后, 重新审查自己录入的内容进行double check

注意: 如果在导入资料的时候发现有日期冲突的数据, 以最新导入的数据为准, 替换掉旧的数据

详细说明请参考: [health-profile/refine_data/refine_data_Readme.md](../../refine_data/refine_data_Readme.md)
