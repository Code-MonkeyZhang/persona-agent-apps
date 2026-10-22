import { useMemo, useState } from 'react'
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import zhHans from 'bytemd/locales/zh_Hans.json'
import editorEn from 'bytemd/locales/en.json'
import 'bytemd/dist/index.css'
import { PenLine, Pin } from 'lucide-react'
import type { DiseaseState, JournalEntry } from '../types'
import { formatDate, todayStr } from '../helpers'
import { useI18n } from '../i18n'
import { DetailHeader } from './DetailHeader'
import { Markdown } from './Markdown'
import { Button } from './ui/button'
import { Card } from './ui/primitives'

interface Props {
  entries: DiseaseState['journal']
  basics: JournalEntry | null
  onBack: () => void
  onSetJournal: (date: string, content: string) => void
  onSetBasics: (content: string) => void
}

interface Draft {
  date: string
  content: string
  isNew: boolean
  isBasics: boolean
}

/** Journal entries by date with a Markdown editor for writing and fixing. */
export function JournalPage({
  entries,
  basics,
  onBack,
  onSetJournal,
  onSetBasics,
}: Props) {
  const { t, locale } = useI18n()
  const [draft, setDraft] = useState<Draft | null>(null)
  // Plugin list stays stable so the editor does not remount on every keystroke.
  const plugins = useMemo(() => [gfm()], [])
  const editorLocale = locale === 'zh-CN' ? zhHans : editorEn
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  if (draft) {
    return (
      <div>
        <DetailHeader
          title={draft.isBasics ? t('disease.basicsTitle') : t('disease.journal')}
          onBack={() => setDraft(null)}
        />
        <Card className="px-3.5 py-3.5">
          {!draft.isBasics && (
            <div className="px-0.5 pb-2.5">
              <input
                className="w-full rounded-lg bg-muted px-3 py-2 text-[15px] outline-none"
                type="date"
                value={draft.date}
                disabled={!draft.isNew}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
          )}
          <div className="journal-editor">
            <Editor
              value={draft.content}
              plugins={plugins}
              locale={editorLocale}
              onChange={(v) => setDraft({ ...draft, content: v })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (draft.isBasics) {
                  onSetBasics(draft.content)
                } else {
                  onSetJournal(draft.date, draft.content)
                }
                setDraft(null)
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <DetailHeader title={t('disease.journal')} onBack={onBack} />
      {basics ? (
        <BasicsCard
          basics={basics}
          onEdit={() =>
            setDraft({
              date: '',
              content: basics.content ?? '',
              isNew: false,
              isBasics: true,
            })
          }
        />
      ) : (
        <Card className="border border-dashed border-teal-500/40 bg-transparent">
          <div className="px-4 py-4 text-center text-[14px] leading-relaxed text-muted-foreground">
            {t('disease.basicsEmpty')}
          </div>
          <div className="flex justify-center pb-3">
            <Button
              variant="ghost"
              className="text-teal-600"
              onClick={() =>
                setDraft({ date: '', content: '', isNew: true, isBasics: true })
              }
            >
              {t('disease.basicsTitle')}
            </Button>
          </div>
        </Card>
      )}
      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          {t('disease.emptyJournal')}
        </div>
      ) : (
        sorted.map((entry) => {
          const body = (entry.content ?? '').replace(/^#\s.*\n/, '')
          return (
            <Card key={entry.date} className="px-4 py-3.5">
              <div className="flex items-center justify-between pb-1.5">
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold">{entry.title ?? entry.date}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {formatDate(entry.date, locale)}
                  </span>
                </div>
                <button
                  aria-label={t('disease.edit')}
                  className="press flex items-center gap-1 border-none bg-none p-1.5 text-muted-foreground active:text-primary"
                  onClick={() =>
                    setDraft({
                      date: entry.date,
                      content: entry.content ?? '',
                      isNew: false,
                      isBasics: false,
                    })
                  }
                >
                  <PenLine size={16} />
                </button>
              </div>
              <Markdown>{body}</Markdown>
            </Card>
          )
        })
      )}
      <div className="flex justify-center pb-2">
        <Button
          variant="ghost"
          onClick={() =>
            setDraft({ date: todayStr(), content: '', isNew: true, isBasics: false })
          }
        >
          {t('disease.writeJournal')}
        </Button>
      </div>
    </div>
  )
}

/** Pinned foundational history card that always sits above the timeline. */
function BasicsCard({
  basics,
  onEdit,
}: {
  basics: JournalEntry
  onEdit: () => void
}) {
  const { t } = useI18n()
  const body = (basics.content ?? '').replace(/^#\s.*\n/, '')

  return (
    <Card className="bg-teal-500/5 px-4 py-3.5 ring-1 ring-teal-500/25">
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5 text-teal-600">
          <Pin size={15} />
          <span className="text-[15px] font-semibold">{t('disease.basicsTitle')}</span>
        </div>
        <button
          aria-label={t('disease.editBasics')}
          className="press flex items-center gap-1 border-none bg-none p-1.5 text-muted-foreground active:text-primary"
          onClick={onEdit}
        >
          <PenLine size={16} />
        </button>
      </div>
      <Markdown>{body}</Markdown>
    </Card>
  )
}
