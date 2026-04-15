import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Toaster } from '@/components/ui/sonner'
import { useGlowEffect } from '@/hooks/useGlowEffect'
import { useThemeShortcut } from '@/hooks/useThemeShortcut'
import { ThemeToast } from '@/components/shared/ThemeToast'
import { SkyBackground } from '@/components/shared/SkyBackground'
import { Sparkles } from 'lucide-react'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  useGlowEffect()
  const themeToast = useThemeShortcut()

  return (
    <div className="flex h-dvh overflow-hidden">
      <SkyBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <MobileNav />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Floating AI Button — mobile only */}
      <button
        onClick={() => navigate('/ai-tools')}
        className="fixed bottom-6 right-6 z-40 lg:hidden h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label="AI Tools"
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <Toaster />
      {themeToast && <ThemeToast theme={themeToast.theme} visible={themeToast.visible} />}
    </div>
  )
}
