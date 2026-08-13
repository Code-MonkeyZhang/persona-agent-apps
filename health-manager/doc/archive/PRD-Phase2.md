# Health Manager — Phase 2：图片归档 + 病历 + 化验数据

Phase 1 做完了纯数字的基础指标。Phase 2 在这个地基上加三块：化验单图片归档、Health Journal 病历、化验数据结构化。**不含 OCR 识别**——图片只是存着，识别留给 Phase 3。

> 本文件是方向性 PRD，不照着逐条实现，是指引规划。

## 阶段目标

Phase 1 的数据从"只有日常数字"扩展到"数字 + 图片 + 文字经过"。用户能：

- 上传化验单照片存档（不识别），形成个人化验单相册
- 用 markdown 写病历，人和 Agent 共同维护
- 把化验指标口述录入或从 CSV 导入，在指标浏览器里看趋势

## 化验单图片归档

用户在 App 界面的化验单区域上传图片，后端把原图存到本地按检查日期组织目录。**只存档，不识别**——Phase 3 才加 OCR。

- 上传按钮（`<input type=file>`，支持图片格式）
- 归档时用户可选填检查日期（默认今天）
- 已归档图片以缩略图列表展示，点开看原图
- `uploads` 表追踪每张图的文件路径、检查日期、上传时间

这个阶段的图片是"死照片"，随时能翻出来看，但数据不会自动进系统。用户想录入化验指标，靠对话口述（看图念给 Agent）。

原图存 `data/images/{checkup_date}/{filename}`，不进数据库，不入 git。

## Health Journal

一份 markdown 文档，记录定性的病例内容——就诊日期、医院科室、诊断、化验趋势描述、治疗方案、用药调整、主观感受。人和 Agent 都能读写。

### 双向维护

- **人编辑**：用户在 App 界面的 Journal 区域直接编辑 markdown，保存时自动存快照
- **Agent 编辑**：用户对话里说就诊经过（"今天看了肾内科，肌酐还行，把缬沙坦减到半片"），Agent 整理后调用 update 工具更新 Journal

### 快照机制

每次修改前把当前内容复制一份存档，文件名带时间戳和修改者（人/Agent），保留最近 N 个。这是 Agent 写入的必要保底——万一 Agent 改错（误删病历、改错用药），用户能回滚。

> 快照的"安全网"机制（改前自动存一份）在 Phase 2 就有。但**历史列表、查看版本、一键回滚这套 UI 留白**，Phase 2 不做，用户需要时手动到快照目录翻文件。

主文档存 `data/health_journal.md`，快照顾目录 `data/journal_snapshots/`，都不入 git。

## 化验数据结构化

把现有 exam_*.csv 的几十种化验指标纳入系统，支持查询和趋势可视化。**不依赖 OCR**——数据来源是对话口述或 CSV 导入。

### 数据来源

- **CSV 一次性导入**：首次启动时把现有 `exam_*.csv` 导入 `lab_results` 表（沿用现有 csv_manager.py 的能力）
- **对话口述录入**：用户看化验单照片，把关键指标念给 Agent，Agent 调 `record_lab_result` 批量录入

### lab_results 表

所有科目共用一张长表：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增 |
| date | TEXT | YYYY-MM-DD |
| category | TEXT | 科目（肾功能/血常规/血脂…） |
| analyte | TEXT | 项目名（血肌酐/尿素/尿酸…） |
| value_num | REAL | 定量数值结果 |
| value_text | TEXT | 定性结果（阴阳性） |
| unit | TEXT | 单位 |
| ref_text | TEXT | 参考范围文本 |
| abnormal_flag | TEXT | 异常标记（L/H） |
| specimen | TEXT | 标本类型 |
| note | TEXT | 备注 |
| created_at | TEXT | 记录时间 |

### 指标浏览器

用户选科目、选指标，画出该指标的历史趋势。这是现有 plot_trends.py 脚本能力的 Web 化：

- 指标趋势折线
- 参考范围线（正常上下限）
- 异常值标注（超出范围的点高亮 + 数值标签）

### 校对分层

化验数据的校对分两层：

- **硬规则**（下沉到录入工具内部）：数值范围校验、定性值白名单。规则来自现有 `validation_rules.yaml`（已覆盖肾功能/肝功能/血常规/血脂等十几个科目）。工具拒绝离谱值，Agent 看到错误自行修正
- **软校对**（Agent 提示词层）：异常值合理性、与病史趋势一致性、漏项检查

## 新增 MCP 工具

Phase 1 的 5 个工具保留，新增：

| 工具 | 用途 |
|---|---|
| `record_lab_result` | 批量录入化验指标（一次体检的一组） |
| `query_history` | 查询某指标的历史数据 |
| `get_summary` | 返回均值、极值、趋势方向、异常次数 |
| `list_categories` | 列出有哪些科目 |
| `list_analytes` | 列出某科目下有哪些指标 |
| `update_health_journal` | Agent 更新 Journal（写前自动快照） |
| `get_health_journal` | 读取 Journal 内容 |
| `get_pending_upload` | 获取已存档的化验单列表（Phase 2 只返回存档信息；Phase 3 扩展为返回识别数据） |

## UI 扩展

在 Phase 1 的基本信息卡 + 日常看板基础上，新增三个区域：

- **化验单归档区**：上传按钮 + 已归档图片缩略图列表（点开看原图）
- **指标浏览器**：选科目 → 选指标 → 趋势折线 + 参考范围线 + 异常标注
- **Health Journal 区**：markdown 内容展示 + 编辑入口

## Notification 设计

Phase 2 仍然**不需要 Notification**。化验单图片上传后纯存档，用户想录入指标时在对话里主动说，Agent 响应。Journal 更新也是对话驱动。Notification 从 Phase 3 的 OCR 识别完成才开始需要。
