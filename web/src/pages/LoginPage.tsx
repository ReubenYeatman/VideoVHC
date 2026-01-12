import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <LoginForm />
      </div>
    </Layout>
  )
}
