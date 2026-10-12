/**
 * Generates the Habit System app icon (SVG + PNG).
 *
 * Design concept: "The Refined Ledger"
 *   - Paper-coloured rounded-square background (journal aesthetic)
 *   - A 5×4 grid of larger rounded squares = the habit tracking grid
 *     (filled moss-green = completed, outlined = pending, amber = mood marker)
 *   - Fewer, bigger cells than the original 7×6 — legible at every size
 *     from 32px favicon to 512px app icon
 *   - A bold checkmark carved through the grid via a paper-coloured halo
 *   - An amber accent dot (mood / special marker)
 *
 * Colours mirror tailwind.config.js exactly.
 * Corner radii align with the design system (rounded-lg ≈ 10, checkbox ≈ 4).
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// ── Palette (from tailwind.config.js) ────────────────────────────────
const C = {
  paper:    '#F3F1EA',
  paperDim: '#EAE7DC',
  ink:      '#1F2A22',
  moss700:  '#2E4E2C',
  moss600:  '#3B6339',
  moss500:  '#4B7A4A',
  moss300:  '#8FAF87',
  moss100:  '#D7E3D3',
  moss50:   '#EEF3ED',
  amber500: '#B8823B',
  amber300: '#DCB273',
  clay500:  '#B15E52',
  line:     '#D8D3C4',
}

// ── Canvas ───────────────────────────────────────────────────────────
const SIZE   = 512
const RADIUS = 112

// ── Grid configuration ───────────────────────────────────────────────
// 5 columns × 4 rows — clean, spacious, legible at small sizes.
const COLS = 5
const ROWS = 4
const CELL = 64
const GAP  = 16
const CR   = 8                     // cell corner radius (between checkbox 4 & card-lg 10)
const GW   = COLS * CELL + (COLS - 1) * GAP   // grid width  = 384
const GH   = ROWS * CELL + (ROWS - 1) * GAP   // grid height = 304
const GX   = Math.round((SIZE - GW) / 2)       // grid start x = 64
const GY   = Math.round((SIZE - GH) / 2)       // grid start y = 104

// ── Habit completion pattern ─────────────────────────────────────────
// 2 = filled (moss-600), 1 = light fill (moss-100), 0 = empty (outlined), 3 = amber accent
// Realistic ~75% completion with a few natural gaps.
const PATTERN = [
  [2, 2, 0, 2, 2],   // mostly done — one miss
  [2, 2, 2, 2, 2],   // perfect streak
  [2, 3, 2, 2, 0],   // amber mood marker + one pending
  [0, 2, 2, 2, 2],   // one miss early in the week
]

// ── Checkmark path ───────────────────────────────────────────────────
// Drawn from upper-left → bottom-centre → upper-right, spanning the grid.
// Proportions tuned so both strokes have a natural ~47° angle.
const cx0 = GX + GW * 0.15          // start x  (left)
const cy0 = GY + GH * 0.35          // start y  (upper area)
const cx1 = GX + GW * 0.45          // bottom point x
const cy1 = GY + GH * 0.75          // bottom point y
const cx2 = GX + GW * 0.88          // end x  (right)
const cy2 = GY + GH * 0.12          // end y  (top)
const checkPath = `M ${cx0.toFixed(1)} ${cy0.toFixed(1)} L ${cx1.toFixed(1)} ${cy1.toFixed(1)} L ${cx2.toFixed(1)} ${cy2.toFixed(1)}`

// ── Build SVG ────────────────────────────────────────────────────────
function buildSVG() {
  const parts = []

  parts.push(
    `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">`
  )

  // ── Background ──
  parts.push(`<rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" fill="${C.paper}"/>`)

  // Subtle inner border (ledger frame)
  parts.push(
    `<rect x="28" y="28" width="${SIZE - 56}" height="${SIZE - 56}" rx="${RADIUS - 28}" fill="none" stroke="${C.line}" stroke-width="1.5"/>`
  )

  // ── Grid cells ──
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = GX + col * (CELL + GAP)
      const y = GY + row * (CELL + GAP)
      const val = PATTERN[row][col]

      if (val === 2) {
        // Filled — completed habit
        parts.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${CR}" fill="${C.moss600}"/>`)
      } else if (val === 3) {
        // Amber accent — mood / special marker
        parts.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${CR}" fill="${C.amber500}"/>`)
      } else if (val === 1) {
        // Light fill
        parts.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${CR}" fill="${C.moss100}"/>`)
      } else {
        // Empty — pending
        parts.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${CR}" fill="none" stroke="${C.line}" stroke-width="2"/>`)
      }
    }
  }

  // ── Checkmark — paper halo first, then moss stroke ──
  // The halo creates negative space so the checkmark reads clearly over the grid.
  const HALO_W = 40
  const STROKE_W = 26
  parts.push(
    `<path d="${checkPath}" stroke="${C.paper}" stroke-width="${HALO_W}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  )
  parts.push(
    `<path d="${checkPath}" stroke="${C.moss700}" stroke-width="${STROKE_W}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  )

  // ── Small accent: amber dot bottom-right (outside grid, in corner area) ──
  const dotX = SIZE - 72
  const dotY = SIZE - 72
  parts.push(`<circle cx="${dotX}" cy="${dotY}" r="10" fill="${C.amber500}"/>`)
  parts.push(`<circle cx="${dotX}" cy="${dotY}" r="10" fill="none" stroke="${C.paper}" stroke-width="3"/>`)

  parts.push(`</svg>`)
  return parts.join('\n')
}

// ── Generate files ───────────────────────────────────────────────────
const svg = buildSVG()
const svgPath = join(publicDir, 'habit-system-icon.svg')
writeFileSync(svgPath, svg, 'utf-8')
console.log(`✓ SVG saved: ${svgPath}`)

const pngPath = join(publicDir, 'habit-system-icon.png')
await sharp(Buffer.from(svg))
  .png()
  .toFile(pngPath)
console.log(`✓ PNG saved: ${pngPath}`)

// Also generate a 180×180 apple-touch-icon
const applePath = join(publicDir, 'apple-touch-icon.png')
await sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toFile(applePath)
console.log(`✓ Apple touch icon saved: ${applePath}`)

// Also generate a 32×32 favicon
const favPath = join(publicDir, 'favicon-32.png')
await sharp(Buffer.from(svg))
  .resize(32, 32)
  .png()
  .toFile(favPath)
console.log(`✓ 32px favicon saved: ${favPath}`)

console.log('\nDone!')
