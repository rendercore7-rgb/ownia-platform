-- OWNIA 토지맵 스키마 (멱등성 보장)
-- Supabase Dashboard > SQL Editor 에서 실행

-- ============================================================
-- 1. 토지 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grid_x int NOT NULL CHECK (grid_x >= 0 AND grid_x < 100),
  grid_y int NOT NULL CHECK (grid_y >= 0 AND grid_y < 100),
  grade text NOT NULL CHECK (grade IN ('S','A','B','C','D')),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  price bigint NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available','reserved','sold')),
  nft_mint_address text,
  metadata jsonb DEFAULT '{}',
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(grid_x, grid_y)
);

CREATE INDEX IF NOT EXISTS idx_lands_owner ON public.lands(owner_id);
CREATE INDEX IF NOT EXISTS idx_lands_grade ON public.lands(grade);
CREATE INDEX IF NOT EXISTS idx_lands_status ON public.lands(status);
CREATE INDEX IF NOT EXISTS idx_lands_coords ON public.lands(grid_x, grid_y);

-- ============================================================
-- 2. 토지 거래 이력 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.land_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id uuid REFERENCES public.lands(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  price bigint NOT NULL,
  grid_x int NOT NULL,
  grid_y int NOT NULL,
  grade text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_land_tx_buyer ON public.land_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_land_tx_land ON public.land_transactions(land_id);

-- ============================================================
-- 3. RLS 비활성화 (개발 단계)
-- ============================================================

ALTER TABLE public.lands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_transactions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS 정책 (프로덕션용 준비)
-- ============================================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view lands" ON public.lands;
  DROP POLICY IF EXISTS "Users can update own lands" ON public.lands;
  DROP POLICY IF EXISTS "Admins can manage all lands" ON public.lands;
  DROP POLICY IF EXISTS "Users can view own transactions" ON public.land_transactions;
  DROP POLICY IF EXISTS "Users can insert transactions" ON public.land_transactions;
  DROP POLICY IF EXISTS "Admins can view all transactions" ON public.land_transactions;
END $$;

CREATE POLICY "Anyone can view lands" ON public.lands FOR SELECT USING (true);
CREATE POLICY "Users can update own lands" ON public.lands FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all lands" ON public.lands FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Users can view own transactions" ON public.land_transactions FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can insert transactions" ON public.land_transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Admins can view all transactions" ON public.land_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================================
-- 5. 10,000셀 초기 데이터 생성 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_lands()
RETURNS void AS $$
DECLARE
  x int;
  y int;
  dist int;
  g text;
  p bigint;
BEGIN
  FOR x IN 0..99 LOOP
    FOR y IN 0..99 LOOP
      -- 체비셰프 거리 (중심 49.5, 49.5 기준)
      dist := GREATEST(ABS(x - 50), ABS(y - 50));

      -- 등급 및 가격 결정
      IF dist <= 5 THEN
        g := 'S'; p := 50000;
      ELSIF dist <= 15 THEN
        g := 'A'; p := 20000;
      ELSIF dist <= 25 THEN
        g := 'B'; p := 10000;
      ELSIF dist <= 35 THEN
        g := 'C'; p := 5000;
      ELSE
        g := 'D'; p := 2000;
      END IF;

      INSERT INTO public.lands (grid_x, grid_y, grade, price)
      VALUES (x, y, g, p)
      ON CONFLICT (grid_x, grid_y) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 실행
SELECT public.seed_lands();
