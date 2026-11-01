import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import zlib from 'node:zlib'

function createPNG(size, r, g, b) {
  // Minimal PNG generator
  const width = size
  const height = size
  const buffer = Buffer.alloc(height * (width * 4 + 1))
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1)
    buffer[rowOffset] = 0 // Filter type none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4
      // Draw rounded icon
      const cx = width / 2
      const cy = height / 2
      const radius = width * 0.45
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      
      if (dist <= radius) {
        buffer[pixelOffset] = r     // R
        buffer[pixelOffset + 1] = g // G
        buffer[pixelOffset + 2] = b // B
        buffer[pixelOffset + 3] = 255 // A
      } else {
        buffer[pixelOffset] = 0
        buffer[pixelOffset + 1] = 0
        buffer[pixelOffset + 2] = 0
        buffer[pixelOffset + 3] = 0
      }
    }
  }

  const deflated = zlib.deflateSync(buffer)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type)
    const crc = crc32(Buffer.concat([typeBuf, data]))
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc, 0)
    return Buffer.concat([len, typeBuf, data, crcBuf])
  }

  function crc32(buf) {
    let crc = -1
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
    }
    return (crc ^ -1) >>> 0
  }

  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ])
}

if (!existsSync('public/icons')) {
  mkdirSync('public/icons', { recursive: true })
}

// Generate vibrant cyan/blue iTab style icons
writeFileSync('public/icons/icon16.png', createPNG(16, 59, 130, 246))
writeFileSync('public/icons/icon48.png', createPNG(48, 59, 130, 246))
writeFileSync('public/icons/icon128.png', createPNG(128, 59, 130, 246))
console.log('✓ Generated extension PNG icons.')
