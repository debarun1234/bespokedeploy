// PATCH  /api/admin/promos/[id] — admin only. Update any field, incl. on/off toggle.
// DELETE /api/admin/promos/[id] — admin only. Remove a promo permanently.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';

const THEMES  = ['accent', 'gold', 'green', 'purple'];
const DISCOUNT_TYPES = ['percent', 'flat'];
const FIELDS  = ['badge_text', 'title', 'subtitle', 'code', 'theme', 'enabled', 'starts_at', 'ends_at', 'discount_type', 'discount_value'];

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPatch({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const body = await request.json().catch(() => ({}));
  if (body.theme !== undefined && !THEMES.includes(body.theme)) {
    return err(`theme must be one of: ${THEMES.join(', ')}`);
  }
  if (body.title !== undefined && !body.title?.trim()) return err('Title cannot be empty');
  if (body.discount_type !== undefined && !DISCOUNT_TYPES.includes(body.discount_type)) {
    return err(`discount_type must be one of: ${DISCOUNT_TYPES.join(', ')}`);
  }
  if (body.discount_value !== undefined && (isNaN(Number(body.discount_value)) || Number(body.discount_value) < 0)) {
    return err('discount_value must be a non-negative number');
  }

  const sets = [];
  const vals = [];
  for (const f of FIELDS) {
    if (body[f] === undefined) continue;
    sets.push(`${f} = ?`);
    if (f === 'enabled')             vals.push(body[f] ? 1 : 0);
    else if (typeof body[f] === 'string') vals.push(body[f].trim());
    else                              vals.push(body[f]);
  }
  if (!sets.length) return err('Nothing to update');

  sets.push('updated_at = ?');
  vals.push(new Date().toISOString());
  vals.push(params.id);

  await env.DB.prepare(`UPDATE promos SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  await env.DB.prepare('DELETE FROM promos WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
