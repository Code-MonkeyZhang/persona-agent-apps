"""
Health Manager Agent App server.

Runs two channels in one process via anyio task group:
- stdio MCP: exposes recording / query tools to the Agent
- uvicorn HTTP: serves the built Web UI as static files, WebSocket for
  real-time metric updates

Both channels share a single HealthDB instance, so an Agent's tool call writes
data and pushes a WebSocket update to the frontend — all within one event loop.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

import anyio
import mcp.types as types
import uvicorn
from mcp.server import Server
from mcp.server.stdio import stdio_server
from starlette.applications import Starlette
from starlette.responses import FileResponse
from starlette.routing import Mount, Route, WebSocketRoute
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocket, WebSocketDisconnect

from .db import HealthDB
from .log import initialize as log_init, log

APP_ROOT = Path(__file__).resolve().parent.parent.parent
UI_DIR = APP_ROOT / "ui"
ICON_PATH = APP_ROOT / "icon.png"
DATA_DIR = APP_ROOT / "data"
CSV_PATH = APP_ROOT / "health-profile" / "refine_data" / "health_data" / "daily_metrics.csv"
LOG_PATH = APP_ROOT / "health-manager.log"

SOURCE = "health-manager"

# --- Tool definitions -------------------------------------------------------

_INJECTED_PARAMS = {
    "agentId": {
        "type": "string",
        "description": "平台自动注入，无需填写",
    },
    "sessionId": {
        "type": "string",
        "description": "平台自动注入，无需填写",
    },
}

TOOLS = [
    types.Tool(
        name="record_weight",
        description="记录体重。录入后返回和上次值的对比。",
        inputSchema={
            "type": "object",
            "required": ["weight"],
            "properties": {
                "weight": {
                    "type": "number",
                    "description": "体重 kg",
                },
                "date": {
                    "type": "string",
                    "description": "日期 YYYY-MM-DD，可选，默认今天",
                },
                "note": {
                    "type": "string",
                    "description": "备注，可选",
                },
                **_INJECTED_PARAMS,
            },
        },
    ),
    types.Tool(
        name="record_blood_pressure",
        description="记录血压和心率。录入后返回和上次值的对比。",
        inputSchema={
            "type": "object",
            "required": ["systolic", "diastolic"],
            "properties": {
                "systolic": {
                    "type": "integer",
                    "description": "收缩压 mmHg",
                },
                "diastolic": {
                    "type": "integer",
                    "description": "舒张压 mmHg",
                },
                "heart_rate": {
                    "type": "integer",
                    "description": "心率 bpm，可选",
                },
                "date": {
                    "type": "string",
                    "description": "日期 YYYY-MM-DD，可选，默认今天",
                },
                "note": {
                    "type": "string",
                    "description": "备注，可选",
                },
                **_INJECTED_PARAMS,
            },
        },
    ),
    types.Tool(
        name="set_profile",
        description="设置身高 cm。",
        inputSchema={
            "type": "object",
            "required": ["height"],
            "properties": {
                "height": {
                    "type": "number",
                    "description": "身高 cm",
                },
                **_INJECTED_PARAMS,
            },
        },
    ),
    types.Tool(
        name="get_profile",
        description="读取身高。",
        inputSchema={
            "type": "object",
            "properties": dict(_INJECTED_PARAMS),
        },
    ),
    types.Tool(
        name="get_latest",
        description="查最近一条日常指标记录。可选 metric 参数过滤类型。",
        inputSchema={
            "type": "object",
            "properties": {
                "metric": {
                    "type": "string",
                    "enum": ["weight", "blood_pressure"],
                    "description": "筛选指标类型，可选。不填返回最近一条综合记录",
                },
                **_INJECTED_PARAMS,
            },
        },
    ),
]


# --- Shared server state ----------------------------------------------------


class HealthServer:
    """Holds DB state and bridges between MCP and WS channels."""

    def __init__(self) -> None:
        self.db = HealthDB(DATA_DIR / "health.db", csv_path=CSV_PATH)
        self._ws_clients: set[WebSocket] = set()

    # --- MCP tool handlers ---

    def record_weight(
        self, weight: float, date: str | None = None, note: str | None = None
    ) -> str:
        date = date or _today()
        try:
            result = self.db.record_weight(date, weight, note)
            log("INFO", "weight_recorded", date=date, weight=weight)
            return _fmt_weight(result, date)
        except ValueError as e:
            return str(e)

    def record_blood_pressure(
        self,
        systolic: int,
        diastolic: int,
        date: str | None = None,
        heart_rate: int | None = None,
        note: str | None = None,
    ) -> str:
        date = date or _today()
        try:
            result = self.db.record_blood_pressure(
                date, systolic, diastolic, heart_rate, note
            )
            log(
                "INFO",
                "bp_recorded",
                date=date,
                systolic=systolic,
                diastolic=diastolic,
                heart_rate=heart_rate,
            )
            return _fmt_bp(result, date)
        except ValueError as e:
            return str(e)

    def set_profile(self, height: float) -> str:
        try:
            self.db.set_profile(height)
            log("INFO", "profile_set", height=height)
            return f"身高已设置为 {height}cm"
        except ValueError as e:
            return str(e)

    def get_profile(self) -> str:
        profile = self.db.get_profile()
        if not profile:
            return "尚未设置身高，请在面板填写或调用 set_profile"
        return f"身高 {profile['height']}cm"

    def get_latest(self, metric: str | None = None) -> str:
        latest = self.db.get_latest(metric)
        if not latest:
            return "暂无记录"
        return _fmt_latest(latest)

    # --- WebSocket handler ---

    async def handle_websocket(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._ws_clients.add(websocket)
        log("INFO", "ws_connected", clients=len(self._ws_clients))

        await websocket.send_json(
            {"type": "init", **self.db.get_snapshot()}
        )

        try:
            while True:
                msg = await websocket.receive_json()
                if msg.get("type") == "set_height":
                    try:
                        self.db.set_profile(float(msg["height"]))
                        log("INFO", "height_set_via_ws", height=msg["height"])
                        await self.broadcast()
                    except (ValueError, KeyError) as e:
                        await websocket.send_json(
                            {"type": "error", "message": str(e)}
                        )
        except WebSocketDisconnect:
            pass
        finally:
            self._ws_clients.discard(websocket)
            log("INFO", "ws_disconnected", clients=len(self._ws_clients))

    async def broadcast(self) -> None:
        """Push the full DB snapshot to all connected WS clients."""
        snapshot = self.db.get_snapshot()
        dead: set[WebSocket] = set()
        for ws in self._ws_clients:
            try:
                await ws.send_json({"type": "update", **snapshot})
            except Exception:
                dead.add(ws)
        self._ws_clients -= dead


# --- Formatting helpers -----------------------------------------------------


def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _fmt_weight(result: dict, date: str) -> str:
    current = result["current"]
    if "previous" not in result:
        return f"已记录：{date} 体重 {current}kg"
    change = result["change"]
    if change < 0:
        detail = f"减轻 {abs(change)}kg"
    elif change > 0:
        detail = f"增加 {change}kg"
    else:
        detail = "持平"
    return (
        f"已记录：{date} 体重 {current}kg。"
        f"上次 {result['previous']}kg（{result['previousDate']}），{detail}"
    )


def _fmt_bp(result: dict, date: str) -> str:
    parts = [f"已记录：{date} 血压 {result['systolic']}/{result['diastolic']}"]
    if "heartRate" in result:
        parts.append(f"心率 {result['heartRate']}")
    if "prevSystolic" in result:
        sc = result["systolicChange"]
        dc = result["diastolicChange"]
        parts.append(
            f"上次 {result['prevSystolic']}/{result['prevDiastolic']}"
            f"（{result['previousDate']}），变化 {sc:+d}/{dc:+d}"
        )
    return "。".join(parts)


def _fmt_latest(row: dict) -> str:
    parts = [row["date"]]
    if row["weight"] is not None:
        parts.append(f"体重 {row['weight']}kg")
    if row["systolic"] is not None:
        bp = f"血压 {row['systolic']}/{row['diastolic']}"
        if row["heartRate"] is not None:
            bp += f" 心率 {row['heartRate']}"
        parts.append(bp)
    return "，".join(parts)


# --- Starlette HTTP app -----------------------------------------------------


def create_http_app(server: HealthServer) -> Starlette:
    async def icon(_request):
        return FileResponse(ICON_PATH)

    async def mobile_page(_request):
        return FileResponse(UI_DIR / "mobile.html")

    routes = [
        Route("/icon.png", icon),
        Route("/mobile", mobile_page),
        WebSocketRoute("/ws", server.handle_websocket),
        # Mobile page derives its WS URL from its own path (/mobile → /mobile/ws)
        WebSocketRoute("/mobile/ws", server.handle_websocket),
        # Static UI build (index.html + mobile.html + assets/). Must be last.
        Mount(
            "/",
            app=StaticFiles(directory=str(UI_DIR), html=True),
            name="ui",
        ),
    ]
    return Starlette(routes=routes)


# --- MCP handler factories --------------------------------------------------


def _make_handlers(server: HealthServer):
    async def handle_list_tools(_ctx, _params) -> types.ListToolsResult:
        return types.ListToolsResult(tools=TOOLS)

    async def handle_call_tool(_ctx, params) -> types.CallToolResult:
        args = params.arguments or {}
        name = params.name

        if name == "record_weight":
            text = server.record_weight(
                weight=args["weight"],
                date=args.get("date"),
                note=args.get("note"),
            )
            await server.broadcast()
        elif name == "record_blood_pressure":
            text = server.record_blood_pressure(
                systolic=args["systolic"],
                diastolic=args["diastolic"],
                date=args.get("date"),
                heart_rate=args.get("heart_rate"),
                note=args.get("note"),
            )
            await server.broadcast()
        elif name == "set_profile":
            text = server.set_profile(height=args["height"])
            await server.broadcast()
        elif name == "get_profile":
            text = server.get_profile()
        elif name == "get_latest":
            text = server.get_latest(args.get("metric"))
        else:
            text = f"未知工具: {name}"

        log("INFO", "tool_called", tool=name)
        return types.CallToolResult(
            content=[types.TextContent(type="text", text=text)]
        )

    return handle_list_tools, handle_call_tool


# --- Dual-channel runner ----------------------------------------------------


async def run() -> None:
    """Start uvicorn HTTP and stdio MCP concurrently."""
    port = int(os.environ.get("APP_PORT", "0"))
    if port == 0:
        log("ERROR", "APP_PORT_not_set")
        sys.exit(1)

    log_init(LOG_PATH)

    server = HealthServer()
    http_app = create_http_app(server)

    mcp = Server(SOURCE)
    handle_list, handle_call = _make_handlers(server)
    mcp.add_request_handler(
        "tools/list", types.PaginatedRequestParams, handle_list
    )
    mcp.add_request_handler(
        "tools/call", types.CallToolRequestParams, handle_call
    )

    uv_config = uvicorn.Config(
        app=http_app,
        host="127.0.0.1",
        port=port,
        log_config=None,
        access_log=False,
    )
    uv_server = uvicorn.Server(uv_config)

    log("INFO", "starting_dual_channel", port=port)

    async with stdio_server() as (read_stream, write_stream):
        log("INFO", "stdio_ready")

        async with anyio.create_task_group() as tg:
            tg.start_soon(
                mcp.run,
                read_stream,
                write_stream,
                mcp.create_initialization_options(),
            )
            tg.start_soon(uv_server.serve)
