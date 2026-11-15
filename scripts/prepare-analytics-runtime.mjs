// Self-host the pinned Python runtime and verified wheels; never send analytics to a CDN.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'node_modules/pyodide');
const { version } = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
const directory = path.join(root, 'public/analytics-runtime', version);
await mkdir(directory, { recursive: true });
for (const name of ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
  await copyFile(path.join(source, name), path.join(directory, name));
}
const lock = JSON.parse(await readFile(path.join(source, 'pyodide-lock.json'), 'utf8'));
const needed = new Set();
function include(name) {
  if (needed.has(name)) return;
  const entry = lock.packages[name];
  if (!entry) throw new Error(`Unknown runtime package: ${name}`);
  needed.add(name);
  entry.depends.forEach(include);
}
include('pandas');
for (const name of needed) {
  const entry = lock.packages[name];
  const target = path.join(directory, entry.file_name);
  const matches = bytes => createHash('sha256').update(bytes).digest('hex') === entry.sha256;
  try { if (matches(await readFile(target))) continue; } catch { /* first build */ }
  const url = `https://cdn.jsdelivr.net/pyodide/v${version}/full/${entry.file_name}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Runtime download failed: ${name} (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!matches(bytes)) throw new Error(`Runtime checksum mismatch: ${name}`);
  await writeFile(target, bytes);
}
await writeFile(path.join(root, 'public/analytics-runtime/version.json'), JSON.stringify({ version }));
console.log(`Analytics Python ${version}: core and ${needed.size} verified packages ready.`);
