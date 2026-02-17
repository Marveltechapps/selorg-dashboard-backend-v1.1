#!/usr/bin/env node
/**
 * Resolve git merge conflicts by keeping HEAD version.
 * Usage: node scripts/resolve-conflicts.js
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function resolveFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const marker = '<<<<<<< HEAD';
  const sep = '=======';
  if (!content.includes(marker)) return false;
  let out = '';
  let remaining = content;
  while (remaining.includes(marker)) {
    const i = remaining.indexOf(marker);
    out += remaining.slice(0, i);
    remaining = remaining.slice(i + marker.length);
    const j = remaining.indexOf(sep);
    if (j === -1) break;
    const headBlock = remaining.slice(0, j).replace(/^\n/, '');
    remaining = remaining.slice(j + sep.length);
    const k = remaining.search(/\n>>>>>>> [^\n]+/);
    if (k === -1) break;
    out += headBlock;
    remaining = remaining.slice(k + 1).replace(/^\n?/, '');
  }
  out += remaining;
  fs.writeFileSync(filePath, out, 'utf8');
  return true;
}

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const e of files) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) count += walk(full);
    else if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.ts'))) {
      if (resolveFile(full)) count++;
    }
  }
  return count;
}

const n = walk(srcDir);
console.log('Resolved', n, 'files.');
process.exit(0);
