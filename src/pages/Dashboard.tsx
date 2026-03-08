import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Investment {
  id: string
  amount: number
  daily_payment: number
  bank_name: string
  account_number: string
  account_holder: string
  status: string
  start_date: string
  created_at: string
}

interface PaymentRequest {
  id: string
  investment_id: string
  request_date: string
  request_time: string
  is_same_day: boolean
  status: string
  admin_confirmed_at: string | null
  transferred_at: string | null
  created_at: string
}

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// Generate 12 months of schedule from start_date
function generate12Months(startDateStr: string) {
  const start = new Date(startDateStr)
  const months: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${d.getFullYear()}.${MONTH_NAMES[d.getMonth()]}`,
    })
  }
  return months
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedInv, setExpandedInv] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    const [invRes, payRes] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payment_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (invRes.data) setInvestments(invRes.data)
    if (payRes.data) setPayments(payRes.data)
    setLoading(false)
  }

  const getPaymentForDate = (investmentId: string, dateStr: string): PaymentRequest | undefined => {
    return payments.find(p => p.investment_id === investmentId && p.request_date === dateStr)
  }

  // 고객: 지급 버튼
  const requestPayment = async (investment: Investment) => {
    if (!user) return
    setRequestingId(investment.id)
    setMessage(null)

    const now = new Date()
    const hours = now.getHours()
    const isSameDay = hours < 12

    const { error } = await supabase.from('payment_requests').insert({
      investment_id: investment.id,
      user_id: user.id,
      request_date: now.toISOString().split('T')[0],
      request_time: now.toTimeString().split(' ')[0],
      is_same_day: isSameDay,
      status: 'requested',
    })

    if (error) {
      setMessage({ type: 'error', text: '지급 요청에 실패했습니다. 다시 시도해주세요.' })
    } else {
      const transferMsg = isSameDay
        ? '오후 12시 이전 요청으로 당일 송금 예정입니다.'
        : '오후 12시 이후 요청으로 익일 송금 예정입니다.'
      setMessage({ type: 'success', text: `지급 요청 완료! ${transferMsg}` })
      fetchData()
    }
    setRequestingId(null)
  }


  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleteError('')
    setDeleting(true)

    // 비밀번호 재검증
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: deletePassword,
    })
    if (authError) {
      setDeleteError('비밀번호가 올바르지 않습니다.')
      setDeleting(false)
      return
    }

    // DB 함수로 데이터 + auth.users 완전 삭제
    const { error: rpcError } = await supabase.rpc('delete_own_account')
    if (rpcError) {
      setDeleteError('탈퇴 처리 중 오류가 발생했습니다.')
      setDeleting(false)
      return
    }

    await signOut()
    setDeleting(false)
    navigate('/login')
  }

  // Day cell status color
  const getDayCellStyle = (dateStr: string, startDateStr: string, payment?: PaymentRequest) => {
    const today = toDateStr(new Date())
    const cellDate = new Date(dateStr)
    const startDate = new Date(startDateStr)
    cellDate.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)

    const isToday = dateStr === today
    const isPast = cellDate < new Date(today)
    const isBeforeStart = cellDate < startDate

    if (isBeforeStart) return 'bg-slate-800/50 text-slate-600 cursor-default'
    if (payment?.status === 'transferred') return `bg-success/20 text-success ring-1 ring-success/30 ${isToday ? 'ring-2 ring-success' : ''}`
    if (payment?.status === 'confirmed') return `bg-accent/20 text-accent ring-1 ring-accent/30 ${isToday ? 'ring-2 ring-accent' : ''}`
    if (payment?.status === 'requested') return `bg-gold/20 text-gold ring-1 ring-gold/30 ${isToday ? 'ring-2 ring-gold' : ''}`
    if (isToday) return 'bg-white/10 text-white ring-2 ring-white/50 font-bold'
    if (isPast) return 'bg-slate-700/30 text-slate-500'
    return 'bg-surface-light/50 text-slate-400'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
        </div>
      </Layout>
    )
  }

  const todayStr = toDateStr(new Date())

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">내 대시보드</h1>
            <p className="text-sm text-slate-400 mt-1">총 {investments.length}건 참여</p>
          </div>
          <Link
            to="/participate"
            className="px-6 py-2.5 rounded-xl bg-gold text-primary font-bold hover:bg-gold-hover transition-colors no-underline text-sm"
          >
            + 추가 참여
          </Link>
        </div>

        {message && (
          <div className={`rounded-lg p-4 mb-6 text-sm ${
            message.type === 'success' ? 'bg-success/10 border border-success/30 text-success' : 'bg-danger/10 border border-danger/30 text-danger'
          }`}>
            {message.text}
          </div>
        )}

        {investments.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 border border-surface-light text-center">
            <p className="text-slate-400 mb-4">아직 도시참여 내역이 없습니다.</p>
            <Link to="/participate" className="text-gold hover:underline font-medium">도시참여 시작하기</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/10 ring-2 ring-white/50"></span> 오늘</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold/20 ring-1 ring-gold/30"></span> 대기중</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-accent/20 ring-1 ring-accent/30"></span> 확인됨</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/20 ring-1 ring-success/30"></span> 송금완료</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700/30"></span> 미청구</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-800/50"></span> 시작 전</span>
            </div>

            {investments.map((inv, idx) => {
              const todayPay = getPaymentForDate(inv.id, todayStr)
              const isExpanded = expandedInv === inv.id
              const months = generate12Months(inv.start_date)
              const startDate = new Date(inv.start_date)
              const canPay = inv.status === 'active' && new Date(todayStr) >= startDate

              // Stats
              const invPayments = payments.filter(p => p.investment_id === inv.id)
              const transferred = invPayments.filter(p => p.status === 'transferred').length
              const totalEarned = transferred * inv.daily_payment
              return (
                <div key={inv.id} className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-surface-light/30 transition-colors"
                    onClick={() => setExpandedInv(isExpanded ? null : inv.id)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 font-medium">#{idx + 1}</span>
                          <span className="text-xl font-bold text-gold">{formatKRW(inv.amount)}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            inv.status === 'active' ? 'bg-success/20 text-success' : 'bg-surface-light text-slate-400'
                          }`}>
                            {inv.status === 'active' ? '활성' : inv.status}
                          </span>
                          <span className="text-slate-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          일일: <span className="text-success font-medium">{inv.daily_payment.toLocaleString()}원</span>
                          &nbsp;&middot;&nbsp;시작: {inv.start_date}
                          &nbsp;&middot;&nbsp;계좌: {inv.bank_name} ({inv.account_holder})
                        </p>
                      </div>
                      <div className="flex gap-4 text-right text-sm">
                        <div>
                          <p className="text-slate-500">수령 횟수</p>
                          <p className="text-lg font-bold text-white">{transferred}일</p>
                        </div>
                        <div>
                          <p className="text-slate-500">누적 이자</p>
                          <p className="text-lg font-bold text-success">{totalEarned.toLocaleString()}원</p>
                        </div>
                      </div>
                    </div>

                    {/* 지급 요청 & 상태 */}
                    <div className="mt-4 pt-3 border-t border-surface-light" onClick={e => e.stopPropagation()}>
                      {!canPay ? (
                        <p className="text-sm text-slate-500 text-center">
                          지급 시작일 전 ({inv.start_date} 부터 지급 가능)
                        </p>
                      ) : !todayPay ? (
                        <button
                          onClick={() => requestPayment(inv)}
                          disabled={requestingId === inv.id}
                          className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors bg-success text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          {requestingId === inv.id ? '요청 중...' : '오늘 지급 요청'}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              todayPay.status === 'transferred' ? 'bg-success' :
                              todayPay.status === 'confirmed' ? 'bg-accent' : 'bg-gold animate-pulse'
                            }`} />
                            <span className={`text-sm font-medium ${
                              todayPay.status === 'transferred' ? 'text-success' :
                              todayPay.status === 'confirmed' ? 'text-accent' : 'text-gold'
                            }`}>
                              {todayPay.status === 'transferred' ? '송금 완료' :
                               todayPay.status === 'confirmed' ? '관리자 확인됨 · 송금 대기중' : '지급 요청됨 · 관리자 확인 대기중'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {todayPay.is_same_day ? '당일 송금' : '익일 송금'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 12-Month Schedule (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-surface-light p-4 sm:p-5 bg-primary/30">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">12개월 지급 스케줄</h3>
                      <div className="space-y-3">
                        {months.map(({ year, month, label }) => {
                          const daysInMonth = getDaysInMonth(year, month)
                          return (
                            <div key={label}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-medium text-slate-400 w-20 flex-shrink-0">{label}</span>
                                <div className="flex-1 h-px bg-surface-light"></div>
                              </div>
                              <div className="grid grid-cols-[repeat(31,1fr)] gap-[2px]">
                                {Array.from({ length: 31 }, (_, i) => {
                                  const day = i + 1
                                  if (day > daysInMonth) {
                                    return <div key={i} className="aspect-square" />
                                  }
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                  const payment = getPaymentForDate(inv.id, dateStr)
                                  const cellStyle = getDayCellStyle(dateStr, inv.start_date, payment)

                                  return (
                                    <div
                                      key={i}
                                      title={`${dateStr}${payment ? ` (${payment.status === 'transferred' ? '송금완료' : payment.status === 'confirmed' ? '확인됨' : '대기중'})` : ''}`}
                                      className={`aspect-square rounded-[3px] flex items-center justify-center text-[9px] sm:text-[10px] ${cellStyle}`}
                                    >
                                      {day}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Monthly summary */}
                      <div className="mt-5 pt-4 border-t border-surface-light">
                        <h4 className="text-xs font-semibold text-slate-400 mb-3">월별 수령 현황</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {months.map(({ year, month, label }) => {
                            const monthPayments = payments.filter(p => {
                              if (p.investment_id !== inv.id) return false
                              const d = new Date(p.request_date)
                              return d.getFullYear() === year && d.getMonth() === month
                            })
                            const monthTransferred = monthPayments.filter(p => p.status === 'transferred').length
                            const monthTotal = monthTransferred * inv.daily_payment

                            return (
                              <div key={label} className="bg-surface rounded-lg p-2 text-center">
                                <p className="text-[10px] text-slate-500">{label}</p>
                                <p className="text-xs font-bold text-white">{monthTransferred}일</p>
                                <p className="text-[10px] text-success">{monthTotal > 0 ? `${monthTotal.toLocaleString()}원` : '-'}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {/* 회원탈퇴 */}
        <div className="mt-12 pt-8 border-t border-surface-light text-center">
          <button
            onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError('') }}
            className="text-xs text-slate-500 hover:text-danger transition-colors"
          >
            회원탈퇴
          </button>
        </div>
      </div>

      {/* 회원탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-surface-light max-w-sm w-full">
            <h3 className="text-lg font-bold text-danger mb-3">회원 탈퇴</h3>
            <p className="text-sm text-slate-400 mb-4">
              탈퇴하시면 모든 투자 내역과 지급 기록이 삭제되며 복구할 수 없습니다.
            </p>

            {deleteError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{deleteError}</div>
            )}

            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-danger transition-colors"
                placeholder="현재 비밀번호 입력"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-light text-slate-300 hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-danger text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
