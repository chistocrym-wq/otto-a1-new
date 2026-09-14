import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const srcDir = path.join(root, 'assets-src', 'sprechen-t3-cards-v2');
const outDir = path.join(root, 'public', 'sprechen', 'teil3-cards');
const pattern = /^part\d+\.b64$/;
const EXPECTED_PARTS = 6;

const files = (await readdir(srcDir)).filter((name) => pattern.test(name)).sort();
if (files.length !== EXPECTED_PARTS) {
  throw new Error(`Sprechen Teil 3 cards: expected ${EXPECTED_PARTS} bundle parts, found ${files.length}`);
}

const base64 = (await Promise.all(files.map((name) => readFile(path.join(srcDir, name), 'utf8'))))
  .join('')
  .replace(/\s+/g, '');
const archive = Buffer.from(base64, 'base64');

let tar;
try {
  tar = gunzipSync(archive);
} catch (error) {
  throw new Error(`Sprechen Teil 3 cards: bundle is not a valid gzip archive: ${error instanceof Error ? error.message : String(error)}`);
}

const cards = new Map();
for (let offset = 0; offset + 512 <= tar.length; ) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every((byte) => byte === 0)) break;

  const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
  const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0/g, '').trim();
  const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
  const start = offset + 512;

  if (/^\d{3}\.webp$/.test(name)) {
    const card = Buffer.from(tar.subarray(start, start + size));
    const isWebP =
      card.length >= 12 &&
      card.subarray(0, 4).toString('ascii') === 'RIFF' &&
      card.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!isWebP) {
      throw new Error(`Sprechen Teil 3 cards: ${name} is not a valid WebP file`);
    }
    cards.set(name, card);
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

console.log(`Built ${expectedNames.length} separate verified Sprechen Teil 3 cards in ${path.relative(root, outDir)}.`);
