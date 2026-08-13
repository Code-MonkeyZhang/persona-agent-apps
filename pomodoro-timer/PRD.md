# 番茄时钟 Agent App — 产品需求文档（PRD）

## 产品定位

番茄时钟是一个嵌入在 MiniAgent 中的专注计时 Agent App。用户在 Web UI 上设定专注时长、写一句话说这次要做什么，点击开始。Agent App 服务器管理计时器，在关键节点通过 MCP notification 通知 Agent，Agent 回应一句简短的话。专注结束时（自然完成或手动停止）记录自动写入 SQLite。

它就是一个番茄钟——设定时间，专注，休息，循环。唯一不同的是，当你开始专注时有 Agent 说一句"开始吧"，时间到了有 Agent 提醒你"到时间了"。

核心价值主张是**有节奏的专注，有人陪伴的感觉**。用户不需要全程跟 Agent 对话，但知道有个 Agent 在关注着自己的节奏——开始时有鼓励，结束时有提醒。

## 设计原则

- **Web UI 为主，Agent 为辅。** 用户的主要操作——设定时间、写意图、控制计时器——都在 Web UI 上完成。Agent 也可以通过 start / stop 工具帮用户控制计时器，但不驱动流程，只在关键节点出现。
- **流程通知者。** Agent 只在专注开始、专注结束、用户停止、休息结束四个时刻被通知。每次一两句话，说完就安静。不主动发起对话，不对用户的专注质量做评价，不提供生产力建议。
- **循环节奏。** 专注和休息的切换是自动的。专注结束自动进入休息，休息结束等待用户开始下一轮。用户不需要手动管理状态转换。
- **轻量记录。** 每次专注前写一句话意图就够了——"写周报"、"看论文"、"整理邮箱"。记录的目的是让用户回看时知道自己这些时间花在了什么上，不是写日记。
- **后端自动记录。** 专注自然结束或被手动停止时，后端自动写入数据库。不依赖 Agent 调用任何工具来记录。

## 三个角色

```
用户 ──Web UI──→ Agent App 服务器 ──MCP notification──→ Agent
  ↑                    │                                    │
  │                    │ ←──── start ──────────────────────┘
  │                    │ ←──── stop ───────────────────────┘
  │                    │ ←──── query_stats ────────────────┘
  │                    │ ←──── get_timer_state ────────────┘
  └── Web UI 展示 ←────┘
```

- **用户**是计时器的主要操作者。设定时长、写意图、点开始、暂停、继续、停止——这些都在 Web UI 上完成。用户也是专注数据的消费者，可以在面板上看统计和历史，也可以在对话中问 Agent。
- **Agent** 是流程中的通知接收者。被通知"用户开始了番茄钟"时回应一句鼓励，被通知"时间到了"时回应一句提醒，被通知"用户停止了"时回应一句关心。Agent 也可以通过 start / stop 工具主动控制计时器——此时不需要通知自己。Agent 不监控计时过程。
- **Agent App** 是整个流程的管家。管理计时器的运行，在四个时刻向 Agent 发送 MCP notification，自动写入专注记录，通过 Web UI 向用户展示时钟和统计数据。

## 计时机制

### 状态机

```
idle ──(开始)──→ focus ──(倒计时归零)──→ break ──(倒计时归零)──→ idle
                    ↑ 可暂停/继续/停止
```

| 阶段 | 说明 |
|---|---|
| `idle` | 无计时器运行，等待用户或 Agent 开始 |
| `focus` | 专注倒计时中 |
| `short_break` | 短休息倒计时中（专注结束后自动进入） |
| `long_break` | 长休息倒计时中（每完成 N 个专注后进入） |

运行中可暂停（计时冻结）、继续、停止（回到 idle）。

### 默认节奏

经典番茄工作法——默认专注 25 分钟，休息 5 分钟。每完成 N 个番茄钟后进入一次长休息（休息时长 × 3）。长休息结束后，新一轮重新计数。

