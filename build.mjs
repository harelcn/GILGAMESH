// Vercel build: writes public/config.js from the project's environment variables (URL + anon key are public by design;
// the service role key is never sent to the browser).
import fs from 'node:fs';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !anon) { console.error('missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'); process.exit(1); }
fs.writeFileSync('public/config.js', `window.ROOM_CONFIG = ${JSON.stringify({ url, anon })};\n`);
console.log('config.js written for', new URL(url).host);
