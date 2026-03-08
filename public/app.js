// ===== API & STATE =====
const API = '/api';
let AUTH_TOKEN = localStorage.getItem('ownia_token');
let CURRENT_USER = JSON.parse(localStorage.getItem('ownia_user') || 'null');
let CURRENT_LOAN_ID = null;
let selectedAmount = 0;
let currentPage = 1;
let pendingEmail = '';
let resendInterval;

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (AUTH_TOKEN) opts.headers['Authorization'] = 'Bearer ' + AUTH_TOKEN;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '서버 오류');
  return data;
}

// ===== UTILS =====
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 4000);
}
function formatKRW(n) { return '₩' + Number(n).toLocaleString('ko-KR'); }
function formatDate(d) { const dt = new Date(d); return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')}`; }
function setLoading(btn, loading) {
  if (loading) { btn.dataset.orig = btn.textContent; btn.innerHTML = '<span class="spinner"></span>처리 중...'; btn.classList.add('loading'); btn.disabled = true; }
  else { btn.textContent = btn.dataset.orig || '확인'; btn.classList.remove('loading'); btn.disabled = false; }
}
function scrollToEl(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }

// ===== AUTH =====
function showLogin() { document.getElementById('loginForm').style.display='block'; document.getElementById('signupForm').style.display='none'; document.getElementById('verifyForm').style.display='none'; }
function showSignup() { document.getElementById('loginForm').style.display='none'; document.getElementById('signupForm').style.display='block'; document.getElementById('verifyForm').style.display='none'; }
function showVerify() { document.getElementById('loginForm').style.display='none'; document.getElementById('signupForm').style.display='none'; document.getElementById('verifyForm').style.display='block'; }

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  err.textContent = '';
  if (!email || !pw) { err.textContent = '이메일과 비밀번호를 입력하세요.'; return; }
  setLoading(btn, true);
  try {
    const data = await api('/auth-login', 'POST', { email, password: pw });
    AUTH_TOKEN = data.token; CURRENT_USER = data.user;
    localStorage.setItem('ownia_token', AUTH_TOKEN);
    localStorage.setItem('ownia_user', JSON.stringify(CURRENT_USER));
    enterSite();
  } catch (e) { err.textContent = e.message; }
  setLoading(btn, false);
}

async function handleSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pw = document.getElementById('signupPassword').value;
  const err = document.getElementById('signupError');
  const btn = document.getElementById('signupBtn');
  err.textContent = '';
  if (!name || !email || !pw) { err.textContent = '모든 항목을 입력하세요.'; return; }
  if (pw.length < 8) { err.textContent = '비밀번호는 8자 이상이어야 합니다.'; return; }
  setLoading(btn, true);
  try {
    await api('/auth-signup', 'POST', { name, email, password: pw });
    pendingEmail = email;
    document.getElementById('verifyEmailShow').textContent = email;
    showVerify();
    startResendTimer();
    showToast('인증 코드가 이메일로 발송되었습니다!', 'success');
  } catch (e) { err.textContent = e.message; }
  setLoading(btn, false);
}

async function handleVerify() {
  const inputs = document.querySelectorAll('#codeInputs input');
  const code = Array.from(inputs).map(i => i.value).join('');
  const err = document.getElementById('verifyError');
  const btn = document.getElementById('verifyBtn');
  if (code.length !== 6) { err.textContent = '6자리 코드를 모두 입력하세요.'; return; }
  setLoading(btn, true);
  try {
    const data = await api('/auth-verify', 'POST', { email: pendingEmail, code });
    AUTH_TOKEN = data.token; CURRENT_USER = data.user;
    localStorage.setItem('ownia_token', AUTH_TOKEN);
    localStorage.setItem('ownia_user', JSON.stringify(CURRENT_USER));
    showToast('인증 완료! 환영합니다.', 'success');
    enterSite();
  } catch (e) { err.textContent = e.message; }
  setLoading(btn, false);
}

