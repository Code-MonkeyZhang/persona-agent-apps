# 番茄时钟 Agent App 产品需求文档

> 本文是 session 模型改版定稿后的 PRD。用户故事与行为契约见 USER_STORY.md，本文只收机制与协议。

## 产品定位

番茄时钟是一个嵌入在 MiniAgent 中的专注计时 Agent App。用户一次设定工作时长、休息时长和轮数并点开始，Agent App 按这份配置自动推进整个 session。工作结束自动进休息，休息结束自动开下一轮，全部轮次走完自动结束。Agent 在 session 开始与结束时收到通知，专注期间进入守护模式。

核心价值主张是一次配置，完整跑完，有人在守护。

## 设计原则

一次配置完整 session。focus_min、break_min、rounds 三个参数定义一次运行，开始后自动推进，中间不需要任何手动接力。

三个数值参数每次必传。工具描述写清 session 结构，杜绝半配置启动。

Web UI 为主，Agent 为辅。配置与控制在面板完成，Agent 可以用工具做同样的事，但不驱动流程，只在 session 级节点出现。

通知是模式切换信号。session 开始进入守护模式，结束解除。轮间切换不通知，计时续轮是 App 的事。Agent 自己 start 也收到通知。

记录保持轻量。一句意图随 session 提交，每段工作自动落库，不依赖 Agent 调工具。

## 三个角色

```
用户 ──Web UI──→ Agent App 服务器 ──MCP notification──→ Agent
  ↑                    │                                    │
  │                    │ ←── start(focus_min, break_min, rounds) ──┘
  │                    │ ←── stop ─────────────────────────┘
  │                    │ ←── query_stats ────────────────┘
  │                    │ ←── get_timer_state ────────────┘
  └── Web UI 展示 ←────┘
```

用户是 session 的配置者。用户配三个数、写意图、点开始，也可以暂停、继续、停止，还能看历史与统计。

Agent 是另一个入口和守护者。Agent 一句话就能起完整 session，session 级通知驱动它的守护模式，它还能查状态与统计。

Agent App 是管家。它推进状态机、自动落库、通过 WS 同步面板。

## Session 模型

一次 session 由三个数值参数完整定义。focus_min 是每轮工作时长，范围 1 到 90 分钟。break_min 是每轮休息时长，范围 1 到 30 分钟。rounds 是轮数，范围 1 到 8。intent 是可选的一句意图，随 session 记录。

session 的结构是每轮工作后面跟一段休息，包括最后一轮。

```
rounds = 1, focus_min = 40, break_min = 10

工作40 → 休息10 → 结束

rounds = 2, focus_min = 40, break_min = 10

工作40 → 休息10 → 工作40 → 休息10 → 结束
```

休息结束自动开始下一轮，全部走完回到 idle。

### 状态机

```
idle ──start──→ focus ──归零──→ break ──归零──→ 还有剩余轮次？
                    ↑                            ├─ 是 → focus 下一轮
                    └──────── 暂停/继续/停止 ──────┴─ 否 → idle
```

phase 的取值从 idle、focus、short_break、long_break 收敛为 idle、focus、break。长休息取消，休息只有 break_min 一档。

计时过程中可以暂停、继续、停止。暂停冻结计时并保留剩余时间，继续从暂停处恢复。停止会中止整个 session 回到 idle，此时若正处于专注段，实际已专注的秒数记录为中断，休息段不记录。

## 工具列表

服务向 Agent 暴露四个工具。agentId 与 sessionId 由平台自动注入。

start 开始一个完整 session。focus_min、break_min、rounds 三个参数必传，intent 可选。调用成功返回回执，例如“session 已开始，工作 50 分钟，休息 15 分钟，共 2 轮”。

stop 中止当前 session。

query_stats 查询今日与本周的统计和最近记录。

get_timer_state 查询实时状态，包括阶段、剩余时间、轮次进度和意图。

### 工具 Prompt 原文

这些文案会原样进入 prompts 目录。

instructions.txt 的内容是这样。

> 番茄时钟工具。帮用户管理专注节奏，一次配置完整的专注 session。
> - 用户可在面板上配置并开始，你也可以通过 start 工具直接起 session，三个数值参数每次必传。
> - session 开始时你会收到通知，进入专注守护模式，不主动打扰用户，用户分心时温和提醒。
> - session 结束时你会收到通知，守护模式解除。轮间切换不通知你，续轮由 App 自动完成。
> - 用户问统计时调用 query_stats，问当前状态时调用 get_timer_state。
> - 不要主动发起对话，不评价专注质量，不提供生产力建议。

start.txt 的内容是这样。

> 开始一个完整的专注 session。三个参数每次必传。focus_min 是每轮工作分钟数，break_min 是每轮休息分钟数，rounds 是轮数。session 以工作加休息为单元循环 rounds 次，休息结束自动开始下一轮，全部轮次走完自动结束，用户无需操作。可选传 intent 描述本次专注。示例 focus_min=50、break_min=15、rounds=2 表示工作 50 分钟、休息 15 分钟、工作 50 分钟、休息 15 分钟。

