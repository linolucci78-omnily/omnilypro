const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }
];

const inputFile = path.join(__dirname, 'public', 'logo-original.png');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('🎉 All icons generated successfully!');
}

generateIcons();
