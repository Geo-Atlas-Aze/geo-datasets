/**
 * Rename indexes/chunks.manifest.json → chunks.index.json (SDK contract) and
 * refresh checksums/manifest/integrity entries.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../v2/az/2.0.0');
const OLD_REL = 'indexes/chunks.manifest.json';
const NEW_REL = 'indexes/chunks.index.json';
const oldPath = path.join(ROOT, OLD_REL);
const newPath = path.join(ROOT, NEW_REL);

if (!fs.existsSync(oldPath) && fs.existsSync(newPath)) {
  console.log('already renamed');
  process.exit(0);
}
if (!fs.existsSync(oldPath)) {
  throw new Error(`missing ${OLD_REL}`);
}

fs.renameSync(oldPath, newPath);
const bytes = fs.readFileSync(newPath);
const sha = crypto.createHash('sha256').update(bytes).digest('hex');
const size = bytes.length;
console.log({ NEW_REL, size, sha });

function rewritePath(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.path === OLD_REL) {
      obj.path = NEW_REL;
      if (typeof obj.sizeBytes === 'number') obj.sizeBytes = size;
      if (obj.checksum?.value) obj.checksum.value = sha;
      if (obj.value && obj.algorithm === 'sha256') obj.value = sha;
      if (obj.id === 'indexes/chunks-manifest' || obj.id === 'indexes/chunks.manifest') {
        // keep id stable; path is what CDN/SDK use
      }
    }
  }
}

{
  const p = path.join(ROOT, 'checksums.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const e of j.entries) {
    if (e.path === OLD_REL) {
      e.path = NEW_REL;
      e.sizeBytes = size;
      e.value = sha;
    }
  }
  fs.writeFileSync(p, JSON.stringify(j));
}

{
  const p = path.join(ROOT, 'manifest.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const a of j.artifacts) {
    if (a.path === OLD_REL) {
      a.path = NEW_REL;
      a.sizeBytes = size;
      if (a.checksum?.value) a.checksum.value = sha;
    }
  }
  fs.writeFileSync(p, JSON.stringify(j));
}

{
  const p = path.join(ROOT, 'release-integrity.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const e of j.entries) {
    if (e.path === OLD_REL) {
      e.path = NEW_REL;
      e.sizeBytes = size;
      e.checksum.value = sha;
    }
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}

console.log('renamed + metadata updated');
