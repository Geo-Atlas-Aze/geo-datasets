/**
 * One-shot: strip technical OSM id aliases from published search-aliases.json
 * and refresh checksum/manifest metadata so the file fits jsDelivr's 20 MB limit.
 *
 * Usage (from repo root or this dir):
 *   node scripts/trim-search-aliases-for-cdn.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../v2/az/2.0.0');
const JSDELIVR_MAX = 20 * 1024 * 1024;
const TECHNICAL = /^osm (node|way|relation)\/\d+/i;

const aliasesPath = path.join(ROOT, 'search/search-aliases.json');
const doc = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
const before = doc.aliases.length;
const kept = doc.aliases.filter((r) => !TECHNICAL.test(r.alias));
doc.aliases = kept;
doc.header = { ...doc.header, count: kept.length };

const bytes = Buffer.from(JSON.stringify(doc));
fs.writeFileSync(aliasesPath, bytes);
const sha = crypto.createHash('sha256').update(bytes).digest('hex');

console.log({
  before,
  after: kept.length,
  dropped: before - kept.length,
  sizeBytes: bytes.length,
  sizeMB: +(bytes.length / (1024 * 1024)).toFixed(2),
  underJsDelivrLimit: bytes.length < JSDELIVR_MAX,
  sha256: sha,
});

if (bytes.length >= JSDELIVR_MAX) {
  throw new Error(`Still >= ${JSDELIVR_MAX} bytes after trim`);
}

function updateChecksums() {
  const p = path.join(ROOT, 'checksums.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = j.entries.find((x) => x.path === 'search/search-aliases.json');
  if (!e) throw new Error('checksums entry missing');
  e.sizeBytes = bytes.length;
  e.value = sha;
  fs.writeFileSync(p, JSON.stringify(j));
}

function updateManifest() {
  const p = path.join(ROOT, 'manifest.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = j.artifacts.find((x) => x.path === 'search/search-aliases.json');
  if (!e) throw new Error('manifest artifact missing');
  e.sizeBytes = bytes.length;
  e.entityCount = kept.length;
  if (typeof e.checksum === 'string') e.checksum = sha;
  else if (e.checksum && typeof e.checksum === 'object' && 'value' in e.checksum) {
    e.checksum.value = sha;
  }
  fs.writeFileSync(p, JSON.stringify(j));
}

function updateSearchIndex() {
  const p = path.join(ROOT, 'search/search.index.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = j.artifacts.find((x) => x.id === 'aliases');
  if (!e) throw new Error('search.index aliases entry missing');
  e.count = kept.length;
  fs.writeFileSync(p, JSON.stringify(j));
}

function updateStatistics() {
  const p = path.join(ROOT, 'search/search-statistics.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.aliasCount = kept.length;
  fs.writeFileSync(p, JSON.stringify(j));
}

function updateIntegrity() {
  const p = path.join(ROOT, 'release-integrity.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = j.entries.find((x) => x.path === 'search/search-aliases.json');
  if (!e) throw new Error('release-integrity entry missing');
  const previous = e.sizeBytes;
  e.sizeBytes = bytes.length;
  e.checksum.value = sha;
  if (typeof j.totalBytes === 'number' && typeof previous === 'number') {
    j.totalBytes = j.totalBytes - previous + bytes.length;
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}

updateChecksums();
updateManifest();
updateSearchIndex();
updateStatistics();
updateIntegrity();
console.log('metadata updated');
