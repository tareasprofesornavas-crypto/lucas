import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, r1, g1, b1, r2, g2, b2) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const lineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * lineLength);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  for (let y = 0; y < height; y++) {
    const offset = y * lineLength;
    rawData[offset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Inner robot / visor core: navy/violet
        if (Math.abs(dy) < radius * 0.4 && Math.abs(dx) < radius * 0.65) {
          // Visor dark navy
          rawData[pxOffset] = 15;
          rawData[pxOffset + 1] = 23;
          rawData[pxOffset + 2] = 42;
        } else {
          // Pearly white helmet
          rawData[pxOffset] = 250;
          rawData[pxOffset + 1] = 250;
          rawData[pxOffset + 2] = 255;
        }
      } else if (dist < radius * 1.25 && dy > -radius * 0.2 && dy < radius * 0.6) {
        // Planetary orbit ring (purple/violet)
        rawData[pxOffset] = 99;
        rawData[pxOffset + 1] = 102;
        rawData[pxOffset + 2] = 241;
      } else {
        // Soft white canvas background
        const factor = (x + y) / (width + height);
        rawData[pxOffset] = Math.floor(255 - factor * 10);
        rawData[pxOffset + 1] = Math.floor(255 - factor * 8);
        rawData[pxOffset + 2] = Math.floor(255 - factor * 4);
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, 255, 255, 255, 99, 102, 241));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, 255, 255, 255, 99, 102, 241));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 255, 255, 255, 99, 102, 241));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 255, 255, 255, 99, 102, 241));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32, 255, 255, 255, 99, 102, 241));

console.log('Nexa mascot PNG Icons generated!');
