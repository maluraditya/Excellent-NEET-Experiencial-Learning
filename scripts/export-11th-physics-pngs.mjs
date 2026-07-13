import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const srcDir = path.join(root, 'public', 'infographics', '11th-physics');
const require = createRequire(import.meta.url);
process.env.XDG_CACHE_HOME = path.join(root, '.tmp-font-cache');
fs.mkdirSync(process.env.XDG_CACHE_HOME, { recursive: true });
const bundledNodeModules = 'C:\\Users\\sudar\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules';
const bundledPnpm = path.join(bundledNodeModules, '.pnpm');
const bundledSharp = fs.existsSync(bundledPnpm)
  ? fs.readdirSync(bundledPnpm)
      .filter((entry) => entry.startsWith('sharp@'))
      .map((entry) => path.join(bundledPnpm, entry, 'node_modules', 'sharp'))
      .find((candidate) => fs.existsSync(candidate))
  : undefined;

const sharpCandidates = [
  path.join(root, 'node_modules', 'sharp'),
  bundledSharp,
  path.join(bundledNodeModules, 'sharp'),
].filter(Boolean);

const sharpPath = sharpCandidates.find((candidate) => fs.existsSync(candidate));
if (!sharpPath) {
  throw new Error('Unable to locate sharp for SVG to PNG export.');
}

const sharp = require(sharpPath);
const svgFiles = fs.readdirSync(srcDir).filter((file) => file.endsWith('.svg')).sort();

for (const file of svgFiles) {
  const svgPath = path.join(srcDir, file);
  const pngPath = path.join(srcDir, file.replace(/\.svg$/, '.png'));
  const svg = fs.readFileSync(svgPath);
  await sharp(svg, { density: 144 })
    .resize(1920, 1080, { fit: 'fill' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pngPath);
}

console.log(`Exported ${svgFiles.length} PNG infographics to ${srcDir}`);
