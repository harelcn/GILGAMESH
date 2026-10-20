// sb.mjs · tiny Supabase REST client for the local tools (publish / watch). Reads SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY from the environment; never prints them.
const URL_ = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!URL_ || !KEY) { console.error('חסרים משתני הסביבה SUPABASE_URL ו-SUPABASE_SERVICE_ROLE_KEY במחשב הזה.'); process.exit(2); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

export async function rest(method, pathq, body, prefer) {
  const r = await fetch(`${URL_}/rest/v1/${pathq}`, { method, headers: { ...H, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${pathq.split('?')[0]}: ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}
export async function exists(path) {
  const r = await fetch(`${URL_}/storage/v1/object/info/review/${encodeURI(path)}`, { headers: H });
  return r.ok;
}
export async function put(path, buf, type) {
  const r = await fetch(`${URL_}/storage/v1/object/review/${encodeURI(path)}`, { method: 'POST', headers: { ...H, 'Content-Type': type, 'x-upsert': 'true' }, body: buf });
  if (!r.ok) throw new Error(`upload ${path}: ${r.status} ${(await r.text()).slice(0, 300)}`);
}
export async function list(prefix) {             // every file under a folder (recursive)
  const out = [];
  const r = await fetch(`${URL_}/storage/v1/object/list/review`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix, limit: 1000 }) });
  if (!r.ok) return out;
  for (const it of await r.json()) {
    const p = prefix.replace(/\/$/, '') + '/' + it.name;
    if (it.id) out.push(p); else out.push(...await list(p));
  }
  return out;
}
export async function remove(paths) {
  for (let i = 0; i < paths.length; i += 100) {
    const r = await fetch(`${URL_}/storage/v1/object/review`, { method: 'DELETE', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: paths.slice(i, i + 100) }) });
    if (!r.ok) throw new Error(`delete: ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
}
export async function get(path) {
  const r = await fetch(`${URL_}/storage/v1/object/review/${encodeURI(path)}`, { headers: H });
  if (!r.ok) throw new Error(`download ${path}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
