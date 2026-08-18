// GET /api/admin/email-status — returns live email config.
// No imports — fully self-contained so nothing can crash at module load.

export async function onRequestGet({ request, env }) {
  try {
    // ── Auth (inlined) ─────────────────────────────────────────────────────
    const auth  = request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return resp({ error: 'Unauthorized' });

    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', enc.encode(env.ADMIN_TOKEN_SECRET || ''),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sig      = await crypto.subtle.sign('HMAC', key, enc.encode(env.ADMIN_PASSWORD || ''));
      const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
      if (token !== expected) return resp({ error: 'Unauthorized' });
    } catch {
      return resp({ error: 'Auth check failed' });
    }

    // ── Config ─────────────────────────────────────────────────────────────
    const apiKey   = env.RESEND_API_KEY     || null;
    const from     = env.RESEND_FROM        || null;
    const override = env.RESEND_TO_OVERRIDE || null;

    let mode = 'unknown';
    if (!apiKey) {
      mode = 'no_api_key';
    } else if (override) {
      mode = 'sandbox_override';
    } else if (!from || from.includes('onboarding@resend.dev')) {
      mode = 'sandbox_restricted';
    } else {
      mode = 'production';
    }

    return resp({
      api_key_set:    !!apiKey,
      api_key_prefix: apiKey ? apiKey.slice(0, 8) + '…' : null,
      from:           from     || null,
      to_override:    override || null,
      mode,
    });

  } catch (e) {
    return resp({ error: `Unexpected error: ${e?.message ?? String(e)}` });
  }
}

function resp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
