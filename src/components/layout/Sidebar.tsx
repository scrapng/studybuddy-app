import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Calendar,
  Trophy,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  LogOut,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { AppLogo } from '@/components/shared/AppLogo'

export function Sidebar() {
  const { settings, toggleSidebar } = useSettingsContext()
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const collapsed = settings.sidebarCollapsed

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t.nav.dashboard },
    { to: '/subjects', icon: BookOpen, label: t.nav.subjects },
    { to: '/ai-tools', icon: Sparkles, label: t.nav.aiTools, accent: true },
    { to: '/analytics', icon: BarChart3, label: t.nav.analytics },
    { to: '/schedule', icon: Calendar, label: t.nav.schedule },
    { to: '/achievements', icon: Trophy, label: t.nav.achievements },
    { to: '/settings', icon: Settings, label: t.nav.settings },
  ]

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r glass-sidebar h-screen sticky top-0 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <Link to="/" className={cn('flex items-center gap-2 p-4 border-b hover:bg-accent/50 transition-colors', collapsed && 'justify-center')}>
        <AppLogo className="h-6 w-6 shrink-0" />
        {!collapsed && <span className="font-bold text-lg">{t.app.name}</span>}
      </Link>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className={cn('h-5 w-5 shrink-0', item.accent && 'text-purple-500')} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={cn('p-2 border-t space-y-2')}>
        {/* User info */}
        {user && !collapsed && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">
                {(user.email?.[0] ?? '?').toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        )}
        <div className={cn('flex items-center', collapsed ? 'justify-center flex-col gap-1' : 'justify-between')}>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-red-500"
              onClick={signOut}
              title={t.auth.signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleSidebar}>
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
