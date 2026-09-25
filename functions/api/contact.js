// POST /api/contact — public: floating contact bubble on every page.
// Customer reports a concern/dispute; we email the admin immediately and
// send the customer a short acknowledgement. No DB write — this is a
// lightweight support channel, not part of the booking/waitlist pipeline.
import { json, err, cors } from '../_shared/auth.js';
import { notifyContact } from '../_shared/notify.js';
import { normalizePhone, checkPhoneToken } from '../_shared/otp.js';

function generateContactId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CT-${date}-${rand}`;
}

const CATEGORY_LABELS = {
  order:    'Placing an order',
  service:  'During service / build',
  delivery: 'Post-delivery',
  payment:  'Payment / refund',
  other:    'Something else',
};

// Mirrors the frontend gate in ContactBubble.jsx — enforced again here so
// this can't be bypassed by calling the API directly. Only genuine leads
// and existing customers can actually reach an inbox notification; anything
// else (course-project help, unrelated requests) is rejected before it ever
// gets emailed.
const PURPOSE_LABELS = {
  build:    'Wants a website built',
  existing: 'Existing customer',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const { name, email, phone, booking_id, category, message, purpose, phone_verify_token } = body;

  if (!PURPOSE_LABELS[purpose]) return err('This form is only for website-building inquiries and existing customers.');
  if (!name?.trim())    return err('Name is required');
  if (!email?.trim())   return err('Email is required');
  if (!phone?.trim())   return err('Phone is required');

  // Mirrors the frontend OTP gate in ContactBubble.jsx — enforced again here
  // so this can't be bypassed by calling the API directly. Unlike bookings.js
  // (where payment is already captured by the time this check runs), nothing
  // irreversible has happened yet here, so an unverified phone is a hard
  // reject rather than a warning.
  const phoneE164 = normalizePhone(phone);
  if (!phoneE164) return err('Enter a valid 10-digit Indian mobile number');
  if (!await checkPhoneToken(env, phoneE164, phone_verify_token)) {
    return err('Please verify your phone number before submitting.');
  }

  if (!message?.trim()) return err('Please describe your concern');

  const id = generateContactId();
  const categoryLabel = CATEGORY_LABELS[category] || 'Something else';
  const purposeLabel = PURPOSE_LABELS[purpose];

  let emailDebug = { attempted: false, error: null };
  try {
    await notifyContact(env, {
      id,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),
      booking_id: booking_id?.trim() || null,
      category: categoryLabel,
      purpose: purposeLabel,
      message: message.trim(),
    });
    emailDebug.attempted = true;
  } catch (e) {
    emailDebug.attempted = true;
    emailDebug.error = e?.message || String(e);
  }

  return json({ id, _email_debug: emailDebug }, 201);
}
