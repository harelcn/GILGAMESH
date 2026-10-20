// review-notes.js · חדר ההערות (רן, 3.10.2026)
// "לבחור פריים, לקחת אותו הצידה, לצייר עליו חצים, ריבועים ועיגולים ולכתוב. הערות לפי שוט, על קאט ועל אפקט סאונד."
// אותם נתונים ואותה שמירה של חדר הביקורת: /studio/review/data · frame · note · lanes · submit · waveform.
// הערת פריים נשמרת ב-notes.json עם תמונה מסומנת במלוא הרזולוציה; שוט, קאט, אפקט, כתובית, בחירה וקטע נשמרים ב-lanes.json.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- icons ----------
const svg = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'),
  pause: svg('<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>'),
  back: svg('<path d="M15 6l-6 6 6 6"/>'), fwd: svg('<path d="M9 6l6 6-6 6"/>'),
  back2: svg('<path d="M12 6l-6 6 6 6M19 6l-6 6 6 6"/>'), fwd2: svg('<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>'),
  start: svg('<path d="M6 5v14M18 6l-8 6 8 6z"/>'),
  mute: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l4 6M21 9l-4 6"/>'),
  vol: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  full: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  pin: svg('<path d="M12 21s-6.5-6.2-6.5-11.2A6.5 6.5 0 0 1 18.5 9.8C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>'),
  film: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>'),
  cut: svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>'),
  cutS: svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>', 12),
  range: svg('<path d="M4 12h16M4 8v8M20 8v8M8 10l-2 2 2 2M16 10l2 2-2 2"/>'),
  wave: svg('<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10"/>'),
  send: svg('<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'),
  arrow: svg('<path d="M5 19L19 5M10 5h9v9"/>'), rect: svg('<rect x="4" y="6" width="16" height="12" rx="1.5"/>'),
  circle: svg('<ellipse cx="12" cy="12" rx="8.5" ry="7"/>'), pen: svg('<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>'),
  text: svg('<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'), redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>'),
  doc: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', 16),
  loop: svg('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>'),
  music: svg('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  type: svg('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
  spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>', 15),
  move: svg('<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>', 16),
  guide: svg('<path d="M3 8h18M3 16h18" stroke-dasharray="3 3"/><path d="M8 3v18"/>', 16),
  safe: svg('<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M5 7h14M5 16.5h14"/>', 16),
  grid: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>', 16),
  line: svg('<path d="M5 19L19 5"/>'),
  marker: svg('<circle cx="12" cy="12" r="8"/><path d="M11 9l2-1v8"/>'),
  hl: svg('<rect x="4" y="7" width="16" height="10" rx="1.5" fill="currentColor" fill-opacity=".3"/>'),
  restore: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>', 16),
};
const paintIcons = (root = document) => root.querySelectorAll('[data-i]').forEach((el) => { if (!el.dataset.done) { el.innerHTML = I[el.dataset.i] || ''; el.dataset.done = '1'; } });

// ---------- api ----------
import * as C from './cloud.js';
const VERSION = '';
const url = () => '';
const FILE = C.FILE;
async function req(r, body, q) { return C.cloudReq(r, body, q); }

// ---------- state ----------
let M = null, FPS = 24, N = 1;
let frameNotes = [], submissions = [], delivery = [], L = { revision: 0, items: {}, ranges: [], general: '' };
let ITEMS = [], BY = new Map(), SHOTS = [], CUTS = [], SFX = [], CAPS = [], MOTION = [], CHOICES = [], TRACKS = [];
let hasLanes = false, cur = 0, curShot = null, sel = null, pending = null, rangeIn = null, filter = 'all', more = false, playUntil = null;
// עריכה מהחדר (רן, 4.10.2026): קאטים (K), הוצאות כמו Q/W בפרימייר, מסגור שכבות וקווי עזר. נשמר ב-edit.json, בפריימים של הסרט הנוכחי
let E = { revision: 0, cuts: [], removes: [], frames: [], guides: [], swaps: [] };
let editDirty = false, editT = null, editChain = Promise.resolve(), editedPreview = true, mode = null, showSafe = false, showGrid = false;
let LAYERS = [], FRM = null, drag = null;
const EH = { undo: [], redo: [] }, layerKeys = new Map(), layerVids = new Map();

const tc = (f) => { const r = Math.round(FPS), s = Math.floor(f / r); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f % r].map((n) => String(n).padStart(2, '0')).join(':'); };
const secs = (a, b) => ((b - a) / FPS).toFixed(1) + ' שנ׳';
const shotAt = (f) => SHOTS.find((s) => f >= s.frameIn && f < s.frameOut) || SHOTS[SHOTS.length - 1];
const shotNo = (s) => SHOTS.indexOf(s) + 1;
const nearestCut = (f) => CUTS.reduce((b, c) => (!b || Math.abs(c.frame - f) < Math.abs(b.frame - f) ? c : b), null);
const kindOf = (it) => (it.kind === 'shot' ? 'shot' : it.kind === 'cut' ? 'cut' : it.kind === 'choice' ? 'choice' : it.lane === 'sfx' ? 'sfx' : it.lane === 'captions' ? 'cap' : it.lane === 'motion' ? 'motion' : it.lane === 'voice' ? 'voice' : 'item');
const trackLabel = (id) => (id ? (TRACKS.find((t) => t.id === id)?.label || { 'shots-t': 'שוטים' }[id] || id) : 'הסרט');
const lastSentAt = () => submissions.map((s) => s.at).filter(Boolean).sort().at(-1) || null;
const wasSent = (at) => { const s = lastSentAt(); return !!(s && at && at <= s); };

const KIND = {
  shot: { name: 'שוט', ph: 'מה לשנות בשוט הזה? למשל: ארוך מדי, להחליף אותו, תנועת מצלמה אחרת…', chips: ['ארוך מדי', 'קצר מדי', 'להחליף את השוט', 'תנועת מצלמה אחרת', 'להוציא את השוט'] },
  cut: { name: 'קאט', ph: 'מה לשנות בקאט? למשל: להקדים, בלי פלאש, מעבר אחר…', chips: ['להקדים את הקאט', 'לאחר את הקאט', 'בלי פלאש', 'מעבר אחר', 'לא יושב על הביט'] },
  sfx: { name: 'אפקט', ph: 'מה לשנות באפקט? למשל: חזק מדי, צליל אחר, להזיז…', chips: ['להוריד את האפקט', 'חזק יותר', 'חלש יותר', 'צליל אחר', 'להקדים', 'לאחר'] },
  cap: { name: 'כתובית', ph: 'מה לשנות בכתובית?', chips: ['טעות בטקסט', 'מהר מדי', 'גדולה מדי', 'קטנה מדי', 'מיקום אחר'] },
  motion: { name: 'הנפשה', ph: 'מה לשנות בהנפשה הזאת?', chips: ['מהר מדי', 'איטי מדי', 'גדול יותר', 'קטן יותר', 'להוריד'] },
  voice: { name: 'קריינות', ph: 'מה לשנות בקריינות כאן?', chips: ['לא ברור', 'מהר מדי', 'טון אחר'] },
  item: { name: 'פריט', ph: 'מה לשנות?', chips: [] },
  range: { name: 'קטע', ph: 'מה לשנות בקטע הזה?', chips: ['חזק מדי', 'חלש מדי', 'מהר מדי', 'איטי מדי', 'לקצר'] },
};

// ---------- toasts + save state ----------
function toast(msg, kind = '', action = null) {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = '<i></i><span></span>';
  t.querySelector('span').textContent = msg;
  if (action) { const b = document.createElement('button'); b.className = 'linkbtn'; b.textContent = action.label; b.onclick = () => { action.run(); t.remove(); }; t.append(b); }
  $('toasts').append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, kind === 'error' ? 7000 : action ? 6000 : 2800);
}
function setSave(s) {
  const el = $('saveState');
  el.className = 'save-state ' + (s === 'saved' ? '' : s);
  el.lastChild.textContent = s === 'saving' ? 'שומר…' : s === 'error' ? 'לא נשמר, מנסה שוב' : 'כל ההערות שמורות';
}

// ---------- load ----------
async function load() {
  const d = await req('data');
  M = d.model; FPS = M.fps; N = M.frameCount;
  frameNotes = d.state?.notes || []; submissions = d.state?.submissions || []; delivery = d.delivery || [];
  hasLanes = !!M.lanes;
  if (d.lanes) L = { ...d.lanes, items: d.lanes.items || {}, ranges: d.lanes.ranges || [], general: d.lanes.general || '' };
  ITEMS = M.lanes?.items || []; TRACKS = M.lanes?.tracks || [];
  BY = new Map(ITEMS.map((i) => [i.id, i]));
  const byIn = (a, b) => (a.frameIn ?? a.frame ?? 0) - (b.frameIn ?? b.frame ?? 0);
  SHOTS = ITEMS.filter((i) => i.kind === 'shot').sort(byIn);
  if (!SHOTS.length) SHOTS = (M.segments || []).map((s) => ({ id: null, kind: 'shot', frameIn: s.startFrame, frameOut: s.endFrame, label: s.shot }));
  if (!SHOTS.length) SHOTS = [{ id: null, kind: 'shot', frameIn: 0, frameOut: N, label: 'הסרט כולו' }];
  CUTS = ITEMS.filter((i) => i.kind === 'cut').sort(byIn);
  SFX = ITEMS.filter((i) => i.lane === 'sfx' && i.kind !== 'choice').sort(byIn);
  CAPS = ITEMS.filter((i) => i.lane === 'captions').sort(byIn);
  MOTION = ITEMS.filter((i) => i.lane === 'motion').sort(byIn);
  CHOICES = ITEMS.filter((i) => i.kind === 'choice');
  E = normEdit(d.edit);
  LAYERS = M.layers || [];
}

// ---------- header ----------
function renderHeader() {
  const title = M.label && M.label !== 'גרסת צפייה' ? M.label : M.title;
  $('title').textContent = title;
  document.title = 'חדר ההערות · ' + title;
  $('meta').textContent = [`${(N / FPS).toFixed(1)} שנ׳`, `${SHOTS.length} שוטים`, CUTS.length && `${CUTS.length} קאטים`, SFX.length && `${SFX.length} אפקטי סאונד`].filter(Boolean).join(' · ');
  const vs = $('version');
  vs.innerHTML = (M.versions || []).map((v) => `<option value="${esc(v.id)}"${v.id === (M.version || '') ? ' selected' : ''}>${esc(v.label)}</option>`).join('');
  vs.hidden = (M.versions || []).length < 2;
  vs.onchange = async () => { await flushLanes(); location.href = './room.html' + (vs.value ? '?version=' + encodeURIComponent(vs.value) : ''); };
}

// ---------- player ----------
const V = $('film'), AUD = $('aud');
function initPlayer() {
  const ar = M.width / M.height, wrap = $('videoWrap');
  wrap.style.aspectRatio = `${M.width} / ${M.height}`;
  wrap.style.width = `min(100%, max(${ar < 1 ? 200 : 480}px, calc((100vh - 520px) * ${ar.toFixed(4)})))`;
  // סרטון אנכי (רן, 4.10): הנגן לגובה המסך, והכלים בעמודה לידו. אחרת הריל נראה זעיר
  if (ar < 1) { document.querySelector('.layout').classList.add('vert'); wrap.style.minWidth = '0'; wrap.style.width = 'auto'; wrap.style.height = 'min(calc(100vh - 300px), 1500px)'; }
  V.crossOrigin = 'anonymous'; V.src = FILE(M.file); V.muted = true;
  const onTime = (t) => { const f = clamp(Math.floor(t * FPS + 1e-3), 0, N - 1); if (f !== cur || !V.paused) { cur = f; onFrame(); } };
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const cb = (_, meta) => { onTime(meta.mediaTime); V.requestVideoFrameCallback(cb); };
    V.requestVideoFrameCallback(cb);
  } else V.addEventListener('timeupdate', () => onTime(V.currentTime));
  V.addEventListener('seeked', () => { if (V.paused) { cur = clamp(Math.floor(V.currentTime * FPS + 1e-3), 0, N - 1); onFrame(); } });
  V.addEventListener('play', syncPlay);
  // הראל 20.10: M פתח פריים אחר ממה שרואים. אחרי עצירה הפריים שעל המסך הוא האמת: קוראים אותו מהנגן ומעמידים את הנגן במרכז הפריים
  V.addEventListener('pause', () => {
    const f = clamp(Math.floor(V.currentTime * FPS + 1e-3), 0, N - 1);
    if (Math.abs(V.currentTime - (f + 0.5) / FPS) > 0.3 / FPS) V.currentTime = (f + 0.5) / FPS;
    if (f !== cur) { cur = f; onFrame(); }
    syncPlay(); paintOverlay();
  });
  V.addEventListener('volumechange', syncMute);
  V.addEventListener('loadeddata', () => seek(cur), { once: true });
  $('tStart').onclick = () => seek(0);
  $('tBackSec').onclick = () => seek(cur - Math.round(FPS));
  $('tBack').onclick = () => seek(cur - 1);
  $('tPlay').onclick = togglePlay;
  $('tFwd').onclick = () => seek(cur + 1);
  $('tFwdSec').onclick = () => seek(cur + Math.round(FPS));
  $('tMute').onclick = $('unmute').onclick = () => { V.muted = !V.muted; };
  $('tFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen?.());
  $('speed').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; V.playbackRate = +b.dataset.s; $('speed').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
  V.addEventListener('click', togglePlay);
  V.addEventListener('pointermove', showCoord); V.addEventListener('pointerleave', () => { $('coord').hidden = true; });
  syncPlay(); syncMute();
}
function syncPlay() { $('tPlay').innerHTML = V.paused ? I.play : I.pause; }
function syncMute() { $('tMute').innerHTML = V.muted ? I.mute : I.vol; $('unmute').hidden = !V.muted; }
function togglePlay() {
  if (V.paused) {
    playUntil = null; if (cur >= N - 1) seek(0, true);
    const r = editedPreview && removedAt(cur); if (r && r.toFrame < N) seek(r.toFrame, true);
    V.play().catch(() => {});
  }
  else V.pause();
}
function seek(f, keepPlaying = false) {
  f = clamp(Math.round(f), 0, N - 1);
  if (!keepPlaying) { V.pause(); playUntil = null; }
  V.currentTime = (f + 0.5) / FPS;
  cur = f; onFrame(); revealPlayhead();
}
function playRange(a, b, loop = false) {
  AUD.pause();
  playUntil = { a, b: Math.max(a + 1, b), loop };
  V.currentTime = (a + 0.5) / FPS; cur = a;
  V.play().catch(() => {});
}
function onFrame() {
  $('tc').textContent = tc(cur);
  $('fr').textContent = `פריים ${cur + 1} מתוך ${N}`;
  movePlayhead();
  const s = shotAt(cur);
  if (s !== curShot) {
    curShot = s;
    // רן, 5.10: בלי תגית שוט על הווידאו, היא הסתירה את הפריים העליון. מספר השוט מופיע בכפתור "הערה על השוט"
    $('actShotSub').textContent = `שוט ${shotNo(s)} · ${s.label}`;
    document.querySelectorAll('.shotb').forEach((b) => b.classList.toggle('cur', b.dataset.id === s.id));
  }
  renderSrc();
  const c = nearestCut(cur);
  $('actCutSub').textContent = c ? `הקרוב: ${tc(c.frame)} · C` : 'אין קאטים בסרט';
  if (editedPreview && !V.paused) {
    const r = removedAt(cur);
    if (r) { if (r.toFrame >= N) { V.pause(); seek(Math.max(0, r.fromFrame - 1)); return; } V.currentTime = (r.toFrame + 0.5) / FPS; cur = r.toFrame; }
  }
  if (playUntil && !V.paused && cur >= playUntil.b - 1) {
    if (playUntil.loop) V.currentTime = (playUntil.a + 0.5) / FPS;
    else { V.pause(); const end = playUntil.b - 1; playUntil = null; seek(end); }
  }
  if (!V.paused) followPlayhead();
  paintOverlay();
}
// הסרט בתוך קנבס או מלבן במסך: איפה הוא יושב ובאיזה סקייל (פיקסל של הסרט → פיקסל של היעד)
function filmBox(W, H) { const ar = M.width / M.height; let w = W, h = w / ar; if (h > H) { h = H; w = h * ar; } return { x: (W - w) / 2, y: (H - h) / 2, w, h, s: w / M.width }; }
function paintOverlay() {
  const cv = $('overlay'), r = $('videoWrap').getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w0 = Math.round(r.width * dpr), h0 = Math.round(r.height * dpr);
  if (cv.width !== w0 || cv.height !== h0) { cv.width = w0; cv.height = h0; }
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const B = filmBox(cv.width, cv.height);
  if (compositeActive()) drawComposite(ctx, B);
  const rm = removedAt(cur);
  if (rm && V.paused) { ctx.fillStyle = 'rgba(255,60,60,.22)'; ctx.fillRect(B.x, B.y, B.w, B.h); pill(ctx, B.x + B.w / 2, B.y + B.h * 0.5, 'הקטע הזה הוצא בעריכה · בניגון מדלגים עליו', '#ff8f8f', true); }
  if (showGrid) drawGrid(ctx, B);
  if (showSafe) drawSafe(ctx, B);
  drawGuides(ctx, B);
  if (mode === 'frame') drawFrameUI(ctx, B);
  const here = V.paused ? frameNotes.filter((n) => !n.archived && n.frameIndex === cur && (n.text?.trim() || n.drawings?.length)) : [];
  const hint = $('frameHint');
  if (!here.length) { hint.hidden = true; return; }
  const w = B.w, h = B.h;
  ctx.save(); ctx.translate(B.x, B.y);
  for (const n of here) for (const s of n.drawings || []) drawShape(ctx, s, w, h);
  ctx.restore();
  hint.hidden = false;
  hint.innerHTML = I.pin + `<span>${here.length > 1 ? here.length + ' הערות על הפריים הזה' : 'יש לך הערה על הפריים הזה'} · לחצו לפתיחה</span>`;
  hint.onclick = () => selectFrameNote(here[0].id);
}

