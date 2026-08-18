// GET /api/waitlist/invite/[token] — public: lets a notified waitlist
// customer's browser confirm their invite is valid and prefill the booking
// flow, without needing admin auth.
import { json, err, cors } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ env, params }) {
  const w = await env.DB.prepare('SELECT * FROM waitlist WHERE invite_token = ?').bind(params.token).first();
  if (!w) return err('Invalid invite link', 404);

  const valid = w.status === 'notified'
    && !!w.invite_expires_at
    && new Date(w.invite_expires_at) > new Date();

  return json({
    valid,
    status:            w.status,
    plan_id:           w.plan_id,
    plan_name:         w.plan_name,
    customer_name:     w.customer_name,
    customer_email:    w.customer_email,
    customer_phone:    w.customer_phone,
    customer_city:     w.customer_city,
    invite_expires_at: w.invite_expires_at,
  });
}
