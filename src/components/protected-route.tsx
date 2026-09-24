import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const { session, loading, configured } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Supabase not configured</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Copy <code className="text-primary">.env.example</code> to{' '}
            <code className="text-primary">.env.local</code>, add your project URL and anon
            key, then run <code className="text-primary">supabase/schema.sql</code> and{' '}
            <code className="text-primary">supabase/seed.sql</code> in the SQL editor.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-3 p-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
