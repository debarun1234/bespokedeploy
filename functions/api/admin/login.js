import { json, err, createToken, cors } from '../../_shared/auth.js';
import { hashPassword } from '../../_shared/settings.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  const { password } = await request.json().catch(() => ({}));
  if (!password) return err('Password required');

  // Check D1 for a changed password hash first
  let isCorrect = false;
  try {
    const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'admin.password_hash'").first();
    if (row?.value) {
      const stored = JSON.parse(row.value);
      const hash   = await hashPassword(password);
      isCorrect = hash === stored;
    }
  } catch (_) { /* D1 not ready yet — fall through to env */ }

  // Fall back to env secret (initial setup / before password was changed in UI)
  if (!isCorrect) {
    isCorrect = password === env.ADMIN_PASSWORD;
  }

  if (!isCorrect) return err('Invalid password', 401);

  const token = await createToken(env);
  return json({ token });
}
