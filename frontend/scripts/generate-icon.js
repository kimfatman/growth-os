const fs = require('fs');
const path = require('path');

// Generate a minimal 64x64 blue PNG icon using raw PNG data
// PNG spec: signature + IHDR + IDAT + IEND

function createMinimalPNG(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // Create image data (dark blue background with 'G' text area)
  // Each row: filter byte (1) + RGB pixels
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < size; x++) {
      const cx = size / 2;
      const cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = size / 2;

      if (dist < maxDist * 0.9) {
        // Inner circle - gradient blue
        const t = dist / (maxDist * 0.9);
        rawData.push(Math.round(59 + t * 30));   // R
        rawData.push(Math.round(130 + t * 20));  // G
        rawData.push(Math.round(246 - t * 60));  // B
      } else if (dist < maxDist) {
        // Border
        rawData.push(37);  // R
        rawData.push(99);  // G
        rawData.push(235); // B
      } else {
        // Transparent (but PNG RGB doesn't support alpha, use background color)
        rawData.push(9);   // R - match bg
        rawData.push(9);   // G
        rawData.push(11);  // B
      }
    }
  }

  // Compress with zlib (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const png = createMinimalPNG(64);
const outputPath = path.join(__dirname, '..', 'electron', 'icon.png');
fs.writeFileSync(outputPath, png);
console.log('Icon created at:', outputPath);
console.log('Size:', png.length, 'bytes');