// ---------- shapes (one renderer for the player overlay, the studio and the saved PNG) ----------
function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawShape(ctx, s, w, h) {
  const P = (s.points || []).map(([x, y]) => [x * w, y * h]);
  if (!P.length) return;
  const lw = Math.max(1.5, s.width * w), a = P[0], b = P[P.length - 1], halo = 'rgba(0,0,0,.5)';
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const stroke = (path, color, width) => { ctx.beginPath(); path(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); };
  const both = (path) => { stroke(path, halo, lw * 2.1); stroke(path, s.color, lw); };
  if (s.type === 'rect') {
    const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), rw = Math.abs(b[0] - a[0]), rh = Math.abs(b[1] - a[1]);
    both(() => roundRect(ctx, x, y, rw, rh, lw * 1.6));
  } else if (s.type === 'ellipse') {
    both(() => ctx.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(1, Math.abs(b[0] - a[0]) / 2), Math.max(1, Math.abs(b[1] - a[1]) / 2), 0, 0, Math.PI * 2));
  } else if (s.type === 'arrow') {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), head = Math.max(lw * 3.4, w * 0.016), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const back = [b[0] - Math.cos(ang) * Math.min(head * 0.8, len), b[1] - Math.sin(ang) * Math.min(head * 0.8, len)];
    both(() => { ctx.moveTo(a[0], a[1]); ctx.lineTo(back[0], back[1]); });
    const tri = () => { ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - head * Math.cos(ang - 0.45), b[1] - head * Math.sin(ang - 0.45)); ctx.lineTo(b[0] - head * Math.cos(ang + 0.45), b[1] - head * Math.sin(ang + 0.45)); ctx.closePath(); };
    ctx.beginPath(); tri(); ctx.lineWidth = lw * 1.1; ctx.strokeStyle = halo; ctx.stroke();
    ctx.beginPath(); tri(); ctx.fillStyle = s.color; ctx.fill();
  } else if (s.type === 'pen') {
    const path = () => {
      ctx.moveTo(P[0][0], P[0][1]);
      if (P.length < 3) { P.slice(1).forEach((p) => ctx.lineTo(p[0], p[1])); if (P.length === 1) ctx.lineTo(P[0][0] + 0.1, P[0][1]); return; }
      for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
      ctx.lineTo(b[0], b[1]);
    };
    both(path);
  } else if (s.type === 'line') {
    both(() => { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); });
  } else if (s.type === 'highlight') {
    const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), rw = Math.abs(b[0] - a[0]), rh = Math.abs(b[1] - a[1]);
    ctx.beginPath(); roundRect(ctx, x, y, rw, rh, lw * 1.6); ctx.fillStyle = hexA(s.color, 0.28); ctx.fill();
    ctx.lineWidth = Math.max(1, lw * 0.6); ctx.strokeStyle = s.color; ctx.stroke();
  } else if (s.type === 'marker') {
    const rad = Math.max(13, w * (0.026 + s.width * 1.6));
    ctx.beginPath(); ctx.arc(a[0], a[1], rad + Math.max(1.5, lw * 0.5), 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
    ctx.beginPath(); ctx.arc(a[0], a[1], rad, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill();
    ctx.font = `800 ${Math.round(rad * 1.15)}px Heebo, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111';
    ctx.fillText(s.text || '', a[0], a[1] + rad * 0.06);
  } else if (s.type === 'text' && s.text) {
    const size = Math.max(12, w * (0.016 + s.width * 2.4));
    ctx.font = `700 ${size}px Heebo, system-ui, sans-serif`; ctx.direction = 'rtl'; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    const tw = ctx.measureText(s.text).width, pad = size * 0.38, bx = a[0] - tw - pad, by = a[1] - size * 0.72;
    ctx.beginPath(); roundRect(ctx, bx - pad, by, tw + pad * 2 + pad, size * 1.44, size * 0.3); ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fill();
    ctx.fillStyle = s.color; ctx.fillText(s.text, a[0], a[1]);
  }
  ctx.restore();
}

// ---------- עריכה ודיוק (רן, 4.10.2026) ----------
// "ללחוץ Q שזה קאט אחורה ו-W שזה קאט קדימה, כמו בפרימייר" · "להזיז את הפריימים עצמם" · "לשים קווים דמיוניים ולהגיד לך איפה הכתוביות צריכות להיות".
// כל הזמנים בפריימים של הסרט הנוכחי. מה שהוצא נשאר בקובץ: בתצוגה הערוכה מדלגים עליו, ובשליחה הוא מגיע אליי כרשימת הוצאות.
const uuid = () => crypto.randomUUID();
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
function normEdit(e) { return { revision: e?.revision || 0, cuts: e?.cuts || [], removes: e?.removes || [], frames: e?.frames || [], guides: e?.guides || [], swaps: e?.swaps || [] }; }
const removedAt = (f) => E.removes.find((r) => f >= r.fromFrame && f < r.toFrame);
const removedFrames = () => E.removes.reduce((s, r) => s + r.toFrame - r.fromFrame, 0);
const editCount = () => E.cuts.length + E.removes.length + E.frames.length + E.guides.length + E.swaps.length;
function cutPoints() {
  const s = new Set([0, N]);
  for (const c of CUTS) s.add(c.frame);
  for (const c of E.cuts) s.add(c.frame);
  for (const r of E.removes) { s.add(r.fromFrame); s.add(r.toFrame); }
  return [...s].sort((a, b) => a - b);
}

// שמירה (כמו המסלולים: השהיה קצרה, תור אחד, 409 = נשמר בחלון אחר)
function editBody() { const strip = (l) => l.map(({ at, ...x }) => x); return { revision: E.revision, cuts: strip(E.cuts), removes: strip(E.removes), frames: strip(E.frames), guides: strip(E.guides), swaps: strip(E.swaps) }; }
function scheduleEditSave() { editDirty = true; setSave('saving'); clearTimeout(editT); editT = setTimeout(flushEdit, 400); }
function flushEdit() { clearTimeout(editT); editChain = editChain.then(saveEdit, saveEdit); return editChain; }
async function saveEdit() {
  if (!editDirty) return;
  editDirty = false;
  try {
    const r = await req('edit', editBody()), s = r.state;
    E.revision = s.revision;
    for (const k of ['cuts', 'removes', 'frames', 'guides', 'swaps']) for (const x of s[k] || []) { const m = E[k].find((y) => y.id === x.id); if (m) m.at = x.at; }
    if (!editDirty && !dirty) setSave('saved');
  } catch (e) {
    if (e.status === 409 && e.body?.state) { E = normEdit(e.body.state); EH.undo = []; EH.redo = []; afterEdit(); setSave('saved'); toast('העריכה עודכנה בחלון אחר, אז טענתי את מה שנשמר שם.', 'error'); }
    else { editDirty = true; setSave('error'); toast(e.message + (e.status === 404 ? ' · רעננו את הדף אחרי שהחדר הופעל מחדש' : ''), 'error'); if (e.status !== 404) editT = setTimeout(flushEdit, 4000); }
  }
}
// ביטול וביצוע שוב לכל פעולת עריכה
const snapE = () => JSON.stringify({ cuts: E.cuts, removes: E.removes, frames: E.frames, guides: E.guides, swaps: E.swaps });
function applySnap(sn) { const o = JSON.parse(sn); E.cuts = o.cuts; E.removes = o.removes; E.frames = o.frames; E.guides = o.guides; E.swaps = o.swaps || []; }
function editChange(fn) { if (!C.isOwner()) return toast('רק הראל עורך את החיתוך. אפשר להעיר ולצייר.'); EH.undo.push(snapE()); if (EH.undo.length > 200) EH.undo.shift(); EH.redo = []; fn(); afterEdit(); scheduleEditSave(); }
const editSelValid = () => !sel || !['remove', 'ecut', 'framing', 'guide'].includes(sel.kind) || [...E.removes, ...E.cuts, ...E.frames, ...E.guides].some((x) => x.id === sel.id);
function editUndo() { if (!C.isOwner()) return; if (!EH.undo.length) return toast('אין עריכה לבטל'); EH.redo.push(snapE()); applySnap(EH.undo.pop()); if (!editSelValid()) sel = null; afterEdit(); renderComposer(false); scheduleEditSave(); toast('בוטל'); }
function editRedo() { if (!C.isOwner()) return; if (!EH.redo.length) return toast('אין מה לבצע שוב'); EH.undo.push(snapE()); applySnap(EH.redo.pop()); if (!editSelValid()) sel = null; afterEdit(); renderComposer(false); scheduleEditSave(); toast('בוצע שוב'); }
function afterEdit() { renderEditRow(); renderEditStat(); paintOverlay(); renderNotes(); updateCounts(); renderSrcList(); }

// K: קאט במקום של הסמן. Q: מהקאט הקודם עד הסמן. W: מהסמן עד הקאט הבא (Ripple Trim של פרימייר).
// Delete: כל הקטע שבין שני הקאטים סביב הסמן (Ripple Delete). רן, 4.10: "ניסיתי לסמן לך בין כת לכת, איפה לחתוך".
function addCut() {
  const f = cur;
  if (f <= 0 || f >= N - 1) return toast('אי אפשר לחתוך בקצה של הסרט');
  if (cutPoints().includes(f)) return toast('יש כבר קאט בפריים הזה');
  const id = uuid();
  editChange(() => { E.cuts = [...E.cuts, { id, frame: f }].sort((a, b) => a.frame - b.frame); });
  toast(`קאט בפריים ${f + 1}. Q מוציא מהקאט הקודם עד כאן, W מכאן עד הקאט הבא, ו-Delete את כל הקטע שבין שני קאטים`, 'ok');
}
function ripple(how) {
  const pts = cutPoints(), f = cur;
  let a, b;
  if (how === 'Q') { a = pts.filter((p) => p < f).at(-1); b = f; if (a == null || b <= a) return toast('הסמן יושב על קאט, אין מה להוציא אחורה. זוזו קדימה ולחצו Q'); }
  else if (how === 'DEL') {
    a = pts.filter((p) => p <= f).at(-1) ?? 0; b = pts.find((p) => p > f) ?? N;
    if (a === 0 && b === N) return toast('אין קאטים מסביב לסמן. שימו קאט (K) בתחילת הקטע ובסופו, עמדו בתוכו ולחצו Delete');
  }
  else { a = f; b = pts.find((p) => p > f); if (b == null || b <= a) return toast('אין קאט אחרי הסמן'); }
  addRemove(a, b, how);
}
function addRemove(a, b, how) {
  let from = a, to = b; const keep = [];
  for (const r of E.removes) { if (r.toFrame < from || r.fromFrame > to) keep.push(r); else { from = Math.min(from, r.fromFrame); to = Math.max(to, r.toFrame); } }
  if (N - keep.reduce((s, r) => s + r.toFrame - r.fromFrame, 0) - (to - from) < Math.round(FPS)) return toast('אי אפשר להוציא כמעט את כל הסרט');
  const id = uuid();
  editChange(() => { E.removes = [...keep, { id, fromFrame: from, toFrame: to, how, note: '' }].sort((x, y) => x.fromFrame - y.fromFrame); });
  sel = { kind: 'remove', id };
  seek(to < N ? to : Math.max(0, from - 1)); // כמו בפרימייר: הסמן נוחת על נקודת החיבור
  afterSelect(false);
  toast(`הוצאו ${secs(from, to)} (${how}). בתצוגה הערוכה מדלגים עליהם`, 'ok', { label: 'בטל', run: editUndo });
}
function restoreRemove(id) { editChange(() => { E.removes = E.removes.filter((r) => r.id !== id); }); if (sel?.id === id) sel = null; afterSelect(false); toast('הקטע חזר לסרט', 'ok', { label: 'בטל', run: editUndo }); }
function renderEditStat() {
  const el = $('editStat'); if (!el) return;
  const rm = removedFrames(), parts = [`אורך <b class="mono">${(N / FPS).toFixed(2)}</b> שנ׳`];
  if (rm) parts.push(`אחרי עריכה <b class="mono">${((N - rm) / FPS).toFixed(2)}</b> שנ׳ <span class="neg mono">−${(rm / FPS).toFixed(2)}</span>`);
  const c = [E.cuts.length && `${E.cuts.length} קאטים`, E.removes.length && `${E.removes.length} הוצאות`, E.frames.length && `${E.frames.length} מסגורים`, E.guides.length && `${E.guides.length} קווי עזר`].filter(Boolean);
  el.innerHTML = parts.join(' · ') + (c.length ? `<br>${c.join(' · ')} · נשלח אליי עם ההערות` : '<br>K מוסיף קאט במקום של הסמן, Q ו-W מוציאים עד הקאט הקרוב, Delete מוציא קטע שלם בין שני קאטים');
  $('tbUndo').disabled = !EH.undo.length; $('tbRedo').disabled = !EH.redo.length;
}

// ---------- שכבות: מסגור חי ----------
// לכל שכבה עם מקור (למשל רן): המלבן של המקור בכל פריים נדגם מהקומפוזיציה (keys), כך שהתצוגה כאן זהה לרינדור.
// המסגור של רן הוא הזזה (dx, dy בפיקסלים של הסרט) וזום סביב מרכז האזור, ואופציונלית קו פיצול חדש מול השכבה שמעליה.
async function initLayers() {
  for (const L of LAYERS) {
    if (L.keys) { try { layerKeys.set(L.id, await req('layer', null, 'id=' + encodeURIComponent(L.id))); } catch {} }
    if (L.src) {
      const v = document.createElement('video');
      v.src = FILE(L.src); v.muted = true; v.preload = 'auto'; v.playsInline = true;
      v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
      v.addEventListener('seeked', () => { if (compositeActive()) paintOverlay(); });
      v.addEventListener('loadeddata', () => { if (compositeActive()) paintOverlay(); });
      document.body.append(v); layerVids.set(L.id, v);
    }
  }
  $('tbFrame').disabled = !LAYERS.some((L) => L.src);
  if ($('tbFrame').disabled) $('tbFrame').title = 'אין בגרסה הזאת שכבה שאפשר להזיז';
  if (compositeActive()) paintOverlay();
}
function layerRectAt(L, f) { const k = layerKeys.get(L.id); if (!k?.rects?.length) return null; const r = k.rects[clamp(f, 0, k.rects.length - 1)]; return Array.isArray(r) ? r : null; }
function savedFraming(id, f) { let out = null; for (const x of E.frames) if (x.layer === id && f >= x.fromFrame && f < x.toFrame) out = x; return out; }
function framingFor(id, f) { return mode === 'frame' && FRM?.layer === id ? FRM : savedFraming(id, f); }
const compositeActive = () => LAYERS.some((L) => L.src) && (mode === 'frame' || (editedPreview && E.frames.length > 0));
function regionOf(L, fr) {
  let [rx, ry, rw, rh] = L.rect;
  if (L.split) { const d = (fr?.split ?? L.split.y) - L.split.y; ry += d; rh -= d; }
  return [rx, ry, rw, rh];
}
function syncLayerVideo(v) {
  const t = (cur + 0.5) / FPS;
  if (V.paused) { if (!v.paused) v.pause(); if (Math.abs(v.currentTime - t) > 0.02 && !v.seeking) v.currentTime = t; }
  else { if (v.paused) v.play().catch(() => {}); if (Math.abs(v.currentTime - V.currentTime) > 0.12) v.currentTime = V.currentTime; }
}
function drawComposite(ctx, B) {
  const S = B.s;
  for (const L of LAYERS) {
    if (!L.src) continue;
    const k = layerRectAt(L, cur); if (!k) continue; // השכבה לא על המסך בפריים הזה (למשל בהדרכה)
    const fr = framingFor(L.id, cur);
    if (!fr && mode !== 'frame') continue;
    const v = layerVids.get(L.id); if (!v) continue;
    syncLayerVideo(v);
    if (v.readyState < 2) continue;
    if (L.split && fr?.split != null && fr.split !== L.split.y) {
      // השכבה שמעל (הסרט עצמו) נדחסת לגובה החדש: חיתוך מהמרכז, או הגדלה כשהיא גבוהה יותר
      const top = LAYERS.find((x) => x.id === L.split.with), [tx, ty, tw, th] = top ? top.rect : [0, 0, M.width, L.split.y], nh = fr.split - ty;
      if (nh < th) ctx.drawImage(V, tx, ty + (th - nh) / 2, tw, nh, B.x + tx * S, B.y + ty * S, tw * S, nh * S);
      else { const sw = tw * th / nh; ctx.drawImage(V, tx + (tw - sw) / 2, ty, sw, th, B.x + tx * S, B.y + ty * S, tw * S, nh * S); }
    }
    const [rx, ry, rw, rh] = regionOf(L, fr), cx = L.rect[0] + L.rect[2] / 2, cy = L.rect[1] + L.rect[3] / 2;
    const sc = fr?.scale ?? 1, dx = fr?.dx ?? 0, dy = fr?.dy ?? 0;
    ctx.save(); ctx.beginPath(); ctx.rect(B.x + rx * S, B.y + ry * S, rw * S, rh * S); ctx.clip();
    ctx.fillStyle = '#000'; ctx.fillRect(B.x + rx * S, B.y + ry * S, rw * S, rh * S);
    ctx.drawImage(v, B.x + (cx + sc * (k[0] - cx) + dx) * S, B.y + (cy + sc * (k[1] - cy) + dy) * S, k[2] * sc * S, k[3] * sc * S);
    ctx.restore();
  }
}
function pill(ctx, x, y, text, color = '#ffd24a', center = false) {
  const dpr = window.devicePixelRatio || 1, fs = Math.round(12.5 * dpr), pad = 7 * dpr;
  ctx.save(); ctx.font = `700 ${fs}px Heebo, system-ui, sans-serif`; ctx.direction = 'rtl';
  const w = ctx.measureText(text).width + pad * 2, h = fs + pad * 1.4, x0 = center ? x - w / 2 : x;
  ctx.beginPath(); roundRect(ctx, x0, y - h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(10,11,13,.82)'; ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + w / 2, y + 0.5);
  ctx.restore();
}
function drawFrameUI(ctx, B) {
  const S = B.s, dpr = window.devicePixelRatio || 1;
  for (const L of LAYERS) {
    const fr = framingFor(L.id, cur), [rx, ry, rw, rh] = regionOf(L, fr);
    ctx.save(); ctx.setLineDash([10 * dpr, 6 * dpr]); ctx.lineWidth = 2 * dpr; ctx.strokeStyle = L.src ? '#ffd24a' : 'rgba(255,255,255,.55)';
    ctx.strokeRect(B.x + rx * S + dpr, B.y + ry * S + dpr, rw * S - 2 * dpr, rh * S - 2 * dpr); ctx.restore();
    pill(ctx, B.x + rx * S + 10 * dpr, B.y + ry * S + 18 * dpr, L.src ? `${L.label} · גוררים להזזה, גלגלת לזום` : L.label, L.src ? '#ffd24a' : '#eef0f3');
    if (L.split) {
      const y = B.y + (fr?.split ?? L.split.y) * S;
      ctx.save(); ctx.fillStyle = '#ffd24a'; ctx.fillRect(B.x, y - 2 * dpr, B.w, 4 * dpr);
      ctx.beginPath(); roundRect(ctx, B.x + B.w / 2 - 28 * dpr, y - 7 * dpr, 56 * dpr, 14 * dpr, 7 * dpr); ctx.fill(); ctx.restore();
      pill(ctx, B.x + B.w - 10 * dpr, y + 20 * dpr, `קו הפיצול · ${Math.round(fr?.split ?? L.split.y)} px · גוררים`, '#ffd24a', false);
    }
  }
  if (FRM) pill(ctx, B.x + B.w / 2, B.y + B.h - 26 * dpr, `x ${FRM.dx > 0 ? '+' : ''}${Math.round(FRM.dx)} · y ${FRM.dy > 0 ? '+' : ''}${Math.round(FRM.dy)} · זום ${Math.round(FRM.scale * 100)}%`, '#ffd24a', true);
}
// אזורים בטוחים בריל 9:16 (מוסכמת הסקיל: 250 למעלה, 450 למטה, 150 בצד ימין בחצי התחתון)
function drawSafe(ctx, B) {
  const S = B.s, W = M.width, H = M.height;
  if (W / H > 0.7) { pill(ctx, B.x + B.w / 2, B.y + 22, 'אזורים בטוחים מוגדרים לריל אנכי', '#ff8f8f', true); return; }
  const zones = [[0, 0, W, Math.round(H * 0.13), 'למעלה: הממשק של אינסטגרם'], [0, Math.round(H * 0.766), W, H - Math.round(H * 0.766), 'למטה: כיתוב, שם ו-CTA'], [W - Math.round(W * 0.139), Math.round(H / 2), Math.round(W * 0.139), Math.round(H * 0.766) - Math.round(H / 2), 'כפתורים']];
  ctx.save();
  for (const [x, y, w, h, t] of zones) { ctx.fillStyle = 'rgba(255,70,70,.2)'; ctx.fillRect(B.x + x * S, B.y + y * S, w * S, h * S); ctx.strokeStyle = 'rgba(255,107,107,.75)'; ctx.lineWidth = 1; ctx.strokeRect(B.x + x * S + 0.5, B.y + y * S + 0.5, w * S - 1, h * S - 1); }
  ctx.restore();
  for (const [x, y, w, h, t] of zones) pill(ctx, B.x + (x + w / 2) * S, B.y + (y + Math.min(h / 2, 40)) * S, t, '#ff9b9b', true);
}
function drawGrid(ctx, B) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.38)'; ctx.lineWidth = 1;
  for (const k of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(B.x + B.w * k, B.y); ctx.lineTo(B.x + B.w * k, B.y + B.h); ctx.moveTo(B.x, B.y + B.h * k); ctx.lineTo(B.x + B.w, B.y + B.h * k); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,210,74,.5)'; const c = 14 * (window.devicePixelRatio || 1);
  ctx.beginPath(); ctx.moveTo(B.x + B.w / 2 - c, B.y + B.h / 2); ctx.lineTo(B.x + B.w / 2 + c, B.y + B.h / 2); ctx.moveTo(B.x + B.w / 2, B.y + B.h / 2 - c); ctx.lineTo(B.x + B.w / 2, B.y + B.h / 2 + c); ctx.stroke();
  ctx.restore();
}
// ---------- קווי עזר ----------
const guideOn = (g, f) => g.fromFrame == null || (f >= g.fromFrame && f < g.toFrame);
function drawGuides(ctx, B) {
  const dpr = window.devicePixelRatio || 1;
  for (const g of E.guides) {
    if (!guideOn(g, cur)) continue;
    const on = sel?.kind === 'guide' && sel.id === g.id, col = on ? '#ffd24a' : '#5fd0ff';
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = (on ? 2.5 : 1.6) * dpr; ctx.setLineDash([12 * dpr, 7 * dpr]);
    ctx.beginPath();
    if (g.axis === 'y') { const y = B.y + g.pos * B.h; ctx.moveTo(B.x, y); ctx.lineTo(B.x + B.w, y); }
    else { const x = B.x + g.pos * B.w; ctx.moveTo(x, B.y); ctx.lineTo(x, B.y + B.h); }
    ctx.stroke(); ctx.restore();
    const px = Math.round(g.pos * (g.axis === 'y' ? M.height : M.width)), t = `${g.label || 'קו עזר'} · ${px}px`;
    if (g.axis === 'y') pill(ctx, B.x + 10 * dpr, B.y + g.pos * B.h - 14 * dpr, t, col);
    else pill(ctx, B.x + g.pos * B.w + 8 * dpr, B.y + 20 * dpr, t, col);
  }
}
// ---------- מצבים: מסגור (F) וקווי עזר (G) ----------
function filmPt(e) {
  const r = $('videoWrap').getBoundingClientRect(), B = filmBox(r.width, r.height);
  return { x: (e.clientX - r.left - B.x) / B.s, y: (e.clientY - r.top - B.y) / B.s, s: B.s };
}
function showCoord(e) {
  const p = filmPt(e), c = $('coord');
  if (p.x < 0 || p.y < 0 || p.x > M.width || p.y > M.height) { c.hidden = true; return; }
  c.hidden = false; c.textContent = `x ${Math.round(p.x)} · y ${Math.round(p.y)} px`;
}
function setMode(m) {
  if (m === 'frame' && !LAYERS.some((L) => L.src)) return toast('אין בגרסה הזאת שכבה שאפשר להזיז');
  V.pause(); mode = m;
  const hit = $('hit'); hit.hidden = !m; hit.className = 'hit' + (m === 'frame' ? ' frame' : '');
  $('tbFrame').classList.toggle('on', m === 'frame'); $('tbGuides').classList.toggle('on', m === 'guides');
  const chip = $('modeChip'); chip.hidden = !m;
  chip.textContent = m === 'frame' ? 'מסגור: גוררים את השכבה או את קו הפיצול · גלגלת לזום · חיצים לפיקסל · Esc ליציאה' : m === 'guides' ? 'קווי עזר: לחיצה מוסיפה קו אופקי · Shift אנכי · גרירה מזיזה · Esc ליציאה' : '';
  if (m === 'frame') { const L = LAYERS.find((x) => x.src); FRM = framingDraft(L); sel = { kind: 'frame-live', id: L.id }; }
  else { FRM = null; if (sel?.kind === 'frame-live') sel = null; }
  afterSelect(false); paintOverlay();
}
function layerSegmentAt(L, f) { const s = (L?.segments || []).find((x) => f >= x[0] && f < x[1]); if (s) return s; const sh = shotAt(f); return [sh.frameIn, sh.frameOut]; }
function framingDraft(L, entry = null) {
  const ex = entry || savedFraming(L.id, cur);
  const scope = ex ? (ex.fromFrame === 0 && ex.toFrame === N ? 'film' : 'shot') : 'film';
  return { layer: L.id, dx: ex?.dx || 0, dy: ex?.dy || 0, scale: ex?.scale || 1, split: ex?.split ?? null, scope, note: ex?.note || '', range: ex ? [ex.fromFrame, ex.toFrame] : null };
}
function saveFraming() {
  const L = LAYERS.find((x) => x.id === FRM.layer); if (!L) return;
  const [from, to] = FRM.scope === 'film' ? [0, N] : FRM.range && FRM.scope === 'keep' ? FRM.range : layerSegmentAt(L, cur);
  const split = FRM.split == null || !L.split || Math.round(FRM.split) === L.split.y ? null : Math.round(FRM.split);
  const id = uuid();
  editChange(() => {
    E.frames = E.frames.filter((x) => !(x.layer === L.id && x.fromFrame === from && x.toFrame === to));
    E.frames.push({ id, layer: L.id, fromFrame: from, toFrame: to, dx: Math.round(FRM.dx), dy: Math.round(FRM.dy), scale: Math.round(FRM.scale * 1000) / 1000, split, note: FRM.note || '' });
  });
  toast(from === 0 && to === N ? 'המסגור נשמר לכל הסרט' : `המסגור נשמר לשוט ${tc(from)}-${tc(to - 1)}`, 'ok', { label: 'בטל', run: editUndo });
  setMode(null); sel = { kind: 'framing', id }; afterSelect(false);
}
function bindHit() {
  const hit = $('hit');
  hit.addEventListener('pointermove', (e) => { showCoord(e); if (drag) dragMove(e); });
  hit.addEventListener('pointerleave', () => { $('coord').hidden = true; });
  hit.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const p = filmPt(e);
    if (mode === 'frame') {
      const L = LAYERS.find((x) => x.id === FRM?.layer); if (!L) return;
      const split = FRM.split ?? L.split?.y, tol = 16 / p.s;
      if (L.split && Math.abs(p.y - split) < tol) drag = { kind: 'split', y0: p.y, v0: split };
      else { const [rx, ry, rw, rh] = regionOf(L, FRM); if (p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh) drag = { kind: 'move', x0: p.x, y0: p.y, dx0: FRM.dx, dy0: FRM.dy }; else return toast('השכבה העליונה היא הסרט עצמו. אפשר להזיז את קו הפיצול, או את ' + L.label); }
      hit.classList.add('drag'); hit.setPointerCapture(e.pointerId);
    } else if (mode === 'guides') {
      const near = E.guides.filter((g) => guideOn(g, cur)).map((g) => ({ g, d: Math.abs((g.axis === 'y' ? p.y / M.height : p.x / M.width) - g.pos) * (g.axis === 'y' ? M.height : M.width) })).sort((a, b) => a.d - b.d)[0];
      if (near && near.d < 14 / p.s) { EH.undo.push(snapE()); EH.redo = []; drag = { kind: 'guide', id: near.g.id }; sel = { kind: 'guide', id: near.g.id }; afterSelect(false); }
      else {
        const axis = e.shiftKey ? 'x' : 'y', pos = clamp(axis === 'y' ? p.y / M.height : p.x / M.width, 0, 1), id = uuid();
        editChange(() => { E.guides.push({ id, axis, pos: Math.round(pos * 10000) / 10000, label: '' }); });
        sel = { kind: 'guide', id }; afterSelect(false);
        drag = { kind: 'guide', id, fresh: true };
      }
      hit.setPointerCapture(e.pointerId);
    }
  });
  const end = () => {
    if (!drag) return;
    const k = drag.kind, fresh = drag.fresh; drag = null; hit.classList.remove('drag');
    if (k === 'guide') { afterEdit(); scheduleEditSave(); }
    if (k === 'guide' || mode !== 'frame') renderComposer(false); else updateFramePanel();
    if (fresh) setTimeout(() => $('gLabel')?.focus({ preventScroll: true }), 30); // קו חדש: ישר לכתוב מה הוא מסמן
  };
  hit.addEventListener('pointerup', end); hit.addEventListener('pointercancel', end);
  hit.addEventListener('wheel', (e) => {
    if (mode !== 'frame' || !FRM) return;
    e.preventDefault();
    FRM.scale = clamp(FRM.scale * (e.deltaY < 0 ? 1.02 : 1 / 1.02), 0.5, 2.5);
    paintOverlay(); updateFramePanel();
  }, { passive: false });
}
function dragMove(e) {
  const p = filmPt(e);
  if (drag.kind === 'move') { FRM.dx = drag.dx0 + (p.x - drag.x0); FRM.dy = drag.dy0 + (p.y - drag.y0); }
  else if (drag.kind === 'split') { const L = LAYERS.find((x) => x.id === FRM.layer); FRM.split = clamp(Math.round(drag.v0 + (p.y - drag.y0)), Math.round(M.height * 0.12), Math.round(M.height * 0.6)); if (L && Math.abs(FRM.split - L.split.y) < 4) FRM.split = L.split.y; }
  else if (drag.kind === 'guide') { const g = E.guides.find((x) => x.id === drag.id); if (g) g.pos = Math.round(clamp(g.axis === 'y' ? p.y / M.height : p.x / M.width, 0, 1) * 10000) / 10000; }
  paintOverlay(); if (drag.kind !== 'guide') updateFramePanel();
}
function updateFramePanel() {
  if (!FRM) return;
  const set = (id, v) => { const el = $(id); if (el && document.activeElement !== el) el.value = v; };
  set('frDx', Math.round(FRM.dx)); set('frDy', Math.round(FRM.dy)); set('frZoom', Math.round(FRM.scale * 100));
  const L = LAYERS.find((x) => x.id === FRM.layer); set('frSplit', Math.round(FRM.split ?? L?.split?.y ?? 0));
}

// ---------- ציר הזמן: שורת העריכה ופסי ההוצאה על כל הציר ----------
function editRowHTML() {
  const rm = E.removes.map((r) => { const x = X(r.fromFrame), w = Math.max(4, X(r.toFrame) - x); return `<button class="rmb${sel?.kind === 'remove' && sel.id === r.id ? ' sel' : ''}" data-id="${esc(r.id)}" data-kind="remove" style="left:${x.toFixed(1)}px;width:${w.toFixed(1)}px" title="הוצא (${r.how}) · ${tc(r.fromFrame)}-${tc(r.toFrame - 1)} · ${secs(r.fromFrame, r.toFrame)}">${w > 46 ? 'הוצא ' + secs(r.fromFrame, r.toFrame) : ''}</button>`; }).join('');
  const fr = E.frames.map((f) => { const x = X(f.fromFrame), w = Math.max(4, X(f.toFrame) - x); return `<button class="frb${sel?.kind === 'framing' && sel.id === f.id ? ' sel' : ''}" data-id="${esc(f.id)}" data-kind="framing" style="left:${x.toFixed(1)}px;width:${w.toFixed(1)}px" title="מסגור · ${esc(LAYERS.find((l) => l.id === f.layer)?.label || f.layer)}"></button>`; }).join('');
  const ct = E.cuts.map((c) => `<button class="ecutb${sel?.kind === 'ecut' && sel.id === c.id ? ' sel' : ''}" data-id="${esc(c.id)}" data-kind="ecut" style="left:${X(c.frame).toFixed(1)}px" title="קאט שהוספת · ${tc(c.frame)}">${I.cutS}</button>`).join('');
  return fr + rm + ct;
}
function renderEditRow() {
  const inner = $('tlInner'), row = inner?.querySelector('.row[data-row="edit"]');
  if (row) row.innerHTML = editRowHTML();
  const lab = $('tlLabels')?.querySelector('[data-row="edit"] small'); if (lab) lab.textContent = editCount() || '';
  inner?.querySelectorAll('.xcut').forEach((x) => x.remove());
  for (const r of E.removes) { const d = document.createElement('div'); d.className = 'xcut'; d.style.left = X(r.fromFrame) + 'px'; d.style.width = Math.max(2, X(r.toFrame) - X(r.fromFrame)) + 'px'; inner?.append(d); }
}

// ---------- המלחין לפריטי עריכה ----------
function editComposer(c) {
  const k = sel.kind;
  if (k === 'frame-live') return frameComposer2(c);
  const x = k === 'remove' ? E.removes.find((r) => r.id === sel.id) : k === 'ecut' ? E.cuts.find((r) => r.id === sel.id) : k === 'framing' ? E.frames.find((r) => r.id === sel.id) : E.guides.find((r) => r.id === sel.id);
  if (!x) { sel = null; return emptyComposer(c); }
  const close = `<button class="xbtn" data-close title="סגור (Esc)">${I.x}</button>`;
  if (k === 'remove') {
    c.innerHTML = `<div class="cmp-head"><span class="badge edit">${I.cut}הוצא · ${esc(x.how)}</span><h3>${secs(x.fromFrame, x.toFrame)} מתוך הסרט</h3>${close}</div>
      <div class="anchor">פריימים <span class="mono">${x.fromFrame + 1}-${x.toFrame}</span> · <span class="mono">${tc(x.fromFrame)}</span> עד <span class="mono">${tc(x.toFrame - 1)}</span>. בתצוגה הערוכה מדלגים עליו, ובשליחה הוא מגיע אליי כהוצאה מהעריכה.</div>
      <div class="cmp-row"><button class="btn" data-pp="${Math.max(0, x.fromFrame - Math.round(FPS * 1.5))}:${Math.min(N, x.toFrame + Math.round(FPS * 1.5))}">${I.play}נגן לפני ואחרי</button><button class="btn" data-seek="${x.fromFrame}">הצג את מה שהוצא</button><button class="btn" data-restore>${I.restore}החזר לסרט</button></div>
      <textarea class="field" id="cmpText" placeholder="למה הוצא? (לא חובה)">${esc(x.note || '')}</textarea><div class="cmp-foot"><span id="cmpSaved">נשמר לבד</span></div>`;
  } else if (k === 'ecut') {
    c.innerHTML = `<div class="cmp-head"><span class="badge edit">${I.cut}קאט שהוספת</span><h3>פריים ${x.frame + 1}</h3>${close}</div>
      <div class="anchor"><span class="mono">${tc(x.frame)}</span>. עומדים אחריו ולוחצים <kbd>Q</kbd> כדי להוציא מהקאט עד הסמן, או לפניו ולוחצים <kbd>W</kbd> כדי להוציא מהסמן עד הקאט.</div>
      <div class="cmp-row"><button class="btn" data-seek="${x.frame}">עבור לקאט</button><button class="btn danger" data-delcut>מחק את הקאט</button></div>`;
  } else if (k === 'framing') {
    const L = LAYERS.find((l) => l.id === x.layer);
    c.innerHTML = `<div class="cmp-head"><span class="badge framing">${I.move}מסגור</span><h3>${esc(L?.label || x.layer)} · ${x.fromFrame === 0 && x.toFrame === N ? 'כל הסרט' : tc(x.fromFrame) + '-' + tc(x.toFrame - 1)}</h3>${close}</div>
      <div class="anchor">הזזה <span class="mono">x ${x.dx > 0 ? '+' : ''}${x.dx} · y ${x.dy > 0 ? '+' : ''}${x.dy}</span> פיקסלים · זום <span class="mono">${Math.round(x.scale * 100)}%</span>${x.split != null ? ` · קו הפיצול <span class="mono">${x.split}px</span>` : ''}. מוצג בתצוגה הערוכה.</div>
      <div class="cmp-row"><button class="btn primary" data-reframe>${I.move}ערוך במסגור</button><button class="btn danger" data-delframe>מחק</button></div>
      <textarea class="field" id="cmpText" placeholder="הערה על המסגור (לא חובה)">${esc(x.note || '')}</textarea><div class="cmp-foot"><span id="cmpSaved">נשמר לבד</span></div>`;
  } else {
    const ranged = x.fromFrame != null;
    c.innerHTML = `<div class="cmp-head"><span class="badge guide">${I.guide}קו עזר ${x.axis === 'y' ? 'אופקי' : 'אנכי'}</span><h3>${esc(x.label || 'קו עזר')}</h3>${close}</div>
      <div class="anchor">${x.axis === 'y' ? 'מלמעלה' : 'משמאל'}: <span class="mono">${Math.round(x.pos * (x.axis === 'y' ? M.height : M.width))}px</span> (${(x.pos * 100).toFixed(1)}%) · גוררים אותו על התמונה במצב קווי עזר (<kbd>G</kbd>)</div>
      <input class="inp" id="gLabel" maxlength="120" placeholder="מה הקו מסמן? למשל: הכתוביות כאן, גובה העיניים" value="${esc(x.label || '')}">
      <div class="seg" id="gScope"><button data-gs="film" class="${ranged ? '' : 'on'}">כל הסרט</button><button data-gs="shot" class="${ranged ? 'on' : ''}">רק בשוט הזה</button></div>
      <div class="cmp-row"><button class="btn danger" data-delguide>מחק את הקו</button></div>`;
  }
  c.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) return deselect();
    if (t.dataset.seek) return seek(+t.dataset.seek);
    if (t.dataset.pp) { const [a, b] = t.dataset.pp.split(':').map(Number); editedPreview = true; $('tbPreview').checked = true; return playRange(a, b); }
    if (t.hasAttribute('data-restore')) return restoreRemove(x.id);
    if (t.hasAttribute('data-delcut')) { editChange(() => { E.cuts = E.cuts.filter((y) => y.id !== x.id); }); sel = null; afterSelect(false); return toast('הקאט נמחק', '', { label: 'בטל', run: editUndo }); }
    if (t.hasAttribute('data-delframe')) { editChange(() => { E.frames = E.frames.filter((y) => y.id !== x.id); }); sel = null; afterSelect(false); return toast('המסגור נמחק', '', { label: 'בטל', run: editUndo }); }
    if (t.hasAttribute('data-reframe')) { seek(Math.max(x.fromFrame, Math.min(cur, x.toFrame - 1))); const L = LAYERS.find((l) => l.id === x.layer); setMode('frame'); FRM = framingDraft(L, x); FRM.scope = x.fromFrame === 0 && x.toFrame === N ? 'film' : 'keep'; renderComposer(false); return paintOverlay(); }
    if (t.hasAttribute('data-delguide')) { editChange(() => { E.guides = E.guides.filter((y) => y.id !== x.id); }); sel = null; afterSelect(false); return toast('הקו נמחק', '', { label: 'בטל', run: editUndo }); }
    if (t.dataset.gs) { const [a, b] = layerSegmentAt(null, cur); editChange(() => { const g = E.guides.find((y) => y.id === x.id); if (t.dataset.gs === 'film') { delete g.fromFrame; delete g.toFrame; } else { g.fromFrame = a; g.toFrame = b; } }); return renderComposer(false); }
  };
  const ta = $('cmpText');
  if (ta) ta.oninput = () => { $('cmpSaved').textContent = 'שומר…'; x.note = ta.value; afterEdit(); scheduleEditSave(); $('cmpSaved').textContent = 'נשמר לבד'; };
  const gl = $('gLabel');
  if (gl) { gl.oninput = () => { x.label = gl.value; paintOverlay(); renderNotes(); scheduleEditSave(); }; setTimeout(() => { if (!x.label) gl.focus({ preventScroll: true }); }, 30); }
}
function frameComposer2(c) {
  const L = LAYERS.find((l) => l.id === FRM.layer);
  const seg = layerSegmentAt(L, cur);
  c.innerHTML = `<div class="cmp-head"><span class="badge framing">${I.move}מסגור</span><h3>${esc(L.label)}</h3><button class="xbtn" data-close title="יציאה (Esc)">${I.x}</button></div>
    <div class="anchor">גוררים את ${esc(L.label)} על התמונה, גלגלת לזום, חיצים להזזה של פיקסל (Shift: 10). ${L.split ? 'הקו הצהוב הוא הגבול בין המושן למעלה ובין ' + esc(L.label) + ': גוררים אותו למעלה או למטה.' : ''} מה שרואים כאן זה מה שיצא ברינדור.</div>
    <div class="seg" id="frScope"><button data-fs="film" class="${FRM.scope === 'film' ? 'on' : ''}">כל הסרט</button><button data-fs="shot" class="${FRM.scope === 'shot' ? 'on' : ''}">השוט הזה (${tc(seg[0])}-${tc(seg[1] - 1)})</button>${FRM.scope === 'keep' ? '<button data-fs="keep" class="on">הטווח השמור</button>' : ''}</div>
    <div class="nums"><label>ימינה / שמאלה<input id="frDx" type="number" step="1"></label><label>למטה / למעלה<input id="frDy" type="number" step="1"></label><label>זום %<input id="frZoom" type="number" step="1" min="50" max="250"></label><label>קו פיצול<input id="frSplit" type="number" step="1"${L.split ? '' : ' disabled'}></label></div>
    <textarea class="field" id="frNote" style="min-height:64px" placeholder="הערה (לא חובה)">${esc(FRM.note || '')}</textarea>
    <div class="cmp-row"><button class="btn primary" data-frsave>שמור מסגור</button><button class="btn" data-frreset>אפס</button><button class="btn ghost" data-close>יציאה</button></div>`;
  updateFramePanel();
  const num = (id, fn) => { $(id).oninput = (e) => { const v = Number(e.target.value); if (Number.isFinite(v)) { fn(v); paintOverlay(); } }; };
  num('frDx', (v) => { FRM.dx = v; }); num('frDy', (v) => { FRM.dy = v; }); num('frZoom', (v) => { FRM.scale = clamp(v / 100, 0.5, 2.5); });
  if (L.split) num('frSplit', (v) => { FRM.split = clamp(Math.round(v), Math.round(M.height * 0.12), Math.round(M.height * 0.6)); });
  $('frNote').oninput = (e) => { FRM.note = e.target.value; };
  c.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) return setMode(null);
    if (t.dataset.fs) { FRM.scope = t.dataset.fs; return frameComposer2(c); }
    if (t.hasAttribute('data-frsave')) return saveFraming();
    if (t.hasAttribute('data-frreset')) { FRM.dx = 0; FRM.dy = 0; FRM.scale = 1; FRM.split = null; updateFramePanel(); return paintOverlay(); }
  };
}

// ---------- timeline ----------
const TL = { pxs: 0, fit: 0, rows: [] };
const X = (f) => (f / FPS) * TL.pxs;
const FX = (x) => clamp(Math.floor((x / TL.pxs) * FPS), 0, N - 1);
const waves = new Map();
function buildRows() {
  const rows = [{ id: 'ruler', label: 'זמן', cls: 'ruler' }];
  if (CUTS.length) rows.push({ id: 'cuts', label: 'קאטים', sub: CUTS.length, cls: 'cuts' });
  rows.push({ id: 'edit', label: 'עריכה', sub: editCount() || '', cls: 'edit' });
  rows.push({ id: 'shots', label: 'שוטים', sub: SHOTS.length, cls: 'shots', track: 'shots-t' });
  if (SFX.length) rows.push({ id: 'sfx', label: 'אפקטים', sub: SFX.length, cls: 'sfx', track: TRACKS.find((t) => t.lanes?.includes('sfx'))?.id || 'sfx' });
  if (more && CAPS.length) rows.push({ id: 'caps', label: 'כתוביות', sub: CAPS.length, cls: 'caps', track: TRACKS.find((t) => t.lanes?.includes('captions'))?.id || 'captions' });
  if (more) {
    const groups = new Map();
    for (const m of MOTION) { const k = m.track || 'motion'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); }
    for (const [k, list] of groups) rows.push({ id: 'm-' + k, label: TRACKS.find((t) => t.id === k)?.label || 'הנפשות', sub: list.length, cls: 'motion', items: list, track: TRACKS.some((t) => t.id === k) ? k : 'motion' });
  }
  for (const t of TRACKS.filter((t) => t.kind === 'audio' && t.src && !t.missing)) {
    const lane = /voice|vo/.test(t.id) ? 'voice' : /music/.test(t.id) ? 'music' : null;
    rows.push({ id: t.id, label: t.label, cls: 'wave', track: t.id, color: t.color, choice: CHOICES.find((c) => c.lane === lane) });
  }
  TL.rows = rows;
}
function rowForTrack(track) { if (!track) return 'ruler'; const r = TL.rows.find((x) => x.track === track); return r ? r.id : 'ruler'; }
function renderTimeline() {
  buildRows();
  const sc = $('tlScroll'), inner = $('tlInner');
  const avail = Math.max(200, sc.clientWidth - 2);
  TL.fit = avail / (N / FPS);
  if (!TL.pxs || TL.pxs < TL.fit) TL.pxs = TL.fit;
  inner.style.width = Math.max(avail, Math.ceil(X(N))) + 'px';
  $('tlLabels').innerHTML = TL.rows.map((r) => `<div class="tl-label" data-row="${esc(r.id)}">${r.choice ? `<button class="pick" data-choice="${esc(r.choice.id)}" title="${esc(r.choice.label)}">בחירה</button>` : ''}<span>${esc(r.label)}</span>${r.sub ? `<small>${r.sub}</small>` : ''}</div>`).join('');
  inner.innerHTML = TL.rows.map((r) => `<div class="row ${r.cls}" data-row="${esc(r.id)}"></div>`).join('') + '<div class="playhead" id="playhead"></div>';
  for (const r of TL.rows) renderRow(r, inner.querySelector(`.row[data-row="${CSS.escape(r.id)}"]`));
  const labels = $('tlLabels');
  for (const r of TL.rows) labels.querySelector(`[data-row="${CSS.escape(r.id)}"]`).style.height = inner.querySelector(`.row[data-row="${CSS.escape(r.id)}"]`).offsetHeight + 'px';
  paintMarks(); renderEditRow(); movePlayhead();
}
function renderRow(r, el) {
  if (r.cls === 'ruler') {
    const steps = [1, 2, 5, 10, 15, 30], step = steps.find((s) => s * TL.pxs >= 64) || 60, total = N / FPS;
    const minor = step * TL.pxs >= 240 ? step / 4 : step / 2;
    let h = '';
    for (let t = 0; t <= total + 1e-6; t += minor) {
      const major = Math.abs(t / step - Math.round(t / step)) < 1e-6;
      h += `<div class="tick${major ? '' : ' minor'}" style="left:${(t * TL.pxs).toFixed(1)}px">${major ? `<span>${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}</span>` : ''}</div>`;
    }
    el.innerHTML = h;
  } else if (r.cls === 'cuts') {
    el.innerHTML = CUTS.map((c, k) => `<button class="cutb" data-id="${esc(c.id)}" data-kind="cut" style="left:${X(c.frame).toFixed(1)}px" title="קאט ${k + 1} · ${esc(c.label)} · ${tc(c.frame)}" aria-label="קאט ${k + 1}">${I.cutS}</button>`).join('');
  } else if (r.cls === 'shots') {
    el.innerHTML = SHOTS.map((s, k) => {
      const x = X(s.frameIn), w = Math.max(6, X(s.frameOut) - x - 2);
      return `<button class="shotb${s === curShot ? ' cur' : ''}" data-id="${esc(s.id || '')}" data-kind="shot" style="left:${(x + 1).toFixed(1)}px;width:${w.toFixed(1)}px;${s.thumb ? `background-image:url('${FILE(s.thumb)}')` : ''}" title="שוט ${k + 1} · ${esc(s.label)} · ${tc(s.frameIn)} עד ${tc(s.frameOut - 1)}"><span class="n">${k + 1}</span>${w > 64 ? `<span class="t">${esc(s.label)}</span>` : ''}</button>`;
    }).join('');
  } else if (r.cls === 'sfx') {
    // מה שחשוב באפקט קצר הוא רגע הפגיעה, לא הזנב השקט של הקובץ: קצר מ-1.6 שנ׳ מצויר כסימון צר; ארוך (זמזום, תקתוק) לכל אורכו
    const ends = [], pos = SFX.map((s) => {
      const x = X(s.frameIn), full = X(s.frameOut) - x, long = (s.frameOut - s.frameIn) / FPS >= 1.6;
      const w = long ? Math.max(16, full) : clamp(0.32 * TL.pxs, 10, Math.max(10, full));
      let row = ends.findIndex((e) => e <= x - 2);
      if (row < 0 && ends.length < 3) { row = ends.length; ends.push(0); }
      if (row < 0) row = ends.indexOf(Math.min(...ends)); // צפוף מדי בזום הזה: חופף קצת; זום מפריד
      ends[row] = x + w;
      return { s, x, w, row };
    });
    el.style.height = Math.max(26, ends.length * 20 + 6) + 'px';
    el.innerHTML = pos.map(({ s, x, w, row }) => `<button class="sfxb" data-id="${esc(s.id)}" data-kind="sfx" style="left:${x.toFixed(1)}px;width:${w.toFixed(1)}px;top:${3 + row * 20}px" title="${esc(s.label)} · ${tc(s.frameIn)}">${w > 38 ? esc(s.label) : ''}</button>`).join('');
  } else if (r.cls === 'caps' || r.cls === 'motion') {
    const list = r.cls === 'caps' ? CAPS : r.items;
    const ends = [], pos = list.map((s) => { const x = X(s.frameIn), w = Math.max(10, X(s.frameOut) - x - 1); let row = ends.findIndex((e) => e <= x - 1); if (row < 0) { row = ends.length; ends.push(0); } ends[row] = x + w; return { s, x, w, row }; });
    el.style.height = Math.max(28, ends.length * 24 + 4) + 'px';
    el.innerHTML = pos.map(({ s, x, w, row }) => `<button class="capb" data-id="${esc(s.id)}" data-kind="${r.cls === 'caps' ? 'cap' : 'motion'}" style="left:${x.toFixed(1)}px;width:${w.toFixed(1)}px;top:${4 + row * 24}px" title="${esc(s.label || s.text)} · ${tc(s.frameIn)}">${w > 26 ? esc(s.label || s.text) : ''}</button>`).join('');
  } else if (r.cls === 'wave') {
    drawWave(r, el);
  } else if (r.cls === 'edit') {
    el.innerHTML = editRowHTML();
  }
}
async function drawWave(r, el) {
  let w = waves.get(r.track);
  if (!w) { try { w = await req('waveform', null, 'track=' + encodeURIComponent(r.track)); waves.set(r.track, w); } catch { return; } }
  if (!w.audio || !w.data || !el.isConnected) return;
  if (!w.bin) { const raw = atob(w.data), u8 = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i); w.bin = new Int16Array(u8.buffer); }
  const W = el.clientWidth, H = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 30000 / Math.max(1, W));
  const cv = document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  ctx.fillStyle = (r.color || '#7aa8ff') + 'bb';
  const pps = w.peaksPerSecond, len = w.length, bin = w.bin, mid = H / 2, amp = H / 2 - 3;
  for (let px = 0; px < W; px++) {
    const i0 = Math.floor((px / TL.pxs) * pps), i1 = Math.max(i0 + 1, Math.floor(((px + 1) / TL.pxs) * pps));
    let lo = 0, hi = 0;
    for (let i = i0; i < i1 && i < len; i++) { if (bin[2 * i] < lo) lo = bin[2 * i]; if (bin[2 * i + 1] > hi) hi = bin[2 * i + 1]; }
    const y0 = mid - (hi / 32767) * amp, y1 = mid - (lo / 32767) * amp;
    ctx.fillRect(px, y0, 1, Math.max(1, y1 - y0));
  }
  el.querySelector('canvas')?.remove();
  el.prepend(cv);
}
function paintMarks() {
  const inner = $('tlInner');
  if (!inner.firstChild) return;
  inner.querySelectorAll('[data-id]').forEach((b) => {
    const k = b.dataset.kind, id = b.dataset.id;
    if (k === 'pin' || k === 'range' || k === 'remove' || k === 'ecut' || k === 'framing') return;
    b.classList.toggle('sel', sel?.kind === 'item' && sel.id === id);
    b.classList.toggle('noted', !!itemHasNote(id));
  });
  inner.querySelectorAll('.pin,.band:not(.drag)').forEach((e) => e.remove());
  const ruler = inner.querySelector('.row.ruler');
  for (const n of activeFrameNotes()) {
    const p = document.createElement('button');
    p.className = 'pin'; p.dataset.id = n.id; p.dataset.kind = 'pin';
    p.style.left = X(n.frameIndex + 0.5) + 'px';
    p.title = `פריים ${n.frameIndex + 1} · ${n.text?.trim() || 'סימון על התמונה'}`;
    ruler.append(p);
  }
  for (const r of [...L.ranges, ...(pending ? [pending] : [])]) {
    const row = inner.querySelector(`.row[data-row="${CSS.escape(rowForTrack(r.track))}"]`) || ruler;
    const b = document.createElement('div');
    b.className = 'band' + ((sel?.kind === 'range' || sel?.kind === 'pending') && sel.id === r.id ? ' sel' : '');
    b.dataset.id = r.id; b.dataset.kind = 'range';
    b.style.left = X(r.fromFrame) + 'px'; b.style.width = Math.max(3, X(r.toFrame + 1) - X(r.fromFrame)) + 'px';
    b.title = r.text || 'קטע';
    row.append(b);
  }
}
function movePlayhead() { const ph = $('playhead'); if (ph) ph.style.transform = `translateX(${X(cur + 0.5).toFixed(1)}px)`; }
function followPlayhead() {
  const sc = $('tlScroll'), x = X(cur);
  if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = Math.max(0, x - 60);
}
function revealPlayhead() {
  const sc = $('tlScroll'), x = X(cur);
  if (x < sc.scrollLeft + 20 || x > sc.scrollLeft + sc.clientWidth - 20) sc.scrollLeft = Math.max(0, x - sc.clientWidth / 2);
}
function zoomAt(k, anchor) {
  const sc = $('tlScroll');
  if (anchor == null) anchor = clamp(X(cur) - sc.scrollLeft, 0, sc.clientWidth);
  const t = (sc.scrollLeft + anchor) / TL.pxs;
  TL.pxs = clamp(TL.pxs * k, TL.fit, TL.fit * 14);
  renderTimeline();
  sc.scrollLeft = t * TL.pxs - anchor;
}
function bindTimeline() {
  const inner = $('tlInner'), sc = $('tlScroll');
  inner.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    const k = b.dataset.kind, id = b.dataset.id;
    if (k === 'pin') return selectFrameNote(id);
    if (k === 'range') return selectRange(id);
    if (k === 'remove' || k === 'ecut' || k === 'framing') return selectEdit(k, id);
    if (id) selectItem(id);
  });
  inner.addEventListener('dblclick', (e) => { const b = e.target.closest('.shotb'); const s = b && BY.get(b.dataset.id); if (s) playRange(s.frameIn, s.frameOut); });
  inner.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('[data-id]')) return;
    const row = e.target.closest('.row'); if (!row) return;
    const def = TL.rows.find((r) => r.id === row.dataset.row);
    const rect = inner.getBoundingClientRect(), fx = (ev) => FX(ev.clientX - rect.left);
    const startF = fx(e), startX = e.clientX, canRange = def && ['wave', 'sfx', 'caps', 'motion', 'shots'].includes(def.cls);
    let moved = false, band = null;
    inner.setPointerCapture(e.pointerId);
    const move = (ev) => {
      if (!moved && Math.abs(ev.clientX - startX) > 4) moved = true;
      if (!moved) return;
      if (!canRange) return seek(fx(ev));
      const a = Math.min(startF, fx(ev)), b = Math.max(startF, fx(ev));
      if (!band) { band = document.createElement('div'); band.className = 'band drag'; row.append(band); }
      band.style.left = X(a) + 'px'; band.style.width = Math.max(2, X(b + 1) - X(a)) + 'px';
    };
    const up = (ev) => {
      inner.removeEventListener('pointermove', move); inner.removeEventListener('pointerup', up); inner.removeEventListener('pointercancel', up);
      if (!moved) return seek(fx(ev));
      if (band) { band.remove(); const a = Math.min(startF, fx(ev)), b = Math.max(startF, fx(ev)); if (b - a >= 3) newRange(a, b, def.track || null); }
    };
    inner.addEventListener('pointermove', move); inner.addEventListener('pointerup', up); inner.addEventListener('pointercancel', up);
  });
  sc.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - sc.getBoundingClientRect().left); }, { passive: false });
  $('tlLabels').addEventListener('click', (e) => { const b = e.target.closest('[data-choice]'); if (b) selectItem(b.dataset.choice); });
  $('zIn').onclick = () => zoomAt(1.6);
  $('zOut').onclick = () => zoomAt(1 / 1.6);
  $('zFit').onclick = () => { TL.pxs = 0; renderTimeline(); sc.scrollLeft = 0; };
  $('more').onchange = (e) => { more = e.target.checked; renderTimeline(); };
}

// ---------- notes model ----------
const activeFrameNotes = () => frameNotes.filter((n) => !n.archived && (n.text?.trim() || n.drawings?.length));
function itemHasNote(id) { const d = L.items[id]; return d && ((d.note || '').trim() || d.verdict || d.option != null); }
function putItem(id, patch) {
  const d = { verdict: null, note: '', text: null, option: null, ...(L.items[id] || {}), ...patch };
  if (!d.verdict && !(d.note || '').trim() && d.text == null && d.option == null) delete L.items[id];
  else L.items[id] = d;
  scheduleLanesSave(); afterChange();
}
let changeT = null;
function afterChange() { clearTimeout(changeT); changeT = setTimeout(() => { renderNotes(); paintMarks(); updateCounts(); }, 120); }

let saveT = null, dirty = false, chain = Promise.resolve();
function scheduleLanesSave() { if (!hasLanes) return; dirty = true; setSave('saving'); clearTimeout(saveT); saveT = setTimeout(flushLanes, 450); }
function flushLanes() { clearTimeout(saveT); chain = chain.then(saveLanes, saveLanes); return chain; }
function lanesBody() {
  const items = {};
  for (const [id, d] of Object.entries(L.items)) items[id] = { verdict: d.verdict ?? null, note: d.note || '', text: d.text ?? null, option: d.option ?? null };
  const ranges = L.ranges.map((r) => ({ id: r.id, fromFrame: r.fromFrame, toFrame: r.toFrame, text: r.text || '', ...(r.track ? { track: r.track } : {}), ...(r.itemId ? { itemId: r.itemId } : {}) }));
  return { itemsSha256: M.lanes.itemsSha256, revision: L.revision, items, ranges, general: L.general || '' };
}
async function saveLanes() {
  if (!hasLanes || !dirty) return;
  dirty = false;
  try {
    const r = await req('lanes', lanesBody());
    const s = r.state;
    L.revision = s.revision;
    for (const [id, d] of Object.entries(s.items || {})) if (L.items[id]) L.items[id].updatedAt = d.updatedAt;
    for (const x of s.ranges || []) { const mine = L.ranges.find((y) => y.id === x.id); if (mine) mine.updatedAt = x.updatedAt; }
    L.generalUpdatedAt = s.generalUpdatedAt;
    if (!dirty) setSave('saved');
    const cs = $('cmpSaved'); if (cs && !dirty) cs.textContent = 'נשמר ✓';
  } catch (e) {
    if (e.status === 409 && e.body?.state) {
      L = { ...e.body.state, items: e.body.state.items || {}, ranges: e.body.state.ranges || [], general: e.body.state.general || '' };
      setSave('saved'); renderComposer(false); afterChange();
      toast('ההערות עודכנו בחלון אחר, אז טענתי את מה שנשמר שם.', 'error');
    } else {
      dirty = true; setSave('error');
      toast(e.message + (e.body?.reload ? ' · רעננו את הדף' : ''), 'error');
      if (!e.body?.reload) saveT = setTimeout(flushLanes, 4000);
    }
  }
}

// ---------- selection ----------
function selectItem(id, opts = {}) {
  const it = BY.get(id);
  if (!it) return;
  if (pending) pending = null;
  sel = { kind: 'item', id };
  if (!opts.noSeek) {
    if (it.kind === 'shot') { if (!(cur >= it.frameIn && cur < it.frameOut)) seek(it.frameIn); else V.pause(); }
    else if (it.kind === 'cut') seek(it.frame);
    else if (it.kind !== 'choice') seek(it.frameIn ?? it.frame ?? cur);
  }
  afterSelect();
}
function selectEdit(kind, id) {
  if (mode === 'frame') setMode(null);
  pending = null; sel = { kind, id };
  const x = kind === 'remove' ? E.removes.find((r) => r.id === id) : kind === 'ecut' ? E.cuts.find((r) => r.id === id) : kind === 'framing' ? E.frames.find((r) => r.id === id) : null;
  if (x) seek(kind === 'ecut' ? x.frame : kind === 'framing' ? clamp(cur, x.fromFrame, x.toFrame - 1) : x.fromFrame);
  afterSelect();
}
function selectRange(id) { pending = null; const r = L.ranges.find((x) => x.id === id); if (!r) return; sel = { kind: 'range', id }; seek(r.fromFrame); afterSelect(); }
function selectFrameNote(id) { const n = frameNotes.find((x) => x.id === id); if (!n) return; pending = null; sel = { kind: 'frame', id }; seek(n.frameIndex); afterSelect(); }
function deselect() {
  if (pending) pending = null;
  const empty = L.ranges.filter((r) => !(r.text || '').trim());
  if (empty.length) { L.ranges = L.ranges.filter((r) => (r.text || '').trim()); scheduleLanesSave(); }
  sel = null; afterSelect(false);
}
function afterSelect(focus = true) {
  paintMarks(); renderEditRow(); renderComposer(focus); renderNotes(); paintOverlay();
  const card = document.querySelector('.ncard.sel'); card?.scrollIntoView({ block: 'nearest' });
  const tb = sel && document.querySelector(`#tlInner [data-id="${CSS.escape(sel.id)}"]`);
  if (tb) { const sc = $('tlScroll'), x = tb.offsetLeft; if (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth - 30) sc.scrollLeft = Math.max(0, x - sc.clientWidth / 3); }
}
function newRange(a, b, track) {
  pending = { id: crypto.randomUUID(), fromFrame: a, toFrame: b, text: '', ...(track ? { track } : {}) };
  sel = { kind: 'pending', id: pending.id };
  seek(a); afterSelect();
}
function noteShot() { const s = shotAt(cur); if (s?.id) selectItem(s.id, { noSeek: true }); else toast('אין מפת שוטים לגרסה הזאת'); }
function noteCut() { const c = nearestCut(cur); if (c?.id) selectItem(c.id); else toast('אין קאטים בגרסה הזאת'); }
function rangeKey() {
  if (rangeIn == null) {
    rangeIn = cur; $('actRange').classList.add('armed');
    $('rangeHint').hidden = false; $('rangeHint').textContent = `קטע מ-${tc(cur)} · הזיזו ולחצו R שוב לסיום`;
    $('actRangeSub').textContent = 'עכשיו בחרו את נקודת הסיום · R';
    return;
  }
  let a = Math.min(rangeIn, cur), b = Math.max(rangeIn, cur);
  if (b - a < 2) b = Math.min(N - 1, a + Math.round(FPS));
  cancelRange(); newRange(a, b, null);
}
function cancelRange() { rangeIn = null; $('actRange').classList.remove('armed'); $('rangeHint').hidden = true; $('actRangeSub').textContent = 'מנקודה לנקודה · R'; }

// ---------- composer ----------
function renderComposer(focus = true) {
  const c = $('composer');
  AUD.pause();
  c.onclick = null;
  if (!sel) return emptyComposer(c);
  if (sel.kind === 'frame') { const n = frameNotes.find((x) => x.id === sel.id); return n ? frameComposer(c, n) : (sel = null, emptyComposer(c)); }
  if (sel.kind === 'range' || sel.kind === 'pending') return rangeComposer(c, focus);
  if (['remove', 'ecut', 'framing', 'guide', 'frame-live'].includes(sel.kind)) return editComposer(c);
  const it = BY.get(sel.id);
  if (!it) { sel = null; return emptyComposer(c); }
  if (it.kind === 'choice') return choiceComposer(c, it);
  itemComposer(c, it, focus);
}
function choiceStatus(it) {
  const o = it.options.find((x) => x.id === (L.items[it.id]?.option ?? it.selected));
  return o ? (L.items[it.id]?.option != null ? 'בחרת: ' : 'עכשיו: ') + o.label.split(' · ')[0] : 'עוד לא נבחר';
}
function emptyComposer(c) {
  c.innerHTML = `<div class="cmp-empty${entries().length ? ' compact' : ''}">
    <h2>על מה להעיר?</h2>
    <p>כל הערה נשמרת מיד ברשימה למטה, עם מה שהיא מתייחסת אליו בדיוק.</p>
    <div class="ways">
      <button class="way" data-way="frame"><span class="ic" style="color:var(--frame)">${I.pin}</span><span><b>פריים מסוים</b><small>עוצרים על הרגע ולוחצים <kbd>M</kbd>. הפריים נפתח בגדול, מציירים חץ, ריבוע או עיגול וכותבים.</small></span></button>
      <button class="way" data-way="shot"><span class="ic" style="color:var(--shot)">${I.film}</span><span><b>שוט או קאט</b><small>לוחצים על שוט בציר הזמן, או על המספריים שבין שני שוטים.</small></span></button>
      <button class="way" data-way="sfx"><span class="ic" style="color:var(--sfx)">${I.wave}</span><span><b>אפקט סאונד או קטע</b><small>לוחצים על אפקט ברצועת האפקטים, או גוררים על הקריינות והמוזיקה.</small></span></button>
    </div>
    ${CHOICES.length ? `<div class="decisions"><h4>מחכה להחלטה שלך</h4>${CHOICES.map((it) => `<button class="dec" data-choice="${esc(it.id)}">${it.lane === 'voice' ? I.mic : I.music}<b>${esc(it.label)}</b><small>${esc(choiceStatus(it))}</small></button>`).join('')}</div>` : ''}
  </div>`;
  c.onclick = (e) => {
    const w = e.target.closest('[data-way]'), d = e.target.closest('[data-choice]');
    if (d) return selectItem(d.dataset.choice);
    if (!w) return;
    if (w.dataset.way === 'frame') return openStudio({ frame: cur });
    if (w.dataset.way === 'shot') return noteShot();
    if (w.dataset.way === 'sfx') { const s = SFX.reduce((b, x) => (!b || Math.abs(x.frameIn - cur) < Math.abs(b.frameIn - cur) ? x : b), null); if (s) selectItem(s.id); }
  };
}
function cmpShell(head, anchor, body, kind, value, extraFoot = '') {
  const meta = KIND[kind] || KIND.item;
  return `<div class="cmp-head">${head}<button class="xbtn" data-close title="סגור (Esc)">${I.x}</button></div>
    <div class="anchor">${anchor}</div>${body}
    <textarea class="field" id="cmpText" placeholder="${esc(meta.ph)}">${esc(value)}</textarea>
    ${meta.chips.length ? `<div class="chips">${meta.chips.map((x) => `<button class="chip" data-chip="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
    <div class="cmp-foot"><span id="cmpSaved">${value ? 'שמור' : 'נשמר לבד תוך כדי כתיבה'}</span><span class="grow"></span>${extraFoot}</div>`;
}
function itemComposer(c, it, focus) {
  const kind = kindOf(it), note = L.items[it.id]?.note || '';
  let head = '', anchor = '', body = '';
  if (kind === 'shot') {
    const n = shotNo(it), fr = [it.frameIn, Math.floor((it.frameIn + it.frameOut) / 2), it.frameOut - 1], cap = ['התחלה', 'אמצע', 'סוף'];
    const th = it.thumbs?.length === 3 ? it.thumbs : it.thumb ? [it.thumb, it.thumb, it.thumb] : [];
    head = `<span class="badge shot">${I.film}שוט ${n}</span><h3>${esc(it.label)}</h3>`;
    anchor = `ההערה תישמר על <b>השוט כולו</b>, מקאט לקאט: <span class="mono">${tc(it.frameIn)}</span> עד <span class="mono">${tc(it.frameOut - 1)}</span> · ${secs(it.frameIn, it.frameOut)}`;
    body = (th.length ? `<div class="media3">${th.map((t, i) => `<button class="mthumb" data-seek="${fr[i]}" title="הצג את ה${cap[i]} בנגן"><img src="${FILE(t)}" alt=""><span>${cap[i]}</span></button>`).join('')}</div>` : '') +
      `<div class="cmp-row"><button class="btn" data-play="${it.frameIn}:${it.frameOut}">${I.play}נגן את השוט</button><button class="btn" data-loop="${it.frameIn}:${it.frameOut}">${I.loop}בלופ</button><button class="btn" data-mark>${I.pin}סמן פריים מתוכו</button></div>`;
  } else if (kind === 'cut') {
    const k = CUTS.indexOf(it) + 1, [from, to] = String(it.label || '').split(' ← ');
    head = `<span class="badge cut">${I.cut}קאט ${k}</span><h3>${esc(from || '')}${to ? ' ← ' + esc(to) : ''}</h3>`;
    anchor = `ההערה תישמר על <b>הקאט עצמו</b>: הרגע שבו שוט ${shotNo(shotAt(it.frame - 1))} מתחלף לשוט ${shotNo(shotAt(it.frame))} · פריים ${it.frame + 1} · <span class="mono">${tc(it.frame)}</span>`;
    body = (it.thumbs?.length === 2 ? `<div class="media2"><button class="mthumb" data-seek="${it.frame - 1}"><img src="${FILE(it.thumbs[0])}" alt=""><span>לפני הקאט</span></button><button class="mthumb" data-seek="${it.frame}"><img src="${FILE(it.thumbs[1])}" alt=""><span>אחרי הקאט</span></button></div>` : '') +
      `<div class="cmp-row"><button class="btn" data-play="${Math.max(0, it.frame - Math.round(FPS))}:${Math.min(N, it.frame + Math.round(FPS))}">${I.play}נגן שנייה לפני ואחרי</button><button class="btn" data-loop="${Math.max(0, it.frame - Math.round(FPS))}:${Math.min(N, it.frame + Math.round(FPS))}">${I.loop}בלופ</button></div>`;
  } else if (kind === 'sfx') {
    head = `<span class="badge sfx">${I.wave}אפקט סאונד</span><h3>${esc(it.label)}</h3>`;
    anchor = `ההערה תישמר על <b>האפקט הזה</b> · נכנס ב-<span class="mono">${tc(it.frameIn)}</span> · ${secs(it.frameIn, it.frameOut)}${it.gainDb != null ? ` · <span class="mono">${it.gainDb} dB</span>` : ''} · בשוט ${shotNo(shotAt(it.frameIn))}`;
    body = `<div class="cmp-row">${it.preview ? `<button class="btn" data-solo="${esc(it.id)}">${I.vol}השמע אותו לבד</button>` : ''}<button class="btn" data-context="${esc(it.id)}">${I.play}נגן בהקשר, עם סאונד</button></div>`;
  } else {
    const name = KIND[kind]?.name || 'פריט';
    head = `<span class="badge item">${kind === 'cap' ? I.type : kind === 'voice' ? I.mic : I.spark}${name}</span><h3>${esc(it.label || it.text || it.id)}</h3>`;
    anchor = `ההערה תישמר על <b>ה${name} הזאת</b>: <span class="mono">${tc(it.frameIn ?? 0)}</span> עד <span class="mono">${tc(Math.max(0, (it.frameOut ?? 1) - 1))}</span>${it.ref ? ` · <span class="mono">#${esc(it.ref)}</span>` : ''}`;
    body = `<div class="cmp-row"><button class="btn" data-play="${it.frameIn ?? 0}:${it.frameOut ?? N}">${I.play}נגן</button>${it.preview ? `<button class="btn" data-solo="${esc(it.id)}">${I.vol}השמע לבד</button>` : ''}</div>`;
  }
  c.innerHTML = cmpShell(head, anchor, body, kind, note, note ? '<button class="linkbtn danger" data-clear>מחק את ההערה</button>' : '');
  bindComposer(c, (v) => { putItem(it.id, { note: v }); }, () => putItem(it.id, { note: '' }));
  if (focus) setTimeout(() => $('cmpText')?.focus({ preventScroll: true }), 30);
}
function rangeComposer(c, focus) {
  const r = sel.kind === 'pending' ? pending : L.ranges.find((x) => x.id === sel.id);
  if (!r) { sel = null; return emptyComposer(c); }
  const where = trackLabel(r.track);
  const head = `<span class="badge range">${I.range}קטע</span><h3>${r.track ? esc(where) : 'קטע בסרט'} · ${secs(r.fromFrame, r.toFrame + 1)}</h3>`;
  const anchor = `ההערה תישמר על <b>הקטע</b>${r.track ? ` ברצועת ${esc(where)}` : ''}: <span class="mono">${tc(r.fromFrame)}</span> עד <span class="mono">${tc(r.toFrame)}</span>`;
  const body = `<div class="cmp-row"><button class="btn" data-play="${r.fromFrame}:${r.toFrame + 1}">${I.play}נגן את הקטע</button><button class="btn" data-loop="${r.fromFrame}:${r.toFrame + 1}">${I.loop}בלופ</button></div>`;
  c.innerHTML = cmpShell(head, anchor, body, 'range', r.text || '', sel.kind === 'range' ? '<button class="linkbtn danger" data-clear>מחק את הקטע</button>' : '');
  bindComposer(c, (v) => {
    r.text = v;
    if (sel.kind === 'pending') { if (!v.trim()) return; L.ranges.push(r); pending = null; sel = { kind: 'range', id: r.id }; }
    scheduleLanesSave(); afterChange();
  }, () => { L.ranges = L.ranges.filter((x) => x.id !== r.id); pending = null; sel = null; scheduleLanesSave(); afterSelect(false); });
  if (focus) setTimeout(() => $('cmpText')?.focus({ preventScroll: true }), 30);
}
function frameComposer(c, n) {
  const s = shotAt(n.frameIndex);
  c.innerHTML = `<div class="cmp-head"><span class="badge frame">${I.pin}פריים ${n.frameIndex + 1}</span><h3>שוט ${shotNo(s)} · ${esc(s.label)}</h3><button class="xbtn" data-close title="סגור (Esc)">${I.x}</button></div>
    <div class="anchor">ההערה שמורה על <b>הפריים הזה בדיוק</b> · <span class="mono">${tc(n.frameIndex)}</span>${n.drawings?.length ? ` · ${n.drawings.length} סימונים על התמונה` : ''}</div>
    <button class="mthumb" data-edit title="לחצו לעריכה"><img src="${FILE(n.annotatedFrame || n.baseFrame)}" alt="הפריים עם הסימונים"><span>לחצו לעריכה</span></button>
    ${n.text?.trim() ? `<p class="ntext" style="-webkit-line-clamp:12">${esc(n.text)}</p>` : '<p class="ntext muted">סימון על התמונה, בלי טקסט</p>'}
    <div class="cmp-row"><button class="btn primary" data-edit>${I.pen}עריכת הציור וההערה</button><span class="grow" style="flex:1"></span><button class="linkbtn danger" data-del>מחק</button></div>`;
  c.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) return deselect();
    if (t.hasAttribute('data-edit')) return openStudio({ note: n });
    if (t.hasAttribute('data-del')) return archiveFrameNote(n);
  };
}
function choiceComposer(c, it) {
  const chosen = L.items[it.id]?.option ?? it.selected, note = L.items[it.id]?.note || '';
  c.innerHTML = `<div class="cmp-head"><span class="badge choice">${it.lane === 'voice' ? I.mic : I.music}החלטה</span><h3>${esc(it.label)}</h3><button class="xbtn" data-close title="סגור (Esc)">${I.x}</button></div>
    <div class="anchor">${it.lane === 'music' ? 'כל אפשרות מנוגנת מתחת לקריינות שלך, באותה רמה.' : 'אותו טקסט, בקול שלך.'} הבחירה נשמרת ומגיעה אליי עם ההערות.</div>
    <div class="opts">${it.options.map((o) => `<div class="opt${o.id === chosen ? ' on' : ''}" data-opt="${esc(o.id)}"><button class="play" data-oplay="${esc(o.id)}" title="השמע">${I.play}</button><div class="lbl">${esc(o.label)}<div class="prog"><i></i></div></div><button class="choose" data-ochoose="${esc(o.id)}">${o.id === chosen ? I.check.replace('<svg', '<svg style="display:inline;vertical-align:-3px"') + ' נבחרה' : 'לבחור בזו'}</button></div>`).join('')}</div>
    <textarea class="field" id="cmpText" placeholder="הערה על הבחירה (לא חובה)">${esc(note)}</textarea>
    <div class="cmp-foot"><span id="cmpSaved">נשמר לבד</span></div>`;
  let playing = null;
  const prog = () => { const el = playing && c.querySelector(`[data-opt="${CSS.escape(playing)}"] .prog i`); if (el && AUD.duration) el.style.width = (100 * AUD.currentTime / AUD.duration).toFixed(1) + '%'; };
  AUD.ontimeupdate = prog;
  AUD.onpause = AUD.onended = () => { c.querySelectorAll('[data-oplay]').forEach((b) => (b.innerHTML = I.play)); };
  c.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) { AUD.pause(); return deselect(); }
    if (t.dataset.oplay) {
      const o = it.options.find((x) => x.id === t.dataset.oplay);
      if (playing === o.id && !AUD.paused) return AUD.pause();
      V.pause(); playing = o.id; AUD.src = FILE(o.preview); AUD.volume = 1; AUD.play().catch(() => {});
      c.querySelectorAll('[data-oplay]').forEach((b) => (b.innerHTML = b === t ? I.pause : I.play));
      return;
    }
    if (t.dataset.ochoose) { const v = t.dataset.ochoose; putItem(it.id, { option: v === it.selected ? null : v }); const keep = AUD.paused ? null : playing; choiceComposer(c, it); if (keep) { playing = keep; c.querySelector(`[data-oplay="${CSS.escape(keep)}"]`).innerHTML = I.pause; } return; }
  };
  $('cmpText').oninput = (e) => { $('cmpSaved').textContent = 'שומר…'; putItem(it.id, { note: e.target.value }); };
}
function bindComposer(c, onText, onClear) {
  c.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) return deselect();
    if (t.dataset.seek) return seek(+t.dataset.seek);
    if (t.dataset.play) { const [a, b] = t.dataset.play.split(':').map(Number); return playRange(a, b, false); }
    if (t.dataset.loop) { const [a, b] = t.dataset.loop.split(':').map(Number); return playRange(a, b, true); }
    if (t.hasAttribute('data-mark')) return openStudio({ frame: cur });
    if (t.dataset.solo) return playSolo(BY.get(t.dataset.solo), t);
    if (t.dataset.context) { const it = BY.get(t.dataset.context); V.muted = false; return playRange(Math.max(0, it.frameIn - Math.round(FPS * 0.8)), Math.min(N, it.frameIn + Math.round(FPS * 1.8))); }
    if (t.dataset.chip) {
      const ta = $('cmpText'), v = ta.value.trim();
      ta.value = v ? v + (/[.!?,:]$/.test(v) ? ' ' : '. ') + t.dataset.chip : t.dataset.chip;
      ta.dispatchEvent(new Event('input')); ta.focus(); return;
    }
    if (t.hasAttribute('data-clear')) { onClear(); const ta = $('cmpText'); if (ta) ta.value = ''; return; }
  };
  const ta = $('cmpText');
  ta.oninput = () => { $('cmpSaved').textContent = 'שומר…'; onText(ta.value); };
}
function playSolo(it, btn) {
  if (!it?.preview) return;
  if (!AUD.paused && AUD.dataset.src === it.preview) { AUD.pause(); return; }
  V.pause();
  AUD.ontimeupdate = null; AUD.onpause = AUD.onended = null;
  AUD.src = FILE(it.preview); AUD.dataset.src = it.preview;
  AUD.volume = clamp(Math.pow(10, (it.gainDb || 0) / 20), 0.05, 1);
  AUD.play().catch(() => {});
}

