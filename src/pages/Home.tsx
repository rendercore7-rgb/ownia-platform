import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center relative">
          <div className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
            The Future of Social-Fi &mdash; Grand Opening 2027
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            당신의 일상이<br />
            <span className="text-gold">자산</span>이 되는 도시
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AI 기반 가상 디지털 도시형 소셜 경제 플랫폼<br />
            소비가 도시의 지분이 되는 곳, OWNIA
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/participate"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gold text-primary font-bold text-lg hover:bg-gold-hover transition-colors no-underline shadow-lg shadow-gold/20"
            >
              도시참여
            </Link>
            <Link
              to="/land-map"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-accent text-white font-bold text-lg hover:bg-accent-hover transition-colors no-underline shadow-lg shadow-accent/20"
            >
              도시맵 탐색
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-surface border border-surface-light text-white font-semibold text-lg hover:bg-surface-light transition-colors no-underline"
            >
              내 대시보드
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Slogan Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-sm text-gold font-medium tracking-widest uppercase mb-3">Brand Philosophy</p>
          <h2 className="text-2xl sm:text-3xl font-bold">OWNIA가 만드는 새로운 경제</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-gold/30 transition-colors">
            <p className="text-gold font-bold text-lg mb-3 leading-snug">
              "Own Your Life,<br />AI Rules Your Wealth"
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              사용자에게 단순 참여자가 아닌 '자산가'로서의 정체성을 부여합니다. AI가 자산 관리의 복잡성을 대행하여 수익을 극대화합니다.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-accent/30 transition-colors">
            <p className="text-accent font-bold text-lg mb-3 leading-snug">
              "당신의 소비가<br />도시의 지분이 되는 곳"
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              '소비=소멸'이라는 기존 경제 관념을 '소비=지분 확보'로 재정의합니다. 사용자 행동 데이터의 가치를 리코모디타이제이션하여 플랫폼 리텐션을 극대화합니다.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-success/30 transition-colors">
            <p className="text-success font-bold text-lg mb-3 leading-snug">
              "Intelligence Architecture,<br />Personal Asset"
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              플랫폼의 접미사(-ia)를 기술적(IA) 가치와 결합하여, 지능형 아키텍처가 곧 개인의 수익성 자산임을 직관적으로 전달합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-gold/30 transition-colors">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">디지털 부동산</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              토큰화된 도시 자산을 분할 소유하여 핵심 입지의 지분을 보유하고 수익을 창출합니다.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-accent/30 transition-colors">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI 자산 관리</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              지능형 아키텍처가 자산 포트폴리오를 분석하고 수익을 자동으로 최적화합니다.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-success/30 transition-colors">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">거대 경제 플랫폼</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              OWNIA는 단순한 메타버스를 넘어 부동산, 광고, 문화 엔터테인먼트 산업이 AI 기술과 결합하여 시너지를 내는 거대 경제 플랫폼으로 진화합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-surface via-surface to-surface-light rounded-2xl p-8 sm:p-12 border border-surface-light">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-accent font-medium tracking-widest uppercase mb-3">Core Philosophy</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">데이터 가치 재순환과 윤리적 타당성</h2>
            <p className="text-slate-400 leading-relaxed text-base">
              OWNIA의 핵심 철학은 <span className="text-white font-medium">'데이터 주권의 온전한 회복'</span>에 있습니다.
              사용자의 광고 시청, 이동 경로, 소비 패턴은 플랫폼의 자본이 아닌 사용자의 <span className="text-gold font-medium">'기여분'</span>으로 산정됩니다.
              이는 빅테크에 집중되었던 데이터 잉여 가치를 생산자인 사용자에게 되돌려준다는 점에서
              <span className="text-success font-medium"> 경제적 지속 가능성</span>과 <span className="text-accent font-medium">윤리적 타당성</span>을 동시에 확보합니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-surface to-surface-light rounded-2xl p-8 sm:p-12 text-center border border-surface-light">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Own your Digital District<br />
            <span className="text-gold">before the 2027 Grand Opening</span>
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            지금 도시에 참여하고 매일 수익을 받으세요.<br />
            500만원부터 참여 가능합니다.
          </p>
          <Link
            to="/participate"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-gold text-primary font-bold text-lg hover:bg-gold-hover transition-colors no-underline shadow-lg shadow-gold/20"
          >
            도시참여 시작하기
          </Link>
        </div>
      </section>
    </Layout>
  )
}
