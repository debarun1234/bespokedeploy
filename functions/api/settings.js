// GET /api/settings — public endpoint, returns plan prices + site content
import { json, cors } from '../_shared/auth.js';
import { getSettings, structureSettings } from '../_shared/settings.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ env }) {
  const flat = await getSettings(env.DB);
  return json(structureSettings(flat));
}