// ---------- notes list ----------
const ORDER = { frame: 0, shot: 1, cut: 2, sfx: 3, cap: 4, motion: 5, voice: 6, choice: 7, item: 8, range: 9, remove: 10, ecut: 11, framing: 12, guide: 13 };
const FILTERS = [['all', 'הכל'], ['frame', 'פריימים'], ['shot', 'שוטים'], ['cut', 'קאטים'], ['sfx', 'אפקטים'], ['range', 'קטעים'], ['edit', 'עריכה'], ['other', 'עוד']];
function entries() {
  const out = [];
  for (const n of activeFrameNotes()) out.push({ kind: 'frame', id: n.id, frame: n.frameIndex, n, at: n.updatedAt });
  for (const [id, d] of Object.entries(L.items)) {
    const it = BY.get(id);
    if (!it || !itemHasNote(id)) continue;
    out.push({ kind: kindOf(it), id, frame: it.frame ?? it.frameIn ?? 0, it, d, at: d.updatedAt });
  }
  for (const r of L.ranges) if ((r.text || '').trim()) out.push({ kind: 'range', id: r.id, frame: r.fromFrame, r, at: r.updatedAt });
  for (const x of E.removes) out.push({ kind: 'remove', id: x.id, frame: x.fromFrame, x, at: x.at });
  for (const x of E.cuts) out.push({ kind: 'ecut', id: x.id, frame: x.frame, x, at: x.at });
  for (const x of E.frames) out.push({ kind: 'framing', id: x.id, frame: x.fromFrame, x, at: x.at });
  for (const x of E.guides) out.push({ kind: 'guide', id: x.id, frame: x.fromFrame ?? 0, x, at: x.at });
  return out.sort((a, b) => a.frame - b.frame || ORDER[a.kind] - ORDER[b.kind]);
}
const groupOf = (k) => (['frame', 'shot', 'cut', 'sfx', 'range'].includes(k) ? k : ['remove', 'ecut', 'framing', 'guide'].includes(k) ? 'edit' : 'other');
function renderNotes() {
  const all = entries(), counts = {};
  for (const e of all) counts[groupOf(e.kind)] = (counts[groupOf(e.kind)] || 0) + 1;
  $('filters').innerHTML = FILTERS.filter(([k]) => k === 'all' || counts[k]).map(([k, label]) => `<button data-f="${k}" class="${filter === k ? 'on' : ''}">${label}<em>${k === 'all' ? all.length : counts[k]}</em></button>`).join('');
  if (filter !== 'all' && !counts[filter]) filter = 'all';
  const list = filter === 'all' ? all : all.filter((e) => groupOf(e.kind) === filter);
  $('notesCount').textContent = all.length ? `· ${all.length}` : '';
  const box = $('noteList');
  if (!list.length) {
    box.innerHTML = `<div class="empty-list"><div class="glyph">${I.pin}</div>עוד אין הערות.<br>עצרו על רגע ולחצו <kbd>M</kbd>, או לחצו על שוט, קאט או אפקט בציר הזמן.</div>`;
  } else box.innerHTML = list.map(card).join('');
  updateCounts();
}
function card(e) {
  let thumb = '', badge = '', where = '', text = '';
  const ek = ['remove', 'ecut', 'framing', 'guide'].includes(e.kind);
  const isSel = sel && sel.id === e.id && ((e.kind === 'frame' && sel.kind === 'frame') || (e.kind === 'range' && sel.kind === 'range') || (ek && sel.kind === e.kind) || (!ek && e.kind !== 'frame' && e.kind !== 'range' && sel.kind === 'item'));
  if (ek) {
    const x = e.x;
    if (e.kind === 'remove') { thumb = `<span class="glyph" style="color:#ff8f8f">${I.cut}</span>`; badge = `<span class="badge edit">הוצא · ${esc(x.how)}</span>`; where = `<span class="mono">${tc(x.fromFrame)}</span> · ${secs(x.fromFrame, x.toFrame)}`; text = x.note ? esc(x.note) : '<span class="muted">הקטע יוצא מהעריכה</span>'; }
    else if (e.kind === 'ecut') { thumb = `<span class="glyph" style="color:var(--accent)">${I.cut}</span>`; badge = '<span class="badge edit">קאט</span>'; where = `<span class="mono">${tc(x.frame)}</span>`; text = '<span class="muted">קאט שהוספת</span>'; }
    else if (e.kind === 'framing') { thumb = `<span class="glyph" style="color:var(--shot)">${I.move}</span>`; badge = '<span class="badge framing">מסגור</span>'; where = `${esc(LAYERS.find((l) => l.id === x.layer)?.label || x.layer)} · ${x.fromFrame === 0 && x.toFrame === N ? 'כל הסרט' : `<span class="mono">${tc(x.fromFrame)}</span>`}`; text = `x ${x.dx > 0 ? '+' : ''}${x.dx} · y ${x.dy > 0 ? '+' : ''}${x.dy} · זום ${Math.round(x.scale * 100)}%${x.split != null ? ' · פיצול ' + x.split : ''}${x.note ? '<br>' + esc(x.note) : ''}`; }
    else { thumb = `<span class="glyph" style="color:#7cc0ff">${I.guide}</span>`; badge = `<span class="badge guide">קו ${x.axis === 'y' ? 'אופקי' : 'אנכי'}</span>`; where = `${Math.round(x.pos * (x.axis === 'y' ? M.height : M.width))}px · ${x.fromFrame != null ? 'בשוט' : 'כל הסרט'}`; text = x.label ? esc(x.label) : '<span class="muted">בלי תווית</span>'; }
  } else if (e.kind === 'frame') {
    const n = e.n, s = shotAt(n.frameIndex);
    thumb = `<img src="${FILE(n.annotatedFrame || n.baseFrame)}" alt="" loading="lazy">`;
    badge = `<span class="badge frame">${I.pin}פריים ${n.frameIndex + 1}</span>`;
    where = `<span class="mono">${tc(n.frameIndex)}</span> · שוט ${shotNo(s)}`;
    text = n.text?.trim() ? esc(n.text) : `<span class="muted">${n.drawings.length} סימונים על התמונה</span>`;
  } else if (e.kind === 'range') {
    thumb = `<span class="glyph" style="color:var(--range)">${I.range}</span>`;
    badge = `<span class="badge range">${I.range}קטע</span>`;
    where = `${esc(trackLabel(e.r.track))} · <span class="mono">${tc(e.r.fromFrame)}</span>`;
    text = esc(e.r.text);
  } else {
    const it = e.it, k = e.kind;
    if (k === 'shot') { thumb = it.thumb ? `<img src="${FILE(it.thumb)}" alt="" loading="lazy">` : ''; badge = `<span class="badge shot">${I.film}שוט ${shotNo(it)}</span>`; where = `${esc(it.label)}`; }
    else if (k === 'cut') { thumb = it.thumbs?.length === 2 ? `<img src="${FILE(it.thumbs[0])}" alt=""><img src="${FILE(it.thumbs[1])}" alt="">` : ''; badge = `<span class="badge cut">${I.cut}קאט ${CUTS.indexOf(it) + 1}</span>`; where = `<span class="mono">${tc(it.frame)}</span>`; }
    else if (k === 'sfx') { thumb = `<span class="glyph" style="color:var(--sfx)">${I.wave}</span>`; badge = `<span class="badge sfx">${I.wave}אפקט</span>`; where = `${esc(it.label)} · <span class="mono">${tc(it.frameIn)}</span>`; }
    else if (k === 'choice') { thumb = `<span class="glyph" style="color:var(--accent)">${it.lane === 'voice' ? I.mic : I.music}</span>`; badge = `<span class="badge choice">החלטה</span>`; where = esc(it.label); }
    else { thumb = `<span class="glyph">${k === 'cap' ? I.type : k === 'voice' ? I.mic : I.spark}</span>`; badge = `<span class="badge item">${KIND[k]?.name || 'פריט'}</span>`; where = `${esc(it.label || it.text || '')} · <span class="mono">${tc(it.frameIn ?? 0)}</span>`; }
    const parts = [];
    if (k === 'choice') { const o = it.options.find((x) => x.id === (e.d.option ?? it.selected)); if (e.d.option != null && o) parts.push('בחרת: ' + esc(o.label)); }
    if ((e.d.note || '').trim()) parts.push(esc(e.d.note));
    text = parts.join('\n') || '<span class="muted">בלי טקסט</span>';
  }
  const split = e.kind === 'cut' && thumb.includes('<img') ? ' split' : '';
  return `<div class="ncard${isSel ? ' sel' : ''}" role="button" tabindex="0" data-k="${e.kind}" data-id="${esc(e.id)}">
    <div class="nthumb${split}">${thumb}</div>
    <div class="nbody"><div class="nline">${badge}${wasSent(e.at) ? '<span class="sent">נשלח</span>' : ''}${byLine(e)}<span class="where">${where}</span></div><p class="ntext">${text}</p></div>
    <div class="nops"><button data-del title="מחק את ההערה">${I.trash}</button></div></div>`;
}
function bindNotes() {
  $('filters').onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; renderNotes(); };
  const open = (cardEl) => {
    const k = cardEl.dataset.k, id = cardEl.dataset.id;
    if (k === 'frame') return selectFrameNote(id);
    if (k === 'range') return selectRange(id);
    if (k === 'guide') { pending = null; sel = { kind: 'guide', id }; return afterSelect(); }
    if (['remove', 'ecut', 'framing'].includes(k)) return selectEdit(k, id);
    selectItem(id);
  };
  $('noteList').onclick = (e) => {
    const cardEl = e.target.closest('.ncard'); if (!cardEl) return;
    if (e.target.closest('[data-del]')) return deleteEntry(cardEl.dataset.k, cardEl.dataset.id);
    open(cardEl);
  };
  $('noteList').onkeydown = (e) => { if (e.key === 'Enter' && e.target.classList.contains('ncard')) open(e.target); };
}
function deleteEntry(k, id) {
  if (k === 'remove') return restoreRemove(id);
  if (['ecut', 'framing', 'guide'].includes(k)) {
    const key = { ecut: 'cuts', framing: 'frames', guide: 'guides' }[k];
    editChange(() => { E[key] = E[key].filter((x) => x.id !== id); });
    if (sel?.id === id) sel = null; afterSelect(false);
    return toast('נמחק', '', { label: 'בטל', run: editUndo });
  }
  if (k === 'frame') { const n = frameNotes.find((x) => x.id === id); if (n) archiveFrameNote(n); return; }
  if (k === 'range') {
    const r = L.ranges.find((x) => x.id === id); if (!r) return;
    L.ranges = L.ranges.filter((x) => x !== r); if (sel?.id === id) sel = null;
    scheduleLanesSave(); afterSelect(false);
    toast('הקטע נמחק', '', { label: 'בטל', run: () => { L.ranges.push(r); scheduleLanesSave(); afterSelect(false); } });
    return;
  }
  const prev = { ...L.items[id] };
  putItem(id, { note: '', verdict: null, option: null });
  if (sel?.id === id) renderComposer(false);
  toast('ההערה נמחקה', '', { label: 'בטל', run: () => { putItem(id, prev); renderComposer(false); } });
}
function updateCounts() {
  const n = entries().length + ((L.general || '').trim() ? 1 : 0);
  renderEditStat();
  $('sendCount').textContent = n;
  $('sendLabel').textContent = n ? `שלח לקלוד · ${n} ${n === 1 ? 'הערה' : 'הערות'}` : 'שלח לקלוד';
  $('sendTop').disabled = $('sendBottom').disabled = !n;
  $('generalDot').hidden = !(L.general || '').trim();
}
function renderDelivery() {
  const last = submissions.at(-1);
  if (!last) { $('delivery').textContent = 'ההערות נשמרות כאן. הן מגיעות אליי רק כשלוחצים "שלח לקלוד".'; return; }
  const st = delivery.find((d) => d.requestId === last.requestId)?.status || last.status;
  const word = { pending: 'ממתין לקלוד', working: 'קלוד עובד על זה', blocked: 'קלוד צריך ממך תשובה', done: 'טופל', completed: 'טופל' }[st] || st || '';
  const at = new Date(last.at);
  $('delivery').innerHTML = `נשלח לאחרונה ב-<span class="mono">${at.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>${word ? ` · <b>${esc(word)}</b>` : ''}`;
}
async function send() {
  if (!C.isOwner()) return toast('רק הראל שולח לקלוד. ההערות שלך כבר אצלו.');
  const n = entries().length + ((L.general || '').trim() ? 1 : 0);
  if (!n) return toast('עוד אין הערות לשליחה');
  $('sendTop').disabled = $('sendBottom').disabled = true;
  try {
    await flushLanes(); await flushEdit();
    if (dirty || editDirty) throw new Error('ההערות עוד לא נשמרו. נסו שוב בעוד רגע.');
    const r = await req('submit', {});
    // רן (29.9.2026): אחרי שליחה הלשונית נסגרת, רק כשהשרת אישר מסירה. שמירה בלי מסירה משאירה את החדר פתוח עם הסיבה.
    const delivered = ['delivered', 'completed', 'queued-for-claude'].includes(r.dispatch?.status);
    if (!delivered) toast('ההערות נשמרו, אך לא נמסרו לקלוד. ' + (r.dispatch?.error || 'אין אישור מסירה.'), 'error');
    else { toast(r.duplicate ? 'ההערות האלה כבר נשלחו, ואין בהן שינוי.' : 'נשלח לקלוד. כל ההערות בדרך אליי.', 'ok'); closeAfterSend(); }
    const d = await req('data');
    frameNotes = d.state?.notes || []; submissions = d.state?.submissions || []; delivery = d.delivery || [];
    renderNotes(); renderDelivery();
  } catch (e) { toast(e.message, 'error'); }
  finally { updateCounts(); }
}
// אותו קוד כמו closeAfterSendJs ב-tab-close.mts: השרת סוגר את לשונית /studio/review בכרום, ו-window.close גיבוי
function closeAfterSend() {}
function initGeneral() {
  const g = $('general');
  g.value = L.general || '';
  if (g.value.trim()) $('generalBox').open = true;
  g.oninput = () => { L.general = g.value; scheduleLanesSave(); updateCounts(); };
  if (!hasLanes) $('generalBox').parentElement.hidden = true;
}

