import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const sourceImage = resolve('public/icons/rose.png')

if (!existsSync(sourceImage)) {
  console.error('Source rose image not found at', sourceImage)
  process.exit(1)
}

if (!existsSync('public/icons')) {
  mkdirSync('public/icons', { recursive: true })
}

const sizes = [16, 32, 48, 128]

async function generate() {
  for (const size of sizes) {
    const target = resolve(`public/icons/icon${size}.png`)
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9 })
      .toFile(target)
    console.log(`✓ Generated ${target} (${size}x${size}, transparent background)`)
  }
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
