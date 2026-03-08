const { getSupabase, headers, respond, verifyToken } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const auth = verifyToken(event);
  if (!auth) return respond(401, { error: '로그인이 필요합니다.' });

  try {
    const { amount, signature_data } = JSON.parse(event.body);
    if (!amount || amount < 1000000 || amount > 500000000 || amount % 1000000 !== 0) {
      return respond(400, { error: '유효하지 않은 금액입니다. (백만원~5억, 백만원 단위)' });
    }
    if (!signature_data) return respond(400, { error: '전자 서명이 필요합니다.' });

    const daily = Math.round(amount * 30000 / 10000000);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 7);

    // Create loan
    const { data: loan, error: loanErr } = await getSupabase().from('loans').insert({
      user_id: auth.id,
      amount,
      daily_amount: daily,
      loan_date: now.toISOString(),
      start_date: startDate.toISOString(),
      signature_data,
      status: 'pending_deposit'
    }).select().single();

    if (loanErr) throw loanErr;

    // Generate 365 days of payments
    const payments = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      payments.push({
        loan_id: loan.id,
        user_id: auth.id,
        day_number: i + 1,
        payment_date: d.toISOString().split('T')[0],
        amount: daily,
        status: 'pending'
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < payments.length; i += 100) {
      const batch = payments.slice(i, i + 100);
      const { error: payErr } = await getSupabase().from('payments').insert(batch);
      if (payErr) throw payErr;
    }

    return respond(200, {
      message: '차용 신청이 완료되었습니다. 입금 후 입금확인 버튼을 눌러주세요.',
      loan: {
        id: loan.id,
        amount: loan.amount,
        daily_amount: loan.daily_amount,
        loan_date: loan.loan_date,
        start_date: loan.start_date,
        status: loan.status
      }
    });
  } catch (err) {
    console.error('Loan create error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
