import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const srcDir = path.join(root, 'assets-src', 'sprechen-t3-cards-v2');
const outDir = path.join(root, 'public', 'sprechen', 'teil3-cards');
const pattern = /^part\d+\.b64$/;
const EXPECTED_PARTS = 6;
const EXPECTED_BYTES = 71059;
const EXPECTED_SHA256 = '9f09c1cfb018b9695a0cbb4eb457d28bc701cc8771befead881c3d51d60de1e4';

const files = (await readdir(srcDir)).filter((name) => pattern.test(name)).sort();
if (files.length !== EXPECTED_PARTS) {
  throw new Error(`Sprechen Teil 3 cards: expected ${EXPECTED_PARTS} bundle parts, found ${files.length}`);
}

const base64 = (await Promise.all(files.map((name) => readFile(path.join(srcDir, name), 'utf8'))))
  .join('')
  .replace(/\s+/g, '');
const archive = Buffer.from(base64, 'base64');
const sha256 = createHash('sha256').update(archive).digest('hex');

if (archive.length !== EXPECTED_BYTES) {
  throw new Error(`Sprechen Teil 3 cards: expected ${EXPECTED_BYTES} archive bytes, got ${archive.length}`);
}
if (sha256 !== EXPECTED_SHA256) {
  throw new Error(`Sprechen Teil 3 cards: SHA-256 mismatch (${sha256})`);
}

const tar = gunzipSync(archive);
const cards = new Map();
for (let offset = 0; offset + 512 <= tar.length; ) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every((byte) => byte === 0)) break;

  const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
  const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0/g, '').trim();
  const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
  const start = offset + 512;

  if (/^\d{3}\.webp$/.test(name)) {
    cards.set(name, Buffer.from(tar.subarray(start, start + size)));
  }
  offset = start + Math.ceil(size / 512) * 512;
}

const expectedNames = Array.from({ length: 50 }, (_, index) => `${String(index + 1).padStart(3, '0')}.webp`);
if (cards.size !== expectedNames.length || expectedNames.some((name) => !cards.has(name))) {
  throw new Error(`Sprechen Teil 3 cards: expected exactly 50 cards 001–050, found ${cards.size}`);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
for (const name of expectedNames) {
  await writeFile(path.join(outDir, name), cards.get(name));
}

console.log(`Built ${expectedNames.length} separate Sprechen Teil 3 cards in ${path.relative(root, outDir)}.`);
