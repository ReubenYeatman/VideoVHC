import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-xl font-bold">
          <img src="/logo.png" alt="ClipVault" className="h-8 w-8" />
          ClipVault
        </Link>

        {user && (
          <nav className="flex items-center gap-4">
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
