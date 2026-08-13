import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import type { GoalMode, MacroGoals } from '../types'
import { DetailHeader } from './DetailHeader'
import { Card, Row, SectionLabel, Chevron } from './ui/primitives'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface Props {
  name: string
  height: number | null
  dietGoal: number | null
  goalMode: GoalMode
  macroGoals: MacroGoals
  mockOn: boolean
  version: string
  schemaVersion: number
  onSetName: (name: string) => void
  onSetHeight: (height: number) => void
  onSetDietGoal: (goal: number) => void
  onSetGoalMode: (mode: GoalMode) => void
  onSetMacroGoals: (carbs: number, protein: number, fat: number) => void
  onToggleMock: () => void
  onBack: () => void
}

/** Settings: personal info, targets, mock-data switch, and about info. */
export function SettingsPage({
  name,
  height,
  dietGoal,
  goalMode,
  macroGoals,
  mockOn,
  version,
  schemaVersion,
  onSetName,
  onSetHeight,
  onSetDietGoal,
  onSetGoalMode,
  onSetMacroGoals,
  onToggleMock,
  onBack,
}: Props) {
  return (
    <div>
      <DetailHeader title="设置" onBack={onBack} />

      <SectionLabel>个人信息</SectionLabel>
      <Card>
        <EditableRow
          label="姓名"
          display={name || '未设置'}
          initial={name}
          placeholder="称呼"
          bordered
          onSubmit={(raw) => {
            const v = raw.trim()
            if (v) {
              onSetName(v)
              return true
            }
            return false
          }}
        />
        <EditableRow
          label="身高"
          display={height ? `${height} cm` : '未设置'}
          initial={height ? String(height) : ''}
          placeholder="身高 cm"
          type="number"
          bordered={false}
          onSubmit={(raw) => {
            const h = parseFloat(raw)
            if (h > 0) {
              onSetHeight(h)
              return true
            }
            return false
          }}
        />
      </Card>

      <SectionLabel>目标</SectionLabel>
      <Card>
        <EditableRow
          label="每日卡路里目标"
          display={dietGoal ? `${dietGoal} kcal` : '未设置'}
          initial={dietGoal ? String(dietGoal) : ''}
          placeholder="2000"
          type="number"
          bordered={false}
          onSubmit={(raw) => {
            const g = parseInt(raw, 10)
            if (g > 0) {
              onSetDietGoal(g)
              return true
            }
            return false
          }}
        />
      </Card>

      <MacroGoalsSection
        goalMode={goalMode}
        macroGoals={macroGoals}
        dietGoal={dietGoal}
        onSetGoalMode={onSetGoalMode}
        onSetMacroGoals={onSetMacroGoals}
      />

      <SectionLabel>数据</SectionLabel>
      <Card>
        <Row bordered={false}>
          <div className="flex flex-col gap-0.5">
            <span>演示数据</span>
            <span className="text-sm text-muted-foreground">
              {mockOn ? '当前使用 mock 演示数据' : '当前使用真实数据'}
            </span>
          </div>
          <Switch checked={mockOn} onCheckedChange={() => onToggleMock()} aria-label="切换演示数据" />
        </Row>
      </Card>

      <SectionLabel>关于</SectionLabel>
      <Card>
        <Row>
          <span>版本</span>
          <span className="font-medium">{version || '——'}</span>
        </Row>
        <Row>
          <span>数据库版本</span>
          <span className="font-medium">v{schemaVersion || '——'}</span>
        </Row>
        <Row bordered={false}>
          <span>数据源</span>
          <span className="font-medium">{mockOn ? '演示' : '真实'}</span>
        </Row>
      </Card>

      <div className="flex items-center justify-center gap-1.5 pb-2 pt-6 text-[13px] text-[#c7c7cc]">
        <SettingsIcon size={20} />
        <span>Health Manager</span>
      </div>
    </div>
  )
}

/** Row that flips between a static value and an inline edit form. */
function EditableRow({
  label,
  display,
  initial,
  placeholder,
  type = 'text',
  bordered = true,
  onSubmit,
}: {
  label: string
  display: string
  initial: string
  placeholder?: string
  type?: string
  bordered?: boolean
  onSubmit: (raw: string) => boolean
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(initial)
  const save = () => {
    if (onSubmit(input)) setEditing(false)
  }
  return (
    <Row
      bordered={bordered}
      onClick={editing ? undefined : () => {
        setInput(initial)
        setEditing(true)
      }}
    >
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input
            type={type}
            placeholder={placeholder}
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <Button onClick={save}>保存</Button>
          <Button variant="outline" onClick={() => setEditing(false)}>
            取消
          </Button>
        </div>
      ) : (
        <>
          <span>{label}</span>
          <span className="flex items-center font-medium">
            {display}
            <Chevron />
          </span>
        </>
      )}
    </Row>
  )
}

function MacroGoalsSection({
  goalMode,
  macroGoals,
  dietGoal,
  onSetGoalMode,
  onSetMacroGoals,
}: {
  goalMode: GoalMode
  macroGoals: MacroGoals
  dietGoal: number | null
  onSetGoalMode: (mode: GoalMode) => void
  onSetMacroGoals: (carbs: number, protein: number, fat: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')

  const startEdit = () => {
    setCarbs(macroGoals.carbs ? String(macroGoals.carbs) : '')
    setProtein(macroGoals.protein ? String(macroGoals.protein) : '')
    setFat(macroGoals.fat ? String(macroGoals.fat) : '')
    setEditing(true)
  }
  const submit = () => {
    const c = parseInt(carbs, 10)
    const p = parseInt(protein, 10)
    const f = parseInt(fat, 10)
    if ([c, p, f].every((v) => v >= 0)) {
      onSetMacroGoals(c, p, f)
      setEditing(false)
    }
  }

  return (
    <>
      <SectionLabel>宏量目标</SectionLabel>
      <Card>
        <Row>
          <span>模式</span>
          <Tabs value={goalMode} onValueChange={(v) => onSetGoalMode(v as GoalMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="auto">自动</TabsTrigger>
              <TabsTrigger value="manual">手动</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>

        {goalMode === 'auto' ? (
          <Row bordered={false}>
            <span>派生自卡路里目标</span>
            <span className="text-sm font-medium text-muted-foreground">
              {dietGoal
                ? `${macroGoals.carbs}/${macroGoals.protein}/${macroGoals.fat} g`
                : '先设卡路里目标'}
            </span>
          </Row>
        ) : editing ? (
          <div className="flex flex-col gap-2 px-4 py-3.5">
            <MacroInput label="碳水" value={carbs} onChange={setCarbs} />
            <MacroInput label="蛋白质" value={protein} onChange={setProtein} />
            <MacroInput label="脂肪" value={fat} onChange={setFat} />
            <div className="flex gap-2">
              <Button onClick={submit}>保存</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                取消
              </Button>
            </div>
          </div>
        ) : (
          <Row
            bordered={false}
            onClick={startEdit}
          >
            <span>碳水/蛋白质/脂肪</span>
            <span className="flex items-center font-medium">
              {macroGoals.carbs ?? '—'}/{macroGoals.protein ?? '—'}/{macroGoals.fat ?? '—'} g
              <Chevron />
            </span>
          </Row>
        )}
      </Card>
    </>
  )
}

function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24"
      />
      <span className="text-muted-foreground">g</span>
    </div>
  )
}
