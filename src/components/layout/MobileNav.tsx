import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Calendar,
  Trophy,
  Menu,
  Sparkles,
  LogOut,
  Settings,
  Users,
  UsersRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { AppLogo } from '@/components/shared/AppLogo'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import { useState } from 'react'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { user, signOut } = useAuth()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t.nav.dashboard },
    { to: '/subjects', icon: BookOpen, label: t.nav.subjects },
    { to: '/ai-tools', icon: Sparkles, label: t.nav.aiTools, accent: true },
    { to: '/analytics', icon: BarChart3, label: t.nav.analytics },
    { to: '/schedule', icon: Calendar, label: t.nav.schedule },
    { to: '/achievements', icon: Trophy, label: t.nav.achievements },
    { to: '/social', icon: Users, label: t.nav.social },
    { to: '/groups', icon: UsersRound, label: t.nav.groups },
    { to: '/settings', icon: Settings, label: t.nav.settings },
  ]

  return (
    <div className="lg:hidden flex items-center justify-between border-b px-4 py-3 glass-nav sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <AppLogo className="h-6 w-6" />
        <span className="font-bold text-lg">{t.app.name}</span>
      </Link>

      <div className="flex items-center gap-1">
        <NotificationsPanel />
        <ThemeToggle />
        <LanguageToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AppLogo className="h-5 w-5" />
                {t.app.name}
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon className={cn('h-5 w-5', item.accent && 'text-purple-500')} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            {/* User info & sign out */}
            <div className="mt-6 pt-4 border-t space-y-2 px-1">
              {user && (
                <div className="flex items-center gap-2 px-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {(user.email?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              )}
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-red-500 transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>{t.auth.signOut}</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
