const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tailles d'icônes requises
const sizes = [
  // Public icons
  { size: 192, dir: 'public/icons', filename: 'icon-192x192.png' },
  { size: 144, dir: 'public/icons', filename: 'icon-144x144.png' },
  { size: 180, dir: 'public/icons', filename: 'icon-180x180.png' },
  { size: 512, dir: 'public/icons', filename: 'icon-512x512.png' },
  
  // Tauri icons
  { size: 32, dir: 'src-tauri/icons', filename: '32x32.png' },
  { size: 128, dir: 'src-tauri/icons', filename: '128x128.png' },
  { size: 256, dir: 'src-tauri/icons', filename: '128x128@2x.png' }, // 2x scale
  
  // Windows specific
  { size: 30, dir: 'src-tauri/icons', filename: 'Square30x30Logo.png' },
  { size: 44, dir: 'src-tauri/icons', filename: 'Square44x44Logo.png' },
  { size: 71, dir: 'src-tauri/icons', filename: 'Square71x71Logo.png' },
  { size: 89, dir: 'src-tauri/icons', filename: 'Square89x89Logo.png' },
  { size: 107, dir: 'src-tauri/icons', filename: 'Square107x107Logo.png' },
  { size: 142, dir: 'src-tauri/icons', filename: 'Square142x142Logo.png' },
  { size: 150, dir: 'src-tauri/icons', filename: 'Square150x150Logo.png' },
  { size: 284, dir: 'src-tauri/icons', filename: 'Square284x284Logo.png' },
  { size: 310, dir: 'src-tauri/icons', filename: 'Square310x310Logo.png' },
  { size: 512, dir: 'src-tauri/icons', filename: 'StoreLogo.png' },
];

const svgFile = path.join(__dirname, '../public/icon-house.svg');

async function generateIcons() {
  if (!fs.existsSync(svgFile)) {
    console.error(`SVG file not found: ${svgFile}`);
    process.exit(1);
  }

  console.log('Generating house icons...');

  for (const { size, dir, filename } of sizes) {
    const outputDir = path.join(__dirname, '..', dir);
    const outputPath = path.join(outputDir, filename);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      await sharp(svgFile)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated: ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${filename}:`, error.message);
    }
  }

  console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
