// make-room.mjs · builds public/room.html + public/room.js from the production-pipeline review room (review-notes.*)
// so the cloud room stays the same room Harel knows. Run after the skill's room changes:  node tools/make-room.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const SKILL = path.join(os.homedir(), '.claude/skills/production-pipeline/scripts');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
let js = fs.readFileSync(path.join(SKILL, 'review-notes.js'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let html = fs.readFileSync(path.join(SKILL, 'review-notes.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const rep = (s, a, b, what) => { if (!s.includes(a)) throw new Error('anchor missing: ' + what); return s.replace(a, b); };

// ---- api: the cloud adapter answers the same routes ----
js = rep(js, "const VERSION = new URLSearchParams(location.search).get('version') || '';", "import * as C from './cloud.js';\nconst VERSION = '';", 'version');
js = js.replace(/const url = \(r, q = ''\) => [^\n]+\n/, "const url = () => '';\n");
js = js.replace(/const FILE = \(rel\) => [^\n]+\n/, 'const FILE = C.FILE;\n');
js = js.replace(/async function req\(r, body, q\) \{[\s\S]*?\n\}\n/, 'async function req(r, body, q) { return C.cloudReq(r, body, q); }\n');
if (js.includes("'/studio/review/'")) throw new Error('local api left in room.js');

// ---- player: frames are read from a cross-origin film ----
js = rep(js, '  V.src = FILE(M.file); V.muted = true;', "  V.crossOrigin = 'anonymous'; V.src = FILE(M.file); V.muted = true;", 'player src');

// ---- roles: only the owner edits the cut and sends ----
js = rep(js, 'async function send() {', "async function send() {\n  if (!C.isOwner()) return toast('רק הראל שולח לקלוד. ההערות שלך כבר אצלו.');", 'send');
js = rep(js, "location.href = '/studio/review' + (vs.value ? '?version=' + encodeURIComponent(vs.value) : '');", "location.href = './room.html' + (vs.value ? '?version=' + encodeURIComponent(vs.value) : '');", 'version switch');
js = js.replace(/function closeAfterSend\(\) \{[^\n]+\n/, 'function closeAfterSend() {}\n');
js = js.replace(/\s*if \(dirty && hasLanes\) navigator\.sendBeacon[^\n]+\n/, '\n').replace(/\s*if \(editDirty\) navigator\.sendBeacon[^\n]+\n/, '\n');
js = rep(js, "  box.querySelectorAll('[data-sw]').forEach((b) => b.onclick = () => {", "  if (!C.isOwner()) box.querySelector('.src-acts')?.remove();\n  box.querySelectorAll('[data-sw]').forEach((b) => b.onclick = () => {", 'swap buttons');

// ---- full screen on the iPhone: Safari has no element fullscreen, only the video's own ----
js = rep(js, "$('tFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen?.());",
  "$('tFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen ? wrap.requestFullscreen().catch(() => V.webkitEnterFullscreen?.()) : V.webkitEnterFullscreen?.());", 'fullscreen');

// ---- partner's take-outs look like proposals on the timeline ----
js = rep(js, 'return `<button class="rmb${sel?.kind === \'remove\' && sel.id === r.id ? \' sel\' : \'\'}"', 'return `<button class="rmb${sel?.kind === \'remove\' && sel.id === r.id ? \' sel\' : \'\'}${r.by && r.by !== C.me.email ? \' prop\' : \'\'}"', 'proposal style');

// ---- who wrote it ----
js = rep(js, "<div class=\"nline\">${badge}${wasSent(e.at) ? '<span class=\"sent\">נשלח</span>' : ''}",
  "<div class=\"nline\">${badge}${wasSent(e.at) ? '<span class=\"sent\">נשלח</span>' : ''}${byLine(e)}", 'author');

// ---- boot: sign-in gate, role UI, live sync ----
js = rep(js, '  paintIcons();\n  try { await load(); }', `  paintIcons();
  try { await C.requireMember(); }
  catch (e) { const b = $('boot'); b.classList.add('err'); b.innerHTML = esc(e.message) + ' <button class="btn" id="bootOut">התחברות מחדש</button>'; $('bootOut').onclick = C.signOut; return; }
  try { await load(); }`, 'boot');
js = rep(js, '  initLayers();\n  $(\'boot\').remove();', '  initLayers();\n  cloudUI();\n  $(\'boot\').remove();', 'cloud ui');
js += `
// ---------- cloud room (Harel 20.10.2026): roles, who is here, live notes ----------
const byLine = (e) => { const who = e.n?.author || e.r?.by || e.d?.by || e.x?.by; return who && who !== C.me.email ? '<span class="by">' + esc(who.split('@')[0]) + '</span>' : ''; };
let following = null, people = [];
function cloudUI() {
  const owner = C.isOwner();
  document.body.classList.toggle('viewer', !owner);
  $('whoami').textContent = C.me.name + (owner ? '' : ' · צופה ומעיר');
  $('logout').onclick = C.signOut;
  $('peopleBtn').hidden = !owner; $('peopleBtn').onclick = openPeople;
  if (!owner) { for (const id of ['sendTop', 'sendBottom']) $(id).hidden = true; $('delivery').textContent = 'ההערות, הקאטים וההוצאות שלך הם הצעות: הם נשמרים ונראים להראל מיד, והוא מחליט ושולח לקלוד.'; }
  const report = C.live({
    onNote: (n) => { upsertNote(n); renderNotes(); paintOverlay(); updateCounts(); },
    onLanes: (s) => { if (dirty) return; L = { ...s }; if (document.activeElement !== $('general')) $('general').value = L.general || ''; afterChange(); paintMarks?.(); },
    onEdit: (s) => { if (editDirty) return; E = normEdit(s); afterEdit(); },
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
  $('peopleAdd').onclick = async () => { const v = $('peopleEmail').value; if (!/.+@.+\\..+/.test(v)) return toast('כתובת מייל לא תקינה'); await C.allowEmail(v); $('peopleEmail').value = ''; toast('הוזמן. כשיירשם עם המייל הזה הוא ייכנס מיד.', 'ok'); draw(); };
  $('peopleClose').onclick = () => { box.hidden = true; };
  await draw();
}
`;

// ---- html ----
html = rep(html, '<script type="module" src="/studio/review/notes.js"></script>', '<script src="./config.js"></script>\n<script type="module" src="./room.js"></script>', 'script');
html = rep(html, '  <div class="top-actions">', `  <div class="top-actions">
    <div class="presence" id="presence"></div>
    <span class="whoami" id="whoami"></span>
    <button class="btn ghost" id="peopleBtn" hidden>משתמשים</button>
    <button class="btn ghost" id="logout">יציאה</button>`, 'header');
html = rep(html, '</body>', `<div class="people-box" id="peopleBox" hidden><div class="people-card">
  <h2>מי נכנס לחדר</h2>
  <div id="peopleList"></div>
  <div class="padd"><input class="field" id="peopleEmail" type="email" placeholder="מייל של שותף להזמנה"><button class="btn primary" id="peopleAdd">הזמן</button></div>
  <button class="btn ghost" id="peopleClose">סגור</button>
</div></div>
</body>`, 'people box');
html = rep(html, '</style>', `
/* cloud room */
.presence{display:flex;gap:6px;flex-wrap:wrap}
.pchip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border-radius:999px;border:1px solid var(--line2);background:var(--panel2);font-size:12.5px;font-weight:600;color:var(--text2)}
.pchip i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
.pchip.on{border-color:var(--ok);color:var(--text)}
.whoami{font-size:12.5px;color:var(--muted)}
.by{font-size:10.5px;font-weight:700;color:var(--range);border:1px solid rgba(95,214,168,.35);border-radius:5px;padding:0 5px}
.rmb.prop{background:repeating-linear-gradient(135deg,rgba(95,214,168,.35) 0 6px,rgba(95,214,168,.12) 6px 12px)!important;border-color:var(--range)!important}
.people-box{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.people-card{width:min(520px,100%);background:var(--panel);border:1px solid var(--line2);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px}
.people-card h2{margin:0;font-size:17px}
.prow{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--panel2);font-size:13.5px}
.prow span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.prow b{font-size:12px;color:var(--muted)}
.pnote{font-size:12.5px;color:var(--muted)}
.padd{display:flex;gap:8px}
.padd .field{flex:1;height:38px}
/* phone (Harel 20.10: "ממשק מיוחד לטלפון"): one column, a header that wraps instead of pushing the page sideways,
   full-width player, compact actions, desktop-only precision tools hidden */
@media (max-width:760px){
  html,body{overflow-x:hidden;max-width:100vw}
  .top{position:static;flex-wrap:wrap;gap:8px;padding:10px 12px;align-items:flex-start}
  .brand{width:100%}
  .brand h1{font-size:18px}
  .top-actions{width:100%;flex:1 1 100%;flex-wrap:wrap;gap:6px;justify-content:flex-start}
  .top-actions .btn{height:36px;padding:0 12px;font-size:13.5px}
  .top-actions select{height:36px;max-width:42vw}
  #sendTop{order:-1;flex:1 1 100%;height:44px;font-size:15px}
  .presence{order:9;width:100%}
  .whoami,.save-state{display:none}
  .layout{padding:8px 8px 18px;gap:10px}
  .player-card{padding:6px}
  .video-wrap{width:100%!important;min-width:0!important;margin:0}
  .actions{grid-template-columns:1fr 1fr!important;gap:6px}
  .act{padding:8px 10px}
  .act small{display:none}
  .tools-row{flex-wrap:wrap}
  .tools-row:nth-of-type(2){display:none}
  .tbx{height:38px}
  .rail > .card:first-child{display:none}
  .tl-card{overflow-x:auto}
}
@media (max-width:900px) and (orientation:landscape) and (max-height:500px){
  .top{display:none}
}
</style>`, 'css');

fs.writeFileSync(path.join(OUT, 'room.js'), js);
fs.writeFileSync(path.join(OUT, 'room.html'), html);
console.log('room.html + room.js written', js.length, html.length);
