// watch.mjs · brings what Harel sent from the cloud room to Claude, like review-watch does for the local room.
//   node tools/watch.mjs          wait for the next submission, print it, exit
//   node tools/watch.mjs --once   print what is waiting now (or nothing), exit
// Downloads every annotated frame to טריילר/work/review/cloud/<submission>/ and marks the submission claimed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rest, get } from './sb.mjs';

const ONCE = process.argv.includes('--once');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', '..', 'review', 'cloud');
const tc = (f, fps) => { const r = Math.round(fps), s = Math.floor(f / r); return [Math.floor(s / 60) % 60, s % 60, f % r].map((x) => String(x).padStart(2, '0')).join(':'); };

async function show(sub) {
  const p = sub.payload, fps = p.version.fps, dir = path.join(OUT, sub.id); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'submission.json'), JSON.stringify(sub, null, 1));
  const out = [`════ בקשה חדשה מחדר הענן ════`, `מזהה: ${sub.id}`, `נשלח: ${sub.created_at} · ${p.version.label} · ${sub.summary}`, `דוח מלא: ${path.join(dir, 'submission.json')}`, ''];
  out.push(`הערות פריים (${p.notes.length}):`);
  for (const [i, n] of p.notes.entries()) {
    let img = '';
    for (const k of ['annotatedFrame', 'baseFrame']) if (n[k]) { try { const f = path.join(dir, `${String(i + 1).padStart(2, '0')}-${k}.png`); fs.writeFileSync(f, await get(n[k])); img = img || f; } catch {} }
    out.push(`${i + 1}. פריים ${n.frameIndex + 1} · ${tc(n.frameIndex, fps)} · ${(n.frameIndex / fps).toFixed(3)}s · ${n.segmentId || ''}${n.author ? ' · כתב: ' + n.author : ''}`);
    out.push(`   טקסט: ${n.text || '(סימון בלבד)'}`);
    out.push(`   סימונים: ${(n.drawings || []).length}${img ? ' · תמונה: ' + img : ''}`);
  }
  const L = p.lanes || {};
  if ((L.ranges || []).length) { out.push('', `הערות טווח (${L.ranges.length}):`); for (const r of L.ranges) out.push(`  פריימים ${r.fromFrame + 1}-${r.toFrame} (${tc(r.fromFrame, fps)}-${tc(r.toFrame - 1, fps)})${r.track ? ' · רצועה ' + r.track : ''}${r.by ? ' · כתב: ' + r.by : ''}: ${r.text}`); }
  for (const [id, d] of Object.entries(L.items || {})) if (d.note || d.verdict || d.option != null) out.push(`  פריט ${id}: ${d.verdict || ''} ${d.option ?? ''} ${d.note || ''}`.trim());
  if ((L.general || '').trim()) out.push('', 'הערה כללית: ' + L.general);
  const E = p.edit || {};
  const cnt = ['cuts', 'removes', 'frames', 'guides', 'swaps'].map((k) => (E[k] || []).length);
  if (cnt.some(Boolean) || (E.arrange || []).length) {
    out.push('', `עריכה בחדר: ${cnt[0]} קאטים · ${cnt[1]} הוצאות · ${cnt[2]} מסגורים · ${cnt[3]} קווי עזר · ${cnt[4]} שוטים מההנפשות`);
    for (const c of E.cuts || []) out.push(`  קאט: פריים ${c.frame + 1} (${tc(c.frame, fps)})${c.by ? ' · ' + c.by : ''}`);
    for (const r of E.removes || []) out.push(`  הוצאה (${r.how}): פריימים ${r.fromFrame + 1}-${r.toFrame} (${tc(r.fromFrame, fps)}-${tc(r.toFrame - 1, fps)})${r.note ? ' · ' + r.note : ''}${r.by ? ' · ' + r.by : ''}`);
    if ((E.arrange || []).length) {
      const len = E.arrange.reduce((t, x) => t + x.b - x.a, 0);
      out.push(`  סידור שוטים חדש (${E.arrange.length} שוטים, ${(len / fps).toFixed(2)} שנ׳). הסדר המלא מההתחלה לסוף:`);
      for (const [i, x] of E.arrange.entries()) { const g = (p.segments || []).find((q) => q.id === x.seg) || {}; const cut = x.a > g.startFrame || x.b < g.endFrame;
        out.push(`    ${i + 1}. שוט ${g.index ?? '?'} (${g.shot ?? ''}) · פריימים ${x.a + 1}-${x.b}${cut ? ` (מקוצר מתוך ${g.startFrame + 1}-${g.endFrame})` : ''} · ${((x.b - x.a) / fps).toFixed(2)} שנ׳`); }
    }
    for (const w of E.swaps || []) { const s = (p.segments || []).find((x) => x.id === w.segment); out.push(`  שוט מההנפשה · ${{ replace: 'החלף את', before: 'הוסף לפני', after: 'הוסף אחרי' }[w.action]} שוט ${s?.index ?? '?'} (${s?.shot ?? ''}) ← ${w.file}${w.shot ? ' · שוט ' + w.shot : ''} · ${w.sourceIn.toFixed(3)}-${w.sourceOut.toFixed(3)}s`); }
  }
  console.log(out.join('\n'));
  await rest('PATCH', `submissions?id=eq.${sub.id}`, { status: 'claimed', claimed_at: new Date().toISOString() });
}

for (;;) {
  let subs;
  try { subs = await rest('GET', 'submissions?status=eq.new&order=created_at.asc&select=*'); }
  catch (e) { if (ONCE) throw e; console.error('רשת: ' + e.message + ' · מנסה שוב'); await new Promise((r) => setTimeout(r, 30000)); continue; }
  for (const s of subs) await show(s);
  if (subs.length) break;
  if (ONCE) { console.log('אין בקשות שממתינות.'); break; }
  await new Promise((r) => setTimeout(r, 15000));
}
