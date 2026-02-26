const { getSupabase, getResend, headers, respond, verifyToken, formatKRW, formatDate } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const auth = verifyToken(event);
  if (!auth) return respond(401, { error: '로그인이 필요합니다.' });
  if (!auth.is_admin) return respond(403, { error: '관리자 권한이 필요합니다.' });

  try {
    const { payment_id } = JSON.parse(event.body);
    if (!payment_id) return respond(400, { error: '지급 ID가 필요합니다.' });

    const { data: payment } = await getSupabase().from('payments')
      .select('*, users(name, email)')
      .eq('id', payment_id)
      .single();

    if (!payment) return respond(404, { error: '지급 내역을 찾을 수 없습니다.' });
    if (payment.status !== 'requested') return respond(400, { error: '승인 요청 상태가 아닙니다.' });

    // Approve
    await getSupabase().from('payments').update({
      status: 'approved',
      approved_at: new Date().toISOString()
    }).eq('id', payment_id);

    // Notify customer
    const user = payment.users;
    if (user?.email) {
      await getResend().emails.send({
        from: 'OWNIA <noreply@yourdomain.com>',
        to: user.email,
        subject: `[OWNIA] ${payment.day_number}회차 지급 승인 완료 — ${formatKRW(payment.amount)}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0A0E1A;color:#F0ECE2;border:1px solid #00E676">
            <h2 style="color:#00E676;text-align:center;font-family:serif;letter-spacing:.15em">✅ 지급 승인 완료</h2>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5)">회차</td><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:#C9A84C;font-weight:bold">${payment.day_number}회차</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5)">지급일</td><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2)">${formatDate(payment.payment_date)}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5)">금액</td><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:#00E5FF;font-family:monospace;font-size:18px">${formatKRW(payment.amount)}</td></tr>
              <tr><td style="padding:8px;color:rgba(240,236,226,.5)">상태</td><td style="padding:8px;color:#00E676;font-weight:bold">✅ 지급 완료</td></tr>
            </table>
          </div>
        `,
      });
    }

    return respond(200, { message: `${payment.day_number}회차 지급이 승인되었습니다.` });
  } catch (err) {
    console.error('Payment approve error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