// ---------- frame notes ----------
function upsertNote(n) { const i = frameNotes.findIndex((x) => x.id === n.id); if (i >= 0) frameNotes[i] = n; else frameNotes.push(n); }
async function archiveFrameNote(n) {
  try {
    const r = await req('note', { id: n.id, revision: n.revision, frameIndex: n.frameIndex, scope: n.scope, text: n.text, drawings: n.drawings, layout: n.layout ?? null, intent: n.intent || 'note', archived: true });
    upsertNote(r.note);
    if (sel?.id === n.id) sel = null;
    afterSelect(false); paintOverlay();
    toast('הערת הפריים נמחקה', '', { label: 'בטל', run: async () => { try { const r2 = await req('note', { id: n.id, revision: r.note.revision, frameIndex: n.frameIndex, scope: n.scope, text: n.text, drawings: n.drawings, layout: n.layout ?? null, intent: n.intent || 'note', archived: false }); upsertNote(r2.note); afterSelect(false); paintOverlay(); } catch (e) { toast(e.message, 'error'); } } });
  } catch (e) { toast(e.message, 'error'); }
}

// ---------- annotation studio ----------
const COLORS = ['#ffd24a', '#ff4d4d', '#3ddc84', '#4da3ff', '#ffffff'];
const SIZES = [0.003, 0.005, 0.008];
const ST = { open: false, d: null, img: null, tool: 'arrow', color: COLORS[0], size: SIZES[1], undo: [], redo: [], live: null, dirty: false, loading: false };
function initStudio() {
  $('swatches').innerHTML = COLORS.map((c, i) => `<button class="swatch${i === 0 ? ' on' : ''}" data-color="${c}" style="background:${c}" title="צבע ${i + 1}"></button>`).join('');
  $('sizes').innerHTML = SIZES.map((s, i) => `<button class="size${i === 1 ? ' on' : ''}" data-size="${s}" title="${['דק', 'בינוני', 'עבה'][i]}"><i style="width:${4 + i * 4}px;height:${4 + i * 4}px"></i></button>`).join('');
  $('stTools').onclick = (e) => {
    const t = e.target.closest('[data-tool]'), c = e.target.closest('[data-color]'), s = e.target.closest('[data-size]');
    if (t) setTool(t.dataset.tool);
    if (c) { ST.color = c.dataset.color; $('swatches').querySelectorAll('.swatch').forEach((x) => x.classList.toggle('on', x === c)); }
    if (s) { ST.size = +s.dataset.size; $('sizes').querySelectorAll('.size').forEach((x) => x.classList.toggle('on', x === s)); }
  };
  $('stUndo').onclick = undo; $('stRedo').onclick = redo;
  $('stClear').onclick = () => { if (!ST.d.drawings.length) return; pushUndo(); ST.d.drawings = []; ST.d.changed = true; drawStudio(); };
  $('stClose').onclick = $('stCancel').onclick = () => closeStudio(false);
  $('stSave').onclick = studioSave;
  $('stDelete').onclick = async () => { const n = frameNotes.find((x) => x.id === ST.d.id); if (!n) return; ST.dirty = false; closeStudio(true); await archiveFrameNote(n); };
  $('stPrev').onclick = () => nudge(-1); $('stNext').onclick = () => nudge(1);
  $('stText').oninput = () => { ST.dirty = true; };
  const cv = $('stCanvas');
  cv.addEventListener('pointerdown', stDown);
  cv.addEventListener('pointermove', stMove);
  cv.addEventListener('pointerup', stUp);
  cv.addEventListener('pointercancel', stUp);
  $('studio').addEventListener('pointerdown', (e) => { if (e.target === $('studio')) closeStudio(false); });
  const ti = $('stTextInput');
  ti.onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitText(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ti.hidden = true; }
  };
  ti.onblur = () => { if (!ti.hidden) commitText(); };
  window.addEventListener('resize', () => { if (ST.open) fitStudio(); });
}
function setTool(t) { ST.tool = t; document.querySelectorAll('#stTools [data-tool]').forEach((x) => x.classList.toggle('on', x.dataset.tool === t)); $('stCanvas').style.cursor = t === 'text' ? 'text' : t === 'marker' ? 'cell' : 'crosshair'; }
async function openStudio({ note = null, frame = null } = {}) {
  const wasPlaying = !V.paused;
  V.pause(); AUD.pause(); cancelRange();
  // the frame the viewer is looking at right now, read from the video itself (rVFC can lag one frame behind a pause)
  const live = clamp(Math.floor(V.currentTime * FPS + 1e-3), 0, N - 1);
  const atPlayhead = !note && (frame === null || frame === cur);  // M / the button: "this frame"
  const f = note ? note.frameIndex : atPlayhead ? live : clamp(frame, 0, N - 1);
  if (atPlayhead && live !== cur) { cur = live; onFrame(); }
  if (!note && wasPlaying) V.currentTime = (f + 0.5) / FPS;
  ST.d = { id: note?.id || crypto.randomUUID(), frame: f, text: note?.text || '', drawings: JSON.parse(JSON.stringify(note?.drawings || [])), isNew: !note, changed: false };
  ST.undo = []; ST.redo = []; ST.dirty = false; ST.live = null; ST.img = null;
  $('stText').value = ST.d.text;
  $('stDelete').hidden = !note;
  $('stNav').hidden = !!note;
  $('studio').hidden = false; ST.open = true;
  document.body.style.overflow = 'hidden';
  studioMeta();
  const cv = $('stCanvas'); cv.width = M.width; cv.height = M.height;
  fitStudio(); drawStudio();
  await loadStudioFrame();
  setTimeout(() => $('stText').focus(), 40);
}
function studioMeta() {
  const f = ST.d.frame, s = shotAt(f);
  $('stTitle').textContent = `פריים ${f + 1}`;
  $('stMeta').innerHTML = `<span class="mono">${tc(f)}</span> · שוט ${shotNo(s)}: <b>${esc(s.label)}</b><br>${ST.d.isNew ? 'זה בדיוק הפריים שעצרת עליו. אפשר לזוז פריים אחד לכל כיוון.' : 'הערה שמורה. אפשר לערוך את הציור ואת הטקסט.'}`;
  $('stFrameNo').textContent = `${f + 1} / ${N}`;
}
async function loadStudioFrame() {
  const f = ST.d.frame;
  ST.loading = true; $('stLoading').hidden = false;
  try {
    const fr = await req('frame', { frameIndex: f, scope: 'frame' });
    const img = new Image(); img.src = FILE(fr.file);
    await img.decode();
    if (!ST.open || ST.d.frame !== f) return;
    ST.img = img; ST.baseFile = fr.file;
  } catch (e) { toast('לא הצלחתי לשלוף את הפריים: ' + e.message, 'error'); }
  finally { if (ST.d?.frame === f) { ST.loading = false; $('stLoading').hidden = true; drawStudio(); } }
}
async function nudge(k) {
  if (!ST.d?.isNew || ST.loading) return;
  const f = clamp(ST.d.frame + k, 0, N - 1);
  if (f === ST.d.frame) return;
  ST.d.frame = f; studioMeta(); seek(f); await loadStudioFrame();
}
function fitStudio() {
  const wrap = $('stWrap'), cv = $('stCanvas');
  const W = wrap.clientWidth - 36, H = wrap.clientHeight - 36, ar = M.width / M.height;
  let w = W, h = w / ar;
  if (h > H) { h = H; w = h * ar; }
  cv.style.width = Math.max(100, w) + 'px'; cv.style.height = Math.max(56, h) + 'px';
}
function drawStudio() {
  const cv = $('stCanvas'), ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (ST.img) ctx.drawImage(ST.img, 0, 0, cv.width, cv.height);
  else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height); }
  for (const s of ST.d?.drawings || []) drawShape(ctx, s, cv.width, cv.height);
  if (ST.live) drawShape(ctx, ST.live, cv.width, cv.height);
  $('stUndo').disabled = !ST.undo.length; $('stRedo').disabled = !ST.redo.length; $('stClear').disabled = !ST.d?.drawings.length;
}
function stPoint(e) { const r = $('stCanvas').getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)]; }
function pushUndo() { ST.undo.push(JSON.stringify(ST.d.drawings)); if (ST.undo.length > 100) ST.undo.shift(); ST.redo = []; }
function undo() { if (!ST.undo.length) return; ST.redo.push(JSON.stringify(ST.d.drawings)); ST.d.drawings = JSON.parse(ST.undo.pop()); ST.d.changed = ST.dirty = true; drawStudio(); }
function redo() { if (!ST.redo.length) return; ST.undo.push(JSON.stringify(ST.d.drawings)); ST.d.drawings = JSON.parse(ST.redo.pop()); ST.d.changed = ST.dirty = true; drawStudio(); }
function stDown(e) {
  if (e.button !== 0 || !ST.img) return;
  const p = stPoint(e);
  if (ST.tool === 'text') { e.preventDefault(); return startText(p, e); }
  if (ST.tool === 'marker') { // מספר: לחיצה אחת, הבא בתור
    e.preventDefault(); pushUndo();
    const n = ST.d.drawings.filter((x) => x.type === 'marker').length + 1;
    ST.d.drawings.push({ type: 'marker', color: ST.color, width: ST.size, points: [p], text: String(n) });
    ST.d.changed = ST.dirty = true; return drawStudio();
  }
  $('stCanvas').setPointerCapture(e.pointerId);
  ST.live = { type: ST.tool, color: ST.color, width: ST.size, points: ST.tool === 'pen' ? [p] : [p, p] };
  drawStudio();
}
function stMove(e) {
  if (!ST.live) return;
  const p = stPoint(e);
  if (ST.live.type === 'pen') { const q = ST.live.points.at(-1); if (Math.hypot((p[0] - q[0]) * M.width, (p[1] - q[1]) * M.height) > 3 && ST.live.points.length < 4900) ST.live.points.push(p); }
  else ST.live.points[1] = p;
  drawStudio();
}
function stUp() {
  if (!ST.live) return;
  const s = ST.live; ST.live = null;
  const [a, b] = [s.points[0], s.points.at(-1)], dist = Math.hypot((b[0] - a[0]) * M.width, (b[1] - a[1]) * M.height);
  if ((s.type !== 'pen' && dist > 6) || (s.type === 'pen' && s.points.length > 1)) { pushUndo(); ST.d.drawings.push(s); ST.d.changed = ST.dirty = true; }
  drawStudio();
}
function startText(p, e) {
  const ti = $('stTextInput'), wrap = $('stWrap').getBoundingClientRect();
  ST.textAt = p;
  ti.hidden = false; ti.value = '';
  ti.style.left = Math.max(8, e.clientX - wrap.left - 200) + 'px';
  ti.style.top = (e.clientY - wrap.top - 20) + 'px';
  ti.style.color = ST.color; ti.style.borderColor = ST.color;
  setTimeout(() => ti.focus(), 0);
}
function commitText() {
  const ti = $('stTextInput'), v = ti.value.trim();
  ti.hidden = true;
  if (!v || !ST.textAt) return;
  pushUndo();
  ST.d.drawings.push({ type: 'text', color: ST.color, width: ST.size, points: [ST.textAt], text: v.slice(0, 300) });
  ST.d.changed = ST.dirty = true; ST.textAt = null; drawStudio();
}
async function studioSave() {
  const d = ST.d;
  if (!$('stTextInput').hidden) commitText();
  d.text = $('stText').value;
  const old = frameNotes.find((n) => n.id === d.id);
  if (!d.text.trim() && !d.drawings.length) {
    if (!old) return toast('כתבו מה לשנות, או סמנו משהו על התמונה, לפני השמירה.');
    ST.dirty = false; closeStudio(true); return archiveFrameNote(old);
  }
  if (!ST.img) return toast('הפריים עוד נטען, רגע…');
  $('stSave').disabled = true;
  try {
    const body = { id: d.id, revision: old?.revision || 0, frameIndex: d.frame, scope: 'frame', text: d.text, drawings: d.drawings, intent: old?.intent || 'note', ...(old?.layout ? { layout: old.layout } : {}) };
    if (d.changed || (!old && d.drawings.length)) { ST.live = null; drawStudio(); body.preview = $('stCanvas').toDataURL('image/png'); }
    const r = await req('note', body);
    upsertNote(r.note);
    ST.dirty = false; closeStudio(true);
    sel = { kind: 'frame', id: r.note.id };
    afterSelect(false); paintOverlay();
    toast(old ? 'ההערה עודכנה' : 'הפריים נשמר בצד עם ההערה', 'ok');
  } catch (e) { toast(e.message, 'error'); }
  finally { $('stSave').disabled = false; }
}
function closeStudio(saved) {
  if (!saved && ST.dirty && !confirm('לסגור בלי לשמור את מה שציירת וכתבת?')) return;
  $('studio').hidden = true; ST.open = false; $('stTextInput').hidden = true;
  document.body.style.overflow = '';
}
function studioKey(e) {
  const typing = document.activeElement === $('stText') || document.activeElement === $('stTextInput');
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key === 'Enter') { e.preventDefault(); return studioSave(); }
  if (e.key === 'Escape') { e.preventDefault(); if (typing && document.activeElement === $('stText')) { $('stText').blur(); return; } return closeStudio(false); }
  if (typing) return;
  if (mod && e.code === 'KeyZ') { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
  if (mod) return;
  const map = { KeyA: 'arrow', KeyR: 'rect', KeyO: 'ellipse', KeyP: 'pen', KeyT: 'text', KeyL: 'line', KeyN: 'marker', KeyH: 'highlight' };
  if (map[e.code]) { e.preventDefault(); return setTool(map[e.code]); }
  if (/^Digit[1-5]$/.test(e.code)) { const b = $('swatches').children[+e.code.slice(5) - 1]; b?.click(); return; }
  if (e.key === 'ArrowLeft') { e.preventDefault(); return nudge(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); return nudge(1); }
}

