export type LandGrade = 'Aether' | 'Apex' | 'Luminous' | 'Grove' | 'Pioneer'
export type LandStatus = 'available' | 'reserved' | 'sold'

export interface Land {
  id: string
  grid_x: number
  grid_y: number
  grade: LandGrade
  owner_id: string | null
  price: number
  status: LandStatus
  nft_mint_address: string | null
  metadata: Record<string, unknown>
  purchased_at: string | null
}

export interface LandTransaction {
  id: string
  land_id: string
  buyer_id: string
  price: number
  grid_x: number
  grid_y: number
  grade: string
  created_at: string
  profiles?: { full_name: string } | null
}

export interface GridStats {
  grade: LandGrade
  total: number
  sold: number
  available: number
  revenue: number
}
