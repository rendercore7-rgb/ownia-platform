import { useRef, useEffect } from 'react'
import type { Land } from '../types/land'
import { GRID_SIZE, getGrade, GRADE_CONFIG } from '../utils/gridAllocation'

interface GridHeatmapProps {
  lands: Land[]
  size?: number
}

export default function GridHeatmap({ lands, size = 400 }: GridHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cellSize = size / GRID_SIZE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)

    // 판매된 토지 맵
    const soldMap = new Map<string, Land>()
    for (const land of lands) {
      if (land.status === 'sold') {
        soldMap.set(`${land.grid_x},${land.grid_y}`, land)
      }
    }

    // 배경 그리드 (등급 색상, 투명하게)
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const grade = getGrade(x, y)
        ctx.fillStyle = GRADE_CONFIG[grade].color + '20' // 매우 투명한 등급 색상
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }

    // 판매된 셀 히트맵 (빨간색 강도)
    for (const land of lands) {
      if (land.status === 'sold') {
        // 등급에 따라 히트맵 강도 조정
        const gradeIntensity: Record<string, number> = { S: 1.0, A: 0.85, B: 0.7, C: 0.55, D: 0.4 }
        const intensity = gradeIntensity[land.grade] || 0.5
        ctx.fillStyle = `rgba(239, 68, 68, ${intensity})` // danger red
        ctx.fillRect(land.grid_x * cellSize, land.grid_y * cellSize, cellSize, cellSize)
      }
    }

    ctx.setLineDash([])
  }, [lands, size, cellSize])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl border border-surface-light"
    />
  )
}
