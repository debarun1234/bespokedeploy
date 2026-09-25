// POST /api/otp/verify — public. Checks the submitted code against the
// signed otp_ref from /api/otp/send (HMAC proof, no DB lookup); on success,
// mints a short-lived signed token proving this exact phone number was just
// verified, which the frontend carries through the rest of checkout.
import { json, err, cors } from '../../_shared/auth.js';
import { normalizePhone, checkOtpRef, signPhoneToken } from '../../_shared/otp.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  try {
    const { phone, otp, otp_ref } = await request.json().catch(() => ({}));
    const phoneE164 = normalizePhone(phone);
    if (!phoneE164) return err('Enter a valid 10-digit Indian mobile number');
    if (!otp || !/^\d{4,9}$/.test(String(otp))) return err('Enter the code you received');

    const ok = await checkOtpRef(env, phoneE164, String(otp).trim(), otp_ref);
    if (!ok) return err('That code is incorrect or has expired', 400);

    const token = await signPhoneToken(env, phoneE164);
    return json({ ok: true, token });
  } catch (e) {
    console.error('[otp/verify] error:', e?.message || e);
    return err(e?.message || 'Could not verify right now, please try again', 502);
  }
}
