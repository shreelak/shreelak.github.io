#!/usr/bin/env node
// Add a term to the denylist without ever writing it to disk in plaintext.
//
//   node scripts/add-denylist-term.mjs "Acme Corporation"
//
// Terms of up to three words are supported, matching the n-gram window
// used by check-anon.mjs.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from './check-anon.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'denylist.hashes.json');

const term = process.argv.slice(2).join(' ').trim();
if (!term) {
  console.error('Usage: node scripts/add-denylist-term.mjs "the term"');
  process.exit(2);
}
if (term.split(/\s+/).length > 3) {
  console.error('Terms longer than three words will never match. Shorten it.');
  process.exit(2);
}

const hashes = new Set(JSON.parse(await readFile(FILE, 'utf8')));
const fp = fingerprint(term);

if (hashes.has(fp)) {
  console.log('Already on the denylist.');
  process.exit(0);
}

hashes.add(fp);
await writeFile(FILE, JSON.stringify([...hashes].sort(), null, 0) + '\n');
console.log(`Added. ${hashes.size} terms on the denylist.`);