// ---------- help ----------
function showHelp() { $('help').hidden = false; setTimeout(() => $('helpClose').focus(), 30); }
function hideHelp() { $('help').hidden = true; try { localStorage.setItem('notes-room-help-v1', '1'); } catch {} }

// ---------- keyboard ----------
function onKey(e) {
  if (ST.open) return studioKey(e);
  if (!$('help').hidden) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); hideHelp(); } return; }
  const tag = document.activeElement?.tagName;
  if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') { if (e.key === 'Escape') document.activeElement.blur(); return; }
  const mod = e.metaKey || e.ctrlKey;
  // עריכה כמו בפרימייר: ⌘Z / ⇧⌘Z לביטול, ⌘K לקאט
  if (mod && e.code === 'KeyZ') { e.preventDefault(); return e.shiftKey ? editRedo() : editUndo(); }
  if (mod && e.code === 'KeyK') { e.preventDefault(); return addCut(); }
  if (mod || e.altKey) return;
  // במצב מסגור החיצים מזיזים את השכבה (Shift: 10 פיקסלים); במצב קווי עזר הם מזיזים את הקו הנבחר
  const arrow = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code];
  if (arrow && mode === 'frame' && FRM) { e.preventDefault(); const k = e.shiftKey ? 10 : 1; FRM.dx += arrow[0] * k; FRM.dy += arrow[1] * k; updateFramePanel(); return paintOverlay(); }
  if (arrow && mode === 'guides' && sel?.kind === 'guide') {
    const g = E.guides.find((x) => x.id === sel.id), k = (e.shiftKey ? 10 : 1);
    if (g && ((g.axis === 'y' && arrow[1]) || (g.axis === 'x' && arrow[0]))) { e.preventDefault(); editChange(() => { g.pos = clamp(g.pos + (g.axis === 'y' ? arrow[1] * k / M.height : arrow[0] * k / M.width), 0, 1); }); return renderComposer(false); }
  }
  const step = e.shiftKey ? Math.round(FPS) : 1;
  switch (e.code) {
    case 'KeyK': e.preventDefault(); return addCut();
    case 'KeyQ': e.preventDefault(); return ripple('Q');
    case 'KeyW': e.preventDefault(); return ripple('W');
    case 'Delete': case 'Backspace': e.preventDefault(); return ripple('DEL');
    case 'KeyF': e.preventDefault(); return setMode(mode === 'frame' ? null : 'frame');
    case 'KeyG': e.preventDefault(); return setMode(mode === 'guides' ? null : 'guides');
    case 'Space': e.preventDefault(); return togglePlay();
    case 'ArrowLeft': e.preventDefault(); return seek(cur - step);
    case 'ArrowRight': e.preventDefault(); return seek(cur + step);
    case 'Home': return seek(0);
    case 'End': return seek(N - 1);
    case 'KeyM': e.preventDefault(); return openStudio({ frame: cur });
    case 'KeyS': e.preventDefault(); return noteShot();
    case 'KeyC': e.preventDefault(); return noteCut();
    case 'KeyR': e.preventDefault(); return rangeKey();
    case 'Escape': return mode ? setMode(null) : rangeIn != null ? cancelRange() : deselect();
    case 'Slash': if (e.shiftKey) { e.preventDefault(); showHelp(); } return;
  }
}

