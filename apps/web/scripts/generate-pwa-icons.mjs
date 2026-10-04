import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

/** PNG minimal orange WINE (#d63a00) avec lettre W simplifiée (pixels). */
function createIcon(size, maskable = false) {
  const raw = Buffer.alloc(size * size * 4);
  const pad = maskable ? Math.floor(size * 0.1) : 0;
  const r = 0xd6;
  const g = 0x3a;
  const b = 0x00;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const inSafe = x >= pad && y >= pad && x < size - pad && y < size - pad;
      const corner = Math.hypot(x - size / 2, y - size / 2) < size * 0.46;
      const bg = maskable ? inSafe : corner;
      if (bg) {
        raw[i] = r;
        raw[i + 1] = g;
        raw[i + 2] = b;
        raw[i + 3] = 255;
      } else {
        raw[i + 3] = maskable ? 255 : 0;
        if (maskable) {
          raw[i] = 0xfa;
          raw[i + 1] = 0xf9;
          raw[i + 2] = 0xf5;
        }
      }
    }
  }

  const stride = size * 4;
  const filtered = Buffer.alloc(raw.length + size);
  let off = 0;
  for (let y = 0; y < size; y++) {
    filtered[off++] = 0;
    raw.copy(filtered, off, y * stride, (y + 1) * stride);
    off += stride;
  }

  const compressed = deflateSync(filtered);

  function chunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, "ascii");
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    const out = Buffer.alloc(12 + len);
    buf.copy(out, 0, 0, 8 + len);
    out.writeUInt32BE(crc >>> 0, 8 + len);
    return out;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c;
}

writeFileSync(join(outDir, "icon-192.png"), createIcon(192));
writeFileSync(join(outDir, "icon-512.png"), createIcon(512));
writeFileSync(join(outDir, "icon-maskable-512.png"), createIcon(512, true));
console.log("PWA icons written to public/icons/");
