// POST /api/feedback — public: customer submits a rating + review, usually via
// the QR code on the thank-you card handed out at delivery.
// GET  /api/feedback — public: approved testimonials only, for the site's
// testimonials section (unapproved/pending feedback never leaks publicly).
import { json, err, cors } from '../_shared/auth.js';

function generateFeedbackId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FB-${date}-${rand}`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

// Public read — only ever returns admin-approved rows.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const featuredOnly = url.searchParams.get('featured') === 'true';
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50);

  const query = featuredOnly
    ? 'SELECT id, customer_name, plan_name, rating, message, created_at FROM feedback WHERE approved = 1 AND featured = 1 ORDER BY created_at DESC LIMIT ?'
    : 'SELECT id, customer_name, plan_name, rating, message, created_at FROM feedback WHERE approved = 1 ORDER BY created_at DESC LIMIT ?';
  const { results } = await env.DB.prepare(query).bind(limit).all();
  return json(results || []);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const { customer_name, customer_email, plan_name, rating, message, booking_id } = body;

  if (!customer_name?.trim()) return err('Name is required');
  if (!message?.trim())       return err('Please share a few words about your experience');
  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) return err('Rating must be between 1 and 5');

  const id  = generateFeedbackId();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO feedback (
      id, booking_id, customer_name, customer_email, plan_name, rating, message,
      approved, featured, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,0,0,?,?)
  `).bind(
    id, booking_id || null, customer_name.trim(), customer_email?.trim() || '',
    plan_name?.trim() || '', ratingNum, message.trim(), now, now
  ).run();

  return json({ id }, 201);
}
