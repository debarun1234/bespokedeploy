// ─── D1 query helpers ─────────────────────────────────────────────────────

export function generateBookingId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BD-${date}-${rand}`;
}

export async function createBooking(db, data, slotDurationDays = 14) {
  const now = new Date().toISOString();
  const id  = generateBookingId();
  const slotExpiresAt = new Date(Date.now() + slotDurationDays * 24 * 60 * 60 * 1000).toISOString();
  const baseCols = `
    id, plan_id, plan_name, plan_price, addons, hosting,
    total, advance, balance,
    customer_name, customer_email, customer_phone,
    customer_city, customer_timing, customer_notes,
    advance_payment_id, status, created_at, updated_at
  `;
  const baseVals = [
    id, data.plan_id, data.plan_name, data.plan_price,
    JSON.stringify(data.addons || []), data.hosting,
    data.total, data.advance, data.balance,
    data.customer_name, data.customer_email, data.customer_phone,
    data.customer_city || '', data.customer_timing || '', data.customer_notes || '',
    data.advance_payment_id || null,
    now, now,
  ];

  try {
    // Preferred: with slot_expires_at + promo columns (needs migrations/002
    // and migrations/007 applied)
    await db.prepare(`
      INSERT INTO bookings (${baseCols}, slot_expires_at, promo_code, discount_amount)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?,?,?,?,?)
    `).bind(...baseVals, slotExpiresAt, data.promo_code || null, data.discount_amount || 0).run();
  } catch (e) {
    // Fallback for a DB that hasn't run those migrations yet — the booking
    // (and the customer's payment) must still be saved.
    console.error('[createBooking] full insert failed, falling back:', e?.message || e);
    await db.prepare(`
      INSERT INTO bookings (${baseCols})
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?,?)
    `).bind(...baseVals).run();
  }
  return id;
}

// Admin manually frees a booking's capacity slot early (project wrapped up
// ahead of the usual 14-day window, or wants to make room for new work).
export async function freeSlot(db, id) {
  const now = new Date().toISOString();
  await db.prepare('UPDATE bookings SET slot_freed_at = ? WHERE id = ?').bind(now, id).run();
}

// Admin "reset counter" — force-frees every currently occupied slot.
export async function resetAllSlots(db) {
  const now = new Date().toISOString();
  await db.prepare('UPDATE bookings SET slot_freed_at = ? WHERE slot_freed_at IS NULL').bind(now).run();
}

export async function getBooking(db, id) {
  const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
  return row ? parse(row) : null;
}

export async function listBookings(db, status = null) {
  // Auto-complete review bookings older than 7 days
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(`
    UPDATE bookings SET status = 'complete', updated_at = ?
    WHERE status = 'review' AND review_started_at IS NOT NULL AND review_started_at < ?
  `).bind(new Date().toISOString(), cutoff).run();

  const query = status
    ? 'SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM bookings ORDER BY created_at DESC';
  const { results } = status
    ? await db.prepare(query).bind(status).all()
    : await db.prepare(query).all();
  return (results || []).map(parse);
}

export async function updateStatus(db, id, status, extra = {}) {
  const now   = new Date().toISOString();
  const sets  = ['status = ?', 'updated_at = ?'];
  const vals  = [status, now];
  if (status === 'review') { sets.push('review_started_at = ?'); vals.push(now); }
  // Free the capacity slot as soon as the project is done (either way)
  if (status === 'complete' || status === 'cancelled') { sets.push('slot_freed_at = ?'); vals.push(now); }
  if (extra.final_payment_link_id) { sets.push('final_payment_link_id = ?'); vals.push(extra.final_payment_link_id); }
  if (extra.final_payment_link)    { sets.push('final_payment_link = ?');    vals.push(extra.final_payment_link); }
  if (extra.final_payment_id)      { sets.push('final_payment_id = ?');      vals.push(extra.final_payment_id); }
  if (extra.cancel_reason)         { sets.push('cancel_reason = ?');         vals.push(extra.cancel_reason); }
  vals.push(id);
  await db.prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
}

export async function getMetrics(db) {
  const now    = new Date().toISOString();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(`
    UPDATE bookings SET status = 'complete', updated_at = ?
    WHERE status = 'review' AND review_started_at IS NOT NULL AND review_started_at < ?
  `).bind(now, cutoff).run();

  const { results } = await db.prepare('SELECT status, total, advance, balance FROM bookings').all();
  const active = ['new','contacting','in_progress','awaiting_payment','review'];

  let totalRevenue = 0, pendingBalance = 0, activeCount = 0, completedCount = 0;
  for (const r of results || []) {
    if (r.status === 'cancelled') continue;
    totalRevenue += r.advance;
    if (r.status === 'complete') { totalRevenue += r.balance; completedCount++; }
    if (active.includes(r.status)) { pendingBalance += r.balance; activeCount++; }
  }
  const byStatus = {};
  for (const r of results || []) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  return { totalRevenue, pendingBalance, activeCount, completedCount, byStatus, total: results?.length || 0 };
}

function parse(row) {
  return { ...row, addons: JSON.parse(row.addons || '[]') };
}
