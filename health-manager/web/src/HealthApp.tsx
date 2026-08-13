import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useHealthData } from './useHealthData'
import type { Tab } from './types'
import { cn } from '@/lib/utils'
import { TabBar } from './components/TabBar'
import { BasicsPage } from './components/BasicsPage'
import { DietPage } from './components/DietPage'
import { FitnessPage } from './components/FitnessPage'

/** Root: a 4-tab shell. The disease module is deferred to a placeholder. */
export function HealthApp({ className }: { className: string }) {
  const {
    basics,
    diet,
    fitness,
    mockOn,
    version,
    schemaVersion,
    setHeight,
    setName,
    setDietGoal,
    setGoalMode,
    setMacroGoals,
    toggleMock,
  } = useHealthData()
  const [tab, setTab] = useState<Tab>('summary')
  const reduce = useReducedMotion()

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col',
        'mobile:select-none mobile:[touch-action:manipulation] mobile:[-webkit-tap-highlight-color:transparent]',
        className
      )}
    >
      <div className="flex-1 overflow-y-auto px-4 py-5 mobile:px-3 mobile:py-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            {tab === 'summary' && (
              <BasicsPage
                basics={basics}
                diet={diet}
                fitness={fitness}
                mockOn={mockOn}
                version={version}
                schemaVersion={schemaVersion}
                onSetHeight={setHeight}
                onSetName={setName}
                onSetDietGoal={setDietGoal}
                onSetGoalMode={setGoalMode}
                onSetMacroGoals={setMacroGoals}
                onToggleMock={toggleMock}
                onNavigate={setTab}
              />
            )}
            {tab === 'diet' && <DietPage diet={diet} />}
            {tab === 'fitness' && <FitnessPage fitness={fitness} />}
            {tab === 'disease' && (
              <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
                疾病模块建设中，敬请期待。
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <TabBar active={tab} onSelect={setTab} />
    </div>
  )
}
