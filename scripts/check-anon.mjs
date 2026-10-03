#!/usr/bin/env node
// Confidentiality guardrail. Fails the build if the rendered site contains
// a customer name, an identifying sector descriptor, an internal programme
// name, or a revenue or internal-metric figure.
//
// The denylist is stored as truncated SHA-256 hashes in denylist.hashes.json
// rather than plaintext, because this repository is public. Shipping the
// list in the clear would hand a reader a lookup table from the anonymised
// case studies straight back to the real companies, which would defeat the
// point of anonymising them in the first place.
//
// To add a term: node scripts/add-denylist-term.mjs "the term"
//
// Only HTML is scanned, and only its visible text, because CSS properties
// such as `flex` and `$` in selectors legitimately collide with the list.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = 'dist';
const MAX_NGRAM = 3;

export function fingerprint(term) {
  return createHash('sha256')
    .update(term.toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex')
    .slice(0, 16);
}

// Revenue, deal values, and internal employer metrics. These stay in
// plaintext: they are patterns, not names, so they reveal nothing.
const PATTERNS = [
  { re: /\$\s?\d+[.,]?\d*\s?(M|K|B)\b/i, name: 'dollar amount' },
  { re: /\bARR\b/, name: 'ARR' },
  { re: /\bPPA\b/, name: 'PPA' },
  { re: /\bEDP\b/, name: 'EDP' },
  { re: /\bSOW\b/, name: 'SOW' },
  { re: /\bCSAT\b/i, name: 'CSAT' },
  { re: /\b\d\.\d{1,2}\s*(\/|out of)\s*5\b/i, name: 'rating out of 5' },
  { re: /\brated\s+5\s*(\/|out of)\s*5\b/i, name: 'rating out of 5' },
  { re: /\bExceeds High Bar\b/i, name: 'internal performance rating' },
  { re: /\bForte\b/, name: 'internal review process' },
  { re: /\bPFRs?\b/, name: 'internal product-request shorthand' },
];

function visibleText(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

// Every 1..3 word window of the visible text, so multi-word names
// like "Dell Technologies" are caught as well as single tokens.
function ngrams(text) {
  const words = text.toLowerCase().match(/[a-z0-9][a-z0-9'’-]*/g) ?? [];
  const out = new Set();
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= MAX_NGRAM && i + n <= words.length; n++) {
      out.add(words.slice(i, i + n).join(' '));
    }
  }
  return out;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (extname(p) === '.html') out.push(p);
  }
  return out;
}

try {
  await stat(DIST);
} catch {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(2);
}

const denylist = new Set(
  JSON.parse(await readFile(join(HERE, 'denylist.hashes.json'), 'utf8')),
);

const files = await walk(DIST);
const findings = [];

for (const file of files) {
  const text = visibleText(await readFile(file, 'utf8'));

  for (const phrase of ngrams(text)) {
    if (denylist.has(fingerprint(phrase))) {
      // Report the hash, not the phrase, so CI logs stay clean too.
      findings.push(`${file}: denylisted term present (${fingerprint(phrase)})`);
    }
  }
  for (const pat of PATTERNS) {
    if (pat.re.test(text)) findings.push(`${file}: ${pat.name}`);
  }
}

if (findings.length) {
  console.error('Anonymisation check FAILED:');
  for (const f of [...new Set(findings)]) console.error('  · ' + f);
  console.error('\nRun scripts/explain-finding.mjs <hash> locally to see which term matched.');
  process.exit(1);
}
console.log(`Anonymisation check OK. ${files.length} HTML files, ${denylist.size} denylisted terms.`);
