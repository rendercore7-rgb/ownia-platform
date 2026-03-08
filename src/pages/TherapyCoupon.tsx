import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function TherapyCoupon() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 뒤로가기 */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 no-underline">
          ← 대시보드로 돌아가기
        </Link>

        {/* 쿠폰 배지 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold/20 text-gold border border-gold/30 tracking-wider">
            체험쿠폰 1매
          </span>
          <span className="text-xs text-slate-500">OWNIA 회원 전용 혜택</span>
        </div>

        {/* 타이틀 */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
          최고의 테라피 체험
        </h1>
        <p className="text-lg text-slate-400 mb-10">
          몸과 마음을 되살리는 프리미엄 웰니스 경험
        </p>

        {/* 제품 소개 */}
        <section className="bg-surface rounded-2xl border border-surface-light p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold text-gold mb-4">제품 소개</h2>
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
            <p>
              이곳에 제품 소개 내용을 입력해 주세요.<br />
              제품의 주요 특징, 성분, 효능 등을 상세히 설명할 수 있습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                { label: '주요 성분', value: '준비 중' },
                { label: '용량 / 규격', value: '준비 중' },
                { label: '제조사', value: '준비 중' },
              ].map(item => (
                <div key={item.label} className="bg-primary/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 테라피 설명 */}
        <section className="bg-surface rounded-2xl border border-surface-light p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold text-accent mb-4">테라피 설명</h2>
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
            <p>
              이곳에 테라피 프로그램 소개를 입력해 주세요.<br />
              테라피의 종류, 진행 방식, 소요 시간, 기대 효과 등을 안내할 수 있습니다.
            </p>
            <div className="space-y-3 mt-4">
              {[
                { step: '01', title: '테라피 단계 1', desc: '준비 중' },
                { step: '02', title: '테라피 단계 2', desc: '준비 중' },
                { step: '03', title: '테라피 단계 3', desc: '준비 중' },
              ].map(item => (
                <div key={item.step} className="flex gap-4 items-start bg-primary/30 rounded-xl p-4">
                  <span className="text-xs font-bold text-accent mt-0.5 w-6 flex-shrink-0">{item.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 쿠폰 사용 안내 */}
        <section className="bg-gold/10 rounded-2xl border border-gold/20 p-6 sm:p-8">
          <h2 className="text-sm font-bold text-gold mb-3">쿠폰 사용 안내</h2>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>• 본 쿠폰은 OWNIA 회원 전용 체험 혜택입니다.</li>
            <li>• 사용 방법 및 예약 문의는 별도 안내 예정입니다.</li>
            <li>• 자세한 내용은 준비 중입니다.</li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
