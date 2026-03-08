import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl p-6 sm:p-8 border border-surface-light text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold">이메일 인증이 필요합니다</h2>

        <p className="text-slate-400 text-sm leading-relaxed">
          <span className="text-white font-medium">{user?.email}</span>으로
          인증 메일을 발송했습니다.<br />
          메일함을 확인하고 인증 링크를 클릭해주세요.
        </p>

        <div className="bg-surface-light rounded-lg p-4 text-sm text-slate-400">
          <p>메일이 도착하지 않았나요?</p>
          <p className="mt-1">스팸 폴더를 확인하거나 잠시 후 다시 시도해주세요.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="block py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors no-underline"
          >
            인증 완료 후 로그인
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            다른 계정으로 가입
          </button>
        </div>
      </div>
    </div>
  )
}
