// cloud.js · the review room on Supabase (Harel 20.10.2026: "שיהיה לי זמין גם בטלפון וגם לשותף שלי")
// Replaces the local room server: the same routes (data · frame · note · lanes · edit · submit · waveform) answered from
// Supabase tables + one private storage bucket. Frames are grabbed in the browser from the film itself.
// Roles: owner (edits, sends to Claude) · collaborator (sees everything, comments and draws, never sends) · pending.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const CFG = window.ROOM_CONFIG || {};
export const sb = createClient(CFG.url, CFG.anon, { auth: { persistSession: true, autoRefreshToken: true } });
const BUCKET = 'review';

export let me = null;          // { id, email, name, role }
let version = null;            // versions row
const signed = new Map();      // storage path -> signed url (or blob url for frames made here)

// ---------- session ----------
export async function requireMember() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace('./?next=' + encodeURIComponent(location.pathname + location.search)); throw new Error('לא מחובר'); }
  const { data: p, error } = await sb.from('profiles').select('id,email,display_name,role').eq('id', session.user.id).single();
  if (error || !p) throw new Error('הפרופיל לא נמצא. נסו להתחבר מחדש.');
  me = { id: p.id, email: p.email, name: p.display_name || p.email.split('@')[0], role: p.role };
  if (me.role === 'pending') throw Object.assign(new Error('החשבון שלך ממתין לאישור של הראל.'), { pending: true });
  return me;
}
export const isOwner = () => me?.role === 'owner';
export async function signOut() { await sb.auth.signOut(); location.replace('./'); }

// ---------- files ----------
const pathOf = (rel) => (version?.model.fileMap || {})[rel] || rel;
export function FILE(rel) { return signed.get(pathOf(rel)) || ''; }
export async function sign(paths) {
  const need = [...new Set(paths.filter(Boolean).map(pathOf))].filter((p) => !signed.has(p));
  for (let i = 0; i < need.length; i += 100) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(need.slice(i, i + 100), 60 * 60 * 12);
    if (error) throw error;
    for (const d of data || []) if (d.signedUrl) signed.set(d.path, d.signedUrl);
  }
}
async function upload(path, blob, type) {
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: true });
  if (error) throw error;
}

// ---------- model helpers ----------
function anchor(model, frame, scope = 'frame') {
  const seg = (model.segments || []).find((s) => frame >= s.startFrame && frame < s.endFrame);
  return { frameIndex: frame, time: frame / model.fps, scope, segmentId: seg?.id ?? null, shotId: seg?.shot ?? null,
    sourceFile: seg?.file ?? null, sourceTime: seg ? seg.sourceIn + (frame - seg.startFrame) / model.fps : null,
    segmentRange: seg ? { fromFrame: seg.startFrame, toFrameExclusive: seg.endFrame } : null, cut: null };
}
function noteOut(r) {
  return { id: r.id, revision: r.revision, intent: r.intent, filmSha256: version.sha256, filmFile: version.model.file, ...r.anchor,
    frameIndex: r.frame_index, scope: r.scope, baseFrame: r.base_frame, annotatedFrame: r.annotated_frame, text: r.text,
    drawings: r.drawings || [], layout: r.layout, archived: r.archived, createdAt: r.created_at, updatedAt: r.updated_at,
    author: r.author_email, authorId: r.author_id, submissionId: r.submission_id };
}
const err = (msg, status, body) => Object.assign(new Error(msg), { status, body });
const nowIso = () => new Date().toISOString();
let loadedAt = nowIso();

