import { useRef, useEffect, useCallback, useState } from 'react'
import type { Land, LandGrade } from '../types/land'
import { GRID_SIZE, getGrade, getCellColor, GRADE_CONFIG, GRADES, formatOwniaPrice, getPrice } from '../utils/gridAllocation'

interface CityMapProps {
  lands: Land[]
  selectedCell: { x: number; y: number } | null
  onCellClick: (x: number, y: number, land?: Land) => void
  onCellHover?: (x: number, y: number, land?: Land) => void
  className?: string
}

const CELL_SIZE = 8
const MIN_ZOOM = 0.5
const MAX_ZOOM = 6
const MINIMAP_SIZE = 120
const MINIMAP_CELL = MINIMAP_SIZE / GRID_SIZE // 1.2px

export default function CityMap({ lands, selectedCell, onCellClick, onCellHover, className }: CityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const minimapRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 뷰포트 상태 (ref로 관리하여 불필요한 리렌더 방지)
  const viewRef = useRef({ zoom: 1, offsetX: 0, offsetY: 0 })
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 })

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // 판매된 토지를 빠르게 조회하기 위한 맵
  const landMapRef = useRef<Map<string, Land>>(new Map())

  useEffect(() => {
    const map = new Map<string, Land>()
    for (const land of lands) {
      map.set(`${land.grid_x},${land.grid_y}`, land)
    }
    landMapRef.current = map
  }, [lands])

  const getLand = useCallback((x: number, y: number): Land | undefined => {
    return landMapRef.current.get(`${x},${y}`)
  }, [])

  // 메인 캔버스 렌더링
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { zoom, offsetX, offsetY } = viewRef.current
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(zoom, zoom)

    // 뷰포트 내 보이는 셀 범위 계산
    const startX = Math.max(0, Math.floor(-offsetX / (zoom * CELL_SIZE)))
    const startY = Math.max(0, Math.floor(-offsetY / (zoom * CELL_SIZE)))
    const endX = Math.min(GRID_SIZE, Math.ceil((w - offsetX) / (zoom * CELL_SIZE)))
    const endY = Math.min(GRID_SIZE, Math.ceil((h - offsetY) / (zoom * CELL_SIZE)))

    // 그리드 셀 렌더링
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const land = getLand(x, y)
        const grade = land?.grade as LandGrade || getGrade(x, y)
        const status = land?.status || 'available'
        const color = getCellColor(grade, status)

        ctx.fillStyle = color
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 0.5, CELL_SIZE - 0.5)

        // sold 셀 표시 (대각선 패턴)
        if (status === 'sold') {
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE)
          ctx.lineTo((x + 1) * CELL_SIZE - 0.5, (y + 1) * CELL_SIZE - 0.5)
          ctx.stroke()
        }
      }
    }

    // 선택된 셀 하이라이트
    if (selectedCell) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 / zoom
      ctx.strokeRect(
        selectedCell.x * CELL_SIZE - 1,
        selectedCell.y * CELL_SIZE - 1,
        CELL_SIZE + 1,
        CELL_SIZE + 1
      )
      // 바깥 글로우
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'
      ctx.lineWidth = 3 / zoom
      ctx.strokeRect(
        selectedCell.x * CELL_SIZE - 2,
        selectedCell.y * CELL_SIZE - 2,
        CELL_SIZE + 3,
        CELL_SIZE + 3
      )
    }

    // 호버 셀 하이라이트
    if (hoveredCell && (hoveredCell.x !== selectedCell?.x || hoveredCell.y !== selectedCell?.y)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5 / zoom
      ctx.strokeRect(
        hoveredCell.x * CELL_SIZE,
        hoveredCell.y * CELL_SIZE,
        CELL_SIZE - 0.5,
        CELL_SIZE - 0.5
      )
    }

    ctx.setLineDash([])

    ctx.restore()
  }, [getLand, selectedCell, hoveredCell])

  // 미니맵 렌더링
  const renderMinimap = useCallback(() => {
    const canvas = minimapRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

    // 전체 그리드 렌더링 (작은 크기)
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const land = getLand(x, y)
        const grade = land?.grade as LandGrade || getGrade(x, y)
        const status = land?.status || 'available'
        ctx.fillStyle = getCellColor(grade, status)
        ctx.fillRect(x * MINIMAP_CELL, y * MINIMAP_CELL, MINIMAP_CELL, MINIMAP_CELL)
      }
    }

    // 현재 뷰포트 영역 표시
    const { zoom, offsetX, offsetY } = viewRef.current
    const mainCanvas = canvasRef.current
    if (!mainCanvas) return

    const vpX = (-offsetX / zoom / CELL_SIZE) * MINIMAP_CELL
    const vpY = (-offsetY / zoom / CELL_SIZE) * MINIMAP_CELL
    const vpW = (mainCanvas.width / zoom / CELL_SIZE) * MINIMAP_CELL
    const vpH = (mainCanvas.height / zoom / CELL_SIZE) * MINIMAP_CELL

    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1.5
    ctx.strokeRect(vpX, vpY, vpW, vpH)
  }, [getLand])

  // 렌더 트리거
  useEffect(() => {
    render()
    renderMinimap()
  }, [render, renderMinimap, lands, zoom])

  // 캔버스 크기 조정
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      render()
      renderMinimap()
    })
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [render, renderMinimap])

  // 화면 좌표 → 그리드 좌표
  const screenToGrid = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const { zoom, offsetX, offsetY } = viewRef.current
    const canvasX = clientX - rect.left
    const canvasY = clientY - rect.top
    const gridX = Math.floor((canvasX - offsetX) / (zoom * CELL_SIZE))
    const gridY = Math.floor((canvasY - offsetY) / (zoom * CELL_SIZE))
    if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) return null
    return { x: gridX, y: gridY }
  }, [])

  // 마우스 휠 줌
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const { zoom: oldZoom, offsetX, offsetY } = viewRef.current
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * delta))

    // 마우스 위치를 중심으로 줌
    const newOffsetX = mouseX - (mouseX - offsetX) * (newZoom / oldZoom)
    const newOffsetY = mouseY - (mouseY - offsetY) * (newZoom / oldZoom)

    viewRef.current = { zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY }
    setZoom(newZoom) // 상태 업데이트로 리렌더 트리거
  }, [])

  // 마우스 다운 (드래그 시작)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: viewRef.current.offsetX,
      startOffsetY: viewRef.current.offsetY,
    }
  }, [])

  // 마우스 이동 (드래그 또는 호버)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.isDragging) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      viewRef.current.offsetX = dragRef.current.startOffsetX + dx
      viewRef.current.offsetY = dragRef.current.startOffsetY + dy
      render()
      renderMinimap()
      return
    }

    const cell = screenToGrid(e.clientX, e.clientY)
    if (cell) {
      setHoveredCell(cell)
      setTooltipPos({ x: e.clientX, y: e.clientY })
      onCellHover?.(cell.x, cell.y, getLand(cell.x, cell.y))
    } else {
      setHoveredCell(null)
    }
  }, [render, renderMinimap, screenToGrid, onCellHover, getLand])

  // 마우스 업 (클릭 판정)
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDragging = dragRef.current.isDragging
    const dx = Math.abs(e.clientX - dragRef.current.startX)
    const dy = Math.abs(e.clientY - dragRef.current.startY)
    dragRef.current.isDragging = false

    // 드래그 거리가 5px 미만이면 클릭으로 판정
    if (wasDragging && dx < 5 && dy < 5) {
      const cell = screenToGrid(e.clientX, e.clientY)
      if (cell) {
        onCellClick(cell.x, cell.y, getLand(cell.x, cell.y))
      }
    }
  }, [screenToGrid, onCellClick, getLand])

  const handleMouseLeave = useCallback(() => {
    dragRef.current.isDragging = false
    setHoveredCell(null)
  }, [])

  // 줌 버튼
  const handleZoomIn = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const { zoom: oldZoom, offsetX, offsetY } = viewRef.current
    const newZoom = Math.min(MAX_ZOOM, oldZoom * 1.3)
    viewRef.current = {
      zoom: newZoom,
      offsetX: cx - (cx - offsetX) * (newZoom / oldZoom),
      offsetY: cy - (cy - offsetY) * (newZoom / oldZoom),
    }
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const { zoom: oldZoom, offsetX, offsetY } = viewRef.current
    const newZoom = Math.max(MIN_ZOOM, oldZoom / 1.3)
    viewRef.current = {
      zoom: newZoom,
      offsetX: cx - (cx - offsetX) * (newZoom / oldZoom),
      offsetY: cy - (cy - offsetY) * (newZoom / oldZoom),
    }
    setZoom(newZoom)
  }

  const handleResetView = () => {
    viewRef.current = { zoom: 1, offsetX: 0, offsetY: 0 }
    setZoom(1)
  }

  // 호버 툴팁 정보
  const hoveredLand = hoveredCell ? getLand(hoveredCell.x, hoveredCell.y) : undefined
  const hoveredGrade = hoveredCell ? (hoveredLand?.grade || getGrade(hoveredCell.x, hoveredCell.y)) : null
  const hoveredStatus = hoveredLand?.status || 'available'

  return (
    <div className={`relative ${className || ''}`}>
      {/* 메인 캔버스 */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[500px] bg-primary rounded-xl overflow-hidden border border-surface-light cursor-grab active:cursor-grabbing"
      >
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full"
        />
      </div>

      {/* 줌 컨트롤 */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button onClick={handleZoomIn} className="w-8 h-8 bg-surface/90 border border-surface-light rounded-lg text-white hover:bg-surface-light transition-colors flex items-center justify-center text-lg font-bold">+</button>
        <button onClick={handleZoomOut} className="w-8 h-8 bg-surface/90 border border-surface-light rounded-lg text-white hover:bg-surface-light transition-colors flex items-center justify-center text-lg font-bold">-</button>
        <button onClick={handleResetView} className="w-8 h-8 bg-surface/90 border border-surface-light rounded-lg text-white hover:bg-surface-light transition-colors flex items-center justify-center text-xs">
          ⟲
        </button>
      </div>

      {/* 줌 레벨 표시 */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-surface/90 border border-surface-light rounded-lg text-xs text-slate-400">
        {Math.round(zoom * 100)}%
      </div>

      {/* 미니맵 */}
      <div className="absolute bottom-3 right-3 border border-surface-light rounded-lg overflow-hidden bg-primary/90">
        <canvas
          ref={minimapRef}
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          className="block"
        />
      </div>

      {/* 등급 범례 */}
      <div className="absolute bottom-3 left-3 flex gap-2 px-3 py-2 bg-surface/90 border border-surface-light rounded-lg">
        {GRADES.map(g => (
          <div key={g} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRADE_CONFIG[g].color }} />
            <span className="text-xs text-slate-400">{g}</span>
          </div>
        ))}
      </div>

      {/* 호버 툴팁 */}
      {hoveredCell && hoveredGrade && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 bg-surface border border-surface-light rounded-lg shadow-lg"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
        >
          <p className="text-xs text-slate-400 mb-0.5">
            ({hoveredCell.x}, {hoveredCell.y})
          </p>
          <p className="text-sm font-semibold" style={{ color: GRADE_CONFIG[hoveredGrade].color }}>
            {hoveredGrade}등급 · {GRADE_CONFIG[hoveredGrade].label}
          </p>
          <p className="text-xs text-slate-300">
            {formatOwniaPrice(getPrice(hoveredGrade))}
          </p>
          <p className="text-xs mt-0.5" style={{ color: hoveredStatus === 'sold' ? '#ef4444' : '#22c55e' }}>
            {hoveredStatus === 'sold' ? '판매완료' : '구매가능'}
          </p>
        </div>
      )}
    </div>
  )
}
