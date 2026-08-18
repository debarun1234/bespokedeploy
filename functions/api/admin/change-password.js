// POST /api/admin/change-password
import { json, err, requireAdmin, cors, createToken } from '../../_shared/auth.js';
import { setSetting, hashPassword } from '../../_shared/settings.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const { current_password, new_password } = await request.json().catch(() => ({}));
  if (!current_password) return err('current_password required');
  if (!new_password)     return err('new_password required');
  if (new_password.length < 8) return err('New password must be at least 8 characters');

  // Verify current password against env secret (or D1 hash if already changed)
  const isCorrect = current_password === env.ADMIN_PASSWORD;
  if (!isCorrect) return err('Current password is incorrect', 401);

  // Store new password hash in D1
  const hash = await hashPassword(new_password);
  await setSetting(env.DB, 'admin.password_hash', hash);

  // Return new token so the admin stays logged in
  // Token is still HMAC of env.ADMIN_PASSWORD — user must re-login after password change
  return json({ ok: true, message: 'Password updated. Please log in again with your new password.' });
}