用户不需要手动切换专注和休息。专注计时结束后，Agent App 自动启动休息计时。休息计时结束后，面板回到待开始状态，等用户或 Agent 开始下一个专注。

### 可自定义时长

用户在设置态面板上直接调整（无弹窗），3 项参数：

| 参数 | 默认值 | 范围 | 设置方式 |
|---|---|---|---|
| 工作时长 | 25 分钟 | 1–90 | 左侧圆 ▲▼ |
| 休息时长 | 5 分钟 | 1–30 | 右侧圆 ▲▼ |
| 每轮番茄钟个数 | 4 个 | 2–8 | 顶部 +/- 按钮 |

长休息 = 休息时长 × 3，自动触发，不单独设置。

设置持久化到 SQLite，跨重启保留。

### 计时器控制

计时过程中可以暂停、继续或停止：

- **暂停**：计时冻结，剩余时间保留
- **继续**：从暂停处恢复倒数
- **停止**：结束当前计时，回到 idle。如果停止时在 focus 阶段，已专注的部分时长会记录到历史（标记为未完成）；如果在 break 阶段，直接回到 idle（休息不记录）

## 专注意图

每次开始专注之前，Web UI 上有一个输入框，用户可以写一句话描述这次专注要做什么。这是可选的——用户可以留空直接开始。

如果写了，这句话会随这次专注一起记录下来，回看历史时能看到每个番茄钟都花在了什么上。意图不需要是正式的任务名称，"写周报"可以，"把那个 bug 修了"也可以。

Agent 通过 `start` 工具启动专注时也可以传入意图。

## 专注历史

用户可在面板右上角点击历史图标进入历史页面（二级页面），查看专注记录列表。每条显示：日期时间、意图文字、专注时长、是否完成（完成的标 ✓，中断的标 —）。按时间倒序排列。

用户也可以在对话中问 Agent 关于统计的问题。Agent 调用 `query_stats` 工具查询后用自然语言回答。

## 工具列表

本服务向 Agent 暴露以下工具（`agentId` / `sessionId` 由平台自动注入，无需填写）：

| 工具名称 | 参数 | 功能描述 |
|---|---|---|
| `start` | `intent?`: string, `duration_min?`: int | 开始一段专注。不传时长用默认值（25 分钟）。可选传入意图描述。调用后 Web UI 同步开始倒计时 |
| `stop` | 无 | 停止当前进行中的计时器，回到空闲。专注中被停止会记录已完成的时长（标记为未完成） |
| `query_stats` | 无 | 查询今日/本周番茄钟数量、累计时长、最近 10 条专注记录 |
| `get_timer_state` | 无 | 查询当前计时器实时状态：阶段、剩余分钟、意图、本轮进度 |

### 工具 Prompt 原文

以下为每个工具的 `prompts/*.txt` 文件内容（即 MCP `tool.description`）：

**`instructions.txt`（server 级整体说明）：**

> 番茄时钟工具。帮用户管理专注节奏——设定时间、专注、休息、循环。
>
> - 用户可在面板上操作（设定时长、写意图、开始/暂停/停止），你也可以通过 start / stop 工具帮用户控制计时器。
> - 你被通知的时刻：用户开始专注、用户停止专注、专注自然结束、休息结束。
> - 专注开始时你说一句鼓励，专注结束时你说一句提醒，休息结束时提示用户是否继续。
> - 用户问专注统计时调用 query_stats 查询后用自然语言回答。
> - 用户问当前计时状态时调用 get_timer_state 查询剩余时间和意图。
> - 不要主动发起对话，不对用户的专注质量做评价，不提供生产力建议。

**`start.txt`：**

> 开始一段专注。可选传入意图描述和自定义时长（分钟），不传时长用默认值（25 分钟）。调用后 Web UI 同步开始倒计时。用户也可以自己在面板上开始——那种情况下你会收到通知。

