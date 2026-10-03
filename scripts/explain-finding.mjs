#!/usr/bin/env node
// check-anon.mjs reports hashes rather than terms, so its output stays safe
// to paste anywhere. This resolves a reported hash back to a readable term
// by testing candidates you supply.
//
//   node scripts/explain-finding.mjs <hash> "Acme Corp" "Initech" ...
//
// With no candidates it reads the visible text of the built site and tells
// you which phrase in it produced the hash, which is usually what you want.

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fingerprint } from './check-anon.mjs';

const [target, ...candidates] = process.argv.slice(2);
if (!target) {
  console.error('Usage: node scripts/explain-finding.mjs <hash> [candidate ...]');
  process.exit(2);
}

if (candidates.length) {
  const hit = candidates.find((c) => fingerprint(c) === target);
  console.log(hit ? `Match: "${hit}"` : 'None of those candidates match.');
  process.exit(0);
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (extname(p) === '.html') out.push(p);
  }
  return out;
}

const found = new Set();
for (const file of await walk('dist')) {
  const text = (await readFile(file, 'utf8'))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const words = text.toLowerCase().match(/[a-z0-9][a-z0-9'’-]*/g) ?? [];
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= 3 && i + n <= words.length; n++) {
      const phrase = words.slice(i, i + n).join(' ');
      if (fingerprint(phrase) === target) found.add(`${file}: "${phrase}"`);
    }
  }
}

if (found.size) {
  console.log('Matched in the built site:');
  for (const f of found) console.log('  · ' + f);
} else {
  console.log('No phrase in dist/ produces that hash. Build first, or pass candidates.');
}
