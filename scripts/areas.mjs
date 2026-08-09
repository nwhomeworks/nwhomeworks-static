#!/usr/bin/env node
// Areas-served bands: regenerates every "areas:start / areas:end" region in
// tracked HTML from the single list in data/areas.json, so adding a city or a
// new /areas/<slug>/ page updates the whole site at once.
//
// Markup contract — put the markers inside whatever wrapper the page already
// uses, and leave the rest of the section alone:
//
//   <p>
//     <!-- areas:start variant="full" -->
//     ...generated, do not hand-edit...
//     <!-- areas:end -->
//   </p>
//
// variant="full"  every city, plus the trailing "and the greater Puget Sound"
// variant="short" only cities flagged `featured`, no trailing phrase
//
// A city is rendered as a link when it has a `slug` AND areas/<slug>/index.html
// exists; otherwise it renders as plain text (and we warn), so a typo or a
// page-not-built-yet degrades to text instead of shipping a 404.
//
// Run manually with `node scripts/areas.mjs`, or via the .githooks/pre-commit
// hook installed by scripts/install-hooks.sh.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const data = JSON.parse(readFileSync('data/areas.json', 'utf8'));
const tail = data.tail ?? '';

// Resolve each city to its final rendered form once, warning about slugs that
// point at a page we haven't built.
const warnings = [];
const resolved = data.areas.map((area) => {
  let href = null;
  if (area.slug) {
    if (existsSync(`areas/${area.slug}/index.html`)) {
      href = `/areas/${area.slug}/`;
    } else {
      warnings.push(`${area.name}: no page at areas/${area.slug}/index.html — rendering as plain text`);
    }
  }
  return {
    featured: Boolean(area.featured),
    html: href ? `<a href="${href}">${area.name}</a>` : area.name,
  };
});

function render(variant, indent) {
  const list = variant === 'short' ? resolved.filter((a) => a.featured) : resolved;
  const withTail = variant !== 'short' && tail;
  const lines = list.map((a, i) => {
    const isLast = i === list.length - 1 && !withTail;
    return `${indent}${a.html}${isLast ? '' : ' &middot;'}`;
  });
  if (withTail) lines.push(`${indent}${tail}`);
  return lines;
}

const htmlFiles = execSync('git ls-files "*.html"', { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((p) => !p.startsWith('.claude/') && !p.startsWith('node_modules/'));

// Attributes stay on the start-marker line, so `.` (no newlines) is the right
// match for them; the body between markers may span any number of lines.
const bandRe = /([ \t]*)<!--\s*areas:start(.*?)-->[\s\S]*?<!--\s*areas:end\s*-->/g;

let changed = 0;
let bands = 0;
const touched = [];

for (const file of htmlFiles) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('areas:start')) continue;

  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const out = src.replace(bandRe, (_full, indent, attrs) => {
    bands++;
    const variant = /variant="([\w-]+)"/.exec(attrs)?.[1] ?? 'full';
    const body = render(variant, indent).join(eol);
    return [
      `${indent}<!-- areas:start${attrs}-->`,
      body,
      `${indent}<!-- areas:end -->`,
    ].join(eol);
  });

  if (out !== src) {
    writeFileSync(file, out);
    changed++;
    touched.push(file);
  }
}

for (const w of warnings) console.warn(`areas: WARNING ${w}`);
console.log(`areas: ${resolved.length} cities, ${bands} bands across ${htmlFiles.length} files, ${changed} updated`);
for (const f of touched) console.log(`  ${f}`);
