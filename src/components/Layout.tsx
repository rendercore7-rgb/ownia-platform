import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <header className="border-b border-surface-light bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tight no-underline">
            <span className="text-gold">OWN</span>
            <span className="text-white">iA</span>
          </Link>
          <nav className="flex items-center gap-4">
            {user && (
              <>
                <Link to="/land-map" className="text-sm text-slate-300 hover:text-white no-underline transition-colors">
                  도시맵
                </Link>
                <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white no-underline transition-colors">
                  대시보드
                </Link>
                <span className="text-sm text-slate-400">{profile?.full_name || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm px-3 py-1.5 rounded-lg bg-surface-light hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  로그아웃
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-surface-light py-6 text-center text-sm text-slate-500">
        &copy; 2027 OWNIA. Own Your Life, AI Rules Your Wealth.
      </footer>
    </div>
  )
}
