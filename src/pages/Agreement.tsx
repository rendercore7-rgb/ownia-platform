import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SignaturePad from '../components/SignaturePad'
import { useAuth } from '../context/AuthContext'

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

// 법인 정보
const COMPANY_NAME = '렌더코어에이아이주식회사'
const REPRESENTATIVE = 'AN JAE HYUN'
const BIZ_NUMBER = '527-88-03631'

export default function Agreement() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  const state = location.state as { amount: number; dailyPayment: number } | null
  if (!state) return <Navigate to="/participate" replace />

  const { amount, dailyPayment } = state
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() + 7)

  const handleNext = () => {
    if (!signatureData || !agreed) return
    navigate('/participate/bank-info', {
      state: { amount, dailyPayment, signatureData },
    })
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">차용증</h1>
          <p className="text-slate-400 mt-2">내용을 확인하고 전자서명해주세요</p>
        </div>

        {/* 차용증 문서 */}
        <div className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 mb-6 border shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6 border-b-2 border-gray-800 pb-4">
            차 용 증
          </h2>

          <div className="space-y-4 text-sm leading-relaxed">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <span className="font-semibold text-gray-600">차용 금액</span>
              <span className="font-bold text-lg">금 {amount.toLocaleString()}원 ({formatKRW(amount)})</span>

              <span className="font-semibold text-gray-600">일일 지급액</span>
              <span className="font-bold">{dailyPayment.toLocaleString()}원/일</span>

              <span className="font-semibold text-gray-600">지급 시작일</span>
              <span>{formatDate(startDate)} (참여일로부터 7일 후)</span>

              <span className="font-semibold text-gray-600">작성일</span>
              <span>{formatDate(today)}</span>
            </div>

            <hr className="my-4" />

            <p>
              위 금액을 아래 조건에 따라 차용하며, 본 차용증의 내용을 성실히 이행할 것을 확약합니다.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>제1조 (차용 목적)</strong> 본 차용금은 OWNIA 디지털 도시 경제 생태계 참여를 위한 것입니다.</p>
              <p><strong>제2조 (수익 지급)</strong> 차용자는 지급 시작일부터 매일 {dailyPayment.toLocaleString()}원을 대여자에게 지급합니다.</p>
              <p><strong>제3조 (지급 방식)</strong> 대여자가 지급 요청 시, 오후 12시 이전 요청은 당일, 12시 이후 요청은 익일에 대여자의 지정 계좌로 송금합니다.</p>
              <p><strong>제4조 (원금 반환)</strong> 차용 기간 종료 시 또는 대여자의 요청 시 원금을 반환합니다.</p>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-gray-600 mb-1">대여자 (채권자)</p>
                <p className="font-bold">{profile?.full_name || '(이름)'}</p>
              </div>
              <div className="flex items-start gap-4">
                <div>
                  <p className="font-semibold text-gray-600 mb-1">차용자 (채무자)</p>
                  <p className="font-bold">{COMPANY_NAME}</p>
                  <p className="text-gray-600">대표이사 {REPRESENTATIVE}</p>
                  <p className="text-gray-500 text-xs mt-0.5">사업자등록번호: {BIZ_NUMBER}</p>
                </div>
                {/* 법인 도장 */}
                <div className="flex-shrink-0 w-20 h-20 rounded-full border-[3px] border-red-600 flex flex-col items-center justify-center text-red-600 rotate-[-5deg] opacity-85 mt-1">
                  <span className="text-[8px] font-bold leading-tight tracking-tight">렌더코어에이아이</span>
                  <span className="text-[10px] font-black leading-tight">주식회사</span>
                  <div className="w-10 h-[1.5px] bg-red-600 my-[2px]"></div>
                  <span className="text-[7px] font-bold leading-tight">대표이사 인</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 전자서명 */}
        <div className="bg-surface rounded-2xl p-6 border border-surface-light mb-6">
          <h3 className="font-semibold mb-3">전자서명</h3>
          <p className="text-sm text-slate-400 mb-4">아래 영역에 서명해주세요 (마우스 또는 터치)</p>
          <SignaturePad onSave={setSignatureData} />
          {signatureData && (
            <p className="text-sm text-success mt-2">서명이 완료되었습니다.</p>
          )}
        </div>

        {/* 동의 체크박스 */}
        <label className="flex items-start gap-3 bg-surface rounded-xl p-4 border border-surface-light mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded accent-gold"
          />
          <span className="text-sm text-slate-300 leading-relaxed">
            본 차용증의 내용을 모두 확인하였으며, 위 조건에 동의하고 전자서명합니다.
          </span>
        </label>

        <button
          onClick={handleNext}
          disabled={!signatureData || !agreed}
          className="w-full py-4 rounded-xl bg-gold text-primary font-bold text-lg hover:bg-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gold/20"
        >
          다음 단계: 계좌 정보 입력
        </button>
      </div>
    </Layout>
  )
}