async function handleResend() {
  try {
    await api('/auth-resend', 'POST', { email: pendingEmail });
    startResendTimer();
    showToast('인증 코드가 재발송되었습니다.', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

function startResendTimer() {
  let sec = 60;
  document.getElementById('resendBtn').style.display = 'none';
  document.getElementById('resendTimer').style.display = 'inline';
  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    sec--;
    document.getElementById('resendTimer').textContent = `${sec}초 후 재발송 가능`;
    if (sec <= 0) { clearInterval(resendInterval); document.getElementById('resendTimer').style.display='none'; document.getElementById('resendBtn').style.display='inline'; }
  }, 1000);
}

function codeInput(el, idx) { if (el.value) { const inputs = document.querySelectorAll('#codeInputs input'); if (idx < 5) inputs[idx+1].focus(); } }
function codeKeydown(e, idx) { if (e.key === 'Backspace' && !e.target.value && idx > 0) { document.querySelectorAll('#codeInputs input')[idx-1].focus(); } }

function enterSite() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainSite').classList.add('visible');
  document.getElementById('navUserName').textContent = CURRENT_USER.name + '님';
  loadDashboard();
}

function logout() {
  AUTH_TOKEN = null; CURRENT_USER = null;
  localStorage.removeItem('ownia_token'); localStorage.removeItem('ownia_user');
  document.getElementById('mainSite').classList.remove('visible');
  document.getElementById('authScreen').classList.remove('hidden');
  showLogin();
}

// Auto-login
if (AUTH_TOKEN && CURRENT_USER) enterSite();

// ===== NAV =====
window.addEventListener('scroll', () => { document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 50); });

// ===== CITY MODAL =====
function openCityModal() {
  if (!AUTH_TOKEN) return showToast('로그인이 필요합니다.', 'error');
  document.getElementById('cityModal').classList.add('active');
  goStep(1);
  selectedAmount = 0;
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('customAmount').value = '';
  document.getElementById('amountInfo').style.display = 'none';
  document.getElementById('step1Next').disabled = true;
  if (document.getElementById('agreeCheck')) document.getElementById('agreeCheck').checked = false;
  if (document.getElementById('step2Next')) document.getElementById('step2Next').disabled = true;
  if (document.getElementById('depositCheck')) document.getElementById('depositCheck').checked = false;
  if (document.getElementById('depositBtn')) document.getElementById('depositBtn').disabled = true;
}
function closeCityModal() { document.getElementById('cityModal').classList.remove('active'); }

function selectAmount(el, amt) {
  selectedAmount = amt;
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('customAmount').value = amt;
  updateAmountInfo();
}

function customAmountInput() {
  const v = parseInt(document.getElementById('customAmount').value);
  if (v && v >= 1000000 && v <= 500000000 && v % 1000000 === 0) {
    selectedAmount = v;
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    updateAmountInfo();
  } else {
    selectedAmount = 0;
    document.getElementById('amountInfo').style.display = 'none';
    document.getElementById('step1Next').disabled = true;
  }
}

function updateAmountInfo() {
  const daily = Math.round(selectedAmount * 30000 / 10000000);
  document.getElementById('selectedAmountDisplay').textContent = formatKRW(selectedAmount);
  document.getElementById('dailyPayDisplay').textContent = formatKRW(daily);
  document.getElementById('amountInfo').style.display = 'block';
  document.getElementById('step1Next').disabled = false;
}

function goStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.toggle('active', i + 1 === n);
    d.classList.toggle('done', i + 1 < n);
  });
  if (n === 2) generateAgreement();
  if (n === 3) initSignature();
}

function generateAgreement() {
  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() + 7);
  const daily = Math.round(selectedAmount * 30000 / 10000000);
  document.getElementById('agreementDoc').innerHTML = `
    <h4>차 용 증</h4>
    <p style="text-align:center;margin-bottom:20px;color:rgba(240,236,226,.4);font-size:.8rem">OWNIA Digital Asset Loan Agreement</p>
    <p><strong>1. 차용인 정보</strong></p>
    <p>성명: <span class="field">${CURRENT_USER.name}</span> | 이메일: <span class="field">${CURRENT_USER.email}</span></p><br>
    <p><strong>2. 차용 조건</strong></p>
    <p>차용 금액: <span class="field">${formatKRW(selectedAmount)}</span><br>
    차용일: <span class="field">${formatDate(now)}</span><br>
    일일 지급액: <span class="field">${formatKRW(daily)}</span><br>
    지급 시작일: <span class="field">${formatDate(start)}</span> (차용일 + 7일, 토·일 포함 매일)</p><br>
    <p><strong>3. 지급 조건</strong></p>
    <p>① 차용일로부터 7일 후 매일 지급됩니다.<br>② 고객 지급 요청 → 운영자 동시 알림 → 승인 후 지급 완료.<br>③ 입금 확인 후 본 차용증이 이메일로 자동 발송됩니다.</p><br>
    <p><strong>4. 특약</strong></p>
    <p>본 차용증은 전자적으로 체결되며 전자 서명으로 효력이 발생합니다.</p>
    <p style="text-align:center;margin-top:20px;color:rgba(240,236,226,.4);font-size:.8rem">${formatDate(now)} | OWNIA Platform</p>`;
}

