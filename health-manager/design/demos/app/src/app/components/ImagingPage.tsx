import type { DiseaseState } from '../types'
import { formatDate } from '../helpers'
import { useI18n } from '../i18n'
import { DetailHeader } from './DetailHeader'
import { Badge } from './ui/badge'
import { Card } from './ui/primitives'

interface Props {
  findings: DiseaseState['imagingFindings']
  onBack: () => void
}

/** Imaging conclusions by date, newest first. */
export function ImagingPage({ findings, onBack }: Props) {
  const { t, locale } = useI18n()
  const sorted = [...findings].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div>
      <DetailHeader title={t('disease.imaging')} onBack={onBack} />
      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          {t('disease.emptyImaging')}
        </div>
      ) : (
        sorted.map((finding) => (
          <Card key={finding.id} className="px-4 py-3.5">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[13px] font-medium text-muted-foreground">
                {formatDate(finding.date, locale)}
              </span>
              <Badge variant="info">{finding.examType}</Badge>
            </div>
            <p className="whitespace-pre-line text-[15px] leading-relaxed">
              {finding.findingText}
            </p>
          </Card>
        ))
      )}
    </div>
  )
}
