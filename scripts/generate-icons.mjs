/**
 * Generates all PNG app icons from the source habit-system-icon.svg.
 *
 *  - favicon-32.png (32×32)              → flattened on #F3F1EA
 *  - apple-touch-icon.png (180×180)      → flattened on #F3F1EA (iOS)
 *  - habit-system-icon.png (512×512)     → flattened on #F3F1EA (PWA)
 *
 * The SVG already carries its own paper-cream background, but we flatten
 * against the same colour so there is zero alpha in the final PNGs
 * (iOS and Android both expect fully opaque home-screen icons).
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
const BG = '#F3F1EA';

const sourceSvg = readFileSync(join(PUBLIC, 'habit-system-icon.svg'), 'utf-8');

async function png(size, file) {
  const buf = await sharp(Buffer.from(sourceSvg))
    .resize(size, size)
    .flatten({ background: BG })
    .png()
    .toBuffer();
  writeFileSync(join(PUBLIC, file), buf);
}

async function main() {
  await png(32, 'favicon-32.png');
  await png(180, 'apple-touch-icon.png');
  await png(512, 'habit-system-icon.png');
  console.log('✅ All habit-tracker icons generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
