import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const AMOUNTS = [5_000_000, 10_000_000, 30_000_000, 50_000_000, 100_000_000, 500_000_000]

const THERAPY_COUPON_MAP: Record<number, { count: number; price: string }> = {
  5_000_000:  { count: 1,  price: '49만원' },
  10_000_000: { count: 3,  price: '119만원' },
  30_000_000: { count: 10, price: '499만원' },
}

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

export default function Participate() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)

  const dailyPayment = selected ? Math.floor(selected * 0.003) : 0

  const handleNext = () => {
    if (!selected) return
    navigate('/participate/agreement', {
      state: { amount: selected, dailyPayment },
    })
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">도시참여</h1>
          <p className="text-slate-400 mt-2">참여 금액을 선택하세요</p>
        </div>

        {/* Selected amount display */}
        <div className="bg-surface rounded-2xl p-6 border border-surface-light mb-6 text-center">
          <p className="text-sm text-slate-400 mb-1">선택 금액</p>
          <p className="text-3xl sm:text-4xl font-bold text-gold">
            {selected ? formatKRW(selected) : '금액을 선택하세요'}
          </p>
          {selected && (
            <p className="mt-2 text-lg text-success">
              일일 이자: <span className="font-bold">{dailyPayment.toLocaleString()}원</span>/일
            </p>
          )}
        </div>

        {/* Amount grid */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 border border-surface-light mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AMOUNTS.map(amount => (
              <button
                key={amount}
                onClick={() => setSelected(amount)}
                className={`py-5 rounded-xl font-bold transition-all ${
                  selected === amount
                    ? 'bg-gold text-primary ring-2 ring-gold shadow-lg shadow-gold/20 text-lg'
                    : 'bg-surface-light text-slate-300 hover:bg-slate-600 hover:text-white text-base'
                }`}
              >
                <span className="block">{formatKRW(amount)}</span>
                <span className={`block text-xs mt-1 font-medium ${
                  selected === amount ? 'text-primary/70' : 'text-slate-500'
                }`}>
                  일 {Math.floor(amount * 0.003).toLocaleString()}원
                </span>
              </button>
            ))}
          </div>
          {selected && THERAPY_COUPON_MAP[selected] && (
            <div className="mt-4 text-center">
              <Link
                to="/therapy-coupon"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-white underline underline-offset-2 transition-colors"
              >
                체험쿠폰 {THERAPY_COUPON_MAP[selected].count}매
                <span className="text-xs text-slate-400 no-underline">OWNIA 회원 전용 혜택</span>
              </Link>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4 text-center">※ 참여일로부터 7일 후 매일 이자가 지급됩니다.</p>
        </div>

        <button
          onClick={handleNext}
          disabled={!selected}
          className="w-full py-4 rounded-xl bg-gold text-primary font-bold text-lg hover:bg-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gold/20"
        >
          다음 단계: 차용증 작성
        </button>
      </div>
    </Layout>
  )
}
