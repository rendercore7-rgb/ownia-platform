import type { LandGrade, LandStatus } from '../types/land'

export const GRID_SIZE = 100
export const CENTER = 50

// 등급별 설정 (Pioneer ~ Aether)
export const GRADE_CONFIG: Record<LandGrade, {
  label: string
  subtitle: string
  price: number
  color: string
  soldColor: string
}> = {
  Pioneer:  { label: 'Pioneer',  subtitle: '개척지 · 기본 농지',      price: 20,  color: '#78716c', soldColor: '#44403c' },
  Grove:    { label: 'Grove',    subtitle: '숲 · 주거 단지',           price: 200, color: '#22c55e', soldColor: '#14532d' },
  Luminous: { label: 'Luminous', subtitle: '빛나는 땅 · 상업 지역',    price: 400, color: '#3b82f6', soldColor: '#1e3a5f' },
  Apex:     { label: 'Apex',     subtitle: '정점의 땅 · 프리미엄',     price: 700, color: '#a855f7', soldColor: '#581c87' },
  Aether:   { label: 'Aether',   subtitle: '신화의 땅 · 랜드마크',     price: 900, color: '#f59e0b', soldColor: '#92600a' },
}

export const GRADES: LandGrade[] = ['Aether', 'Apex', 'Luminous', 'Grove', 'Pioneer']

/**
 * 결정론적 시드 해시 (x, y → 0~1 사이 고정값)
 * 같은 좌표는 항상 같은 등급을 반환
 */
function cellHash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

/**
 * 랜덤 산포 방식 등급 계산
 * Aether  ~500셀  (5%)
 * Apex    ~1000셀 (10%)
 * Luminous~2000셀 (20%)
 * Grove   ~3000셀 (30%)
 * Pioneer ~3500셀 (35%)
 */
export function getGrade(x: number, y: number): LandGrade {
  const r = cellHash(x, y)
  if (r < 0.05) return 'Aether'
  if (r < 0.15) return 'Apex'
  if (r < 0.35) return 'Luminous'
  if (r < 0.65) return 'Grove'
  return 'Pioneer'
}

/** 등급별 가격 */
export function getPrice(grade: LandGrade): number {
  return GRADE_CONFIG[grade].price
}

/** 셀 색상 (등급 + 상태) */
export function getCellColor(grade: LandGrade, status: LandStatus): string {
  if (status === 'sold') return GRADE_CONFIG[grade].soldColor
  return GRADE_CONFIG[grade].color
}

/** 등급별 셀 수 계산 */
export function getGradeCellCount(grade: LandGrade): number {
  let count = 0
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (getGrade(x, y) === grade) count++
    }
  }
  return count
}

/** 모든 등급의 셀 수 */
export function getAllGradeCounts(): Record<LandGrade, number> {
  return {
    Aether:   getGradeCellCount('Aether'),
    Apex:     getGradeCellCount('Apex'),
    Luminous: getGradeCellCount('Luminous'),
    Grove:    getGradeCellCount('Grove'),
    Pioneer:  getGradeCellCount('Pioneer'),
  }
}

/** 좌표 → 셀 라벨 */
export function getCellLabel(x: number, y: number): string {
  return `(${x}, ${y})`
}

/** 가격 포맷 */
export function formatOwniaPrice(price: number): string {
  return `$${price.toLocaleString()}`
}
