import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Shield } from 'lucide-react'

export function Header() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-xl font-bold">
          <img src="/logo.png" alt="ClipVault" className="h-8 w-8" />
          ClipVault
        </Link>

        {user && (
          <nav className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
