// ─── Admin auth helpers ───────────────────────────────────────────────────
// Token = HMAC-SHA256(ADMIN_PASSWORD, ADMIN_TOKEN_SECRET)
// Stable per password — no expiry by design (solo admin, simple setup)

export function cors(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}

async function makeToken(password, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function createToken(env) {
  return makeToken(env.ADMIN_PASSWORD, env.ADMIN_TOKEN_SECRET);
}

export async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return false;
  const expected = await createToken(env);
  return token === expected;
}
