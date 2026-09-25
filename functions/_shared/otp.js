// ─── Phone OTP verification — sent via email ───────────────────────────────────
// WhatsApp Authentication-template sending is currently gated by Meta behind a
// business-messaging-volume requirement (2,000 delivered messages to unique
// users within 30 days) that a brand-new WABA hasn't crossed yet — see
// sendWhatsappOtp() below, kept for when that unlocks. Until then, the code is
// emailed via Resend (already wired up in notify.js) to the customer's email
// address instead, but the verification "identity" this proves stays the
// phone number — the ref/token are still keyed on phoneE164 — so bookings.js
// and contact.js need no changes at all; only the delivery channel moved.
//
// It has no built-in OTP generate/verify service, so we own the code lifecycle
// ourselves. To avoid a database round trip (and a table of live OTPs to clean
// up), the code's proof travels as a signed, opaque "otp_ref" that the client
// carries from /send to /verify. The ref only contains an HMAC(secret,
// phone|otp|expiry) — without ADMIN_TOKEN_SECRET it can't be brute-forced
// offline even if intercepted, so leaking it back to the client is safe. Once
// verified, we mint the existing short-lived phone-verification token (same
// mechanism as admin auth) so the checkout flow can prove "this phone was
// verified in the last few minutes."

const WA_API_VERSION = 'v20.0';
const OTP_TTL_MS = 5 * 60 * 1000;    // how long a sent code stays valid
const TOKEN_TTL_MS = 20 * 60 * 1000; // how long a verified phone stays trusted (form + payment)

// Normalizes to "91XXXXXXXXXX" (India only, matching the rest of this app's
// assumptions). Returns null if it doesn't look like a valid 10-digit Indian
// mobile number.
export function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(1);
  if (digits.length === 10) digits = '91' + digits;
  if (digits.length !== 12 || !digits.startsWith('91')) return null;
  const local = digits.slice(2);
  if (!/^[6-9]\d{9}$/.test(local)) return null; // valid Indian mobile prefixes
  return digits;
}

export function genOtp() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, '0');
}

// Sends `otp` to `email` via Resend (reuses notify.js's mailer/branding).
// Throws on any failure — the caller must not treat a thrown error as "code sent."
export async function sendEmailOtp(env, email, otp) {
  const { notifyOtp } = await import('./notify.js');
  await notifyOtp(env, email, otp);
}

// Sends `otp` to `phoneE164` as a WhatsApp template message. Requires a
// Meta-approved Authentication-category template (default name
// "otp_verification", override via WA_OTP_TEMPLATE_NAME) with one body
// variable for the code. Throws on any failure — the caller must not treat
// a thrown error as "code sent." Currently unused (see file header) — kept
// ready to swap back in once the Meta Authentication template unlocks.
export async function sendWhatsappOtp(env, phoneE164, otp) {
  if (!env.WA_ACCESS_TOKEN || !env.WA_PHONE_NUMBER_ID) {
    throw new Error('WA_ACCESS_TOKEN / WA_PHONE_NUMBER_ID not configured');
  }
  const templateName = env.WA_OTP_TEMPLATE_NAME || 'otp_verification';
  const res = await fetch(
    `https://graph.facebook.com/${WA_API_VERSION}/${env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneE164,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [
            { type: 'body', parameters: [{ type: 'text', text: otp }] },
            // Standard Meta auth-template "copy code" button — safe to include
            // even if the approved template has no button component.
            { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
          ],
        },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `WhatsApp send failed (HTTP ${res.status})`);
  }
  return data;
}

async function hmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Builds the tamper-proof ref the client carries between send → verify.
// Format: "<expiryMs>.<base64 hmac>" where hmac = HMAC(secret, phone|otp|expiry).
export async function signOtpRef(env, phoneE164, otp) {
  const expires = Date.now() + OTP_TTL_MS;
  const proof = await hmac(env.ADMIN_TOKEN_SECRET, `${phoneE164}|${otp}|${expires}`);
  return `${expires}.${proof}`;
}

export async function checkOtpRef(env, phoneE164, otp, ref) {
  if (!ref || typeof ref !== 'string' || !ref.includes('.')) return false;
  if (!/^\d{6}$/.test(String(otp || ''))) return false;
  const [expiresStr, proof] = ref.split('.');
  const expires = Number(expiresStr);
  if (!expires || Date.now() > expires) return false;
  const expected = await hmac(env.ADMIN_TOKEN_SECRET, `${phoneE164}|${otp}|${expires}`);
  return proof === expected;
}

// Signed proof that `phone` passed OTP verification recently. Format:
// "<expiryMs>.<base64 hmac>" — stateless, no DB row needed.
export async function signPhoneToken(env, phoneE164) {
  const expires = Date.now() + TOKEN_TTL_MS;
  const sig = await hmac(env.ADMIN_TOKEN_SECRET, `${phoneE164}|${expires}`);
  return `${expires}.${sig}`;
}

export async function checkPhoneToken(env, phoneE164, token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [expiresStr, sig] = token.split('.');
  const expires = Number(expiresStr);
  if (!expires || Date.now() > expires) return false;
  const expected = await hmac(env.ADMIN_TOKEN_SECRET, `${phoneE164}|${expires}`);
  return sig === expected;
}
