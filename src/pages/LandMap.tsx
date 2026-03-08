import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import CityMap from '../components/CityMap'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Land, LandGrade } from '../types/land'
import { GRADES, GRADE_CONFIG, getGrade, getPrice, formatOwniaPrice, getAllGradeCounts } from '../utils/gridAllocation'

const gradeCounts = getAllGradeCounts()

export default function LandMap() {
  const { user } = useAuth()
  const [lands, setLands] = useState<Land[]>([])
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null)
  const [selectedLand, setSelectedLand] = useState<Land | undefined>()
  const [myLands, setMyLands] = useState<Land[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gradeFilter, setGradeFilter] = useState<LandGrade | 'all'>('all')
  const [showMyLands, setShowMyLands] = useState(false)

  // 판매된 토지만 DB에서 로드 (available은 프론트에서 계산)
  const fetchLands = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('lands')
      .select('*')
      .neq('status', 'available')

    if (error) {
      console.error('Failed to fetch lands:', error)
    } else {
      setLands(data || [])
    }

    // 내 토지 로드
    if (user) {
      const { data: myData } = await supabase
        .from('lands')
        .select('*')
        .eq('owner_id', user.id)
      setMyLands(myData || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchLands()
  }, [fetchLands])

  const handleCellClick = useCallback((x: number, y: number, land?: Land) => {
    setSelectedCell({ x, y })
    setSelectedLand(land)
    setMessage(null)
  }, [])

  // 구매 실행
  const handlePurchase = async () => {
    if (!selectedCell || !user) return
    const { x, y } = selectedCell

    // 이미 판매된 토지인지 확인
    if (selectedLand?.status === 'sold') {
      setMessage({ type: 'error', text: '이미 판매된 토지입니다.' })
      return
    }

    setPurchasing(true)
    setMessage(null)

    try {
      const grade = getGrade(x, y)
      const price = getPrice(grade)

      // DB에 토지 레코드가 있는지 확인 (seed 데이터)
      const { data: existing } = await supabase
        .from('lands')
        .select('id, status')
        .eq('grid_x', x)
        .eq('grid_y', y)
        .single()

      if (existing?.status === 'sold') {
        setMessage({ type: 'error', text: '이미 판매된 토지입니다.' })
        setPurchasing(false)
        setShowPurchaseModal(false)
        return
      }

      if (existing) {
        // 기존 레코드 업데이트
        const { error } = await supabase
          .from('lands')
          .update({
            owner_id: user.id,
            status: 'sold',
            purchased_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) throw error

        // 거래 이력 삽입
        await supabase.from('land_transactions').insert({
          land_id: existing.id,
          buyer_id: user.id,
          price,
          grid_x: x,
          grid_y: y,
          grade,
        })
      } else {
        // seed 데이터가 없는 경우 새 레코드 삽입
        const { data: newLand, error } = await supabase
          .from('lands')
          .insert({
            grid_x: x,
            grid_y: y,
            grade,
            price,
            owner_id: user.id,
            status: 'sold',
            purchased_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        if (newLand) {
          await supabase.from('land_transactions').insert({
            land_id: newLand.id,
            buyer_id: user.id,
            price,
            grid_x: x,
            grid_y: y,
            grade,
          })
        }
      }

      setMessage({ type: 'success', text: `토지 (${x}, ${y}) 구매가 완료되었습니다!` })
      setShowPurchaseModal(false)
      await fetchLands()
    } catch (err) {
      console.error('Purchase failed:', err)
      setMessage({ type: 'error', text: '구매 중 오류가 발생했습니다. 다시 시도해주세요.' })
    } finally {
      setPurchasing(false)
    }
  }

  // 선택된 셀 정보
  const selectedGrade = selectedCell ? (selectedLand?.grade || getGrade(selectedCell.x, selectedCell.y)) as LandGrade : null
  const selectedPrice = selectedGrade ? getPrice(selectedGrade) : 0
  const selectedStatus = selectedLand?.status || 'available'
  const isMyLand = selectedLand?.owner_id === user?.id

  // 통계
  const soldCount = lands.filter(l => l.status === 'sold').length
  const totalCells = 10_000

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="text-gold">OWNIA</span> 도시맵
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            가상 도시의 토지를 탐색하고 구매하세요 · {soldCount.toLocaleString()}/{totalCells.toLocaleString()} 판매됨
          </p>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg border text-sm ${
            message.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            {message.text}
          </div>
        )}

        {/* 메인 레이아웃 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 맵 영역 */}
          <div className="flex-1 min-w-0">
            <CityMap
              lands={lands}
              selectedCell={selectedCell}
              onCellClick={handleCellClick}
              className="h-[600px] lg:h-[700px]"
            />
          </div>

          {/* 사이드바 */}
          <div className="w-full lg:w-80 space-y-4">
            {/* 선택된 셀 정보 */}
            {selectedCell && selectedGrade ? (
              <div className="bg-surface rounded-2xl p-5 border border-surface-light">
                <h3 className="text-lg font-bold mb-3">선택된 토지</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">좌표</span>
                    <span className="text-sm font-mono">({selectedCell.x}, {selectedCell.y})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">등급</span>
                    <span className="text-sm font-bold px-2 py-0.5 rounded" style={{ backgroundColor: GRADE_CONFIG[selectedGrade].color + '20', color: GRADE_CONFIG[selectedGrade].color }}>
                      {GRADE_CONFIG[selectedGrade].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">가격</span>
                    <span className="text-sm font-bold text-gold">{formatOwniaPrice(selectedPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">상태</span>
                    <span className={`text-sm font-medium ${selectedStatus === 'sold' ? 'text-danger' : 'text-success'}`}>
                      {selectedStatus === 'sold' ? '판매완료' : '구매가능'}
                    </span>
                  </div>
                  {isMyLand && (
                    <div className="mt-2 px-3 py-2 bg-gold/10 border border-gold/30 rounded-lg text-xs text-gold text-center">
                      내가 소유한 토지
                    </div>
                  )}
                </div>

                {selectedStatus === 'available' && (
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="mt-4 w-full py-3 rounded-xl bg-gold text-primary font-bold text-sm hover:bg-gold-hover transition-colors shadow-lg shadow-gold/20"
                  >
                    구매하기
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-surface rounded-2xl p-5 border border-surface-light text-center">
                <p className="text-slate-400 text-sm">맵에서 토지를 클릭하여<br />상세 정보를 확인하세요</p>
              </div>
            )}

            {/* 등급별 가격표 */}
            <div className="bg-surface rounded-2xl p-5 border border-surface-light">
              <h3 className="text-sm font-bold mb-3 text-slate-300">등급별 정보</h3>
              <div className="space-y-2">
                {GRADES.map(g => {
                  const soldInGrade = lands.filter(l => l.grade === g && l.status === 'sold').length
                  return (
                    <div key={g} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRADE_CONFIG[g].color }} />
                        <span className="text-slate-300">{GRADE_CONFIG[g].label}</span>
                        <span className="text-xs text-slate-500 ml-1 hidden sm:inline">{GRADE_CONFIG[g].subtitle}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gold font-medium">{GRADE_CONFIG[g].price.toLocaleString()}</span>
                        <span className="text-slate-500 text-xs ml-1">({soldInGrade}/{gradeCounts[g]})</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 내 토지 목록 */}
            {myLands.length > 0 && (
              <div className="bg-surface rounded-2xl p-5 border border-surface-light">
                <button
                  onClick={() => setShowMyLands(!showMyLands)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-bold text-slate-300">
                    내 토지 ({myLands.length}개)
                  </h3>
                  <span className="text-slate-400 text-xs">{showMyLands ? '접기' : '펼치기'}</span>
                </button>
                {showMyLands && (
                  <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                    {myLands.map(land => (
                      <button
                        key={land.id}
                        onClick={() => handleCellClick(land.grid_x, land.grid_y, land)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-light/50 hover:bg-surface-light transition-colors text-left"
                      >
                        <span className="text-xs font-mono text-slate-300">({land.grid_x}, {land.grid_y})</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: GRADE_CONFIG[land.grade as LandGrade].color + '20', color: GRADE_CONFIG[land.grade as LandGrade].color }}>
                          {GRADE_CONFIG[land.grade as LandGrade].label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 필터 */}
            <div className="bg-surface rounded-2xl p-5 border border-surface-light">
              <h3 className="text-sm font-bold mb-3 text-slate-300">필터</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setGradeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${gradeFilter === 'all' ? 'bg-accent text-white' : 'bg-surface-light text-slate-400 hover:text-white'}`}
                >
                  전체
                </button>
                {GRADES.map(g => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${gradeFilter === g ? 'text-white' : 'bg-surface-light text-slate-400 hover:text-white'}`}
                    style={gradeFilter === g ? { backgroundColor: GRADE_CONFIG[g].color } : undefined}
                  >
                    {GRADE_CONFIG[g].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 구매 확인 모달 */}
      {showPurchaseModal && selectedCell && selectedGrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPurchaseModal(false)} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-md border border-surface-light shadow-2xl">
            <h2 className="text-xl font-bold mb-4">토지 구매 확인</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-surface-light">
                <span className="text-sm text-slate-400">좌표</span>
                <span className="text-sm font-mono font-bold">({selectedCell.x}, {selectedCell.y})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-light">
                <span className="text-sm text-slate-400">등급</span>
                <span className="text-sm font-bold" style={{ color: GRADE_CONFIG[selectedGrade].color }}>
                  {GRADE_CONFIG[selectedGrade].label}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-light">
                <span className="text-sm text-slate-400">가격</span>
                <span className="text-sm font-bold text-gold">{formatOwniaPrice(selectedPrice)}</span>
              </div>
            </div>

            <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg mb-6">
              <p className="text-xs text-gold leading-relaxed">
                구매 후 취소가 불가합니다. 토지 좌표와 등급을 다시 한번 확인해주세요.
                향후 NFT로 발행되어 거래가 가능해질 예정입니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface-light text-slate-300 font-medium text-sm hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 py-3 rounded-xl bg-gold text-primary font-bold text-sm hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    처리 중...
                  </span>
                ) : '구매 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
