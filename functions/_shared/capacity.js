// ─── Capacity — limits how many projects can be active at once ──────────────
// A booking occupies a "slot" from the moment it's created (advance already
// paid at that point — see functions/api/bookings.js) until:
//   - its slot_expires_at passes (auto-freed, lazily, on next read), or
//   - status becomes complete/cancelled, or
//   - admin manually frees it early (see booking/[id]/free-slot.js)

// Lazily free any slots whose time has passed or whose booking is done.
// Called before every capacity read so we never need a cron job.
async function sweepExpiredSlots(db) {
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE bookings SET slot_freed_at = ?
    WHERE slot_freed_at IS NULL AND slot_expires_at IS NOT NULL AND slot_expires_at < ?
  `).bind(now, now).run();
  await db.prepare(`
    UPDATE bookings SET slot_freed_at = ?
    WHERE slot_freed_at IS NULL AND status IN ('complete', 'cancelled')
  `).bind(now).run();
}

// Bookings currently occupying a slot, soonest-to-free first.
export async function getActiveSlotBookings(db) {
  await sweepExpiredSlots(db);
  const { results } = await db.prepare(`
    SELECT id, plan_id, plan_name, customer_name, status, created_at, slot_expires_at
    FROM bookings
    WHERE slot_freed_at IS NULL AND slot_expires_at IS NOT NULL
    ORDER BY slot_expires_at ASC
  `).all();
  return results || [];
}

export async function getCapacityStatus(db, settings) {
  const maxSlots = settings['capacity.max_slots'] ?? 2;
  const active = await getActiveSlotBookings(db);
  const slotsAvailable = Math.max(0, maxSlots - active.length);
  return {
    maxSlots,
    activeCount: active.length,
    slotsAvailable,
    available: slotsAvailable > 0,
    nextFreeAt: active.length ? active[0].slot_expires_at : null,
    active,
  };
}

// Only 1 urgent waitlist flag can be "live" in any rolling 7-day window.
export async function isUrgentAvailable(db) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const row = await db.prepare(`
    SELECT id FROM waitlist
    WHERE is_urgent = 1 AND status != 'cancelled' AND created_at > ?
    LIMIT 1
  `).bind(cutoff).first();
  return !row;
}

// Validate an invite token lets its holder bypass a full-capacity block.
export async function checkInviteBypass(db, inviteToken) {
  if (!inviteToken) return false;
  const w = await db.prepare(`
    SELECT id, invite_expires_at FROM waitlist
    WHERE invite_token = ? AND status = 'notified'
  `).bind(inviteToken).first();
  if (!w || !w.invite_expires_at) return false;
  return new Date(w.invite_expires_at) > new Date();
}
