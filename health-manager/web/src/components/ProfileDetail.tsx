import { useState } from 'react'
import type { Profile, Metric } from '../types'
import { calcBMI, bmiCategory, latestAndPrev } from '../helpers'
import { Card, Row, SectionLabel } from './ui/primitives'
import { Input } from './ui/input'
import { Button } from './ui/button'

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
      <div className="px-1 pb-0.5 pt-1 text-[40px] font-bold leading-tight mobile:text-[44px]">
        {height ?? '——'}
        {height && <span className="ml-1 text-xl font-normal text-muted-foreground">cm</span>}
      </div>

      <SectionLabel>基本信息</SectionLabel>
      <Card>
        <Row>
          <span>身高</span>
          <span className="font-medium">{height ? `${height} cm` : '未设置'}</span>
        </Row>
        <Row>
          <span>BMI</span>
          <span className="flex items-center gap-2 font-medium">
            {bmi !== null ? (
              <>
                {bmi}
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ background: bmiCategory(bmi).color }}
                >
                  {bmiCategory(bmi).label}
                </span>
              </>
            ) : (
              '——'
            )}
          </span>
        </Row>
        {!editing ? (
          <Row bordered={false} onClick={() => { setInput(height ? String(height) : ''); setEditing(true) }} onKeyDown={(e) => e.key === 'Enter' && (() => { setInput(height ? String(height) : ''); setEditing(true) })()} role="button" tabIndex={0}>
            <span>修改身高</span>
            <span className="ml-0.5 text-xl font-light text-[#c7c7cc]">›</span>
          </Row>
        ) : (
          <div className="flex min-h-12 items-center gap-2 px-4 py-3.5">
            <Input
              type="number"
              placeholder="身高 cm"
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button onClick={handleSubmit}>保存</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>取消</Button>
          </div>
        )}
      </Card>
    </>
  )
}
