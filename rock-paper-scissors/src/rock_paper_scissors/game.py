"""
Game state and judging logic for Rock-Paper-Scissors.

Pure logic — no I/O, no async. Shared between MCP tool handlers and WS handlers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Move = Literal["rock", "paper", "scissors"]
Result = Literal["user_win", "agent_win", "draw"]

MOVE_LABELS: dict[Move, str] = {
    "rock": "石头",
    "paper": "布",
    "scissors": "剪刀",
}

MOVE_EMOJI: dict[Move, str] = {
    "rock": "✊",
    "paper": "✋",
    "scissors": "✌️",
}

RESULT_TEXT: dict[Result, str] = {
    "user_win": "用户赢",
    "agent_win": "Agent赢",
    "draw": "平局",
}

# Which move beats which: key beats value
_BEATS: dict[Move, Move] = {
    "rock": "scissors",
    "scissors": "paper",
    "paper": "rock",
}


def judge(user: Move, agent: Move) -> Result:
    """Judge a round. Returns who won from the user's perspective."""
    if user == agent:
        return "draw"
    if _BEATS[user] == agent:
        return "user_win"
    return "agent_win"


@dataclass
class GameState:
    """In-memory state for a single game session.

    - game_id uniquely identifies this game for persistence
    - agent_id/session_id recorded at start_game time for notification routing
    - waiting_for_agent is True between user's move and agent's move
    """

    game_id: str
    agent_id: str
    session_id: str
    round_no: int = 1
    user_score: int = 0
    agent_score: int = 0
    last_user_move: Move | None = None
    last_agent_move: Move | None = None
    last_result: Result | None = None
    waiting_for_agent: bool = False
    user_move_pending: Move | None = None

    def to_dict(self) -> dict:
        """Serialize to a dict suitable for WS broadcast."""
        return {
            "gameId": self.game_id,
            "roundNo": self.round_no,
            "userScore": self.user_score,
            "agentScore": self.agent_score,
            "lastUserMove": self.last_user_move,
            "lastAgentMove": self.last_agent_move,
            "lastResult": self.last_result,
            "waitingForAgent": self.waiting_for_agent,
        }
