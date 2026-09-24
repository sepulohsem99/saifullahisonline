// Static site: copy the page and its files into dist/ for Vercel.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const p of ['index.html', 'assets', 'lib']) cpSync(p, `dist/${p}`, { recursive: true });
console.log('Built dist/');
