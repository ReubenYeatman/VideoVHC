import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AllVideosPage } from '@/pages/AllVideosPage'
import { PlayerPage } from '@/pages/PlayerPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/v/:shareCode" element={<PlayerPage />} />

            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/videos" element={<AllVideosPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
