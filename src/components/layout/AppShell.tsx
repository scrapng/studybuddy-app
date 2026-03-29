import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Toaster } from '@/components/ui/sonner'
import { useGlowEffect } from '@/hooks/useGlowEffect'
import { useThemeShortcut } from '@/hooks/useThemeShortcut'
import { ThemeToast } from '@/components/shared/ThemeToast'
import { SkyBackground } from '@/components/shared/SkyBackground'

export function AppShell() {
  const location = useLocation()
  useGlowEffect()
  const themeToast = useThemeShortcut()

  return (
    <div className="flex h-dvh overflow-hidden">
      <SkyBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <MobileNav />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
      {themeToast && <ThemeToast theme={themeToast.theme} visible={themeToast.visible} />}
    </div>
  )
}
