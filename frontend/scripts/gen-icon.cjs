const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createMinimalPNG(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk('IHDR', ihdrData);

  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0);
    for (let x = 0; x < size; x++) {
      const cx = size / 2, cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = size / 2;
      if (dist < maxDist * 0.9) {
        const t = dist / (maxDist * 0.9);
        rawData.push(Math.round(59 + t * 30), Math.round(130 + t * 20), Math.round(246 - t * 60));
      } else if (dist < maxDist) {
        rawData.push(37, 99, 235);
      } else {
        rawData.push(9, 9, 11);
      }
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);
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
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xEDB88320) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const png = createMinimalPNG(64);
const outputPath = path.join(__dirname, '..', 'electron', 'icon.png');
const icoPath = path.join(__dirname, '..', 'electron', 'icon.ico');
fs.writeFileSync(outputPath, png);
// Also copy as .ico (Windows will accept it)
fs.writeFileSync(icoPath, png);
console.log('Icons created!');
