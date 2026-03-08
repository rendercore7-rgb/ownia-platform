const { getSupabase, getResend, headers, respond, generateCode, hashPassword, getSiteUrl } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { name, email, password } = JSON.parse(event.body);
    if (!name || !email || !password) return respond(400, { error: '모든 항목을 입력하세요.' });
    if (password.length < 8) return respond(400, { error: '비밀번호는 8자 이상이어야 합니다.' });

    // Check existing user
    const { data: existing } = await getSupabase()
      .from('users')
      .select('id, is_verified')
      .eq('email', email)
      .single();

    if (existing?.is_verified) return respond(400, { error: '이미 등록된 이메일입니다.' });

    const code = generateCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분
    const password_hash = await hashPassword(password);

    if (existing) {
      // Update unverified user
      await getSupabase().from('users').update({
        name, password_hash,
        verification_code: code,
        code_expires_at: codeExpires
      }).eq('id', existing.id);
    } else {
      // Insert new user
      await getSupabase().from('users').insert({
        name, email, password_hash,
        verification_code: code,
        code_expires_at: codeExpires
      });
    }

    // Send verification email
    await getResend().emails.send({
      from: 'OWNIA <noreply@yourdomain.com>',
      to: email,
      subject: '[OWNIA] 이메일 인증 코드',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:'Noto Sans KR',sans-serif;background:#0A0E1A;color:#F0ECE2;padding:40px;border:1px solid #C9A84C">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="font-family:serif;color:#C9A84C;letter-spacing:.2em;font-size:28px;margin:0">OWNIA</h1>
            <p style="color:rgba(240,236,226,.5);font-size:14px;margin-top:4px">이메일 인증</p>
          </div>
          <p style="font-size:14px;line-height:1.8;color:rgba(240,236,226,.7)">
            안녕하세요, <strong style="color:#C9A84C">${name}</strong>님.<br>
            OWNIA 회원가입을 위한 인증 코드입니다.
          </p>
          <div style="text-align:center;margin:30px 0;padding:24px;background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.2)">
            <span style="font-family:monospace;font-size:36px;letter-spacing:.5em;color:#00E5FF">${code}</span>
          </div>
          <p style="font-size:12px;color:rgba(240,236,226,.4);text-align:center">
            이 코드는 10분간 유효합니다.<br>본인이 요청하지 않았다면 이 메일을 무시하세요.
          </p>
        </div>
      `,
    });

    return respond(200, { message: '인증 코드가 이메일로 발송되었습니다.' });
  } catch (err) {
    console.error('Signup error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
