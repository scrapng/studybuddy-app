import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { SubjectsProvider } from '@/contexts/SubjectsContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SubjectsPage } from '@/pages/SubjectsPage'
import { SubjectDetailPage } from '@/pages/SubjectDetailPage'
import { StudySetPage } from '@/pages/StudySetPage'
import { StudySessionPage } from '@/pages/StudySessionPage'
import { QuizPage } from '@/pages/QuizPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { AchievementsPage } from '@/pages/AchievementsPage'
import { TimedChallengePage } from '@/pages/TimedChallengePage'
import { AIToolsPage } from '@/pages/AIToolsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LandingPage } from '@/pages/LandingPage'
import { SettingsPage } from '@/pages/SettingsPage'

function AuthenticatedApp() {
  const { user } = useAuth()

  return (
    <SubjectsProvider key={user?.id ?? 'none'}>
      <SessionProvider>
        <TooltipProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/welcome" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
              <Route path="/study-sets/:setId" element={<StudySetPage />} />
              <Route path="/study/:setId" element={<StudySessionPage />} />
              <Route path="/quiz/:setId" element={<QuizPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/ai-tools" element={<AIToolsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/challenge/:setId" element={<TimedChallengePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </SessionProvider>
    </SubjectsProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AuthenticatedApp />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
