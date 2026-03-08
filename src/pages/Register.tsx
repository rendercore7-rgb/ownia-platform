import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName, form.phone)
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      navigate('/verify-email')
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
          <p className="text-slate-400 mt-2">도시의 주인이 되십시오</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 sm:p-8 space-y-5 border border-surface-light">
          <h2 className="text-xl font-semibold text-center">회원가입</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">이름</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">이메일</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">전화번호</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="6자 이상"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">비밀번호 확인</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="비밀번호 재입력"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>

          <p className="text-center text-sm text-slate-400">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-accent hover:underline">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
