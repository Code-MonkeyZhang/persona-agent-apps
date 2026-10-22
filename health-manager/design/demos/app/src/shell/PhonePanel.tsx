import { ChevronLeft } from 'lucide-react'
import MobileApp from '../app/MobileApp'

/**
 * Right column of the shell, mirroring the Nova phone-screen panel: a
 * rounded screen on a soft gradient wallpaper with the host-provided nav
 * bar (back + app title), the app itself rendered underneath.
 */
export function PhonePanel() {
  return (
    <aside className="flex w-[358px] shrink-0 flex-col border-l border-[#e5e5ea] bg-white">
      <div
        className="relative m-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-[#e3e3e9]"
        style={{
          background:
            'radial-gradient(420px 300px at 88% -8%, rgba(34,139,230,0.10), transparent 60%), radial-gradient(360px 300px at -8% 108%, rgba(139,92,246,0.07), transparent 60%), linear-gradient(168deg, #e9f1fa 0%, #f3f6fb 55%, #eef1f6 100%)',
        }}
      >
        <nav className="relative z-10 flex h-11 shrink-0 items-center justify-center border-b border-[#e5e5ea] bg-white/90 backdrop-blur">
          <button className="absolute left-2 flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#228be6]">
            <ChevronLeft className="size-[18px]" />
            返回
          </button>
          <span className="max-w-[60%] truncate text-[13px] font-semibold">
            Health Manager
          </span>
        </nav>
        <div className="app-frame flex min-h-0 flex-1 flex-col">
          <MobileApp />
        </div>
      </div>
    </aside>
  )
}
