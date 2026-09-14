import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const archivePath = path.join(root, 'assets-src', 'sprechen-t3-cards.tar.gz');
const outDir = path.join(root, 'public', 'sprechen', 'teil3-cards');
const EXPECTED_BYTES = 71075;
const EXPECTED_SHA256 = 'c8b1c178fac9769b7df99895a661d687ea8da701f8681ecacd00f71f76f14723';

const archive = await readFile(archivePath);
const sha256 = createHash('sha256').update(archive).digest('hex');

if (archive.length !== EXPECTED_BYTES) {
  throw new Error(`Sprechen Teil 3 cards: expected ${EXPECTED_BYTES} archive bytes, got ${archive.length}`);
}
if (sha256 !== EXPECTED_SHA256) {
  throw new Error(`Sprechen Teil 3 cards: SHA-256 mismatch (${sha256})`);
}

let tar;
try {
  tar = gunzipSync(archive);
} catch (error) {
  throw new Error(`Sprechen Teil 3 cards: invalid gzip archive: ${error instanceof Error ? error.message : String(error)}`);
}

const cards = new Map();
for (let offset = 0; offset + 512 <= tar.length; ) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every((byte) => byte === 0)) break;

  const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
  const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0/g, '').trim();
  const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
  const start = offset + 512;
  const end = start + size;

  if (/^\d{3}\.webp$/.test(name)) {
    const buffer = Buffer.from(tar.subarray(start, end));
    const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!isWebp) throw new Error(`Sprechen Teil 3 cards: ${name} is not a valid WebP file`);
    cards.set(name, buffer);
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
