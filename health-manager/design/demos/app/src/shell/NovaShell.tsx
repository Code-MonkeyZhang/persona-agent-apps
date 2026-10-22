import { useEffect, useState } from 'react'
import { SessionSidebar } from './SessionSidebar'
import { ChatPanel } from './ChatPanel'
import { PhonePanel } from './PhonePanel'

const W = 1180
const H = 740

/**
 * Replica of the Nova desktop shell: title bar over a three-column body
 * (sessions / chat / phone screen). The shell is exhibit furniture that
 * frames the app copy rendered inside the phone panel.
 */
export function NovaShell() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () =>
      setScale(
        Math.min(1, (window.innerHeight - 96) / H, (window.innerWidth - 32) / W)
      )
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="demo-stage">
      <div
        className="nova-window"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <div className="nova-titlebar">
          <div className="flex gap-2">
            <i className="tl r" />
            <i className="tl y" />
            <i className="tl g" />
          </div>
          <span className="nova-title">Persona Agent</span>
        </div>
        <div className="nova-body">
          <SessionSidebar />
          <ChatPanel />
          <PhonePanel />
        </div>
      </div>
    </div>
  )
}
