const { getSupabase, headers, respond, createToken } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { email, code } = JSON.parse(event.body);
    if (!email || !code) return respond(400, { error: '이메일과 인증 코드를 입력하세요.' });

    const { data: user, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return respond(400, { error: '등록되지 않은 이메일입니다.' });
    if (user.is_verified) return respond(400, { error: '이미 인증된 계정입니다.' });
    if (user.verification_code !== code) return respond(400, { error: '인증 코드가 올바르지 않습니다.' });
    if (new Date(user.code_expires_at) < new Date()) return respond(400, { error: '인증 코드가 만료되었습니다. 재발송해 주세요.' });

    // Verify user
    await getSupabase().from('users').update({
      is_verified: true,
      verification_code: null,
      code_expires_at: null
    }).eq('id', user.id);

    const token = createToken({ ...user, is_verified: true });

    return respond(200, {
      message: '인증 완료! OWNIA에 오신 것을 환영합니다.',
      token,
      user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin }
    });
  } catch (err) {
    console.error('Verify error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
