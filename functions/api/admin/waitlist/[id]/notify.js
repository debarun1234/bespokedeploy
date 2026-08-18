// POST /api/admin/waitlist/[id]/notify — admin only.
// A slot opened up — notify this waitlisted customer with a time-limited
// invite link that lets them pay the advance and claim it, bypassing the
// normal capacity block for 48 hours.
import { json, err, requireAdmin, cors } from '../../../../_shared/auth.js';
import { notify } from '../../../../_shared/notify.js';

const INVITE_WINDOW_HOURS = 48;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const w = await env.DB.prepare('SELECT * FROM waitlist WHERE id = ?').bind(params.id).first();
  if (!w) return err('Waitlist entry not found', 404);
  if (w.status !== 'waiting') return err(`Cannot notify — entry is already '${w.status}'`);

  const token     = crypto.randomUUID();
  const now       = new Date().toISOString();
  const expiresAt = new Date(Date.now() + INVITE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(`
    UPDATE waitlist
    SET status = 'notified', invite_token = ?, invite_expires_at = ?, notified_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(token, expiresAt, now, now, params.id).run();

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/?invite=${token}`;

  let emailDebug = { attempted: false, error: null };
  try {
    await notify(env, {
      id: w.id,
      plan_name: w.plan_name,
      customer_name: w.customer_name,
      customer_email: w.customer_email,
      customer_phone: w.customer_phone,
      invite_url: inviteUrl,
      invite_expires_at: expiresAt,
    }, 'waitlist_slot_open');
    emailDebug.attempted = true;
  } catch (e) {
    emailDebug.attempted = true;
    emailDebug.error = e?.message || String(e);
  }

  return json({ ok: true, invite_token: token, invite_url: inviteUrl, invite_expires_at: expiresAt, _email_debug: emailDebug });
}
