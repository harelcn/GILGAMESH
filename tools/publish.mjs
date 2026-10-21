// publish.mjs · puts the version that the local review room shows into the cloud room.
//   node tools/publish.mjs [--port 4847] [--project gilgamesh-trailer]
// Takes the model from the running local room (segments, tracks, items, sources, variants), uploads a review copy of
// the film (~20 MB), the animations for the side panel (480p), the stems (m4a) and the waveforms, then marks it current.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rest, put, exists, list, remove } from './sb.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = arg('port', '4847'), PROJECT = arg('project', 'gilgamesh-trailer');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');            // טריילר/
const CACHE = path.join(HERE, '.cache'); fs.mkdirSync(CACHE, { recursive: true });
const local = async (p) => { const r = await fetch(`http://localhost:${PORT}/studio/review/${p}`); if (!r.ok) throw new Error('local room: ' + p + ' ' + r.status); return r.json(); };
const h = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });

const PRUNE_ONLY = process.argv.includes('--prune-only');   // node tools/publish.mjs --prune-only : just the clean-up
if (!PRUNE_ONLY) {
  const { model } = await local('data');
  const sha = model.sha256.slice(0, 12), base = `versions/${sha}`;
  const fileMap = {};
  console.log(`מעלה את "${model.label}" (${(model.frameCount / model.fps).toFixed(1)} שנ׳)`);

  // film: a review copy, same frames and size, small enough for the free plan (50 MB per file)
  const filmOut = path.join(CACHE, sha + '-film.mp4');
  if (!fs.existsSync(filmOut)) ff(['-i', path.join(ROOT, model.file), '-c:v', 'libx264', '-preset', 'medium', '-b:v', '1300k', '-maxrate', '1700k', '-bufsize', '3400k',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', filmOut]);
  await put(`${base}/film.mp4`, fs.readFileSync(filmOut), 'video/mp4'); fileMap[model.file] = `${base}/film.mp4`;
  console.log('  סרט:', (fs.statSync(filmOut).size / 1e6).toFixed(1), 'MB');

  // animations for the side panel (shared between versions)
  const anims = new Set([...(model.segments || []).map((s) => s.file), ...Object.keys(model.sources || {}), ...Object.values(model.variants || {}).flat()]);
  anims.delete(model.file);
  let n = 0;
  for (const rel of anims) {
    if (!rel || !fs.existsSync(path.join(ROOT, rel))) continue;
    const dest = `anim/${h(rel)}.mp4`; fileMap[rel] = dest;
    if (await exists(dest)) continue;
    const out = path.join(CACHE, h(rel) + '.mp4');
    if (!fs.existsSync(out)) ff(['-i', path.join(ROOT, rel), '-vf', 'scale=-2:480', '-c:v', 'libx264', '-preset', 'medium', '-b:v', '900k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out]);
    await put(dest, fs.readFileSync(out), 'video/mp4'); n++;
  }
  console.log('  הנפשות:', anims.size, 'בסך הכל,', n, 'הועלו עכשיו');

  // stems + waveforms
  for (const t of model.lanes?.tracks || []) {
    if (t.kind !== 'audio') continue;
    if (t.src && fs.existsSync(path.join(ROOT, t.src))) {
      const out = path.join(CACHE, sha + '-' + t.id + '.m4a');
      if (!fs.existsSync(out)) ff(['-i', path.join(ROOT, t.src), '-c:a', 'aac', '-b:a', '96k', out]);
      await put(`${base}/stems/${t.id}.m4a`, fs.readFileSync(out), 'audio/mp4'); fileMap[t.src] = `${base}/stems/${t.id}.m4a`;
    }
    try { const w = await local('waveform?track=' + encodeURIComponent(t.id)); await put(`${base}/waves/${t.id}.json`, Buffer.from(JSON.stringify(w)), 'application/json'); fileMap['wave:' + t.id] = `${base}/waves/${t.id}.json`; } catch {}
  }
  try { const w = await local('waveform'); await put(`${base}/waves/mix.json`, Buffer.from(JSON.stringify(w)), 'application/json'); fileMap['wave:mix'] = fileMap['wave:mix'] || `${base}/waves/mix.json`; } catch {}

  // version row, current
  const cloudModel = { ...model, fileMap, versions: undefined, version: undefined };
  // the same label again = an edit-only fix published in place (Harel 21.10): same version row, notes kept, old film removed
  const [prev] = await rest('GET', `versions?project_id=eq.${PROJECT}&label=eq.${encodeURIComponent(model.label)}&select=id,sha256`);
  await rest('PATCH', `versions?project_id=eq.${PROJECT}&is_current=eq.true`, { is_current: false });
  const [row] = await rest('POST', 'versions?on_conflict=project_id,label', { project_id: PROJECT, label: model.label, sha256: model.sha256, model: cloudModel, is_current: true }, 'resolution=merge-duplicates,return=representation');
  if (prev && prev.sha256 !== model.sha256) {
    const old = await list(`versions/${prev.sha256.slice(0, 12)}`);
    if (old.length) await remove(old);
    console.log(`  ✓ "${row.label}" עודכנה במקום (אותה גרסה, ההערות נשארו; ${old.length} קבצים ישנים נמחקו)`);
  } else console.log(`  ✓ "${row.label}" היא עכשיו הגרסה בחדר (id ${row.id})`);

}

// keep only the current version and the one before it (Harel 20.10: free space on Supabase).
// Older versions go with their film, stems, waves, note frames and their rows (notes, lanes, edits, submissions);
// what was sent to Claude is already saved locally by watch.mjs. Animations no kept version uses are removed too.
const all = await rest('GET', `versions?project_id=eq.${PROJECT}&select=id,label,sha256,model,created_at&order=created_at.desc`);
const keep = all.slice(0, 2), drop = all.slice(2);
for (const v of drop) {
  const files = [...await list(`versions/${v.sha256.slice(0, 12)}`), ...await list(`notes/${v.id}`)];
  if (files.length) await remove(files);
  await rest('DELETE', `versions?id=eq.${v.id}`);
  console.log(`  🗑 נמחקה "${v.label}" (${files.length} קבצים)`);
}
if (drop.length) {
  const used = new Set(keep.flatMap((v) => Object.values(v.model.fileMap || {})).filter((p) => p.startsWith('anim/')));
  const stale = (await list('anim')).filter((p) => !used.has(p));
  if (stale.length) { await remove(stale); console.log(`  🗑 ${stale.length} הנפשות שאף גרסה כבר לא משתמשת בהן`); }
}
console.log(`  נשארו בענן: ${keep.map((v) => v.label).join(' · ')}`);
