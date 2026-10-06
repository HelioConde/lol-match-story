const fs = require('node:fs');
const path = require('node:path');

const budgets = [
  { file: 'screenshots/latest-home-full.png', maxHeight: 1700, expectedWidth: 1440, maxBytes: 2_500_000 },
  { file: 'screenshots/latest-alchemy-full.png', maxHeight: 3900, expectedWidth: 1440, maxBytes: 4_500_000 },
  { file: 'screenshots/latest-story-full.png', maxHeight: 3500, expectedWidth: 1440, maxBytes: 4_000_000 },
  { file: 'screenshots/latest-tablet-home-full.png', maxHeight: 2200, expectedWidth: 768, maxBytes: 2_500_000 },
  { file: 'screenshots/latest-tablet-story-full.png', maxHeight: 4400, expectedWidth: 768, maxBytes: 4_500_000 },
  { file: 'screenshots/latest-mobile-full.png', maxHeight: 5000, expectedWidth: 390, maxBytes: 2_500_000 }
];

function pngSize(file) {
  const buf = fs.readFileSync(file);
  const sig = buf.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') throw new Error(file + ' is not a PNG');
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length
  };
}

const metadataPath = path.resolve(process.cwd(), 'screenshots/metadata.json');
if (!fs.existsSync(metadataPath)) {
  console.error('screenshots/metadata.json is missing');
  process.exit(1);
}
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const declared = Array.isArray(metadata.captures) ? metadata.captures : [];
if (!declared.length) {
  console.error('metadata.json does not declare any captures');
  process.exit(1);
}
for (const capture of declared) {
  const file = path.resolve(process.cwd(), 'screenshots', capture.file);
  if (!fs.existsSync(file)) {
    console.error('declared screenshot is missing: ' + capture.file);
    failed = true;
  }
}

for (const budget of budgets) {
  const file = path.resolve(process.cwd(), budget.file);
  const s = pngSize(file);
  console.log(`${budget.file}: ${s.width}x${s.height} · ${Math.round(s.bytes/1024)} KB`);
  if (s.width !== budget.expectedWidth) {
    console.error(`  width regression: expected ${budget.expectedWidth}, got ${s.width}`);
    failed = true;
  }
  if (s.height > budget.maxHeight) {
    console.error(`  height budget exceeded: max ${budget.maxHeight}, got ${s.height}`);
    failed = true;
  }
  if (s.bytes > budget.maxBytes) {
    console.error(`  file-size budget exceeded: max ${budget.maxBytes}, got ${s.bytes}`);
    failed = true;
  }
}
if (failed) process.exit(1);
