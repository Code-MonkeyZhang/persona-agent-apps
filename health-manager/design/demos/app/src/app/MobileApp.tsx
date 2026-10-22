import { MemoryRouter } from 'react-router'
import { Toaster } from 'sonner'
import { HealthApp } from './HealthApp'
import { I18nProvider } from './i18n'

/**
 * Demo shell: a MemoryRouter keeps navigation inside the stage and never
 * touches the demo page's own URL. The initial entry opens the disease tab
 * because that is the module under review.
 */
export default function MobileApp() {
  return (
    <I18nProvider>
      <MemoryRouter initialEntries={['/disease']}>
        <HealthApp className="mobile-app" />
      </MemoryRouter>
      <Toaster position="top-center" />
    </I18nProvider>
  )
}
