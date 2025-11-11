const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateWindowsIcons() {
  const svgFile = path.join(__dirname, '../public/icon-house.svg');
  const tauriIconsDir = path.join(__dirname, '../src-tauri/icons');

  if (!fs.existsSync(svgFile)) {
    console.error(`SVG file not found: ${svgFile}`);
    process.exit(1);
  }

  console.log('Generating additional Windows icons...');

  try {
    // Generate icon.png (large version for Windows)
    await sharp(svgFile)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(tauriIconsDir, 'icon.png'));
    console.log('✓ Generated: icon.png (512x512)');

    // Generate StoreLogo.png
    await sharp(svgFile)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(tauriIconsDir, 'StoreLogo.png'));
    console.log('✓ Generated: StoreLogo.png (512x512)');

    console.log('✓ Additional Windows icons generated successfully!');
  } catch (error) {
    console.error('Error generating Windows icons:', error.message);
    process.exit(1);
  }
}

generateWindowsIcons();