**`stop.txt`：**

> 停止当前进行中的计时器（专注或休息），回到空闲。专注中被停止会记录已完成的时长（标记为未完成）。用户也可以自己在面板上停止——那种情况下你会收到通知。

**`query_stats.txt`：**

> 查询专注统计。返回今日和本周的番茄钟数量、累计专注时长、以及最近 10 条专注记录。用户问专注数据时调用。

**`get_timer_state.txt`：**

> 查询当前计时器实时状态。返回当前阶段（专注/休息/空闲）、剩余分钟数、当前意图、本轮已完成番茄钟数。用户问"还剩多久"或"在专注什么"时调用。纯查询，不影响通知路由。

## 通知设计

Agent App 在**三个时刻**通过 `notifications/app` 主动推送通知给 Agent。

通知 method 固定为 `notifications/app`，params 固定四字段（`agentId` / `sessionId` / `source` / `content`），字段名不可更改。`source` 值为 `"pomodoro-timer"`（与 mcp.json 的 key 一致）。

**核心规则：通知是行为模式切换信号，不是信息传递。** 专注开始时 Agent 进入「专注守护模式」——不主动打扰用户，用户分心时温和提醒。专注结束时解除守护模式。**Agent 自己调用 start / stop 工具也触发通知**——因为 Agent 需要知道自己进入了或退出了守护模式。

通知 content 从 `prompts/notify_*.txt` 模板文件加载，方便随时修改。模板使用 `{variable}` 占位符，运行时用 `str.format()` 填充。

### 通知 1：专注开始（守护模式开启）

| 项目 | 内容 |
|---|---|
| **触发条件** | 计时器从 `idle` 进入 `focus` 阶段 |
| **触发源** | WebSocket `start` 消息 **或** Agent 调用 `start` 工具 |
| **content 模板** | `prompts/notify_start.txt`：`用户进入了专注模式，预计 {duration} 分钟{intent_clause}。在专注期间请不要主动发起对话。如果用户主动找你聊天且话题与专注任务无关，请温和地提醒他回到专注。` |
| **路由目标** | 启动本次 focus 的 session（WS query 参数或 MCP 注入参数中的 `agentId` / `sessionId`） |

### 通知 2：专注结束（守护模式解除）

| 项目 | 内容 |
|---|---|
| **触发条件** | `focus` 阶段倒计时归零 **或** 用户/Agent 点击停止 |
| **触发源** | asyncio Task 到期 **或** WebSocket `stop` 消息 **或** Agent 调用 `stop` 工具 |
| **content 模板** | `prompts/notify_end.txt`：`专注已结束。专注守护模式已解除，你可以恢复正常对话。` |
| **路由目标** | 启动本次 focus 时存储的 `agentId` / `sessionId` |
| **后端动作** | 自然结束：写入 focus_sessions（completed=1）+ auto-start break；手动停止（focus 阶段）：写入 focus_sessions（completed=0） |

### 通知 3：休息结束

| 项目 | 内容 |
|---|---|
| **触发条件** | `short_break` 或 `long_break` 阶段倒计时归零 |
| **触发源** | 后端 asyncio Task 到期事件 |
| **content 模板** | `prompts/notify_break_end.txt`：`{break_type}休息结束了，可以开始下一段专注了。` |
| **路由目标** | 启动本次 focus cycle 的 `agentId` / `sessionId` |
| **后端动作** | 切换到 `idle`，等待用户或 Agent 开始下一个专注 |

### 不触发通知的操作

以下操作**不产生** `notifications/app`：

- 用户暂停 / 继续计时器（只更新 UI 状态）
- 用户修改设置
- 用户查看历史 / 切换日历月份
- Agent 调用 `query_stats` / `get_timer_state`（纯查询，不触发通知）
- 用户/Agent 停止休息阶段（专注已结束，守护模式已解除，停止休息不改变行为模式）

