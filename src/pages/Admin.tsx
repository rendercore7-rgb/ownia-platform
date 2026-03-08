import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import GridHeatmap from '../components/GridHeatmap'
import { supabase } from '../lib/supabase'
import type { Land, LandTransaction, GridStats, LandGrade } from '../types/land'
import { GRADES, GRADE_CONFIG, getAllGradeCounts, formatOwniaPrice } from '../utils/gridAllocation'

const ADMIN_PASSWORD = 'ownia2027!@#'

interface InvestmentWithProfile {
  id: string
  amount: number
  daily_payment: number
  bank_name: string
  account_number: string
  account_holder: string
  status: string
  start_date: string
  created_at: string
  profiles: { full_name: string; phone: string | null } | null
}

interface PaymentRequestWithProfile {
  id: string
  investment_id: string
  request_date: string
  request_time: string
  is_same_day: boolean
  status: string
  admin_confirmed_at: string | null
  transferred_at: string | null
  created_at: string
  profiles: { full_name: string } | null
  investments: { amount: number; daily_payment: number; bank_name: string; account_number: string; account_holder: string } | null
}

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

interface MemberProfile {
  id: string
  full_name: string
  phone: string | null
  is_admin: boolean
  is_approved: boolean
  created_at: string
}

type Tab = 'payments' | 'investments' | 'members' | 'lands'
type PaymentFilter = 'all' | 'requested' | 'confirmed' | 'transferred'

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [tab, setTab] = useState<Tab>('payments')
  const [investments, setInvestments] = useState<InvestmentWithProfile[]>([])
  const [payments, setPayments] = useState<PaymentRequestWithProfile[]>([])
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [loading, setLoading] = useState(false)
  const [landData, setLandData] = useState<Land[]>([])
  const [landTransactions, setLandTransactions] = useState<LandTransaction[]>([])
  const [landStats, setLandStats] = useState<GridStats[]>([])

  // Check session storage for admin auth
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('ownia_admin_auth')
    if (adminAuth === 'true') {
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      setLoading(true)
      fetchData()
    }
  }, [authenticated])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('ownia_admin_auth', 'true')
      setAuthenticated(true)
      setPasswordError('')
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.')
    }
  }

  const fetchData = async () => {
    const [invRes, payRes, memRes, landsRes, landTxRes] = await Promise.all([
      supabase.from('investments').select('*, profiles(full_name, phone)').order('created_at', { ascending: false }),
      supabase.from('payment_requests').select('*, profiles(full_name), investments(amount, daily_payment, bank_name, account_number, account_holder)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lands').select('*').neq('status', 'available'),
      supabase.from('land_transactions').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20),
    ])
    if (invRes.data) setInvestments(invRes.data as unknown as InvestmentWithProfile[])
    if (payRes.data) setPayments(payRes.data as unknown as PaymentRequestWithProfile[])
    if (memRes.data) setMembers(memRes.data as MemberProfile[])
    if (landsRes.data) {
      const lands = landsRes.data as Land[]
      setLandData(lands)
      // 등급별 통계 계산
      const counts = getAllGradeCounts()
      const stats: GridStats[] = GRADES.map(g => {
        const soldInGrade = lands.filter(l => l.grade === g && l.status === 'sold')
        return {
          grade: g,
          total: counts[g],
          sold: soldInGrade.length,
          available: counts[g] - soldInGrade.length,
          revenue: soldInGrade.reduce((sum, l) => sum + l.price, 0),
        }
      })
      setLandStats(stats)
    }
    if (landTxRes.data) setLandTransactions(landTxRes.data as LandTransaction[])
    setLoading(false)
  }

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    const updates: Record<string, unknown> = { status }
    if (status === 'confirmed') updates.admin_confirmed_at = new Date().toISOString()
    if (status === 'transferred') updates.transferred_at = new Date().toISOString()

    await supabase.from('payment_requests').update(updates).eq('id', paymentId)
    fetchData()
  }

  const approveMember = async (memberId: string) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', memberId)
    if (error) {
      alert(`승인 실패: ${error.message}`)
    } else {
      alert('승인 완료')
    }
    fetchData()
  }

  const rejectMember = async (memberId: string) => {
    // 관련 데이터 삭제 후 auth.users도 삭제
    await supabase.from('payment_requests').delete().eq('user_id', memberId)
    await supabase.from('investments').delete().eq('user_id', memberId)
    await supabase.from('profiles').delete().eq('id', memberId)
    fetchData()
  }

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // 시트1: 투자 목록
    const invData = investments.map((inv, i) => ({
      '번호': i + 1,
      '회원명': inv.profiles?.full_name || '',
      '연락처': inv.profiles?.phone || '',
      '투자금액': inv.amount,
      '일일지급액': inv.daily_payment,
      '은행': inv.bank_name,
      '계좌번호': inv.account_number,
      '예금주': inv.account_holder,
      '시작일': inv.start_date,
      '상태': inv.status === 'active' ? '활성' : inv.status,
      '등록일': inv.created_at.split('T')[0],
    }))
    const ws1 = XLSX.utils.json_to_sheet(invData)
    ws1['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(wb, ws1, '투자목록')

    // 시트2: 지급 내역
    const payData = payments.map((pay, i) => ({
      '번호': i + 1,
      '회원명': pay.profiles?.full_name || '',
      '투자금액': pay.investments?.amount || 0,
      '지급액': pay.investments?.daily_payment || 0,
      '요청일': pay.request_date,
      '요청시간': pay.request_time,
      '당일/익일': pay.is_same_day ? '당일' : '익일',
      '상태': pay.status === 'transferred' ? '송금완료' : pay.status === 'confirmed' ? '확인됨' : '대기중',
      '승인일시': pay.admin_confirmed_at ? pay.admin_confirmed_at.replace('T', ' ').slice(0, 19) : '',
      '송금일시': pay.transferred_at ? pay.transferred_at.replace('T', ' ').slice(0, 19) : '',
      '계좌': `${pay.investments?.bank_name || ''} ${pay.investments?.account_number || ''}`,
      '예금주': pay.investments?.account_holder || '',
    }))
    const ws2 = XLSX.utils.json_to_sheet(payData)
    ws2['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, ws2, '지급내역')

    // 시트3: 회원 요약
    const memberMap = new Map<string, { name: string; phone: string; count: number; total: number }>()
    investments.forEach(inv => {
      const name = inv.profiles?.full_name || '미확인'
      const existing = memberMap.get(name)
      if (existing) {
        existing.count++
        existing.total += inv.amount
      } else {
        memberMap.set(name, { name, phone: inv.profiles?.phone || '', count: 1, total: inv.amount })
      }
    })
    const memberData = Array.from(memberMap.values()).map((m, i) => ({
      '번호': i + 1,
      '회원명': m.name,
      '연락처': m.phone,
      '투자건수': m.count,
      '총투자액': m.total,
    }))
    const ws3 = XLSX.utils.json_to_sheet(memberData)
    ws3['!cols'] = [{ wch: 5 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws3, '회원요약')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `OWNIA_관리_${today}.xlsx`)
  }

  const filteredPayments = paymentFilter === 'all'
    ? payments
    : payments.filter(p => p.status === paymentFilter)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'payments', label: '지급 관리' },
    { key: 'investments', label: '투자 목록' },
    { key: 'members', label: '회원 관리' },
    { key: 'lands', label: '토지 관리' },
  ]

  const filterButtons: { key: PaymentFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'requested', label: '대기중' },
    { key: 'confirmed', label: '확인됨' },
    { key: 'transferred', label: '송금완료' },
  ]

  // Password Gate
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">
              <span className="text-gold">OWN</span>
              <span className="text-white">iA</span>
              <span className="text-slate-400 text-lg ml-2">Admin</span>
            </h1>
          </div>
          <form onSubmit={handlePasswordSubmit} className="bg-surface rounded-2xl p-6 sm:p-8 border border-surface-light space-y-5">
            <h2 className="text-lg font-semibold text-center text-slate-300">관리자 인증</h2>

            {passwordError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">{passwordError}</div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1">관리자 비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                placeholder="비밀번호 입력"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gold text-primary font-bold hover:bg-gold-hover transition-colors"
            >
              접속
            </button>
          </form>
        </div>
      </div>
    )
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">관리자 대시보드</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="text-sm px-3 py-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              엑셀 다운로드
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('ownia_admin_auth'); setAuthenticated(false) }}
              className="text-sm px-3 py-1.5 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
            >
              관리자 로그아웃
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-surface rounded-xl p-4 border border-surface-light">
            <p className="text-sm text-slate-400">총 투자</p>
            <p className="text-xl font-bold text-gold">{investments.length}건</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface-light">
            <p className="text-sm text-slate-400">총 투자액</p>
            <p className="text-xl font-bold text-white">{formatKRW(investments.reduce((s, i) => s + i.amount, 0))}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface-light">
            <p className="text-sm text-slate-400">대기중 지급</p>
            <p className="text-xl font-bold text-gold">{payments.filter(p => p.status === 'requested').length}건</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface-light">
            <p className="text-sm text-slate-400">오늘 송금</p>
            <p className="text-xl font-bold text-success">
              {payments.filter(p => p.status === 'transferred' && p.transferred_at?.startsWith(new Date().toISOString().split('T')[0])).length}건
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-surface-light">
            <p className="text-sm text-slate-400">가입 대기</p>
            <p className="text-xl font-bold text-gold">{members.filter(m => !m.is_approved && !m.is_admin).length}명</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-surface-light mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Payment Management Tab */}
        {tab === 'payments' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {filterButtons.map(f => (
                <button
                  key={f.key}
                  onClick={() => setPaymentFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    paymentFilter === f.key ? 'bg-accent text-white' : 'bg-surface-light text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredPayments.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">해당하는 지급 요청이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map(pay => (
                  <div key={pay.id} className="bg-surface rounded-xl p-4 border border-surface-light">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{pay.profiles?.full_name}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            pay.is_same_day ? 'bg-success/20 text-success' : 'bg-gold/20 text-gold'
                          }`}>
                            {pay.is_same_day ? '당일 송금' : '익일 송금'}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            pay.status === 'requested' ? 'bg-gold/20 text-gold' :
                            pay.status === 'confirmed' ? 'bg-accent/20 text-accent' :
                            'bg-success/20 text-success'
                          }`}>
                            {pay.status === 'requested' ? '대기중' : pay.status === 'confirmed' ? '확인됨' : '송금완료'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          요청: {pay.request_date} {pay.request_time}
                          &nbsp;&middot;&nbsp;
                          금액: <span className="text-success">{pay.investments?.daily_payment.toLocaleString()}원</span>
                        </p>
                        <p className="text-sm text-slate-500">
                          계좌: {pay.investments?.bank_name} {pay.investments?.account_number} ({pay.investments?.account_holder})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {pay.status === 'requested' && (
                          <button
                            onClick={() => updatePaymentStatus(pay.id, 'confirmed')}
                            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
                          >
                            승인
                          </button>
                        )}
                        {(pay.status === 'requested' || pay.status === 'confirmed') && (
                          <button
                            onClick={() => updatePaymentStatus(pay.id, 'transferred')}
                            className="px-4 py-2 rounded-lg bg-success text-white text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            송금 완료
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Investments Tab */}
        {tab === 'investments' && (
          <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-light text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">회원</th>
                    <th className="text-left px-4 py-3 font-medium">투자금액</th>
                    <th className="text-left px-4 py-3 font-medium">일일지급</th>
                    <th className="text-left px-4 py-3 font-medium">계좌</th>
                    <th className="text-left px-4 py-3 font-medium">시작일</th>
                    <th className="text-left px-4 py-3 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => (
                    <tr key={inv.id} className="border-b border-surface-light/50 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{inv.profiles?.full_name}</p>
                        <p className="text-xs text-slate-500">{inv.profiles?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gold font-medium">{formatKRW(inv.amount)}</td>
                      <td className="px-4 py-3 text-success">{inv.daily_payment.toLocaleString()}원</td>
                      <td className="px-4 py-3 text-slate-400">
                        {inv.bank_name} {inv.account_number}
                      </td>
                      <td className="px-4 py-3">{inv.start_date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'active' ? 'bg-success/20 text-success' : 'bg-surface-light text-slate-400'
                        }`}>
                          {inv.status === 'active' ? '활성' : inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {tab === 'members' && (
          <div>
            {/* 승인 대기 회원 */}
            {members.filter(m => !m.is_approved && !m.is_admin).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gold mb-3">승인 대기 ({members.filter(m => !m.is_approved && !m.is_admin).length}명)</h3>
                <div className="space-y-3">
                  {members.filter(m => !m.is_approved && !m.is_admin).map(m => (
                    <div key={m.id} className="bg-surface rounded-xl p-4 border border-gold/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{m.full_name}</p>
                          <p className="text-sm text-slate-400">{m.phone || '연락처 없음'}</p>
                          <p className="text-xs text-slate-500">가입: {m.created_at?.split('T')[0]}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveMember(m.id)}
                            className="px-4 py-2 rounded-lg bg-success text-white text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => { if (confirm(`${m.full_name} 회원을 거절하시겠습니까?`)) rejectMember(m.id) }}
                            className="px-4 py-2 rounded-lg bg-danger/20 text-danger text-sm font-medium hover:bg-danger/30 transition-colors"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 승인된 회원 목록 */}
            <h3 className="text-sm font-semibold text-slate-400 mb-3">승인된 회원 ({members.filter(m => m.is_approved && !m.is_admin).length}명)</h3>
            <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-light text-slate-400">
                      <th className="text-left px-4 py-3 font-medium">이름</th>
                      <th className="text-left px-4 py-3 font-medium">연락처</th>
                      <th className="text-left px-4 py-3 font-medium">투자 건수</th>
                      <th className="text-left px-4 py-3 font-medium">총 투자액</th>
                      <th className="text-left px-4 py-3 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.is_approved && !m.is_admin).map(m => {
                      const memberInvestments = investments.filter(i => i.profiles?.full_name === m.full_name)
                      const total = memberInvestments.reduce((s, i) => s + i.amount, 0)
                      return (
                        <tr key={m.id} className="border-b border-surface-light/50 last:border-0">
                          <td className="px-4 py-3 font-medium">{m.full_name}</td>
                          <td className="px-4 py-3 text-slate-400">{m.phone || '-'}</td>
                          <td className="px-4 py-3">{memberInvestments.length}건</td>
                          <td className="px-4 py-3 text-gold font-medium">{total > 0 ? formatKRW(total) : '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">승인</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Lands Tab */}
        {tab === 'lands' && (
          <div>
            {/* 토지 통계 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface rounded-xl p-4 border border-surface-light">
                <p className="text-sm text-slate-400">총 판매 토지</p>
                <p className="text-xl font-bold text-gold">{landData.filter(l => l.status === 'sold').length}필지</p>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-light">
                <p className="text-sm text-slate-400">총 수익</p>
                <p className="text-xl font-bold text-white">{formatOwniaPrice(landStats.reduce((s, st) => s + st.revenue, 0))}</p>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-light">
                <p className="text-sm text-slate-400">판매율</p>
                <p className="text-xl font-bold text-accent">
                  {landStats.length > 0 ? ((landStats.reduce((s, st) => s + st.sold, 0) / 10000 * 100).toFixed(1)) : '0'}%
                </p>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-light">
                <p className="text-sm text-slate-400">오늘 거래</p>
                <p className="text-xl font-bold text-success">
                  {landTransactions.filter(t => t.created_at.startsWith(new Date().toISOString().split('T')[0])).length}건
                </p>
              </div>
            </div>

            {/* 히트맵 + 등급 테이블 */}
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* 히트맵 */}
              <div className="bg-surface rounded-2xl p-5 border border-surface-light">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">판매 히트맵</h3>
                <GridHeatmap lands={landData} size={360} />
              </div>

              {/* 등급별 통계 테이블 */}
              <div className="flex-1 bg-surface rounded-2xl border border-surface-light overflow-hidden">
                <div className="p-4 border-b border-surface-light">
                  <h3 className="text-sm font-semibold text-slate-300">등급별 현황</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-light text-slate-400">
                        <th className="text-left px-4 py-3 font-medium">등급</th>
                        <th className="text-right px-4 py-3 font-medium">총 셀</th>
                        <th className="text-right px-4 py-3 font-medium">판매</th>
                        <th className="text-right px-4 py-3 font-medium">미판매</th>
                        <th className="text-right px-4 py-3 font-medium">판매율</th>
                        <th className="text-right px-4 py-3 font-medium">수익</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landStats.map(st => (
                        <tr key={st.grade} className="border-b border-surface-light/50 last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRADE_CONFIG[st.grade].color }} />
                              <span className="font-medium">{st.grade}</span>
                              <span className="text-xs text-slate-500">{GRADE_CONFIG[st.grade].label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300">{st.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gold font-medium">{st.sold.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{st.available.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-medium ${st.sold / st.total > 0.5 ? 'text-success' : 'text-slate-300'}`}>
                              {st.total > 0 ? (st.sold / st.total * 100).toFixed(1) : '0'}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gold font-medium">{formatOwniaPrice(st.revenue)}</td>
                        </tr>
                      ))}
                      <tr className="bg-surface-light/30">
                        <td className="px-4 py-3 font-bold">합계</td>
                        <td className="px-4 py-3 text-right font-bold">10,000</td>
                        <td className="px-4 py-3 text-right font-bold text-gold">{landStats.reduce((s, st) => s + st.sold, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-400">{landStats.reduce((s, st) => s + st.available, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          {(landStats.reduce((s, st) => s + st.sold, 0) / 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gold">{formatOwniaPrice(landStats.reduce((s, st) => s + st.revenue, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 최근 거래 내역 */}
            <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden">
              <div className="p-4 border-b border-surface-light">
                <h3 className="text-sm font-semibold text-slate-300">최근 거래 내역</h3>
              </div>
              {landTransactions.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">거래 내역이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-light text-slate-400">
                        <th className="text-left px-4 py-3 font-medium">구매자</th>
                        <th className="text-left px-4 py-3 font-medium">좌표</th>
                        <th className="text-left px-4 py-3 font-medium">등급</th>
                        <th className="text-right px-4 py-3 font-medium">가격</th>
                        <th className="text-left px-4 py-3 font-medium">일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landTransactions.map(tx => (
                        <tr key={tx.id} className="border-b border-surface-light/50 last:border-0">
                          <td className="px-4 py-3 font-medium">{tx.profiles?.full_name || '-'}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">({tx.grid_x}, {tx.grid_y})</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: GRADE_CONFIG[tx.grade as LandGrade]?.color + '20', color: GRADE_CONFIG[tx.grade as LandGrade]?.color }}>
                              {tx.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gold font-medium">{formatOwniaPrice(tx.price)}</td>
                          <td className="px-4 py-3 text-slate-400">{tx.created_at.replace('T', ' ').slice(0, 19)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
