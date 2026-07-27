// Run every runtime's test.mjs in order. Exits nonzero if any runtime fails.
// Usage: node runtimes/run.mjs   (or `pnpm runtimes`; also a `pnpm verify` step)
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimes = readdirSync(here, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d\d-/.test(d.name))
  .map((d) => d.name)
  .sort();

let failures = 0;
for (const name of runtimes) {
  const r = spawnSync(process.execPath, ['test.mjs'], {
    cwd: path.join(here, name),
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    failures++;
    console.error(`\nRUNTIME FAILED: ${name}`);
  }
}
console.log(failures === 0 ? `\nRUNTIMES: all ${runtimes.length} green` : `\nRUNTIMES: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
