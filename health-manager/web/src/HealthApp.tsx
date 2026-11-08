import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useHealthData } from './useHealthData'
import { cn } from '@/lib/utils'
import { fadeVariants, pageVariants, PAGE_TRANSITION } from '@/lib/transitions'
import { AnalyteDetail } from './components/AnalyteDetail'
import { BasicsPage, SummaryDetailPage } from './components/BasicsPage'
import { DietHistoryPage } from './components/DietHistoryPage'
import { DietPage } from './components/DietPage'
import { DiseasePage } from './components/DiseasePage'
import { FitnessPage } from './components/FitnessPage'
import { ImagingPage } from './components/ImagingPage'
import { JournalPage } from './components/JournalPage'
import { LabSubcatPage } from './components/LabSubcatPage'
import { BpDetail, MetricDetail, RoutinePage } from './components/RoutinePage'
import { SettingsPage } from './components/SettingsPage'
import { StrengthDetail } from './components/StrengthDetail'
import { TabBar } from './components/TabBar'
import { WorkoutDayDetail } from './components/WorkoutDayDetail'

/**
 * Root: a 4-tab shell over react-router. Tab and detail navigation both go
 * through the router, so the browser back gesture walks the same stack the
 * in-app chevron does. Page params are read by each detail page itself.
 */
export function HealthApp({ className }: { className?: string }) {
  const {
    basics,
    diet,
    fitness,
    disease,
    mockOn,
    version,
    schemaVersion,
    setHeight,
    setName,
    setDietGoal,
    setGoalMode,
    setMacroGoals,
    toggleMock,
    setJournal,
    setJournalBasics,
  } = useHealthData()
  const location = useLocation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const variants = reduce ? fadeVariants : pageVariants
  const scrollRef = useRef<HTMLDivElement>(null)
  const dir = (location.state as { dir?: number } | null)?.dir ?? 0

  // Navigation always starts the next page at the top of the scroll container.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  // Deep-link reload: the server bounces to the shell entry with the original
  // path in ?r= because relative asset URLs need the shallow entry path.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('r')
    if (r && r.startsWith('/') && r !== '/') {
      navigate(r, { replace: true })
    }
    // Run once on mount; later search changes are not deep-link restores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detail headers share one back handler wired to browser history.
  const back = () => navigate(-1)

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col',
        'mobile:select-none mobile:[touch-action:manipulation] mobile:[-webkit-tap-highlight-color:transparent]',
        className
      )}
    >
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 mobile:px-3 mobile:py-4"
      >
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={location.pathname}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={PAGE_TRANSITION}
            className="bg-background"
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/summary" replace />} />
              <Route
                path="/summary"
                element={
                  <BasicsPage
                    basics={basics}
                    diet={diet}
                    fitness={fitness}
                    disease={disease}
                  />
                }
              />
              <Route
                path="/summary/settings"
                element={
                  <SettingsPage
                    name={basics.profile?.name ?? ''}
                    height={basics.profile?.height ?? null}
                    dietGoal={diet.goal}
                    goalMode={diet.goalMode}
                    macroGoals={diet.macroGoals}
                    mockOn={mockOn}
                    version={version}
                    schemaVersion={schemaVersion}
                    onSetName={setName}
                    onSetHeight={setHeight}
                    onSetDietGoal={setDietGoal}
                    onSetGoalMode={setGoalMode}
                    onSetMacroGoals={setMacroGoals}
                    onToggleMock={toggleMock}
                    onBack={back}
                  />
                }
              />
              <Route
                path="/summary/:detail"
                element={
                  <SummaryDetailPage basics={basics} onSetHeight={setHeight} />
                }
              />
              <Route path="/diet" element={<DietPage diet={diet} />} />
              <Route
                path="/diet/history"
                element={<DietHistoryPage diet={diet} onBack={back} />}
              />
              <Route path="/fitness" element={<FitnessPage fitness={fitness} />} />
              <Route
                path="/fitness/day/:date"
                element={<WorkoutDayDetail workouts={fitness.workouts} onBack={back} />}
              />
              <Route
                path="/fitness/strength/:exercise"
                element={
                  <StrengthDetail
                    records={fitness.strengthRecords}
                    onBack={back}
                  />
                }
              />
              <Route path="/disease" element={<DiseasePage disease={disease} />} />
              <Route
                path="/disease/subcat/:sub"
                element={
                  <LabSubcatPage
                    labs={disease.labResults}
                    dict={disease.labDictionary}
                    onBack={back}
                  />
                }
              />
              <Route
                path="/disease/analyte/:analyte"
                element={
                  <AnalyteDetail
                    labs={disease.labResults}
                    dict={disease.labDictionary}
                    onBack={back}
                  />
                }
              />
              <Route
                path="/disease/routine"
                element={<RoutinePage metrics={basics.metrics} onBack={back} />}
              />
              <Route
                path="/disease/routine/bp"
                element={<BpDetail metrics={basics.metrics} onBack={back} />}
              />
              <Route
                path="/disease/routine/:metric"
                element={<MetricDetail metrics={basics.metrics} onBack={back} />}
              />
              <Route
                path="/disease/imaging"
                element={<ImagingPage findings={disease.imagingFindings} onBack={back} />}
              />
              <Route
                path="/disease/journal"
                element={
                  <JournalPage
                    entries={disease.journal}
                    basics={disease.journalBasics}
                    onBack={back}
                    onSetJournal={setJournal}
                    onSetBasics={setJournalBasics}
                  />
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <TabBar />
    </div>
  )
}