## 通知路由（按任务记账）

**关键约束**（来自《归属与消息模型》§6.2 番茄时钟反例）：

> 启动 focus 的 Session A 必须收到所有通知。即使 Session B 中途查询了计时器状态，通知目标也不变。

实现方式：

1. 用户通过 WS 连接点击「开始专注」时，后端从该 WS 连接的 query 参数（`?agentId=...&sessionId=...`）取出 `agentId` / `sessionId`，存入当前计时器状态（`focus_agent_id` / `focus_session_id`）
2. 四个时刻的通知都从这俩字段取路由目标，不依赖当前 WS 连接
3. `get_timer_state` 和 `query_stats` 是纯查询，**不改** `focus_agent_id` / `focus_session_id`
4. 如果目标 Session 已被删除，通知直接丢弃并记日志（不回退到其他 Session）

## 记录规则

后端在以下时机自动写入 `focus_sessions` 表，不需要 Agent 调用任何工具：

| 时机 | 记录 | completed |
|---|---|---|
| 专注自然结束（倒计时归零） | duration_min = 设定时长，intent = 用户填的意图 | 1 |
| 专注被停止（用户 UI 停止或 Agent 调 stop） | duration_min = 实际已专注分钟数（向下取整），intent = 用户填的意图 | 0 |
| 专注中暂停后未恢复 | 不记录（暂停不是结束） | — |
| 休息被停止 / 跳过 | 不记录（休息不记录） | — |

## WebSocket 协议

### 前端 → 后端

| `type` | 附加字段 | 说明 |
|---|---|---|
| `start` | `intent: string`, `duration_min?: int` | 开始专注（idle → focus），可选传入工作时长覆盖默认值 |
| `pause` | — | 暂停计时 |
| `resume` | — | 继续计时 |
| `stop` | — | 停止计时，回到 idle（focus 中停止会记录部分时长） |
| `update_settings` | `settings: { focus_min, break_min, focus_per_round }` | 更新设置 |
| `get_month` | `year: int, month: int` | 请求某月的专注记录（日历视图用） |

### 后端 → 前端

| `type` | 载荷 | 说明 |
|---|---|---|
| `init` | `{ state, history, stats }` | 首次连接推送完整初始状态 |
| `state` | `{ state }` | 任何状态变更（开始/暂停/继续/停止/阶段切换/设置更新） |
| `data` | `{ history, stats }` | 数据更新（专注记录写入后） |
| `month_data` | `{ sessions: FocusSession[] }` | 返回某月的专注记录（响应 `get_month`） |

### state 对象结构

```json
{
  "phase": "idle | focus | short_break | long_break",
  "running": true,
  "ends_at": 1234567890000,
  "remaining_seconds": 1500,
  "intent": "写周报",
  "focus_count_in_round": 2,
  "settings": {
    "focus_min": 25,
    "break_min": 5,
    "focus_per_round": 4
  }
}
```

- `ends_at`：当前阶段结束的绝对时间戳（ms）。`running=true` 时前端据此本地倒数；`running=false` 时无效
- `remaining_seconds`：暂停时的剩余秒数。前端暂停态显示此值

## SQLite 数据模型

使用 Python 标准库 `sqlite3`，`PRAGMA user_version` 做迁移。

```sql
-- v1
CREATE TABLE IF NOT EXISTS focus_sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at   TEXT NOT NULL,     -- ISO 8601 datetime
    ended_at     TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    intent       TEXT DEFAULT '',
    completed    INTEGER NOT NULL DEFAULT 1,  -- 0=中断 1=完成
    agent_id     TEXT DEFAULT '',
    session_id   TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_focus_started ON focus_sessions(started_at);

CREATE TABLE IF NOT EXISTS app_settings (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    focus_min       INTEGER NOT NULL DEFAULT 25,
    break_min       INTEGER NOT NULL DEFAULT 5,
    focus_per_round INTEGER NOT NULL DEFAULT 4
);
```