// ---------- boot ----------
function bindUI() {
  $('actFrame').onclick = () => openStudio({ frame: cur });
  $('actShot').onclick = noteShot;
  $('actCut').onclick = noteCut;
  $('actRange').onclick = rangeKey;
  $('sendTop').onclick = $('sendBottom').onclick = send;
  $('tbCut').onclick = addCut; $('tbQ').onclick = () => ripple('Q'); $('tbW').onclick = () => ripple('W'); $('tbDel').onclick = () => ripple('DEL');
  $('tbUndo').onclick = editUndo; $('tbRedo').onclick = editRedo;
  $('tbFrame').onclick = () => setMode(mode === 'frame' ? null : 'frame');
  $('tbGuides').onclick = () => setMode(mode === 'guides' ? null : 'guides');
  $('tbSafe').onclick = () => { showSafe = !showSafe; $('tbSafe').classList.toggle('on', showSafe); paintOverlay(); };
  $('tbGrid').onclick = () => { showGrid = !showGrid; $('tbGrid').classList.toggle('on', showGrid); paintOverlay(); };
  $('tbPreview').onchange = (e) => { editedPreview = e.target.checked; paintOverlay(); };
  bindHit();
  $('helpBtn').onclick = showHelp;
  $('helpClose').onclick = hideHelp;
  $('help').addEventListener('pointerdown', (e) => { if (e.target === $('help')) hideHelp(); });
  document.addEventListener('keydown', onKey);
  let rt = null;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const sc = $('tlScroll'), t = sc.scrollLeft / TL.pxs, wasFit = TL.pxs <= TL.fit + 1e-6; if (wasFit) TL.pxs = 0; renderTimeline(); sc.scrollLeft = t * TL.pxs; paintOverlay(); }, 150); });
  window.addEventListener('pagehide', () => {
  });
  window.addEventListener('beforeunload', (e) => { if (dirty || editDirty || ST.dirty) { e.preventDefault(); e.returnValue = ''; } });
  setInterval(async () => {
    if (document.hidden || !submissions.length) return;
    const last = submissions.at(-1), st = delivery.find((d) => d.requestId === last.requestId)?.status || last.status;
    if (st === 'done' || st === 'completed') return;
    try { const d = await req('data'); submissions = d.state?.submissions || submissions; delivery = d.delivery || delivery; renderDelivery(); } catch {}
  }, 20000);
}
async function init() {
  paintIcons();
  try { await C.requireMember(); }
  catch (e) { const b = $('boot'); b.classList.add('err'); b.innerHTML = esc(e.message) + ' <button class="btn" id="bootOut">התחברות מחדש</button>'; $('bootOut').onclick = C.signOut; return; }
  try { await load(); }
  catch (e) { const b = $('boot'); b.classList.add('err'); b.textContent = 'חדר ההערות לא נטען: ' + e.message; return; }
  renderHeader(); initPlayer(); bindTimeline(); renderTimeline(); initStudio(); bindNotes(); initGeneral(); bindUI();
  onFrame(); renderComposer(false); renderNotes(); renderDelivery(); renderEditStat();
  initLayers();
  cloudUI();
  $('boot').remove();
  let seen = false;
  try { seen = !!localStorage.getItem('notes-room-help-v1'); } catch {}
  if (!seen) showHelp();
}
init();

