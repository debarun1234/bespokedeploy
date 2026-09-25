// POST /api/otp/send — public. Generates a 6-digit OTP and emails it to the
// given address (via Resend), while signing the proof against the customer's
// phone number — so the resulting otp_ref/token still verifies "this phone
// number" for bookings.js / contact.js, matching how the OTP gate has always
// worked; only the delivery channel is email instead of WhatsApp for now
// (see _shared/otp.js header for why). No OTP stored server-side.
import { json, err, cors } from '../../_shared/auth.js';
import { normalizePhone, genOtp, sendEmailOtp, signOtpRef } from '../../_shared/otp.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  try {
    const { phone, email } = await request.json().catch(() => ({}));
    const phoneE164 = normalizePhone(phone);
    if (!phoneE164) return err('Enter a valid 10-digit Indian mobile number');
    if (!email || !/\S+@\S+\.\S+/.test(String(email))) return err('Enter a valid email address to receive the code');

    const otp = genOtp();
    await sendEmailOtp(env, String(email).trim(), otp);
    const otp_ref = await signOtpRef(env, phoneE164, otp);
    return json({ ok: true, otp_ref });
  } catch (e) {
    console.error('[otp/send] error:', e?.message || e);
    return err(e?.message || 'Could not send code right now, please try again', 502);
  }
}
