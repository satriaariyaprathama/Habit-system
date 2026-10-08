import { useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { DateProvider } from '@/context/DateContext'
import { Login } from '@/components/Auth/Login'
import { Header } from '@/components/Layout/Header'
import { Dashboard } from '@/components/Dashboard/Dashboard'
import { HabitsPage } from '@/components/Habits/HabitsPage'

type Tab = 'dashboard' | 'habits'

function AppShell() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink-faint">Loading your dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Header />
      <nav className="mx-auto flex max-w-5xl gap-1 px-4 pt-4 sm:px-6">
        <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
          Dashboard
        </TabButton>
        <TabButton active={tab === 'habits'} onClick={() => setTab('habits')}>
          Manage Habits
        </TabButton>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        {tab === 'dashboard' ? <Dashboard /> : <HabitsPage />}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-sm border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-moss-600 text-ink'
          : 'border-transparent text-ink-faint hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DateProvider>
          <AppShell />
        </DateProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