// ---------- ההנפשה של השוט (הראל, 20.10.2026) ----------
// "על כל שוט שיהיה שם את ההנפשה המלאה של אותו השוט ... לכל שוט לבחור אם אני רוצה להכניס אותו או להחליף את השוט הקיים או להוסיף לפניו או אחריו".
// מפת העריכה נותנת לכל שוט בסרט את קובץ ההנפשה שלו (file, sourceIn/Out), ו-M.sources את גבולות השוטים בתוך ההנפשה.
// בחירה נשמרת כ-swaps ב-edit.json ומגיעה אליי בשליחה כ"שוט מההנפשה".
const SW_LABEL = { replace: 'החלפה', before: 'לפני', after: 'אחרי' };
let srcSeg = null, srcPick = null, srcLoop = null, srcFile = null;
const segAt = (f) => (M?.segments || []).find((s) => f >= s.startFrame && f < s.endFrame) || null;
const fmtS = (t) => t.toFixed(2);
function srcShots(file, dur) {
  const cuts = (M.sources?.[file]?.cuts || []).filter((c) => !dur || c < dur);
  const end = dur || M.sources?.[file]?.duration || null;
  const b = [0, ...cuts, ...(end ? [end] : [])];
  return b.slice(0, -1).map((a, i) => ({ n: i + 1, a, b: b[i + 1] }));
}
function renderSrc(force = false) {
  const box = $('srcPanel');
  if (!box) return;
  const seg = segAt(cur);
  if (!force && seg === srcSeg) return;
  if (seg !== srcSeg) srcFile = null;
  srcSeg = seg; srcPick = null; srcLoop = null;
  const known = seg && seg.file !== M.file && M.sources && Object.hasOwn(M.sources, seg.file);
  box.hidden = !(M.segments || []).length;
  if (!known) {
    box.innerHTML = `<div class="src-head"><h2>ההנפשה של השוט</h2></div><div class="src-empty">${seg ? 'לשוט הזה אין קובץ הנפשה (כותרת או שחור).' : 'אין מפת שוטים לגרסה הזאת.'}</div>`;
    return;
  }
  const base = (f) => f.split('/').pop().replace(/\.[^.]+$/, '');
  const takes = [seg.file, ...(M.variants?.[seg.file] || [])];
  const file = srcFile && takes.includes(srcFile) ? srcFile : seg.file;
  box.innerHTML = `
    <div class="src-head"><h2>ההנפשה של השוט</h2><small>שוט ${seg.index} בסרט · ${esc(base(seg.file))}</small></div>
    ${takes.length > 1 ? `<div class="src-takes">${takes.map((f, i) => `<button class="src-take${f === file ? ' on' : ''}" data-f="${esc(f)}" title="${esc(base(f))}">${i ? 'גרסה ' + (i + 1) : 'בסרט'}<span>${esc(base(f))}</span></button>`).join('')}</div>` : ''}
    <div class="src-video"><video id="srcV" playsinline preload="metadata" controls src="${FILE(file)}"></video></div>
    <div class="src-shots" id="srcShots"></div>
    <div class="src-acts">
      <button class="btn" data-sw="replace" disabled>החלף את השוט הזה</button>
      <button class="btn ghost" data-sw="before" disabled>הוסף לפני</button>
      <button class="btn ghost" data-sw="after" disabled>הוסף אחרי</button>
    </div>
    <div class="src-list" id="srcList"></div>`;
  const sv = $('srcV');
  box.querySelectorAll('.src-take').forEach((b) => b.onclick = () => { srcFile = b.dataset.f; renderSrc(true); });
  const drawShots = () => {
    const dur = Number.isFinite(sv.duration) ? sv.duration : null;
    const shots = srcShots(file, dur);
    $('srcShots').innerHTML = shots.length ? shots.map((s) => {
      const used = file === seg.file && s.a < seg.sourceOut - 0.02 && s.b > seg.sourceIn + 0.02;
      return `<button class="src-shot${used ? ' used' : ''}${srcPick && srcPick.n === s.n ? ' on' : ''}" data-n="${s.n}" title="${fmtS(s.a)}–${fmtS(s.b)} שנ׳"><b>שוט ${s.n}</b><span>${fmtS(s.b - s.a)} שנ׳${used ? ' · בסרט' : ''}</span></button>`;
    }).join('') : '<div class="src-empty">טוען את ההנפשה…</div>';
    $('srcShots').querySelectorAll('.src-shot').forEach((b) => b.onclick = () => {
      const s = shots.find((x) => x.n === +b.dataset.n);
      srcPick = s; srcLoop = s; drawShots();
      box.querySelectorAll('[data-sw]').forEach((x) => x.disabled = false);
      V.pause(); sv.currentTime = s.a + 0.01; sv.play().catch(() => {});
    });
  };
  sv.addEventListener('loadedmetadata', drawShots);
  sv.addEventListener('play', () => V.pause());
  sv.addEventListener('timeupdate', () => { if (srcLoop && sv.currentTime >= srcLoop.b - 0.03) sv.currentTime = srcLoop.a + 0.01; });
  sv.addEventListener('seeking', () => { if (srcLoop && (sv.currentTime < srcLoop.a - 0.05 || sv.currentTime > srcLoop.b + 0.05)) srcLoop = null; });
  if (!C.isOwner()) box.querySelector('.src-acts')?.remove();
  box.querySelectorAll('[data-sw]').forEach((b) => b.onclick = () => {
    if (!srcPick) return;
    const action = b.dataset.sw;
    editChange(() => E.swaps.push({ id: uuid(), segment: seg.id, action, file, sourceIn: Math.round(srcPick.a * 1000) / 1000, sourceOut: Math.round(srcPick.b * 1000) / 1000, shot: srcPick.n, note: '' }));
    toast(`${action === 'replace' ? 'שוט ' + seg.index + ' יוחלף' : 'יתווסף ' + SW_LABEL[action] + ' שוט ' + seg.index} בשוט ${srcPick.n} מ${file === seg.file ? 'ההנפשה' : base(file)}`);
  });
  drawShots(); renderSrcList();
}
function renderSrcList() {
  const list = $('srcList');
  if (!list || !srcSeg) return;
  const mine = E.swaps.filter((w) => w.segment === srcSeg.id);
  list.innerHTML = mine.map((w) => `<div class="src-row"><span class="src-tag ${w.action}">${SW_LABEL[w.action]}</span><span>${w.file !== srcSeg.file ? esc(w.file.split('/').pop().replace(/\.[^.]+$/, '')) + ' · ' : ''}שוט ${w.shot ?? '?'} · ${fmtS(w.sourceIn)}–${fmtS(w.sourceOut)} שנ׳</span><button class="src-x" data-id="${w.id}" aria-label="הסר">✕</button></div>`).join('');
  list.querySelectorAll('.src-x').forEach((b) => b.onclick = () => editChange(() => { E.swaps = E.swaps.filter((w) => w.id !== b.dataset.id); }));
}

