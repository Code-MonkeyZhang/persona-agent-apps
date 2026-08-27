export type Lang = 'zh' | 'en'

/** 中文文案（基准语言，key 集合由此定义）。 */
const zh = {
  _title: '番茄时钟',
  'tab.focus': '专注',
  'tab.history': '历史',
  'timeCircle.work': '工作',
  'timeCircle.break': '休息',
  'timer.intentPlaceholder': '写一句话意图（可选）',
  'timer.start': '开始专注',
  'phase.idle': '空闲',
  'phase.focus': '专注',
  'phase.short_break': '短休息',
  'phase.long_break': '长休息',
  'control.pause': '暂停',
  'control.resume': '继续',
  'control.stop': '停止',
  'status.paused': '已暂停',
  'status.focusing': '专注中',
  'status.resting': '休息中',
  'status.intent': '在{intent}中',
  'dayDetail.selectPrompt': '选择一天查看详情',
  'dayDetail.total': '共 {duration}',
  'dayDetail.empty': '无专注记录',
  'dayDetail.defaultIntent': '工作',
  'duration.minutes': '{n} 分钟',
  'duration.seconds': '{n} 秒',
  'duration.compound': '{m} 分 {s} 秒',
  'time.today': '今天 {time}',
  'time.yesterday': '昨天 {time}',
} as const

export type TKey = keyof typeof zh

/** 英文文案（与 zh 的 key 一一对应）。 */
const en: Record<TKey, string> = {
  _title: 'Pomodoro Timer',
  'tab.focus': 'Focus',
  'tab.history': 'History',
  'timeCircle.work': 'Work',
  'timeCircle.break': 'Break',
  'timer.intentPlaceholder': "What's the plan? (optional)",
  'timer.start': 'Start focusing',
  'phase.idle': 'Idle',
  'phase.focus': 'Focus',
  'phase.short_break': 'Short break',
  'phase.long_break': 'Long break',
  'control.pause': 'Pause',
  'control.resume': 'Resume',
  'control.stop': 'Stop',
  'status.paused': 'Paused',
  'status.focusing': 'Focusing',
  'status.resting': 'On break',
  'status.intent': 'Focusing on {intent}',
  'dayDetail.selectPrompt': 'Select a day to see details',
  'dayDetail.total': '{duration} total',
  'dayDetail.empty': 'No focus records',
  'dayDetail.defaultIntent': 'Work',
  'duration.minutes': '{n} min',
  'duration.seconds': '{n} sec',
  'duration.compound': '{m}m {s}s',
  'time.today': 'Today {time}',
  'time.yesterday': 'Yesterday {time}',
}

export const LOCALES: Record<Lang, Record<TKey, string>> = { zh, en }
