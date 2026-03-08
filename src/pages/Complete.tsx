import { Link, useLocation, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

export default function Complete() {
  const location = useLocation()
  const state = location.state as { amount: number; dailyPayment: number; bankName: string; accountHolder: string } | null
  if (!state) return <Navigate to="/" replace />

  const { amount, dailyPayment, bankName, accountHolder } = state

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">도시참여 완료!</h1>
        <p className="text-slate-400 mb-8">차용증이 이메일로 발송되었습니다.</p>

        <div className="bg-surface rounded-2xl p-6 border border-surface-light text-left space-y-3 mb-8">
          <div className="flex justify-between">
            <span className="text-slate-400">참여 금액</span>
            <span className="font-bold text-gold">{formatKRW(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">일일 이자</span>
            <span className="font-bold text-success">{dailyPayment.toLocaleString()}원/일</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">입금 계좌</span>
            <span className="font-medium">{bankName} ({accountHolder})</span>
          </div>
          <hr className="border-surface-light" />
          <p className="text-sm text-slate-400">
            참여일로부터 7일 후 매일 이자가 지급됩니다.<br />
            대시보드에서 지급 요청을 할 수 있습니다.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-accent text-white font-bold text-lg hover:bg-accent-hover transition-colors no-underline"
        >
          대시보드로 이동
        </Link>
      </div>
    </Layout>
  )
}