// ---------- cloud room (Harel 20.10.2026): roles, who is here, live notes ----------
const byLine = (e) => { const who = e.n?.author || e.r?.by || e.d?.by; return who && who !== C.me.email ? '<span class="by">' + esc(who.split('@')[0]) + '</span>' : ''; };
let following = null, people = [];
function cloudUI() {
  const owner = C.isOwner();
  document.body.classList.toggle('viewer', !owner);
  $('whoami').textContent = C.me.name + (owner ? '' : ' · צופה ומעיר');
  $('logout').onclick = C.signOut;
  $('peopleBtn').hidden = !owner; $('peopleBtn').onclick = openPeople;
  if (!owner) { for (const id of ['sendTop', 'sendBottom']) $(id).hidden = true; $('tools')?.querySelector('.tools-row')?.remove(); $('delivery').textContent = 'ההערות שלך נשמרות ונראות להראל מיד. הוא שולח אותן לקלוד.'; }
  const report = C.live({
    onNote: (n) => { upsertNote(n); renderNotes(); paintOverlay(); updateCounts(); },
    onLanes: (s) => { if (dirty) return; L = { ...s }; if (document.activeElement !== $('general')) $('general').value = L.general || ''; afterChange(); paintMarks?.(); },
    onEdit: (s) => { E = normEdit(s); afterEdit(); },
    onPresence: (list) => { people = list; renderPeople(); follow(); },
  });
  setInterval(() => report(cur, !V.paused), 300);
}
function renderPeople() {
  $('presence').innerHTML = people.map((p) => '<button class="pchip' + (following === p.id ? ' on' : '') + '" data-id="' + esc(p.id) + '" title="' + esc(p.email) + '"><i></i>' + esc(p.name) + ' · ' + tc(p.frame || 0) + (following === p.id ? ' · עוקב' : ' · עקוב') + '</button>').join('');
  $('presence').querySelectorAll('.pchip').forEach((b) => b.onclick = () => { following = following === b.dataset.id ? null : b.dataset.id; renderPeople(); follow(); });
}
function follow() {
  const p = people.find((x) => x.id === following);
  if (!p) { if (following && !people.length) following = null; return; }
  const drift = Math.abs((p.frame || 0) - cur);
  if (p.playing) { if (V.paused) { seek(p.frame, true); V.play().catch(() => {}); } else if (drift > 12) seek(p.frame, true); }
  else { if (!V.paused) V.pause(); if (drift > 0) seek(p.frame); }
}
async function openPeople() {
  const box = $('peopleBox'); box.hidden = false;
  const draw = async () => {
    const { people: ps, allowed } = await C.listPeople();
    const role = { owner: 'בעלים', collaborator: 'צופה ומעיר', pending: 'ממתין לאישור' };
    $('peopleList').innerHTML = ps.map((p) => '<div class="prow"><span>' + esc(p.email) + '</span><b>' + role[p.role] + '</b>' + (p.role === 'pending' ? '<button class="btn" data-ok="' + p.id + '">אשר</button>' : p.role === 'collaborator' ? '<button class="btn ghost" data-no="' + p.id + '">בטל גישה</button>' : '') + '</div>').join('') +
      (allowed.length ? '<div class="pnote">מוזמנים מראש: ' + allowed.map(esc).join(', ') + '</div>' : '');
    $('peopleList').querySelectorAll('[data-ok]').forEach((b) => b.onclick = async () => { await C.setRole(b.dataset.ok, 'collaborator'); draw(); });
    $('peopleList').querySelectorAll('[data-no]').forEach((b) => b.onclick = async () => { await C.setRole(b.dataset.no, 'pending'); draw(); });
  };
  $('peopleAdd').onclick = async () => { const v = $('peopleEmail').value; if (!/.+@.+\..+/.test(v)) return toast('כתובת מייל לא תקינה'); await C.allowEmail(v); $('peopleEmail').value = ''; toast('הוזמן. כשיירשם עם המייל הזה הוא ייכנס מיד.', 'ok'); draw(); };
  $('peopleClose').onclick = () => { box.hidden = true; };
  await draw();
}
