# OWNIA 풀스택 배포 가이드

## 📁 프로젝트 구조
```
ownia-netlify/
├── netlify.toml              ← Netlify 설정
├── package.json              ← 의존성 패키지
├── supabase-schema.sql       ← DB 테이블 생성 SQL
├── .env.example              ← 환경변수 템플릿
├── public/                   ← 프론트엔드
│   ├── index.html
│   ├── style.css
│   └── app.js
└── netlify/functions/        ← 백엔드 API
    ├── utils.js              ← 공통 유틸리티
    ├── auth-signup.js        ← 회원가입 + 이메일 인증코드 발송
    ├── auth-verify.js        ← 인증코드 확인
    ├── auth-login.js         ← 로그인
    ├── auth-resend.js        ← 인증코드 재발송
    ├── loan-create.js        ← 차용 신청 (서명 후)
    ├── loan-deposit-confirm.js ← 입금확인 + 차용증 이메일 발송
    ├── dashboard.js           ← 대시보드 데이터 조회
    ├── payment-request.js     ← 고객 지급요청 (양측 이메일)
    └── payment-approve.js     ← 관리자 지급승인
```

## 🚀 배포 단계 (약 15분)

### Step 1: Supabase 설정 (무료 DB)
1. https://supabase.com 회원가입 & 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** 클릭
3. `supabase-schema.sql` 파일 내용을 붙여넣고 **Run** 실행
4. **Settings → API** 에서 아래 3개 값 복사:
   - `Project URL` → SUPABASE_URL
   - `anon public` 키 → SUPABASE_ANON_KEY  
   - `service_role` 키 → SUPABASE_SERVICE_KEY

### Step 2: Resend 설정 (무료 이메일 발송)
1. https://resend.com 회원가입
2. **API Keys** 메뉴에서 키 생성 → RESEND_API_KEY
3. **Domains** 메뉴에서 도메인 인증 (또는 무료 테스트용 onboarding@resend.dev 사용)
4. ⚠️ 무료 플랜: 월 3,000건 발송 가능

### Step 3: Netlify 환경변수 설정
1. Netlify 대시보드 → 사이트 선택
2. **Site configuration → Environment variables**
3. 아래 변수들 추가:

| 변수명 | 값 |
|--------|-----|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | `re_xxxxx` |
| `JWT_SECRET` | 아무 긴 랜덤 문자열 (예: `myOwnia2026SecretKey!@#`) |
| `ADMIN_EMAIL` | 관리자 이메일 주소 |
| `SITE_URL` | `https://your-site.netlify.app` |

### Step 4: GitHub 연결 & 배포
1. GitHub에 새 레포 생성 (예: `ownia-platform`)
2. 이 프로젝트 폴더 전체를 push
3. Netlify → **Site configuration → Build & deploy → Link repository**
4. 레포 선택 → 자동 배포됨

또는 **Netlify CLI**로 직접 배포:
```bash
npm install -g netlify-cli
cd ownia-netlify
npm install
netlify deploy --prod
```

### Step 5: Resend 발신자 이메일 설정
백엔드 함수들에서 `from: 'OWNIA <noreply@yourdomain.com>'` 부분을:
- 도메인 인증한 경우: `noreply@yourdomain.com`으로 변경
- 테스트 단계: `onboarding@resend.dev`로 변경

## 📧 이메일 발송 시점

| 시점 | 수신자 | 내용 |
|------|--------|------|
| 회원가입 | 고객 | 6자리 인증 코드 |
| 입금 확인 | 고객 | **차용증 전체** (금액, 조건, 서명 포함) |
| 입금 확인 | 관리자 | 입금 알림 (고객명, 금액) |
| 지급 요청 | 고객 | 요청 접수 확인 |
| 지급 요청 | 관리자 | 승인 요청 알림 |
| 지급 승인 | 고객 | 지급 완료 알림 |

## 🔄 도시 참여 플로우 (수정된 부분)

```
1. 금액 선택 → 2. 차용증 확인 → 3. 전자서명 → 4. 입금 확인
                                                    ↓
                                          [입금확인 버튼 클릭]
                                                    ↓
                                    차용증 이메일 자동 발송 (고객 + 관리자)
                                                    ↓
                                          7일 후부터 매일 지급 시작
```

## 💰 일일 지급 계산 공식
- 천만원 차용 → 매일 ₩30,000
- 공식: `일일지급액 = 차용금액 × 30,000 ÷ 10,000,000`
- 예시: 5천만원 → ₩150,000/일, 1억 → ₩300,000/일

## 🔐 관리자 설정
Supabase SQL Editor에서 특정 유저를 관리자로 설정:
```sql
UPDATE users SET is_admin = true WHERE email = 'admin@yourdomain.com';
```

## 💡 모든 서비스가 무료입니다
- **Netlify**: 월 125,000 함수 호출, 100GB 대역폭
- **Supabase**: 500MB DB, 무제한 API 호출
- **Resend**: 월 3,000건 이메일 발송