function checkAgreement() { document.getElementById('step2Next').disabled = !document.getElementById('agreeCheck').checked; }

// ===== SIGNATURE =====
let sigCtx, sigDrawing = false, sigHasContent = false;
function initSignature() {
  const canvas = document.getElementById('sigCanvas');
  const pad = document.getElementById('signaturePad');
  canvas.width = pad.offsetWidth; canvas.height = pad.offsetHeight;
  sigCtx = canvas.getContext('2d');
  sigCtx.strokeStyle = '#C9A84C'; sigCtx.lineWidth = 2; sigCtx.lineCap = 'round';
  sigHasContent = false;
  document.getElementById('submitLoan').disabled = true;

  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.touches?.[0]?.clientX || e.clientX) - r.left, y: (e.touches?.[0]?.clientY || e.clientY) - r.top };
  };
  canvas.onmousedown = canvas.ontouchstart = (e) => { e.preventDefault(); sigDrawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); };
  canvas.onmousemove = canvas.ontouchmove = (e) => { if (!sigDrawing) return; e.preventDefault(); const p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); sigHasContent = true; document.getElementById('submitLoan').disabled = false; };
  canvas.onmouseup = canvas.ontouchend = canvas.onmouseleave = () => { sigDrawing = false; };
}
function clearSignature() { if (sigCtx) { sigCtx.clearRect(0, 0, document.getElementById('sigCanvas').width, document.getElementById('sigCanvas').height); sigHasContent = false; document.getElementById('submitLoan').disabled = true; } }

// ===== SUBMIT LOAN =====
async function submitLoan() {
  if (!sigHasContent) return showToast('서명을 완료해주세요.', 'error');
  const btn = document.getElementById('submitLoan');
  const sigData = document.getElementById('sigCanvas').toDataURL('image/png');
  setLoading(btn, true);
  try {
    const data = await api('/loan-create', 'POST', { amount: selectedAmount, signature_data: sigData });
    CURRENT_LOAN_ID = data.loan.id;
    // Move to step 4: Deposit confirmation
    document.getElementById('depositAmount').textContent = formatKRW(selectedAmount);
    goStep(4);
    showToast('차용 신청 완료! 입금 후 확인 버튼을 눌러주세요.', 'success');
  } catch (e) { showToast(e.message, 'error'); }
  setLoading(btn, false);
}

// ===== DEPOSIT CONFIRM =====
function checkDeposit() { document.getElementById('depositBtn').disabled = !document.getElementById('depositCheck').checked; }

