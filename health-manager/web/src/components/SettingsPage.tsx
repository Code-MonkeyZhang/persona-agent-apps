import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import type { GoalMode, MacroGoals } from '../types'
import { useI18n } from '../i18n'
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
  const { t, lang, setLang } = useI18n()
  return (
    <div>
      <DetailHeader title={t('common.settings')} onBack={onBack} />

      <SectionLabel>{t('settings.personalInfo')}</SectionLabel>
      <Card>
        <EditableRow
          label={t('profile.name')}
          display={name || t('common.notSet')}
          initial={name}
          placeholder={t('profile.namePlaceholder')}
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
          label={t('profile.height')}
          display={height ? `${height} cm` : t('common.notSet')}
          initial={height ? String(height) : ''}
          placeholder={t('profile.heightPlaceholder')}
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
        <Row bordered={false}>
          <span>{t('settings.language')}</span>
          <Tabs value={lang} onValueChange={(v) => setLang(v as 'zh' | 'en')}>
            <TabsList className="h-8">
              <TabsTrigger value="zh">中文</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>
      </Card>

      <SectionLabel>{t('settings.goals')}</SectionLabel>
      <Card>
        <EditableRow
          label={t('settings.dailyCalorieGoal')}
          display={dietGoal ? `${dietGoal} kcal` : t('common.notSet')}
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

      <SectionLabel>{t('settings.data')}</SectionLabel>
      <Card>
        <Row bordered={false}>
          <div className="flex flex-col gap-0.5">
            <span>{t('settings.demoData')}</span>
            <span className="text-sm text-muted-foreground">
              {mockOn ? t('settings.demoOn') : t('settings.demoOff')}
            </span>
          </div>
          <Switch
            checked={mockOn}
            onCheckedChange={() => onToggleMock()}
            aria-label={t('settings.toggleDemoAria')}
          />
        </Row>
      </Card>

      <SectionLabel>{t('settings.about')}</SectionLabel>
      <Card>
        <Row>
          <span>{t('settings.version')}</span>
          <span className="font-medium">{version || '——'}</span>
        </Row>
        <Row>
          <span>{t('settings.dbVersion')}</span>
          <span className="font-medium">v{schemaVersion || '——'}</span>
        </Row>
        <Row bordered={false}>
          <span>{t('settings.dataSource')}</span>
          <span className="font-medium">
            {mockOn ? t('settings.demo') : t('settings.real')}
          </span>
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
  const { t } = useI18n()
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
          <Button onClick={save}>{t('common.save')}</Button>
          <Button variant="outline" onClick={() => setEditing(false)}>
            {t('common.cancel')}
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
  const { t } = useI18n()

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
      <SectionLabel>{t('settings.macroGoals')}</SectionLabel>
      <Card>
        <Row>
          <span>{t('settings.mode')}</span>
          <Tabs value={goalMode} onValueChange={(v) => onSetGoalMode(v as GoalMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="auto">{t('settings.auto')}</TabsTrigger>
              <TabsTrigger value="manual">{t('settings.manual')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>

        {goalMode === 'auto' ? (
          <Row bordered={false}>
            <span>{t('settings.derivedFromCalories')}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {dietGoal
                ? `${macroGoals.carbs}/${macroGoals.protein}/${macroGoals.fat} g`
                : t('settings.setCalorieGoalFirst')}
            </span>
          </Row>
        ) : editing ? (
          <div className="flex flex-col gap-2 px-4 py-3.5">
            <MacroInput label={t('macro.carbs')} value={carbs} onChange={setCarbs} />
            <MacroInput label={t('macro.protein')} value={protein} onChange={setProtein} />
            <MacroInput label={t('macro.fat')} value={fat} onChange={setFat} />
            <div className="flex gap-2">
              <Button onClick={submit}>{t('common.save')}</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Row
            bordered={false}
            onClick={startEdit}
          >
            <span>{t('settings.carbsProteinFat')}</span>
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