stop.txt 的内容是这样。

> 中止当前进行中的 session，回到空闲。专注段被中止会记录已专注时长并标记为未完成。用户在面板停止时你也会收到 session 结束通知。

query_stats.txt 的内容是这样。

> 查询专注统计。返回今日与本周的番茄钟数量、累计专注时长、最近记录。用户问专注数据时调用。

get_timer_state.txt 的内容是这样。

> 查询实时状态。返回当前阶段、剩余时间、第几轮共几轮、意图。用户问还剩多久或在专注什么时调用。纯查询，不影响通知路由。

## 通知设计

通知的 method 固定为 notifications/app，params 固定 agentId、sessionId、source、content 四字段，source 的值为 pomodoro-timer。

整个 session 只有两个通知。session 开始时发一个，模板在 notify_start.txt。session 结束时发一个，模板在 notify_end.txt，结束的触发可能是最后一段倒计时归零，也可能是用户或 Agent 停止。

notify_start.txt 的内容是这样。

> 用户开始了一个专注 session，共 {rounds} 轮，每轮工作 {focus_min} 分钟，轮间休息 {break_min} 分钟{intent_clause}。专注期间请进入守护模式，不要主动发起对话。用户主动找你且话题与任务无关时，温和提醒他回到专注。

notify_end.txt 的内容是这样。

> 专注 session 已结束{summary}。守护模式解除，你可以恢复正常对话。

自然完成时 summary 是“共完成 N 轮，累计专注 X”，中途停止时是“中途停止，已完成 i 轮，累计专注 X”。notify_break_end.txt 删除。

暂停、继续、轮间自动切换、看历史、纯查询，这些操作不触发通知。

## 通知路由

路由按任务记账。启动 session 时把 agentId 与 sessionId 记入 session 状态，两个通知都从这里取目标，不依赖当前 WS 连接。query_stats 与 get_timer_state 是纯查询，不改归属。目标 session 已删除时通知丢弃并记日志，不回退。

## 记录规则

每段工作自然结束时，后端把这一轮 focus_min 对应的秒数写入 focus_sessions，completed 为 1。专注段中被停止时，实际已专注秒数写入，completed 为 0。暂停未恢复和休息段都不记录。每条记录携带 round_index 与 round_total，历史界面可以展示这条记录属于 session 的第几轮。

## WebSocket 协议

前端发给后端的消息有五种。

- start，携带 focus_min、break_min、rounds、intent，三个数值必传，同时把这份配置持久化为上次配置
- pause 与 resume，控制暂停和继续
- stop，中止 session
- get_month，携带 year 与 month，请求月历数据

update_settings 消息删除。表单是本地草稿，点开始时随 start 一次提交，不再逐步写库。

后端推给前端的消息维持现状。init 在首次连接推送完整状态，state 推送状态变更，data 在记录写入后推送，month_data 回应月历请求。

state 对象长这样。

```json
{
  "phase": "idle | focus | break",
  "running": true,
  "ends_at": 1234567890000,
  "remaining_seconds": 1500,
  "phase_total_seconds": 3000,
  "intent": "写代码",
  "round_current": 1,
  "round_total": 2,
  "config": { "focus_min": 50, "break_min": 15, "rounds": 2 }
}
```

phase_total_seconds 是当前阶段的真实总时长。进度环直接用它计算，不得从 config 推算。这一条修复自定义时长下进度环满格冻结的缺陷。config 在 idle 时为上次使用的配置，运行时为本次 session 的配置。

## SQLite 数据模型

v4 迁移给 focus_sessions 加两列。

```sql
ALTER TABLE focus_sessions ADD COLUMN round_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE focus_sessions ADD COLUMN round_total INTEGER NOT NULL DEFAULT 0;
```

app_settings 表重建，focus_per_round 更名为 rounds，focus_min 与 break_min 保留，语义变为面板表单的上次使用配置。

## UI 设计

本次改版界面整体重排，视觉与布局方案先出草图确认再实施，本节只锁定结构。

设置态变成 session 配置表单，工作时长、休息时长、轮数、意图、开始五项一次配齐提交。表单初始值取上次使用的配置，跨重启保留。

计时态展示轮次进度、当前阶段、倒计时圆环、意图和暂停停止按钮。进度环的数据源改为 phase_total_seconds。

历史页功能不变，记录里展示轮次信息。

主题色 #ff4b4b、系统字体栈、Lucide 图标、tabular-nums、动画规范、hover 门控、reduced-motion 支持全部沿用。

## 本次改版变更清单

- start 参数从 intent 与 duration_min 可选，变为 focus_min、break_min、rounds 必传
- 轮间推进从休息结束回 idle 等手动，变为自动开下一轮
- 休息档位从短休息与长休息双档，变为单档 break_min
- phase 取值从四值收敛为 idle、focus、break
- 通知粒度从三个时点收敛为 session 开始结束两个时点
- 进度环总时长从前端推算，变为协议下发 phase_total_seconds
- 设置语义从全局默认参数即时写库，变为上次使用配置随 start 提交
- prompt 文件里 instructions 与 start 重写，notify_break_end 删除