async function confirmDeposit() {
  const btn = document.getElementById('depositBtn');
  setLoading(btn, true);
  try {
    await api('/loan-deposit-confirm', 'POST', { loan_id: CURRENT_LOAN_ID });
    closeCityModal();
    showToast('입금 확인! 차용증이 이메일로 발송되었습니다.', 'success');
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
  setLoading(btn, false);
}

// Deposit from dashboard banner
async function confirmDepositFromBanner(loanId) {
  try {
    await api('/loan-deposit-confirm', 'POST', { loan_id: loanId });
    showToast('입금 확인! 차용증이 이메일로 발송되었습니다.', 'success');
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const data = await api('/dashboard?page=' + currentPage);
    if (!data.loans?.length) {
      document.getElementById('paymentTableArea').style.display = 'none';
      document.getElementById('noLoanMsg').style.display = 'block';
      document.getElementById('depositBanner').style.display = 'none';
      return;
    }
    document.getElementById('noLoanMsg').style.display = 'none';

    const loan = data.loans[0];
    document.getElementById('dashPrincipal').textContent = formatKRW(loan.amount);
    document.getElementById('dashDaily').textContent = formatKRW(loan.daily_amount);
    document.getElementById('dashTotal').textContent = formatKRW(data.totalApproved || 0);
    document.getElementById('dashStartDate').textContent = formatDate(loan.start_date);

    // Deposit banner for pending loans
    const banner = document.getElementById('depositBanner');
    const pendingLoan = data.loans.find(l => l.status === 'pending_deposit');
    if (pendingLoan) {
      banner.style.display = 'flex';
      banner.className = 'deposit-banner';
      banner.innerHTML = `<span style="color:var(--orange)">⚠️ <strong>${formatKRW(pendingLoan.amount)}</strong> 입금 대기 중입니다. 입금 완료 후 확인 버튼을 눌러주세요.</span>
        <button class="btn-deposit-sm" onclick="confirmDepositFromBanner('${pendingLoan.id}')">입금 확인</button>`;
    } else {
      banner.style.display = 'none';
    }

    // Payment table (only for active loans)
    if (loan.status === 'active' && data.payments?.length) {
      document.getElementById('paymentTableArea').style.display = 'block';
      renderPaymentTable(data.payments, data.total, data.page);
    } else {
      document.getElementById('paymentTableArea').style.display = 'none';
    }
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

function renderPaymentTable(payments, total, page) {
  const now = new Date();
  const body = document.getElementById('paymentBody');
  const isAdmin = CURRENT_USER?.is_admin;

  body.innerHTML = payments.map(p => {
    const pDate = new Date(p.payment_date);
    const isFuture = pDate > now;
    const canRequest = p.status === 'pending' && !isFuture;
    const canApprove = p.status === 'requested' && isAdmin;

    let badge = '';
    if (isFuture && p.status === 'pending') badge = '<span class="status-badge future">예정</span>';
    else if (p.status === 'pending') badge = '<span class="status-badge pending">대기</span>';
    else if (p.status === 'requested') badge = '<span class="status-badge requested">요청됨</span>';
    else if (p.status === 'approved') badge = '<span class="status-badge approved">지급완료</span>';

    let reqCol = '—';
    if (canRequest) reqCol = `<button class="btn-request" onclick="requestPayment('${p.id}')">지급 요청</button>`;
    else if (p.status === 'requested') reqCol = '<span style="color:var(--cyan);font-size:.75rem">요청 완료</span>';
    else if (p.status === 'approved') reqCol = '<span style="color:var(--green);font-size:.75rem">✓</span>';

    let appCol = '—';
    if (canApprove) appCol = `<button class="btn-approve" onclick="approvePayment('${p.id}')">승인</button>`;
    else if (p.status === 'approved') appCol = '<span style="color:var(--green);font-size:.75rem">승인됨</span>';

    return `<tr><td style="font-family:var(--font-mono)">${p.day_number}</td><td>${formatDate(p.payment_date)}</td><td style="font-family:var(--font-mono);color:var(--gold)">${formatKRW(p.amount)}</td><td>${badge}</td><td>${reqCol}</td><td>${appCol}</td></tr>`;
  }).join('');

  // Pagination
  const pageSize = 15;
  const totalPages = Math.ceil(total / pageSize);
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  const maxShow = 7;
  let pStart = Math.max(1, page - 3);
  let pEnd = Math.min(totalPages, pStart + maxShow - 1);
  if (page > 1) html += `<button onclick="goPage(${page-1})">◀</button>`;
  for (let i = pStart; i <= pEnd; i++) html += `<button class="${i===page?'active':''}" onclick="goPage(${i})">${i}</button>`;
  if (page < totalPages) html += `<button onclick="goPage(${page+1})">▶</button>`;
  pag.innerHTML = html;
}

function goPage(p) { currentPage = p; loadDashboard(); }

async function requestPayment(paymentId) {
  try {
    const data = await api('/payment-request', 'POST', { payment_id: paymentId });
    showToast(data.message + ' (고객 & 운영자 이메일 발송)', 'success');
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

async function approvePayment(paymentId) {
  try {
    const data = await api('/payment-approve', 'POST', { payment_id: paymentId });
    showToast(data.message, 'success');
    loadDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

// ===== ESC KEY =====
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCityModal(); });

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.animation = 'fadeInUp .6s ease both'; observer.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.arch-card, .ia-feature, .roadmap-item, .flow-step').forEach(el => { el.style.opacity = '0'; observer.observe(el); });
