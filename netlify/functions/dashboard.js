const { getSupabase, headers, respond, verifyToken } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  const auth = verifyToken(event);
  if (!auth) return respond(401, { error: '로그인이 필요합니다.' });

  try {
    const params = event.queryStringParameters || {};
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const loanId = params.loan_id;

    // Get user's loans
    const { data: loans } = await getSupabase().from('loans')
      .select('*')
      .eq('user_id', auth.id)
      .order('created_at', { ascending: false });

    if (!loans?.length) {
      return respond(200, { loans: [], payments: [], total: 0, page: 1 });
    }

    const targetLoan = loanId ? loans.find(l => l.id === loanId) : loans[0];
    if (!targetLoan) return respond(404, { error: '차용 내역을 찾을 수 없습니다.' });

    // Get payments with pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: payments, count } = await getSupabase().from('payments')
      .select('*', { count: 'exact' })
      .eq('loan_id', targetLoan.id)
      .order('day_number', { ascending: true })
      .range(from, to);

    // Calculate totals
    const { data: approvedSum } = await getSupabase().from('payments')
      .select('amount')
      .eq('loan_id', targetLoan.id)
      .eq('status', 'approved');

    const totalApproved = (approvedSum || []).reduce((s, p) => s + p.amount, 0);

    return respond(200, {
      loans: loans.map(l => ({
        id: l.id,
        amount: l.amount,
        daily_amount: l.daily_amount,
        loan_date: l.loan_date,
        start_date: l.start_date,
        status: l.status,
        deposit_confirmed: l.deposit_confirmed,
        agreement_sent: l.agreement_sent
      })),
      current_loan: targetLoan.id,
      payments: payments || [],
      total: count || 0,
      page,
      pageSize,
      totalApproved
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return respond(500, { error: '서버 오류가 발생했습니다.' });
  }
};
