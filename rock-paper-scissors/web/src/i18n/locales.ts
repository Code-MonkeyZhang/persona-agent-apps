export type Lang = 'zh' | 'en'

/** 中文文案（基准语言，key 集合由此定义）。 */
const zh = {
  _title: '剪刀石头布',
  'result.user_win': '你赢',
  'result.agent_win': 'Agent赢',
  'result.draw': '平局',
  'result.drawReplay': '（重出）',
  'move.rock': '石头',
  'move.scissors': '剪刀',
  'move.paper': '布',
  'score.waiting': '等待开始',
  'score.finished': '整场结束',
  'score.round': '第 {n} / 3 局',
  'score.user': '用户',
  'score.agent': 'Agent',
  'score.endGame': '结束游戏',
  'resultArea.start': '开始游戏',
  'resultArea.matchEnded': '本局已结束',
  'resultArea.rematch': '再来一局',
  'resultArea.userWinsMatch': '你赢了整场！',
  'resultArea.agentWinsMatch': 'Agent 赢了整场！',
  'resultArea.agentThinking': 'Agent 思考中...',
  'resultArea.yourMove': '出招吧！',
  'history.title': '历史记录',
  'history.count': '{n} 场',
  'history.empty': '暂无记录',
  'history.win': '你赢',
  'history.lose': '你输',
  'history.aborted': '中途结束',
} as const

export type TKey = keyof typeof zh

/** 英文文案（与 zh 的 key 一一对应）。 */
const en: Record<TKey, string> = {
  _title: 'Rock Paper Scissors',
  'result.user_win': 'You win',
  'result.agent_win': 'Agent wins',
  'result.draw': 'Draw',
  'result.drawReplay': ' (replay)',
  'move.rock': 'Rock',
  'move.scissors': 'Scissors',
  'move.paper': 'Paper',
  'score.waiting': 'Waiting to start',
  'score.finished': 'Match over',
  'score.round': 'Round {n} / 3',
  'score.user': 'You',
  'score.agent': 'Agent',
  'score.endGame': 'End game',
  'resultArea.start': 'Start game',
  'resultArea.matchEnded': 'Match ended',
  'resultArea.rematch': 'Rematch',
  'resultArea.userWinsMatch': 'You won the match!',
  'resultArea.agentWinsMatch': 'Agent won the match!',
  'resultArea.agentThinking': 'Agent thinking...',
  'resultArea.yourMove': 'Your move!',
  'history.title': 'History',
  'history.count': '{n} games',
  'history.empty': 'No records yet',
  'history.win': 'Win',
  'history.lose': 'Loss',
  'history.aborted': 'Ended early',
}

export const LOCALES: Record<Lang, Record<TKey, string>> = { zh, en }
