#!/usr/bin/env node
// Auto cache-bust: stamps /css/*.css and /js/*.js references in tracked HTML
// with a content-hash query string, so Cloudflare and browsers fetch fresh
// assets whenever the underlying file changes.
//
// Run manually with `node scripts/cachebust.mjs`, or via the .githooks/pre-commit
// hook installed by scripts/install-hooks.sh.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const htmlFiles = execSync('git ls-files "*.html"', { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((p) => !p.startsWith('.claude/') && !p.startsWith('node_modules/'));

// Matches absolute refs like /css/site.css, /js/main.js, or nested paths like
// /tools/kitchen-remodel-cost-estimator/css/estimator.css, with an optional ?v=.
const assetRefRe = /\/([\w.\-/]*?(?:css|js)\/[\w.\-]+\.(?:css|js))(\?v=[^"']*)?/g;

// Pass 1: discover every asset referenced in any tracked HTML file.
const assets = new Set();
for (const f of htmlFiles) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(assetRefRe)) assets.add(m[1]);
}

// Compute 8-char sha1 for each asset that actually exists on disk.
const hashes = {};
for (const a of assets) {
  if (existsSync(a)) {
    hashes[a] = createHash('sha1').update(readFileSync(a)).digest('hex').slice(0, 8);
  }
}

// Pass 2: rewrite each HTML file, stamping (or re-stamping) the version.
let changed = 0;
const touched = [];
for (const f of htmlFiles) {
  const src = readFileSync(f, 'utf8');
  const out = src.replace(assetRefRe, (full, path) => {
    const h = hashes[path];
    return h ? `/${path}?v=${h}` : full;
  });
  if (out !== src) {
    writeFileSync(f, out);
    changed++;
    touched.push(f);
  }
}

console.log(`cachebust: ${Object.keys(hashes).length} assets hashed, ${changed} html files updated`);
if (touched.length && process.env.CACHEBUST_PRINT_FILES) {
  for (const f of touched) console.log(`  ${f}`);
}
