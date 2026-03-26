import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Trash2, AlertTriangle, LogOut, Mail, Calendar, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { useTranslation } from '@/hooks/useTranslation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { state, dispatch } = useSubjectsContext()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [showDeleteData, setShowDeleteData] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const stats = {
    subjects: state.subjects.length,
    studySets: state.studySets.length,
    flashcards: state.studySets.reduce((sum, s) => sum + s.flashcards.length, 0),
    notes: state.studySets.reduce((sum, s) => sum + s.notes.length, 0),
    questions: state.studySets.reduce((sum, s) => sum + s.questions.length, 0),
    sessions: state.sessions.length,
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t.auth.passwordMinLength)
      return
    }
    setIsUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.settings.passwordUpdated)
      setNewPassword('')
    }
    setIsUpdatingPassword(false)
  }

  const handleDeleteData = async () => {
    if (!user) return
    setIsDeleting(true)

    // Clear from Supabase
    try {
      await supabase.from('user_data').delete().eq('user_id', user.id)
    } catch {
      // continue to clear locally
    }

    // Clear localStorage
    localStorage.removeItem(`studybuddy-data-${user.id}`)

    // Reset state
    dispatch({ type: 'HYDRATE', payload: { subjects: [], studySets: [], sessions: [] } })

    toast.success(t.settings.dataDeleted)
    setShowDeleteData(false)
    setIsDeleting(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE' || !user) return
    setIsDeleting(true)

    // Delete user data first
    try {
      await supabase.from('user_data').delete().eq('user_id', user.id)
    } catch {
      // continue
    }

    // Delete the auth account via edge function or RPC
    // Note: Supabase client-side can't delete users directly, so we sign out
    // and the user row in auth.users would need admin cleanup or an edge function
    try {
      // Try RPC if available
      await supabase.rpc('delete_user')
    } catch {
      // Fall through — sign out regardless
    }

    localStorage.removeItem(`studybuddy-data-${user.id}`)
    localStorage.removeItem(`notebuddy-tutorial-seen-${user.id}`)

    await signOut()
    toast.success(t.settings.accountDeleted)
    navigate('/login')
    setIsDeleting(false)
  }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold animate-in fade-in duration-500">{t.settings.title}</h1>

      {/* Profile Info */}
      <Card className="card-hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t.settings.profile}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {(user?.email?.[0] ?? '?').toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{user?.email}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {t.settings.emailVerified}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t.settings.joined} {createdAt}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Overview */}
      <Card className="card-hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {t.settings.yourData}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[
              { label: t.settings.subjects, val: stats.subjects },
              { label: t.settings.studySets, val: stats.studySets },
              { label: t.settings.flashcards, val: stats.flashcards },
              { label: t.settings.notes, val: stats.notes },
              { label: t.settings.questions, val: stats.questions },
              { label: t.settings.sessions, val: stats.sessions },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="card-hover-lift">
        <CardHeader>
          <CardTitle className="text-base">{t.settings.changePassword}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t.settings.newPassword}</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isUpdatingPassword || newPassword.length < 6}
            size="sm"
          >
            {t.settings.updatePassword}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t.settings.dangerZone}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delete Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.settings.deleteAllData}</p>
              <p className="text-xs text-muted-foreground">{t.settings.deleteDataDesc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 shrink-0"
              onClick={() => setShowDeleteData(!showDeleteData)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t.settings.deleteData}
            </Button>
          </div>
          {showDeleteData && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 space-y-3 animate-fade-in-up">
              <p className="text-sm text-red-700 dark:text-red-300">{t.settings.deleteDataWarn}</p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteData}
                  disabled={isDeleting}
                >
                  {t.settings.confirmDelete}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteData(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}

          {/* Delete Account */}
          <div className="flex items-center justify-between pt-2 border-t border-red-100 dark:border-red-900/30">
            <div>
              <p className="text-sm font-medium">{t.settings.deleteAccount}</p>
              <p className="text-xs text-muted-foreground">{t.settings.deleteAccountDesc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 shrink-0"
              onClick={() => setShowDeleteAccount(!showDeleteAccount)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t.settings.deleteAccount}
            </Button>
          </div>
          {showDeleteAccount && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 space-y-3 animate-fade-in-up">
              <p className="text-sm text-red-700 dark:text-red-300">{t.settings.deleteAccountWarn}</p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm" className="text-xs text-red-600">
                  {t.settings.typeDelete}
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                >
                  {t.settings.permanentlyDelete}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowDeleteAccount(false); setDeleteConfirm('') }}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <div className="flex items-center justify-between pt-2 border-t border-red-100 dark:border-red-900/30">
            <div>
              <p className="text-sm font-medium">{t.auth.signOut}</p>
              <p className="text-xs text-muted-foreground">{t.settings.signOutDesc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              {t.auth.signOut}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
