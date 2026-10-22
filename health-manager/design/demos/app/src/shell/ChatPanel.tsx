import { ArrowUp, Zap } from 'lucide-react'

/** One exchange in the demo conversation. */
interface Turn {
  kind: 'user' | 'agent' | 'tool'
  text?: string
  tool?: string
  args?: string
}

const TURNS: Turn[] = [
  { kind: 'user', text: '今天早上称了 76.4 公斤，血压 129/79，心率 73' },
  { kind: 'tool', tool: 'update_body_metrics', args: 'weight=76.4 · systolic=129 · diastolic=79 · heart_rate=73' },
  { kind: 'agent', text: '记好了。体重比上周轻 0.6 kg，血压和上次基本持平，都在正常范围。右边已经更新。' },
  { kind: 'user', text: '中午吃了一碗牛肉面' },
  { kind: 'tool', tool: 'record_diet', args: 'food=牛肉面 · calories≈600 · carbs=70 · protein=25 · fat=18' },
  { kind: 'agent', text: '牛肉面按 600 卡记了，宏量我估好了。今天目前一共 1850 卡，还剩 350 卡额度。' },
]

/** Middle column of the shell: message stream over an input box. */
export function ChatPanel() {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#fbfbfd]">
      <header className="flex items-center gap-2 border-b border-[#e5e5ea] px-4 py-3">
        <div className="flex size-[26px] items-center justify-center rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0ea5e9] text-[12px] font-bold text-white">
          C
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">健康管家 · Chris</div>
          <div className="text-[10.5px] text-[#16a34a]">● 在线 · 已连接 14 个工具</div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {TURNS.map((t, i) =>
          t.kind === 'user' ? (
            <div
              key={i}
              className="max-w-[78%] self-end rounded-2xl rounded-br-sm bg-[#228be6] px-3 py-2 text-[13px] leading-relaxed text-white"
            >
              {t.text}
            </div>
          ) : t.kind === 'agent' ? (
            <div
              key={i}
              className="max-w-[78%] self-start rounded-2xl rounded-bl-sm border border-[#e5e5ea] bg-white px-3 py-2 text-[13px] leading-relaxed"
            >
              {t.text}
            </div>
          ) : (
            <div
              key={i}
              className="flex max-w-[86%] items-center gap-2 self-start rounded-lg border border-[#14b8a6]/35 bg-[#f0faf8] px-2.5 py-[7px]"
            >
              <Zap className="size-[13px] shrink-0 text-[#0d9488]" />
              <code className="font-mono text-[11px] font-semibold text-[#0d9488]">
                {t.tool}
              </code>
              <span className="truncate text-[10.5px] text-[#777]">{t.args}</span>
              <span className="text-[11px] font-bold text-[#16a34a]">✓</span>
            </div>
          )
        )}
      </div>

      <div className="m-3.5 mt-0 flex items-center gap-2 rounded-xl border border-[#e5e5ea] bg-white px-3 py-2.5">
        <span className="flex-1 text-[12.5px] text-[#b0b0b6]">
          给 Agent 发消息，比如「深蹲现在能蹲 100 了」…
        </span>
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#228be6] text-white">
          <ArrowUp className="size-4" />
        </span>
      </div>
    </section>
  )
}
