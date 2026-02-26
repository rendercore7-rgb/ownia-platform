-- =============================================
-- OWNIA Database Schema
-- Supabase SQL Editor에서 이 파일을 실행하세요
-- =============================================

-- 1. 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  code_expires_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 차용(대출) 테이블
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,              -- 차용 금액 (원)
  daily_amount BIGINT NOT NULL,        -- 일일 지급액 (원)
  loan_date TIMESTAMPTZ NOT NULL,      -- 차용일 (발행일)
  start_date TIMESTAMPTZ NOT NULL,     -- 지급 시작일 (차용일+7)
  deposit_confirmed BOOLEAN DEFAULT FALSE,  -- 입금 확인 여부
  deposit_confirmed_at TIMESTAMPTZ,
  agreement_sent BOOLEAN DEFAULT FALSE,     -- 차용증 발송 여부
  agreement_sent_at TIMESTAMPTZ,
  signature_data TEXT,                 -- 전자서명 데이터 (base64)
  status TEXT DEFAULT 'pending_deposit', -- pending_deposit, active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 일일 지급 테이블
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INT NOT NULL,             -- 회차
  payment_date DATE NOT NULL,          -- 지급 예정일
  amount BIGINT NOT NULL,              -- 지급 금액
  status TEXT DEFAULT 'pending',       -- pending, requested, approved
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_payments_loan_id ON payments(loan_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Service role은 모든 접근 허용 (백엔드 함수용)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payments FOR ALL USING (true) WITH CHECK (true);
