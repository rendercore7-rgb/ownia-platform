import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // 관리자 승인 대기 중
  if (profile && !profile.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-surface rounded-2xl p-8 border border-surface-light">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">가입 승인 대기중</h2>
            <p className="text-slate-400 text-sm mb-1">
              회원가입이 완료되었습니다.
            </p>
            <p className="text-slate-400 text-sm mb-6">
              관리자 승인 후 서비스를 이용하실 수 있습니다.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              문의: RENDERCOREAI@ICLOUD.COM
            </p>
            <button
              onClick={async () => { await signOut(); window.location.href = '/login' }}
              className="px-6 py-2 rounded-lg bg-surface-light text-slate-300 hover:bg-slate-600 text-sm transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