- `focus_sessions`：每次专注一条记录（自然结束或手动停止）。后端自动写入
- `app_settings`：单行表（id 恒为 1），存三项可调参数。首次启动时 INSERT 默认行

## UI 设计

### 主题色

`#ff4b4b`（番茄红）。用于：进度环描边、focus 阶段标识、开始按钮、工作圆选中态。休息阶段切换为中性灰色。

### 设计规范遵循

遵循 `ui-design/设计规范`（字体/UI 规范 + 图标语义标准 + 术语规范）和 `reference/agent-skill/skills-emilkowalski`（动画配方）：

- **字体**：系统字体栈（`-apple-system, BlinkMacSystemFont, ...`），正文 13px，标题 14–16px
- **图标**：Lucide（`History` 历史入口、`Play` 开始、`Pause` 暂停、`Square` 停止）
- **数字**：倒计时必须用 tabular numbers（`font-variant-numeric: tabular-nums`），防止数字宽度变化导致布局抖动
- **圆角**：卡片 `rounded-2xl`，按钮 `rounded-xl`
- **材质**：`.glass` 毛玻璃效果（`backdrop-filter: blur(12px) saturate(1.4)`）
- **按压**：`.press` 类，`transform: scale(0.97)`，`transition: transform 160ms cubic-bezier(0.23,1,0.32,1)`

### 动画规范

| 场景 | 动画 | 参数 |
|---|---|---|
| 倒计时数字 | tabular-nums + 本地 setInterval 1s | 不动画，直接跳变 |
| 圆形进度环 | SVG stroke-dashoffset | **linear**（常量运动不用 easing），1s 步进 |
| 主按钮按压 | transform: scale(0.97) | 160ms `cubic-bezier(0.23,1,0.32,1)` |
| 专注完成 → 休息切换 | 阶段标识 morph + 颜色过渡 | spring `{ duration: 0.5, bounce: 0.2 }` |
| 历史列表入场 | stagger | `nth-child` 延迟 40ms，`ease-out` |
| hover 效果 | 门控 | `@media (hover: hover) and (pointer: fine)` |
| 减少动效 | 无障碍 | `@media (prefers-reduced-motion: reduce)` 保留 opacity/color |

### Tab 导航 + 两态布局

顶部一条 tab 栏（左「专注」、右「历史」），点击切换。专注 tab 内分为**设置态**（idle）和**计时态**（running），开始按钮触发切换。

#### 设置态（idle）

