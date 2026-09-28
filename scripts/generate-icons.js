import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create beautiful SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="shield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background with subtle rounded corners -->
  <rect width="512" height="512" rx="96" fill="url(#bg)" />
  
  <!-- Outer glowing ring -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#38bdf8" stroke-width="6" opacity="0.4" />
  
  <!-- Shield Icon Graphic -->
  <g filter="url(#shadow)">
    <path d="M256 90 L380 145 C380 270 256 360 256 390 C256 360 132 270 132 145 Z" fill="url(#shield)" />
    <!-- Medical Cross inside Shield -->
    <path d="M236 175 H276 V225 H326 V265 H276 V315 H236 V265 H186 V225 H236 Z" fill="#0284c7" />
  </g>
  
  <!-- Banner accent text -->
  <text x="256" y="445" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="4">HBP MASTER</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Function to generate raw PNG with uncompressed or zlib-compressed scanlines
function createPng(width, height, isMaskable = false) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const rOuter = (width / 2) * (isMaskable ? 0.95 : 0.88);
  const rSafe = (width / 2) * 0.72;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background color: deep medical cyan/blue (#0284c7 = 2, 132, 199)
      let r = 2, g = 132, b = 199, a = 255;

      // Darker gradient towards bottom
      const gradRatio = y / height;
      r = Math.round(2 * (1 - gradRatio * 0.2));
      g = Math.round(132 * (1 - gradRatio * 0.2));
      b = Math.round(199 * (1 - gradRatio * 0.15));

      // Draw white medical shield / emblem in center
      // Shield parametric boundary:
      const relY = (y - (cy - height * 0.08)) / (height * 0.55);
      const relX = Math.abs(dx) / (width * 0.32);

      const inShield = relY >= 0 && relY <= 1.0 && relX <= (1 - Math.max(0, (relY - 0.35) * 1.3));

      if (inShield) {
        // Shield white background
        r = 255; g = 255; b = 255; a = 255;

        // Medical Cross inside shield
        const crossRelY = y - (cy - height * 0.05);
        const crossRelX = Math.abs(dx);
        const armThick = width * 0.07;
        const armLen = width * 0.18;

        const inVerticalArm = crossRelX <= armThick && Math.abs(crossRelY) <= armLen;
        const inHorizontalArm = crossRelX <= armLen && Math.abs(crossRelY) <= armThick;

        if (inVerticalArm || inHorizontalArm) {
          // Blue medical cross
          r = 2; g = 132; b = 199;
        }
      }

      // Outer border circle ring for polish
      if (Math.abs(dist - rSafe) <= Math.max(1, width * 0.012)) {
        r = 56; g = 189; b = 248; // sky-400
      }

      // Corners for non-maskable rounded square
      if (!isMaskable) {
        const cornerR = width * 0.18;
        const inBox = (x >= cornerR && x <= width - cornerR) ||
                      (y >= cornerR && y <= height - cornerR) ||
                      Math.hypot(Math.max(0, Math.abs(x - cx) - (cx - cornerR)), Math.max(0, Math.abs(y - cy) - (cy - cornerR))) <= cornerR;
        if (!inBox) {
          a = 0; // transparent corner
        }
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  return encodePng(width, height, buffer);
}

function encodePng(width, height, rgbaBuffer) {
  // Scanlines with filter byte 0 (None)
  const rowSize = width * 4 + 1;
  const filteredData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    filteredData[y * rowSize] = 0; // Filter type None
    rgbaBuffer.copy(filteredData, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(filteredData, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression method: 0
  ihdr[11] = 0; // Filter method: 0
  ihdr[12] = 0; // Interlace method: 0
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(12 + length);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crcTarget = buffer.subarray(4, 8 + length);
  const crc = crc32(crcTarget);
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// CRC32 table & function
const crcTable = new Uint32Array(256);
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

// Generate the required files:
console.log('Generating PNG icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));

console.log('All icons generated successfully!');
