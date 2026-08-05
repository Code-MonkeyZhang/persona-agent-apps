import { useState } from 'react'
import type { Profile, Metric } from '../types'
import { calcBMI, bmiCategory, latestAndPrev } from '../helpers'

interface Props {
  profile: Profile | null
  metrics: Metric[]
  onSetHeight: (height: number) => void
}

export function ProfileDetail({ profile, metrics, onSetHeight }: Props) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const height = profile?.height ?? null
  const weight = latestAndPrev(metrics, 'weight').latest?.weight ?? null
  const bmi = calcBMI(height, weight)

  const handleSubmit = () => {
    const h = parseFloat(input)
    if (h > 0) {
      onSetHeight(h)
      setEditing(false)
      setInput('')
    }
  }

  return (
    <>
      <div className="big-number">
        {height ?? '——'}
        {height && <span className="big-unit">cm</span>}
      </div>

      <div className="section-label">基本信息</div>
      <div className="card-group">
        <div className="metric-row static-row metric-row-bordered">
          <span className="metric-row-label">身高</span>
          <span className="metric-row-value">{height ? `${height} cm` : '未设置'}</span>
        </div>
        <div className="metric-row static-row metric-row-bordered">
          <span className="metric-row-label">BMI</span>
          <span className="metric-row-value">
            {bmi !== null ? (
              <>
                {bmi}
                <span
                  className="bmi-tag"
                  style={{ background: bmiCategory(bmi).color }}
                >
                  {bmiCategory(bmi).label}
                </span>
              </>
            ) : (
              '——'
            )}
          </span>
        </div>
        {!editing ? (
          <div
            className="metric-row"
            role="button"
            tabIndex={0}
            onClick={() => {
              setInput(height ? String(height) : '')
              setEditing(true)
            }}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              (() => {
                setInput(height ? String(height) : '')
                setEditing(true)
              })()
            }
          >
            <span className="metric-row-label">修改身高</span>
            <span className="metric-row-chevron">›</span>
          </div>
        ) : (
          <div className="metric-row edit-row">
            <input
              className="edit-input"
              type="number"
              placeholder="身高 cm"
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button className="btn-primary" onClick={handleSubmit}>
              保存
            </button>
            <button className="btn-cancel" onClick={() => setEditing(false)}>
              取消
            </button>
          </div>
        )}
      </div>
    </>
  )
}
