import { useState } from 'react'
import { useHealthData } from './useHealthData'
import type { View } from './types'
import { OverviewPage } from './components/OverviewPage'
import { DetailHeader } from './components/DetailHeader'
import { ProfileDetail } from './components/ProfileDetail'
import { WeightDetail, BloodPressureDetail } from './components/DetailViews'

const TITLES: Record<Exclude<View, 'overview'>, string> = {
  profile: '基本信息',
  weight: '体重',
  blood_pressure: '血压',
}

export function HealthApp({ className }: { className: string }) {
  const { profile, metrics, setHeight } = useHealthData()
  const [view, setView] = useState<View>('overview')

  if (view === 'overview') {
    return (
      <div className={className}>
        <OverviewPage
          profile={profile}
          metrics={metrics}
          onSelect={setView}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <DetailHeader
        title={TITLES[view]}
        onBack={() => setView('overview')}
      />
      <div className="detail-content">
        {view === 'profile' && (
          <ProfileDetail
            profile={profile}
            metrics={metrics}
            onSetHeight={setHeight}
          />
        )}
        {view === 'weight' && <WeightDetail metrics={metrics} />}
        {view === 'blood_pressure' && <BloodPressureDetail metrics={metrics} />}
      </div>
    </div>
  )
}
