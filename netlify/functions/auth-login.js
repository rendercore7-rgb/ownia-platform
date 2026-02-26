const { getSupabase, headers, respond, comparePassword, createToken } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { email, password } = JSON.parse(event.body);
    if (!email || !password) return respond(400, { error: '이메일과 비밀번호를 입력하세요.' });

    const { data: user } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return respond(400, { error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    if (!user.is_verified) return respond(400, { error: '이메일 인증이 완료되지 않았습니다.' });

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return respond(400, { error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const token = createToken(user);

    return respond(200, {
      token,
      user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin }
    });
  } catch (err) {
    console.error('Login error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
