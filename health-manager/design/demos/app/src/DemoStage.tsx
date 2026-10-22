import { useEffect, useState } from 'react'
import { PhoneDemo } from './PhoneDemo'
import { NovaShell } from './shell/NovaShell'

type Mode = 'mobile' | 'desktop'

const STORAGE_KEY = 'demo-mode'

/**
 * Exhibit switcher: a floating pill toggling between the phone bezel and the
 * Nova desktop shell. Both frames render the same app copy from src/app.
 */
export function DemoStage() {
  const [mode, setMode] = useState<Mode>(() =>
    localStorage.getItem(STORAGE_KEY) === 'desktop' ? 'desktop' : 'mobile'
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  return (
    <>
      <div className="mode-switch">
        <button
          className={mode === 'mobile' ? 'on' : ''}
          onClick={() => setMode('mobile')}
        >
          手机端
        </button>
        <button
          className={mode === 'desktop' ? 'on' : ''}
          onClick={() => setMode('desktop')}
        >
          桌面端
        </button>
      </div>
      {mode === 'mobile' ? <PhoneDemo /> : <NovaShell />}
    </>
  )
}
