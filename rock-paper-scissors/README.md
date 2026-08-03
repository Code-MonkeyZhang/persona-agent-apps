# 剪刀石头布 Agent App

用户和 Agent 通过 Agent App 玩剪刀石头布。用户在 Web UI 点按钮出招，Agent 通过 MCP 工具出招，服务器判定胜负。

## 工具

- `start_game` — 开始一局，初始化比分
- `play_move(move)` — Agent 出招（rock/paper/scissors），服务器判定胜负
- `get_game_state` — 查询当前比分和游戏阶段
- `get_game_history` — 查询历史对局记录

## 通知

用户在 Web UI 出招后，发 `notifications/app` 通知 Agent"轮到你了"。这是唯一的通知时机。

## 开发

```bash
cd mcp/rock-paper-scissors
uv sync          # 安装依赖
uv run python -m rock_paper_scissors  # 启动（需 APP_PORT 环境变量）
```
