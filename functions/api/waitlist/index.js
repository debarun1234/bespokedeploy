// POST /api/waitlist — public: join the waiting list when slots are full,
// or when a plan has been temporarily disabled by the admin.
import { json, err, cors } from '../../_shared/auth.js';
import { isUrgentAvailable } from '../../_shared/capacity.js';
import { notify } from '../../_shared/notify.js';
import { getSettings } from '../../_shared/settings.js';

function generateWaitlistId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WL-${date}-${rand}`;
}

const PLAN_NAMES = { portfolio: 'Portfolio', starter: 'Small Website', pro: 'Pro Website' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const {
    plan_id, customer_name, customer_email, customer_phone,
    customer_city, notes, is_urgent, reason,
  } = body;

  if (!plan_id)        return err('plan_id required');
  if (!customer_name)  return err('Name is required');
  if (!customer_email) return err('Email is required');
  if (!customer_phone) return err('Phone is required');

  const planName = PLAN_NAMES[plan_id] || plan_id;
  const signupReason = reason === 'unavailable' ? 'unavailable' : 'capacity';

  // Live price at time of signup — lets the admin alert email show the cost.
  let planPrice = null;
  try {
    const settings = await getSettings(env.DB);
    planPrice = settings[`plans.${plan_id}.price`] ?? null;
  } catch (e) {
    console.error('[waitlist] could not load price:', e?.message || e);
  }

  let urgent = 0;
  if (is_urgent) {
    const canUrgent = await isUrgentAvailable(env.DB);
    if (!canUrgent) {
      return err('Urgent requests are fully booked for this week — you can still join the regular waiting list.', 409);
    }
    urgent = 1;
  }

  const id  = generateWaitlistId();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO waitlist (
      id, plan_id, plan_name, plan_price, customer_name, customer_email, customer_phone,
      customer_city, notes, is_urgent, reason, status, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,'waiting',?,?)
  `).bind(
    id, plan_id, planName, planPrice, customer_name, customer_email, customer_phone,
    customer_city || '', notes || '', urgent, signupReason, now, now
  ).run();

  let emailDebug = { attempted: false, error: null };
  try {
    await notify(env, {
      id, plan_name: planName, plan_price: planPrice,
      customer_name, customer_email, customer_phone, customer_city, notes,
      is_urgent: !!urgent, reason: signupReason,
    }, 'waitlist_joined');
    emailDebug.attempted = true;
  } catch (e) {
    emailDebug.attempted = true;
    emailDebug.error = e?.message || String(e);
  }

  return json({ id, is_urgent: !!urgent, _email_debug: emailDebug }, 201);
}