// ---------- frame grab (in the browser, from the review copy of the film) ----------
let grabV = null;
async function grabFrame(f) {
  if (!grabV) {
    grabV = document.createElement('video');
    Object.assign(grabV, { muted: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
    grabV.src = FILE(version.model.file);
    await new Promise((ok, no) => { grabV.onloadeddata = ok; grabV.onerror = () => no(new Error('הסרט לא נטען לשליפת פריים')); });
  }
  await new Promise((ok) => { grabV.onseeked = ok; grabV.currentTime = (f + 0.5) / version.model.fps; });
  const c = document.createElement('canvas'); c.width = version.model.width; c.height = version.model.height;
  c.getContext('2d').drawImage(grabV, 0, 0, c.width, c.height);
  return await new Promise((ok) => c.toBlob(ok, 'image/png'));
}

// ---------- the room's routes ----------
const vparam = () => new URLSearchParams(location.search).get('version');
async function loadVersion() {
  let q = sb.from('versions').select('*');
  q = vparam() ? q.eq('id', vparam()) : q.eq('is_current', true).order('created_at', { ascending: false }).limit(1);
  const { data, error } = await q;
  if (error) throw error;
  if (!data?.length) throw new Error('עוד לא הועלתה גרסה לחדר.');
  version = data[0];
  const { data: all } = await sb.from('versions').select('id,label,created_at').eq('project_id', version.project_id).order('created_at');
  version.model.versions = (all || []).map((v) => ({ id: v.id, label: v.label })).reverse();
  version.model.version = version.id;
  return version;
}
export const currentVersion = () => version;

export async function cloudReq(route, body, q = '') {
  if (route === 'data') {
    if (!version) await loadVersion();
    const vid = version.id;
    const [notes, lanes, edit, subs] = await Promise.all([
      sb.from('notes').select('*').eq('version_id', vid).order('created_at'),
      sb.from('lane_states').select('*').eq('version_id', vid).maybeSingle(),
      sb.from('edit_states').select('*').eq('version_id', vid).maybeSingle(),
      sb.from('submissions').select('id,created_at,status').eq('version_id', vid).order('created_at'),
    ]);
    for (const r of [notes, lanes, edit, subs]) if (r.error) throw r.error;
    const m = version.model;
    await sign([m.file, ...Object.keys(m.fileMap || {}), ...(notes.data || []).flatMap((n) => [n.base_frame, n.annotated_frame])]);
    loadedAt = nowIso();
    const ls = lanes.data?.state || {};
    return {
      model: m,
      state: { revision: 0, notes: (notes.data || []).map(noteOut), submissions: (subs.data || []).map((s) => ({ requestId: s.id, at: s.created_at, status: s.status })) },
      edit: { revision: edit.data?.revision || 0, cuts: [], removes: [], frames: [], guides: [], swaps: [], ...(edit.data?.state || {}) },
      delivery: [],
      lanes: m.lanes ? { revision: lanes.data?.revision || 0, items: ls.items || {}, ranges: ls.ranges || [], general: ls.general || '', generalUpdatedAt: ls.generalUpdatedAt || null } : undefined,
    };
  }
  if (route === 'frame') {
    const f = body.frameIndex, path = `notes/${version.id}/frames/${String(f).padStart(6, '0')}.png`;
    if (!signed.has(path)) {
      const blob = await grabFrame(f);
      signed.set(path, URL.createObjectURL(blob));
      upload(path, blob, 'image/png').catch(() => {});  // shared copy for the partner and for Claude
    }
    return { ...anchor(version.model, f, body.scope), file: path };
  }
  if (route === 'note') {
    const { data: old } = await sb.from('notes').select('*').eq('id', body.id).maybeSingle();
    if ((old?.revision || 0) !== body.revision) throw err('ההערה עודכנה בחלון אחר. פתחו אותה מחדש לפני עדכון.', 409);
    const revision = (old?.revision || 0) + 1, f = body.frameIndex;
    const base = `notes/${version.id}/frames/${String(f).padStart(6, '0')}.png`;
    if (!old) { try { await upload(base, await (await fetch(FILE(base) || '')).blob(), 'image/png'); } catch { try { await upload(base, await grabFrame(f), 'image/png'); } catch {} } }
    let annotated = old?.annotated_frame || null;
    if (body.preview) {
      annotated = `notes/${version.id}/annotations/${body.id}-v${revision}.png`;
      const blob = await (await fetch(body.preview)).blob();
      await upload(annotated, blob, 'image/png'); signed.set(annotated, URL.createObjectURL(blob));
    }
    const row = { id: body.id, version_id: version.id, revision, frame_index: f, scope: body.scope || 'frame', intent: body.intent || old?.intent || 'note',
      text: String(body.text || '').slice(0, 20000), drawings: body.drawings || [], layout: body.layout ?? null, anchor: anchor(version.model, f, body.scope),
      base_frame: base, annotated_frame: annotated, archived: !!body.archived, updated_at: nowIso() };
    const res = old ? await sb.from('notes').update(row).eq('id', body.id).select().single()
                    : await sb.from('notes').insert({ ...row, author_id: me.id, author_email: me.email }).select().single();
    if (res.error) throw res.error;
    return { note: noteOut(res.data), stateRevision: revision };
  }
  if (route === 'lanes') {
    const { data: cur } = await sb.from('lane_states').select('*').eq('version_id', version.id).maybeSingle();
    const curState = cur?.state || { items: {}, ranges: [], general: '' }, curRev = cur?.revision || 0, t = nowIso();
    // merge instead of refusing: the partner and the owner write range notes at the same time
    const ranges = (body.ranges || []).map((r) => { const o = (curState.ranges || []).find((x) => x.id === r.id);
      const same = o && o.fromFrame === r.fromFrame && o.toFrame === r.toFrame && o.text === r.text;
      return { ...r, by: o?.by || me.email, updatedAt: same ? o.updatedAt : t }; });
    for (const o of curState.ranges || []) if (!ranges.some((r) => r.id === o.id) && o.by !== me.email && (o.updatedAt || '') > loadedAt) ranges.push(o);
    const items = { ...(curRev !== body.revision ? curState.items : {}) };
    for (const [id, d] of Object.entries(body.items || {})) { const o = curState.items?.[id]; items[id] = { ...d, updatedAt: o && JSON.stringify({ ...o, updatedAt: 0 }) === JSON.stringify({ ...d, updatedAt: 0 }) ? o.updatedAt : t }; }
    const general = body.general ?? '', generalUpdatedAt = general === (curState.general || '') ? (curState.generalUpdatedAt || null) : t;
    const state = { items, ranges, general, generalUpdatedAt }, revision = curRev + 1;
    const res = cur ? await sb.from('lane_states').update({ state, revision, updated_by: me.id, updated_at: t }).eq('version_id', version.id).eq('revision', curRev)
                    : await sb.from('lane_states').insert({ version_id: version.id, state, revision, updated_by: me.id });
    if (res.error) throw res.error;
    loadedAt = t;
    return { state: { revision, ...state } };
  }
  if (route === 'edit') {
    if (!isOwner()) throw err('רק הראל עורך את החיתוך.', 403);
    const { data: cur } = await sb.from('edit_states').select('*').eq('version_id', version.id).maybeSingle();
    if ((cur?.revision || 0) !== body.revision) throw err('העריכה עודכנה בחלון אחר.', 409, { state: { revision: cur.revision, ...cur.state } });
    const t = nowIso(), stamp = (list, old) => (list || []).map((x) => ({ ...x, at: (old || []).find((o) => o.id === x.id && JSON.stringify({ ...o, at: 0 }) === JSON.stringify({ ...x, at: 0 }))?.at || t }));
    const o = cur?.state || {};
    const state = { cuts: stamp(body.cuts, o.cuts), removes: stamp(body.removes, o.removes), frames: stamp(body.frames, o.frames), guides: stamp(body.guides, o.guides), swaps: stamp(body.swaps, o.swaps) };
    const revision = (cur?.revision || 0) + 1;
    const res = cur ? await sb.from('edit_states').update({ state, revision, updated_at: t }).eq('version_id', version.id)
                    : await sb.from('edit_states').insert({ version_id: version.id, state, revision });
    if (res.error) throw res.error;
    return { state: { revision, ...state } };
  }
  if (route === 'submit') {
    if (!isOwner()) throw err('רק הראל שולח לקלוד.', 403);
    const d = await cloudReq('data');
    const notes = d.state.notes.filter((n) => !n.archived && (n.text?.trim() || n.drawings?.length));
    const payload = { version: { id: version.id, label: version.label, sha256: version.sha256, fps: version.model.fps, frameCount: version.model.frameCount },
      notes, lanes: d.lanes || null, edit: d.edit, segments: version.model.segments, fileMap: version.model.fileMap };
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ notes, lanes: d.lanes, edit: d.edit }))))).map((b) => b.toString(16).padStart(2, '0')).join('');
    const { data: dup } = await sb.from('submissions').select('id,status').eq('version_id', version.id).eq('digest', digest).maybeSingle();
    if (dup) return { requestId: dup.id, duplicate: true, dispatch: { status: 'queued-for-claude' } };
    const res = await sb.from('submissions').insert({ version_id: version.id, submitted_by: me.id, digest, payload, summary: `${notes.length} הערות פריים · ${(d.lanes?.ranges || []).length} הערות טווח` }).select('id').single();
    if (res.error) throw res.error;
    return { requestId: res.data.id, dispatch: { status: 'queued-for-claude' } };
  }
  if (route === 'waveform') {
    const track = new URLSearchParams(q).get('track') || 'mix', key = 'wave:' + track;
    await sign([key]);
    const r = await fetch(FILE(key));
    if (!r.ok) throw err('אין גל קול לרצועה הזאת', 404);
    return await r.json();
  }
  if (route === 'layer') return {};
  throw err('לא נמצא: ' + route, 404);
}

