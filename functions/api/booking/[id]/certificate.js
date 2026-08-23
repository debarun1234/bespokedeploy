// POST /api/booking/[id]/certificate — admin only.
// Records ownership-certificate metadata on the booking and emails the PDF
// (built client-side in the admin dashboard with jsPDF) to the customer as
// an attachment.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getBooking } from '../../../_shared/db.js';
import { notifyCertificate } from '../../../_shared/notify.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env, params }) {
  // Top-level guard: never let an uncaught throw produce an opaque Cloudflare
  // HTML/500 page with no detail — always resolve to a readable JSON error.
  try {
    return await handleCertificate(request, env, params);
  } catch (e) {
    console.error('[certificate] uncaught error:', e?.message || e, e?.stack);
    return err(`Server error: ${e?.message || 'unknown'}`, 500);
  }
}

async function handleCertificate(request, env, params) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const { client_name, website_name, website_url, certificate_id, pdf_base64 } = body;
  if (!client_name?.trim())  return err('client_name required');
  if (!website_name?.trim()) return err('website_name required');
  if (!website_url?.trim())  return err('website_url required');
  if (!certificate_id)       return err('certificate_id required');
  if (!pdf_base64)           return err('pdf_base64 required');

  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      UPDATE bookings
      SET certificate_id = ?, certificate_issued_at = ?, cert_website_name = ?, cert_website_url = ?, updated_at = ?
      WHERE id = ?
    `).bind(certificate_id, now, website_name.trim(), website_url.trim(), now, params.id).run();
  } catch (e) {
    // Most likely cause: migrations/005_certificate.sql hasn't been run on
    // this DB yet, so the cert_* columns don't exist. Don't block sending
    // the certificate email over a metadata-storage failure — just log it
    // and fall back to touching updated_at only.
    console.error('[certificate] cert column update failed (migration 005 applied?):', e?.message || e);
    try {
      await env.DB.prepare('UPDATE bookings SET updated_at = ? WHERE id = ?').bind(now, params.id).run();
    } catch (e2) {
      console.error('[certificate] fallback update also failed:', e2?.message || e2);
    }
  }

  try {
    await notifyCertificate(env, {
      customer_email: booking.customer_email,
      client_name:    client_name.trim(),
      website_name:   website_name.trim(),
      website_url:    website_url.trim(),
      certificate_id,
      pdf_base64,
    });
  } catch (e) {
    console.error('[certificate] email failed:', e?.message || e, e?.stack);
    return err(`Certificate saved, but the email failed to send: ${e?.message || 'unknown error'}`, 502);
  }

  return json({ ok: true });
}
