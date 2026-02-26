const { getSupabase, getResend, headers, respond, verifyToken, formatKRW, formatDate, getAdminEmail } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const auth = verifyToken(event);
  if (!auth) return respond(401, { error: '로그인이 필요합니다.' });

  try {
    const { payment_id } = JSON.parse(event.body);
    if (!payment_id) return respond(400, { error: '지급 ID가 필요합니다.' });

    const { data: payment } = await getSupabase().from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('user_id', auth.id)
      .single();

    if (!payment) return respond(404, { error: '지급 내역을 찾을 수 없습니다.' });
    if (payment.status !== 'pending') return respond(400, { error: '이미 처리된 건입니다.' });
    if (new Date(payment.payment_date) > new Date()) return respond(400, { error: '아직 지급일이 되지 않았습니다.' });

    // Update status
    await getSupabase().from('payments').update({
      status: 'requested',
      requested_at: new Date().toISOString()
    }).eq('id', payment_id);

    const payDate = formatDate(payment.payment_date);

    // Notify customer
    await getResend().emails.send({
      from: 'OWNIA <noreply@yourdomain.com>',
      to: auth.email,
      subject: `[OWNIA] ${payment.day_number}회차 지급 요청 접수 — ${payDate}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0A0E1A;color:#F0ECE2;border:1px solid #C9A84C">
          <h2 style="color:#C9A84C;text-align:center;font-family:serif;letter-spacing:.15em">지급 요청 접수</h2>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5)">회차</td><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:#C9A84C;font-weight:bold">${payment.day_number}회차</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5)">지급일</td><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2)">${payDate}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5)">금액</td><td style="padding:8px;border-bottom:1px solid rgba(201,168,76,.2);color:#00E5FF;font-family:monospace">${formatKRW(payment.amount)}</td></tr>
            <tr><td style="padding:8px;color:rgba(240,236,226,.5)">상태</td><td style="padding:8px;color:#FFA726">⏳ 승인 대기중</td></tr>
          </table>
          <p style="font-size:12px;color:rgba(240,236,226,.4);text-align:center">관리자 승인 후 최종 지급됩니다.</p>
        </div>
      `,
    });

    // Notify admin
    if (getAdminEmail()) {
      await getResend().emails.send({
        from: 'OWNIA System <noreply@yourdomain.com>',
        to: getAdminEmail(),
        subject: `[OWNIA 승인 요청] ${auth.name} — ${payment.day_number}회차 ${formatKRW(payment.amount)}`,
        html: `
          <div style="font-family:sans-serif;padding:24px">
            <h2 style="color:#C9A84C">💰 지급 승인 요청</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>고객명</strong></td><td style="padding:8px;border:1px solid #ddd">${auth.name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>이메일</strong></td><td style="padding:8px;border:1px solid #ddd">${auth.email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>회차</strong></td><td style="padding:8px;border:1px solid #ddd">${payment.day_number}회차</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>지급일</strong></td><td style="padding:8px;border:1px solid #ddd">${payDate}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>금액</strong></td><td style="padding:8px;border:1px solid #ddd">${formatKRW(payment.amount)}</td></tr>
            </table>
            <p style="margin-top:16px;color:red"><strong>관리자 대시보드에서 승인해 주세요.</strong></p>
          </div>
        `,
      });
    }

    return respond(200, { message: `${payment.day_number}회차 지급 요청이 접수되었습니다.` });
  } catch (err) {
    console.error('Payment request error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
