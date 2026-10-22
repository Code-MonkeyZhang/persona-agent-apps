import { useEffect, useState } from 'react'
import MobileApp from './app/MobileApp'

const W = 393
const H = 852

/**
 * Presentation stage: centers a fixed-size phone bezel and scales it down to
 * fit the viewport. The bezel is exhibit furniture, not part of the app
 * design; everything inside .app-frame is the verbatim app copy.
 */
export function PhoneDemo() {
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
        className="phone-bezel"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <div className="phone-notch" />
        <div className="app-frame">
          <MobileApp />
        </div>
      </div>
    </div>
  )
}
