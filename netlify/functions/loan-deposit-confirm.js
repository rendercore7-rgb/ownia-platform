const { getSupabase, getResend, headers, respond, verifyToken, formatKRW, formatDate, getAdminEmail, getSiteUrl } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const auth = verifyToken(event);
  if (!auth) return respond(401, { error: '로그인이 필요합니다.' });

  try {
    const { loan_id } = JSON.parse(event.body);
    if (!loan_id) return respond(400, { error: '차용 ID가 필요합니다.' });

    // Get loan
    const { data: loan } = await getSupabase().from('loans')
      .select('*')
      .eq('id', loan_id)
      .eq('user_id', auth.id)
      .single();

    if (!loan) return respond(404, { error: '차용 내역을 찾을 수 없습니다.' });
    if (loan.deposit_confirmed) return respond(400, { error: '이미 입금이 확인된 건입니다.' });

    // Update loan status
    await getSupabase().from('loans').update({
      deposit_confirmed: true,
      deposit_confirmed_at: new Date().toISOString(),
      agreement_sent: true,
      agreement_sent_at: new Date().toISOString(),
      status: 'active'
    }).eq('id', loan_id);

    const loanDate = formatDate(loan.loan_date);
    const startDate = formatDate(loan.start_date);

    // Build agreement HTML for email
    const agreementHTML = `
      <div style="max-width:600px;margin:0 auto;font-family:'Noto Sans KR',sans-serif;background:#0A0E1A;color:#F0ECE2;padding:0;border:2px solid #C9A84C">
        <!-- Header -->
        <div style="text-align:center;padding:32px;border-bottom:1px solid rgba(201,168,76,.3)">
          <h1 style="font-family:serif;color:#C9A84C;letter-spacing:.3em;font-size:28px;margin:0">OWNIA</h1>
          <p style="color:rgba(240,236,226,.4);font-size:12px;margin-top:4px">Digital Asset Loan Agreement</p>
        </div>

        <!-- Agreement Content -->
        <div style="padding:36px">
          <h2 style="text-align:center;font-family:serif;color:#C9A84C;font-size:22px;margin-bottom:24px;letter-spacing:.15em">차 용 증</h2>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px;width:30%">차용인</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#C9A84C;font-size:14px;font-weight:bold">${auth.name}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px">이메일</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#C9A84C;font-size:14px">${auth.email}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px">차용 금액</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#00E5FF;font-size:16px;font-weight:bold;font-family:monospace">${formatKRW(loan.amount)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px">차용일 (발행일)</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#F0ECE2;font-size:14px">${loanDate}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px">일일 지급액</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#00E5FF;font-size:14px;font-family:monospace">${formatKRW(loan.daily_amount)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px">지급 시작일</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#F0ECE2;font-size:14px">${startDate} (차용일 + 7일)</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:rgba(240,236,226,.5);font-size:13px">입금 확인</td>
              <td style="padding:10px 12px;border:1px solid rgba(201,168,76,.2);color:#00E676;font-size:14px;font-weight:bold">✅ 확인 완료</td>
            </tr>
          </table>

          <div style="padding:20px;background:rgba(240,236,226,.03);border:1px solid rgba(201,168,76,.15);font-size:13px;line-height:2;color:rgba(240,236,226,.6);margin-bottom:24px">
            <p><strong style="color:#C9A84C">지급 조건:</strong></p>
            <p>① 차용일로부터 7일 경과 후 매일 일일 지급액이 지급됩니다.</p>
            <p>② 지급은 토요일, 일요일을 포함하여 매일 이루어집니다.</p>
            <p>③ 고객이 지급 요청 버튼 클릭 시 운영자에게 동시 알림이 발송됩니다.</p>
            <p>④ 운영자 승인 후 최종 지급이 완료됩니다.</p>
          </div>

          <div style="text-align:center;padding:16px;border-top:1px solid rgba(201,168,76,.2)">
            <p style="font-size:11px;color:rgba(240,236,226,.3)">
              본 차용증은 OWNIA 디지털 자산 생태계 내에서 전자적으로 체결되었으며,<br>
              양 당사자의 전자 서명으로 효력이 발생합니다.
            </p>
            <p style="font-size:12px;color:rgba(240,236,226,.4);margin-top:12px">${loanDate} | OWNIA Platform</p>
          </div>
        </div>

        <!-- Signature -->
        ${loan.signature_data ? `
        <div style="padding:0 36px 24px;text-align:center">
          <p style="font-size:11px;color:rgba(240,236,226,.4);margin-bottom:8px">전자 서명</p>
          <img src="${loan.signature_data}" style="max-width:200px;border:1px solid rgba(201,168,76,.2);padding:8px;background:rgba(240,236,226,.02)" />
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align:center;padding:20px;background:rgba(201,168,76,.05);border-top:1px solid rgba(201,168,76,.2)">
          <a href="${getSiteUrl()}" style="color:#C9A84C;font-size:13px;text-decoration:none">OWNIA Platform 바로가기</a>
        </div>
      </div>
    `;

    // Send agreement to customer
    await getResend().emails.send({
      from: 'OWNIA <noreply@yourdomain.com>',
      to: auth.email,
      subject: `[OWNIA] 차용증 발행 완료 — ${formatKRW(loan.amount)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <p style="color:#333;font-size:14px;line-height:1.8">
            안녕하세요 <strong>${auth.name}</strong>님,<br><br>
            입금이 확인되어 차용증이 정식 발행되었습니다.<br>
            ${startDate}부터 매일 ${formatKRW(loan.daily_amount)}이 지급됩니다.<br><br>
            아래는 발행된 차용증입니다.
          </p>
          ${agreementHTML}
        </div>
      `,
    });

    // Send notification to admin
    if (getAdminEmail()) {
      await getResend().emails.send({
        from: 'OWNIA System <noreply@yourdomain.com>',
        to: getAdminEmail(),
        subject: `[OWNIA 관리자] 입금 확인 — ${auth.name} / ${formatKRW(loan.amount)}`,
        html: `
          <div style="font-family:sans-serif;padding:24px">
            <h2 style="color:#C9A84C">📢 입금 확인 알림</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>고객명</strong></td><td style="padding:8px;border:1px solid #ddd">${auth.name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>이메일</strong></td><td style="padding:8px;border:1px solid #ddd">${auth.email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>차용 금액</strong></td><td style="padding:8px;border:1px solid #ddd">${formatKRW(loan.amount)}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>일일 지급액</strong></td><td style="padding:8px;border:1px solid #ddd">${formatKRW(loan.daily_amount)}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>지급 시작일</strong></td><td style="padding:8px;border:1px solid #ddd">${startDate}</td></tr>
            </table>
            <p style="margin-top:16px"><a href="${getSiteUrl()}">관리자 대시보드 바로가기</a></p>
          </div>
        `,
      });
    }

    return respond(200, {
      message: '입금이 확인되었습니다. 차용증이 이메일로 발송되었습니다.',
      loan_id
    });
  } catch (err) {
    console.error('Deposit confirm error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
