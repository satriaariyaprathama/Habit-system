import { useAuth } from '@/context/AuthContext'
import { MonthYearSelector } from '@/components/Layout/MonthYearSelector'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center justify-between sm:justify-start sm:gap-6">
          <h1 className="font-display text-2xl text-ink">Habit System</h1>
          <div className="hidden sm:block">
            <MonthYearSelector />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="sm:hidden">
            <MonthYearSelector />
          </div>
          {user && (
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5 text-sm text-ink-soft hover:bg-paper-dim"
              title="Sign out"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-moss-100 text-xs text-moss-700">
                  {(user.email ?? '?')[0].toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[10rem] truncate sm:inline">
                {user.user_metadata?.full_name ?? user.email}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
