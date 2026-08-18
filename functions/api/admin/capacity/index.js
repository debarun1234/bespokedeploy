// GET /api/admin/capacity — admin only. Full capacity overview: settings,
// which bookings currently occupy a slot (with customer info), and a quick
// waitlist count so the Capacity tab doesn't need a second round trip.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getSettings } from '../../../_shared/settings.js';
import { getCapacityStatus, isUrgentAvailable } from '../../../_shared/capacity.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const settings = await getSettings(env.DB);
  const cap = await getCapacityStatus(env.DB, settings);
  const urgentAvailable = await isUrgentAvailable(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM waitlist WHERE status = 'waiting'`
  ).all();
  const waitingCount = results?.[0]?.n || 0;

  return json({
    maxSlots:          cap.maxSlots,
    slotDurationDays:  settings['capacity.slot_duration_days'] ?? 14,
    activeCount:       cap.activeCount,
    slotsAvailable:    cap.slotsAvailable,
    available:         cap.available,
    nextFreeAt:        cap.nextFreeAt,
    urgentAvailable,
    waitingCount,
    active: cap.active, // includes customer_name here — admin-only
  });
}