```
┌─────────────────────────────┐
│  [ 专注 ]    [ 历史 ]        │ ← 顶部 Tab
│                             │
│   [<]      4      [>]       │ ← 每轮番茄钟数(< > 调整)
│                             │
│   ┌────────┐    ┌────────┐  │
│   │   ▲    │    │   ▲    │  │ ← ▲ +1 / ▼ -1
│   │   25   │    │    5   │  │ ← 工作时长    休息时长
│   │   ▼    │    │   ▼    │  │ ← 中间数字可点击直接输入
│   └────────┘    └────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 写一句话意图（可选）... │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │        开始专注        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- 顶部 tab 栏切换「专注」和「历史」
- 轮数 `[<] 4 [>]`：左右箭头调整每轮番茄钟个数，只显示数字本身
- 两个圆（工作 / 休息）：▲▼ 按钮加减，**中间数字可点击直接键盘输入**（Enter 确认，clamp 到范围）
- 意图输入框（可选）+ 开始按钮

#### 计时态（running）

```
┌─────────────────────────────┐
│  [ 专注 ]    [ 历史 ]        │
│          2 / 4              │ ← 当前轮 / 总轮(只读)
│                             │
│        ┌──────────┐         │
│        │  24:35   │         │ ← 倒计时 + 圆环(10px)
│        └──────────┘         │   红色=专注  灰色=休息
│                             │
│        在写周报中            │ ← 任务状态
│                             │
│      [暂停]    [停止]       │
└─────────────────────────────┘
```

- 轮数 `2 / 4`：只读进度，不显示调整按钮
- 倒计时时钟 + SVG 圆环（strokeWidth 10px），专注红色 / 休息灰色
- 任务状态文字（从阶段和意图自动生成）
- 暂停/停止按钮（暂停态变为继续/停止）

#### 任务状态规则

| 状态 | 显示文字 |
|---|---|
| idle | 不显示（设置态不需要） |
| focus + 有意图 | `在{意图}中`（如 在写周报中） |
| focus + 无意图 | `专注中` |
| short_break / long_break | `休息中` |
| paused | `已暂停` |

#### 历史页面（日历视图）

切换到「历史」tab，显示月历 + 日详情。有专注记录的日期画 SVG 圆环标记。

```
┌─────────────────────────────┐
│  [ 专注 ]    [ 历史 ]        │
│                             │
│  [<]     2026年8月     [>]  │ ← 月份切换
│  一  二  三  四  五  六  日  │
│              ①   ②   ③   ④ │ ← 有记录的日子画圆环
│   ⑤   ⑥   ⑦   ⑧   ⑨  10  11│
│  ...                        │
│                             │
│  ┌────────────────────────┐ │
│  │ 8月12日        共 50 分钟│ │ ← 选中日详情
│  │ 14:30  写周报  25min  ✓ │ │
│  │ 11:00  工作    25min  ✓ │ │ ← 空意图默认显示"工作"
│  └────────────────────────┘ │
└─────────────────────────────┘
```

- 月历网格，有记录的日子在数字背后画 SVG 圆环（番茄红，满环）
- 点击某天选中，下方显示该日专注列表
- 每条记录：时间、意图（空则显示"工作"）、时长、完成标记
- 底部显示当天总专注时长

## 使用场景

**场景一：开始一段专注。** 用户打开番茄钟面板，设置态显示两个圆（工作 25 / 休息 5）和轮数 4。用户在意图输入框写"写周报"，点击开始。面板切换到计时态，时钟开始倒数。Agent 收到通知进入专注守护模式——不主动打扰用户。

**场景二：番茄钟自然结束。** 25 分钟到了，倒计时归零，Agent App 自动启动 5 分钟休息，后端写入专注记录。面板显示灰色倒计时和"休息中"。Agent 收到"专注已结束，守护模式解除"通知。

**场景三：用户中途停止。** 用户专注了 12 分钟后有急事，点击停止。后端记录（duration_min=12, completed=0），面板回到设置态。Agent 收到"专注已结束，守护模式解除"通知。

**场景四：Agent 帮用户开始。** 用户在对话中说"帮我开一个 30 分钟的番茄钟，我要看论文"。Agent 调用 `start(intent="看论文", duration_min=30)`。计时器启动，Web UI 同步切换到计时态。Agent 也收到专注开始通知，进入守护模式——后续如果用户跑题，Agent 会提醒用户回到专注。

**场景五：完成一轮四个番茄钟。** 用户连续完成 4 个番茄钟，每个之间有 5 分钟休息。第 4 个结束后，自动进入 15 分钟长休息（5 × 3）。长休息结束后回到设置态，Agent 收到"长休息结束了，可以开始下一段专注了"。

**场景六：查看历史。** 用户切换到「历史」tab，看到当月日历——有专注的日子标记了红色圆环。点击某天，下方显示那天的专注详情（时间、意图、时长）。也可以在对话中问 Agent"这周专注得怎么样"，Agent 调用 query_stats 后回答。

**场景七：查实时状态。** 用户在对话中问"我现在还剩多久"，Agent 调用 get_timer_state 后回答"正在专注，还剩 12 分钟，意图是写周报"。
