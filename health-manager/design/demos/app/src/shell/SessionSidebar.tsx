import { Plus } from 'lucide-react'

const GROUPS: { label: string; items: { name: string; when: string; on?: boolean }[] }[] = [
  {
    label: '今天',
    items: [
      { name: '健康记录', when: '10-15', on: true },
      { name: '饮食打卡', when: '10-14' },
    ],
  },
  {
    label: '本周',
    items: [
      { name: '深蹲 PR！', when: '10-13' },
      { name: '复查准备', when: '10-11' },
    ],
  },
]

/** Left column of the shell: new-chat button plus grouped session list. */
export function SessionSidebar() {
  return (
    <aside className="flex w-[186px] shrink-0 flex-col border-r border-[#e5e5ea] bg-[#f7f7fa] p-2.5">
      <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-[#228be6]/10 px-2.5 py-2 text-[12.5px] font-semibold text-[#228be6]">
        <Plus className="size-4" />
        新对话
      </div>
      {GROUPS.map((g) => (
        <div key={g.label} className="mb-1.5">
          <div className="px-2 py-1 text-[10.5px] font-bold text-[#8e8e93]">
            {g.label}
          </div>
          {g.items.map((it) => (
            <div
              key={it.name}
              className={
                'flex items-center justify-between rounded-md px-2 py-[7px] text-[12px] ' +
                (it.on
                  ? 'bg-[#228be6]/10 font-semibold text-[#228be6]'
                  : 'text-[#444]')
              }
            >
              <span className="truncate">{it.name}</span>
              <span className="ml-2 shrink-0 text-[10px] text-[#b0b0b6]">
                {it.when}
              </span>
            </div>
          ))}
        </div>
      ))}
    </aside>
  )
}
