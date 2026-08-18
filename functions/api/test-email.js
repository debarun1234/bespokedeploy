// GET /api/test-email — fires a test email and returns the raw Resend response.
// Always returns HTTP 200 with JSON — no imports so nothing can crash at module load.

export async function onRequestGet({ request, env }) {
  try {
    // ── Auth (inlined — no import needed) ──────────────────────────────────
    const auth  = request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return resp({ ok: false, error: 'Unauthorized — log in to admin first' });

    // Verify HMAC token
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', enc.encode(env.ADMIN_TOKEN_SECRET || ''),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sig      = await crypto.subtle.sign('HMAC', key, enc.encode(env.ADMIN_PASSWORD || ''));
      const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
      if (token !== expected) return resp({ ok: false, error: 'Unauthorized' });
    } catch {
      return resp({ ok: false, error: 'Auth check failed' });
    }

    // ── Config ─────────────────────────────────────────────────────────────
    const apiKey = env.RESEND_API_KEY  || null;
    const from   = env.RESEND_FROM     || null;
    const to     = env.RESEND_TO_OVERRIDE || 'debarun.ghosh.2024@gmail.com';

    if (!apiKey) {
      return resp({
        ok: false,
        error: 'RESEND_API_KEY is not set in Cloudflare Pages secrets.',
        hint:  'Run: wrangler pages secret put RESEND_API_KEY --project-name=bespokedeploy',
        sent_from: from, sent_to: to,
      });
    }
    if (!from) {
      return resp({
        ok: false,
        error: 'RESEND_FROM is not set in Cloudflare Pages secrets.',
        hint:  'Example value: BespokeDeploy <noreply@bespokedeploy.in>',
        api_key_prefix: apiKey.slice(0, 8) + '…',
        sent_to: to,
      });
    }

    // ── Send via Resend ────────────────────────────────────────────────────
    let resendStatus = null;
    let resendBody   = null;
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          subject: '🧪 BespokeDeploy — Email Test',
          html: `<div style="font-family:sans-serif;padding:24px;max-width:480px">
            <h2 style="color:#0F172A;margin:0 0 8px">Email test ✅</h2>
            <p style="color:#475569">Delivered from <strong>${from}</strong> to <strong>${to}</strong>.</p>
          </div>`,
        }),
      });
      resendStatus = r.status;
      resendBody   = await r.text();
    } catch (fetchErr) {
      return resp({
        ok: false,
        error: `Network error reaching Resend: ${fetchErr.message}`,
        api_key_prefix: apiKey.slice(0, 8) + '…',
        sent_from: from, sent_to: to,
      });
    }

    const ok = resendStatus >= 200 && resendStatus < 300;
    return resp({
      ok,
      error:           ok ? null : `Resend rejected the request (HTTP ${resendStatus})`,
      api_key_prefix:  apiKey.slice(0, 8) + '…',
      sent_from:       from,
      sent_to:         to,
      resend_status:   resendStatus,
      resend_response: resendBody,
    });

  } catch (e) {
    return resp({ ok: false, error: `Unexpected error: ${e?.message ?? String(e)}` });
  }
}

function resp(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
