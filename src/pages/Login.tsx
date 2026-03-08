import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-gold">OWN</span>
            <span className="text-white">iA</span>
          </h1>
          <p className="text-slate-400 mt-2">2027년, 당신의 일상이 자산이 되는 도시</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 sm:p-8 space-y-5 border border-surface-light">
          <h2 className="text-xl font-semibold text-center">로그인</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="비밀번호"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gold text-primary font-bold hover:bg-gold-hover disabled:opacity-50 transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-slate-400">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-accent hover:underline">회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
