import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행',
  'IBK기업은행', 'SC제일은행', '씨티은행', '카카오뱅크', '토스뱅크',
  '케이뱅크', '새마을금고', '신협', '우체국', '수협은행',
]

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

export default function BankInfo() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const state = location.state as { amount: number; dailyPayment: number; signatureData: string } | null
  if (!state) return <Navigate to="/participate" replace />

  const { amount, dailyPayment, signatureData } = state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      // Upload signature image to Supabase Storage
      const signatureBlob = await fetch(signatureData).then(r => r.blob())
      const signaturePath = `signatures/${user.id}/${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('agreements')
        .upload(signaturePath, signatureBlob, { contentType: 'image/png' })

      if (uploadError) throw new Error('서명 이미지 업로드에 실패했습니다.')

      const { data: urlData } = supabase.storage.from('agreements').getPublicUrl(signaturePath)

      // Calculate start date (7 days from now)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7)

      // Create investment record
      const { error: insertError } = await supabase.from('investments').insert({
        user_id: user.id,
        amount,
        daily_payment: dailyPayment,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        signature_url: urlData.publicUrl,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
      })

      if (insertError) throw new Error('참여 등록에 실패했습니다. 다시 시도해주세요.')

      // Send agreement email via Edge Function
      try {
        await supabase.functions.invoke('send-agreement', {
          body: {
            email: user.email,
            userName: accountHolder,
            amount,
            dailyPayment,
            startDate: startDate.toISOString().split('T')[0],
            signatureUrl: urlData.publicUrl,
          },
        })
      } catch {
        // Email failure should not block the flow
        console.warn('차용증 이메일 발송 실패')
      }

      navigate('/participate/complete', {
        state: { amount, dailyPayment, bankName, accountHolder },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">입금 계좌 정보</h1>
          <p className="text-slate-400 mt-2">이자를 받으실 계좌를 입력하세요</p>
        </div>

        {/* 요약 */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-light mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400">참여 금액</p>
            <p className="text-xl font-bold text-gold">{formatKRW(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">일일 이자</p>
            <p className="text-xl font-bold text-success">{dailyPayment.toLocaleString()}원</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 sm:p-8 border border-surface-light space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">은행명</label>
            <select
              required
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">은행을 선택하세요</option>
              {BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">계좌번호</label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="'-' 없이 입력"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">예금주</label>
            <input
              type="text"
              required
              value={accountHolder}
              onChange={e => setAccountHolder(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              placeholder="예금주명"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gold text-primary font-bold text-lg hover:bg-gold-hover disabled:opacity-50 transition-colors shadow-lg shadow-gold/20"
          >
            {loading ? '처리 중...' : '참여 완료'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
