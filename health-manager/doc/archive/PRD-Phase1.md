# Health Manager — Phase 1：基础指标记录器

Health Manager 的最终形态是一个**个人健康中枢**——统一管理基本属性、日常体征、化验指标、病例记录四类数据。分三个阶段递进建设：

- **Phase 1**（本文档）：基础指标，纯数字
- Phase 2：加化验单图片归档、Health Journal、化验数据
- Phase 3：加 OCR 自动识别

> 本文件是 Phase 1 的权威产品设计文档，照着它实现。

## 产品定位

Phase 1 做一个**日常健康指标记录器**。用户在对话里随口说体重、血压、心率，Agent 帮忙记下来并给简短反馈；身高在 App 表单填一次。界面展示这些指标的趋势曲线。

只处理数字性的基础体征，不碰图片、不碰化验、不碰病例。目标是把整条 Agent App 链路跑通——对话录入 → MCP 工具写库 → WebSocket 推送 → 前端刷新，用最小功能验证架构。Phase 2 和 Phase 3 在这个地基上长。

## 数据范畴

| 数据 | 类型 | 录入方式 | 呈现 |
|---|---|---|---|
| 身高 | 静态基本属性 | App 表单 | 基本信息卡（含 BMI） |
| 体重 | 动态日常指标 | 对话口述 | 最新值卡 + 趋势折线 |
| 血压（收缩压/舒张压） | 动态日常指标 | 对话口述 | 最新值卡 + 双折线 |
| 心率 | 动态日常指标 | 对话口述（随血压一起） | 最新值卡 + 折线 |

## 交互模型

### 对话录入（唯一通道）

用户在 Agent 对话里说健康数据，Agent 识别后调用 record 工具写入后端：

- "今天 71.2 公斤" → `record_weight`
- "血压 120/80 心率 68" → `record_blood_pressure`（心率随血压一起录）
- "刚称了下 75.4" → `record_weight`

后端校验通过后写 SQLite，通过 WebSocket 推送更新给前端。Agent 拿到工具返回值（含和上次的对比），在对话里给简短反馈（如"记下了，比上次轻 0.3"）。

这条通道是**单向的**：数据从对话进来，不反向通知 Agent。

### 身高表单

身高是静态属性，用户在 App 界面的基本信息卡直接填，不走对话。保存后存到 profile 表，用于计算 BMI（结合最新体重）。

## 数据存储

所有数据存 SQLite（`data/health.db`，在 .gitignore 里不入库）。两张表：

### profile 表（基本属性，单行表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 固定为 1 |
| height | REAL | 身高 cm |
| updated_at | TEXT | 更新时间 |

### daily_metrics 表（日常指标）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增 |
| date | TEXT | YYYY-MM-DD |
| weight | REAL | 体重 kg |
| systolic | INTEGER | 收缩压 mmHg |
| diastolic | INTEGER | 舒张压 mmHg |
| heart_rate | INTEGER | 心率 bpm |
| note | TEXT | 备注 |
| created_at | TEXT | 记录时间 |

一次录入不一定填满所有字段——用户可能只说体重，或只说血压。未提到的字段留空。

## MCP 工具

| 工具 | 用途 | 关键参数 |
|---|---|---|
| `record_weight` | 记录体重 | date、weight、note（可选） |
| `record_blood_pressure` | 记录血压和心率 | date、systolic、diastolic、heart_rate（可选）、note（可选） |
| `set_profile` | 设置身高 | height |
| `get_profile` | 读取身高 | 无 |
| `get_latest` | 查最近一条日常指标（给 Agent 做对比反馈） | metric（可选，weight/blood_pressure） |

### 工具返回值设计

`record_weight` 和 `record_blood_pressure` 录入成功后，返回值包含**上次值 + 本次值 + 变化量**，方便 Agent 直接给对比反馈，不用再调一次查询。例如：

> 已记录：体重 71.2kg。上次 71.5kg（3 天前），变化 -0.3kg。

`get_latest` 返回最近一条体重 / 血压记录，供 Agent 在用户问"我上次多重"时调用。

工具参数里 `agentId` 和 `sessionId` 由平台自动注入，Agent 不用填。

## Notification 设计

Phase 1 **不需要 Notification**。原因是：

- 数据从对话单向流入，用户主动说才会录入，不需要后端反向触发 Agent
- 没有图片上传、没有异步识别——所有操作都是对话里即时完成

Notification 从 Phase 2 的化验单图片上传、Phase 3 的 OCR 识别完成才开始需要。

## UI 设计

界面分两块。技术栈 React + Vite + Recharts，复用 rock-paper-scissors 的前端基建。

### 基本信息卡

- 展示身高，点击可编辑（表单 → 调 `set_profile`）
- 展示 BMI（身高结合最新体重实时算：`weight / (height/100)²`），附带 BMI 分级标签（偏瘦/正常/偏胖/肥胖）

### 日常看板

- **最新值卡片**：最新体重、血压、心率，各带和上次的对比（如"比上次轻 0.3"、"比上次高 5"）
- **体重趋势折线**：Recharts LineChart，所有历史数据点，X 轴日期
- **血压双折线**：收缩压 + 舒张压两条线共 X 轴，叠加正常范围参考带（收缩压 90-140，舒张压 60-90 的浅色带）。心率作为第三条细线叠加在同一图上，共用右侧 Y 轴

界面只做展示，没有对话功能——对话仍在 Agent 聊天侧。录入后前端通过 WebSocket 自动刷新，不用手动刷新。

## 校对

### 硬规则（下沉到录入工具内部）

基础指标的合理范围，防止离谱值入库：

| 指标 | 合理范围 | 说明 |
|---|---|---|
| 体重 | 20-300 kg | 兜底防离谱 |
| 收缩压 | 60-250 mmHg | 兜底防离谱 |
| 舒张压 | 40-200 mmHg | 兜底防离谱 |
| 心率 | 30-250 bpm | 兜底防离谱 |
| 身高 | 50-250 cm | 兜底防离谱 |

注意这是**防离谱值的兜底范围**，不是医学正常范围。超出范围的值，工具直接拒绝并返回错误，Agent 看到错误自行修正重试（可能是用户说错、Agent 听错）。

### 软校对（Agent 提示词层）

- 异常波动提醒（如体重和上次比变化超过 3kg，Agent 主动确认"变化有点大，确认是这个数吗"）
- 录入工具返回值带"上次值 + 变化量"，辅助 Agent 做对比判断

## 技术架构

复用 rock-paper-scissors 跑通的双通道 Agent App 架构：

- **stdio MCP**：暴露 5 个工具给 Agent
- **uvicorn HTTP**：serve 前端静态文件 + WebSocket
- **单进程双通道**：anyio task group 同时跑 MCP 和 HTTP，共享同一个 SQLite 实例。Agent 调工具写库后，同一进程内通过 WebSocket 推送给前端

数据流：

```
用户对话 → Agent 调 MCP 工具 → 工具写 SQLite + 返回对比值给 Agent
                              → WebSocket 推送 → 前端刷新
```

前端构建产出 `ui/` 目录，server 用 StaticFiles serve。Vite 配置 `base: './'`（相对路径，适配平台 webview 嵌入）。
