// Supabase Edge Function: send-agreement
// Sends the loan agreement via Resend email API
//
// Deploy: supabase functions deploy send-agreement
// Set secret: supabase secrets set RESEND_API_KEY=your_key

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string
  userName: string
  amount: number
  dailyPayment: number
  startDate: string
  signatureUrl: string
}

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${(amount / 10_000).toLocaleString()}만원`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const body: RequestBody = await req.json()
    const { email, userName, amount, dailyPayment, startDate, signatureUrl } = body

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; padding: 20px; background: #0f172a; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: #f59e0b; margin: 0;">OWNiA</h1>
          <p style="color: #94a3b8; margin: 5px 0 0;">차용증</p>
        </div>

        <div style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 16px;">차 용 증</h2>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">차용 금액</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px;">금 ${amount.toLocaleString()}원 (${formatKRW(amount)})</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">일일 지급액</td><td style="padding: 8px 0; font-weight: bold;">${dailyPayment.toLocaleString()}원/일</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">지급 시작일</td><td style="padding: 8px 0;">${startDate}</td></tr>
          </table>

          <hr style="border: 1px solid #e2e8f0;">

          <p>위 금액을 아래 조건에 따라 차용하며, 본 차용증의 내용을 성실히 이행할 것을 확약합니다.</p>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>제1조 (차용 목적)</strong> 본 차용금은 OWNIA 디지털 도시 경제 생태계 참여를 위한 것입니다.</p>
            <p><strong>제2조 (수익 지급)</strong> 차용자는 지급 시작일부터 매일 ${dailyPayment.toLocaleString()}원을 대여자에게 지급합니다.</p>
            <p><strong>제3조 (지급 방식)</strong> 대여자가 지급 요청 시, 오후 12시 이전 요청은 당일, 12시 이후 요청은 익일에 대여자의 지정 계좌로 송금합니다.</p>
            <p><strong>제4조 (원금 반환)</strong> 차용 기간 종료 시 또는 대여자의 요청 시 원금을 반환합니다.</p>
          </div>

          <hr style="border: 1px solid #e2e8f0;">

          <table style="width: 100%; margin: 16px 0;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <p style="color: #64748b; margin-bottom: 4px;">대여자 (채권자)</p>
                <p style="font-weight: bold;">${userName}</p>
              </td>
              <td style="width: 50%; vertical-align: top;">
                <p style="color: #64748b; margin-bottom: 4px;">차용자 (채무자)</p>
                <p style="font-weight: bold;">주식회사 OWNIA</p>
                <p style="color: #64748b;">대표이사 (추후 기재)</p>
              </td>
            </tr>
          </table>

          <div style="margin-top: 16px;">
            <p style="color: #64748b; margin-bottom: 8px;">전자서명:</p>
            <img src="${signatureUrl}" alt="전자서명" style="max-width: 300px; border: 1px solid #e2e8f0; border-radius: 8px;" />
          </div>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          &copy; 2027 OWNIA. Own Your Life, AI Rules Your Wealth.
        </p>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'OWNIA <noreply@ownia.io>',
        to: [email],
        subject: `[OWNIA] 차용증 - ${formatKRW(amount)} 도시참여`,
        html: htmlContent,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 400,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
