// GET /api/capacity — public. Lets the customer-facing site show whether
// project slots are open right now, and roughly when the next one frees up.
import { json, cors } from '../_shared/auth.js';
import { getSettings } from '../_shared/settings.js';
import { getCapacityStatus, isUrgentAvailable } from '../_shared/capacity.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ env }) {
  const settings = await getSettings(env.DB);

  // Fail OPEN — if the capacity tables/columns aren't migrated yet (or any
  // other DB hiccup), the site should just behave as if slots are open
  // rather than break the plans section.
  try {
    const cap = await getCapacityStatus(env.DB, settings);
    const urgentAvailable = await isUrgentAvailable(env.DB);
    return json({
      maxSlots:       cap.maxSlots,
      activeCount:    cap.activeCount,
      slotsAvailable: cap.slotsAvailable,
      available:      cap.available,
      nextFreeAt:     cap.nextFreeAt,
      urgentAvailable,
      // No customer PII on the public endpoint — just what's occupying slots
      active: cap.active.map(a => ({ plan_name: a.plan_name, slot_expires_at: a.slot_expires_at })),
    });
  } catch (e) {
    console.error('[capacity] status check failed, reporting open:', e?.message || e);
    const maxSlots = settings['capacity.max_slots'] ?? 2;
    return json({
      maxSlots, activeCount: 0, slotsAvailable: maxSlots, available: true,
      nextFreeAt: null, urgentAvailable: true, active: [],
    });
  }
}
