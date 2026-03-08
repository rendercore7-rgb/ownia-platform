-- OWNIA Database Schema (멱등성 보장 - 여러 번 실행해도 안전)
-- Supabase Dashboard > SQL Editor 에서 실행

-- ============================================================
-- 1. 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.investments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount bigint NOT NULL,
  daily_payment int NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  signature_url text,
  agreement_sent boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('pending','active','completed','cancelled')),
  start_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id uuid REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  request_date date NOT NULL,
  request_time time NOT NULL,
  is_same_day boolean NOT NULL,
  status text DEFAULT 'requested' CHECK (status IN ('requested','confirmed','transferred')),
  admin_confirmed_at timestamptz,
  transferred_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. RLS 비활성화 (개발 단계 - 나중에 프로덕션에서 활성화)
-- ============================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. 기존 정책 정리 후 재생성
-- ============================================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
  DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
  DROP POLICY IF EXISTS "Admins can view all investments" ON public.investments;
  DROP POLICY IF EXISTS "Admins can update investments" ON public.investments;
  DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
  DROP POLICY IF EXISTS "Users can insert own payment requests" ON public.payment_requests;
  DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
  DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
  DROP POLICY IF EXISTS "Anyone can upload to agreements" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view agreements" ON storage.objects;
END $$;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Investments
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all investments" ON public.investments FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update investments" ON public.investments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Payment requests
CREATE POLICY "Users can view own payment requests" ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment requests" ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update payment requests" ON public.payment_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- 4. Storage 버킷
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('agreements', 'agreements', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Anyone can upload to agreements" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'agreements');
CREATE POLICY "Anyone can view agreements" ON storage.objects FOR SELECT USING (bucket_id = 'agreements');

-- ============================================================
-- 5. 자동 프로필 생성 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 6. 기본 프로필 & 테스트 데이터 (기존 유저)
-- ============================================================

INSERT INTO public.profiles (id, full_name, phone, is_admin)
VALUES ('478d08a8-8ed8-417f-8a70-cf57af4da562', '관리자', '010-0000-0000', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;
