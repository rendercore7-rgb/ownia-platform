const { getSupabase, getResend, headers, respond, generateCode } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { email } = JSON.parse(event.body);
    if (!email) return respond(400, { error: '이메일을 입력하세요.' });

    const { data: user } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return respond(400, { error: '등록되지 않은 이메일입니다.' });
    if (user.is_verified) return respond(400, { error: '이미 인증된 계정입니다.' });

    const code = generateCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await getSupabase().from('users').update({
      verification_code: code,
      code_expires_at: codeExpires
    }).eq('id', user.id);

    await getResend().emails.send({
      from: 'OWNIA <noreply@yourdomain.com>',
      to: email,
      subject: '[OWNIA] 이메일 인증 코드 (재발송)',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:sans-serif;background:#0A0E1A;color:#F0ECE2;padding:40px;border:1px solid #C9A84C">
          <h1 style="text-align:center;color:#C9A84C;letter-spacing:.2em;font-size:28px">OWNIA</h1>
          <div style="text-align:center;margin:30px 0;padding:24px;background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.2)">
            <span style="font-family:monospace;font-size:36px;letter-spacing:.5em;color:#00E5FF">${code}</span>
          </div>
          <p style="font-size:12px;color:rgba(240,236,226,.4);text-align:center">이 코드는 10분간 유효합니다.</p>
        </div>
      `,
    });

    return respond(200, { message: '인증 코드가 재발송되었습니다.' });
  } catch (err) {
    console.error('Resend error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
