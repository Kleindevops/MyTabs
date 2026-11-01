import * as esbuild from 'esbuild'
import { copyFileSync, existsSync, mkdirSync, cpSync } from 'node:fs'
import { resolve } from 'node:path'

const isDev = process.argv.includes('--watch')

async function buildAll() {
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true })
  }

  // 1. Build Background Service Worker (ESM format supported in MV3)
  await esbuild.build({
    entryPoints: ['src/background/index.ts'],
    bundle: true,
    outfile: 'dist/background.js',
    format: 'esm',
    target: 'chrome110',
    sourcemap: isDev,
    minify: !isDev,
  })
  console.log('✓ Background service worker built.')

  // 2. Build Content Script (IIFE format for webpage execution)
  await esbuild.build({
    entryPoints: ['src/content/index.ts'],
    bundle: true,
    outfile: 'dist/content.js',
    format: 'iife',
    target: 'chrome110',
    sourcemap: isDev,
    minify: !isDev,
  })
  console.log('✓ Content script built.')

  // 3. Copy manifest.json
  copyFileSync('manifest.json', 'dist/manifest.json')
  console.log('✓ Manifest copied.')

  // 4. Copy icons if exists
  if (existsSync('public/icons')) {
    mkdirSync('dist/icons', { recursive: true })
    cpSync('public/icons', 'dist/icons', { recursive: true })
    console.log('✓ Icons copied.')
  }

  // 5. Auto sync ready-to-run build to OneDrive for instant install on new PCs
  const oneDriveTarget = 'D:/OneDrive/备份/MyTabs/MyTabs-App'
  try {
    if (existsSync('D:/OneDrive/备份/MyTabs')) {
      cpSync('dist', oneDriveTarget, { recursive: true })
      console.log('✓ Auto-synced ready-to-run app to OneDrive/备份/MyTabs/MyTabs-App')
    }
  } catch (err) {
    // Ignore if path not available
  }
}

buildAll().catch((err) => {
  console.error(err)
  process.exit(1)
})