// ---------- live: changes from the other person, and who is watching where ----------
export function live({ onNote, onLanes, onEdit, onPresence }) {
  const vid = version.id;
  sb.channel('db-' + vid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: 'version_id=eq.' + vid }, async (p) => {
      if (!p.new?.id) return;
      await sign([p.new.base_frame, p.new.annotated_frame]).catch(() => {});
      onNote(noteOut(p.new));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lane_states', filter: 'version_id=eq.' + vid }, (p) => {
      if (p.new?.updated_by === me.id) return;
      loadedAt = nowIso();
      const s = p.new.state || {};
      onLanes({ revision: p.new.revision, items: s.items || {}, ranges: s.ranges || [], general: s.general || '', generalUpdatedAt: s.generalUpdatedAt || null });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'edit_states', filter: 'version_id=eq.' + vid }, (p) => {
      if (isOwner()) return;
      onEdit({ revision: p.new.revision, ...(p.new.state || {}) });
    })
    .subscribe();
  const room = sb.channel('room-' + vid, { config: { presence: { key: me.id } } });
  room.on('presence', { event: 'sync' }, () => {
    const st = room.presenceState(), people = [];
    for (const [id, metas] of Object.entries(st)) if (id !== me.id && metas[0]) people.push({ id, ...metas[0] });
    onPresence(people);
  }).subscribe(async (s) => { if (s === 'SUBSCRIBED') await room.track({ email: me.email, name: me.name, role: me.role, frame: 0, playing: false }); });
  let last = 0, pend = null;
  return (frame, playing) => {   // report my playhead (throttled)
    pend = { email: me.email, name: me.name, role: me.role, frame, playing };
    const t = Date.now();
    if (t - last > 250) { last = t; room.track(pend); pend = null; }
    else setTimeout(() => { if (pend) { last = Date.now(); room.track(pend); pend = null; } }, 260);
  };
}

// ---------- owner: people ----------
export async function listPeople() {
  const [p, a] = await Promise.all([sb.from('profiles').select('id,email,role,created_at').order('created_at'), sb.from('allowed_emails').select('email')]);
  return { people: p.data || [], allowed: (a.data || []).map((x) => x.email) };
}
export async function setRole(id, role) { const r = await sb.from('profiles').update({ role }).eq('id', id); if (r.error) throw r.error; }
export async function allowEmail(email) { const r = await sb.from('allowed_emails').upsert({ email: email.trim().toLowerCase() }); if (r.error) throw r.error; }
