import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const srcDir = path.join(root, 'assets-src');
const outDir = path.join(root, 'public', 'sprechen');
const outFile = path.join(outDir, 'teil3-requests-user.avif');
const pattern = /^sprechen-t3-user\.avif\.b64\.part\d+$/;
const EXPECTED_PARTS = 9;
const EXPECTED_BYTES = 48391;
const EXPECTED_SHA256 = '7062d5f61830bd39da97e22cbd6c324c791e9efbb84794fea722beb90314f3fe';

const files = (await readdir(srcDir)).filter((name) => pattern.test(name)).sort();
if (files.length !== EXPECTED_PARTS) {
  throw new Error(`Sprechen Teil 3 asset: expected ${EXPECTED_PARTS} parts, found ${files.length}`);
}

const base64 = (await Promise.all(files.map((name) => readFile(path.join(srcDir, name), 'utf8'))))
  .join('')
  .replace(/\s+/g, '');
const buffer = Buffer.from(base64, 'base64');
const signature = buffer.subarray(4, 12).toString('ascii');
const sha256 = createHash('sha256').update(buffer).digest('hex');

if (signature !== 'ftypavif') {
  throw new Error(`Sprechen Teil 3 asset: invalid AVIF signature ${JSON.stringify(signature)}`);
}
if (buffer.length !== EXPECTED_BYTES) {
  throw new Error(`Sprechen Teil 3 asset: expected ${EXPECTED_BYTES} bytes, got ${buffer.length}`);
}
if (sha256 !== EXPECTED_SHA256) {
  throw new Error(`Sprechen Teil 3 asset: SHA-256 mismatch (${sha256})`);
}

await mkdir(outDir, { recursive: true });
await writeFile(outFile, buffer);
console.log(`Built ${path.relative(root, outFile)} from ${files.length} verified parts (${buffer.length} bytes).`);
