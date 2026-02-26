const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Lazy initialization - 함수 호출 시점에 환경변수 읽기
let _supabase = null;
let _resend = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const getJwtSecret = () => process.env.JWT_SECRET;
const getAdminEmail = () => process.env.ADMIN_EMAIL;
const getSiteUrl = () => process.env.SITE_URL || 'https://your-site.netlify.app';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function respond(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function verifyToken(event) {
  const auth = event.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), getJwtSecret());
  } catch { return null; }
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

async function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

function formatKRW(n) {
  return '₩' + Number(n).toLocaleString('ko-KR');
}

function formatDate(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')}`;
}

module.exports = {
  getSupabase, getResend, headers, respond, verifyToken,
  generateCode, hashPassword, comparePassword, createToken,
  formatKRW, formatDate,
  getAdminEmail, getSiteUrl
};
