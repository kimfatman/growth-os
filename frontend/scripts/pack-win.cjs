const packager = require('electron-packager');
const fs = require('fs');
const path = require('path');

async function build() {
  console.log('Packaging Growth OS for Windows...');

  const distPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!fs.existsSync(distPath)) {
    console.error('ERROR: dist/index.html not found! Run "npm run build" first.');
    process.exit(1);
  }

  const appPaths = await packager({
    dir: '.',
    name: 'GrowthOS',
    platform: 'win32',
    arch: 'x64',
    electronVersion: '41.3.0',
    out: 'release',
    overwrite: true,
    asar: true,
    prune: true,
    appVersion: '1.0.0',
    executableName: 'GrowthOS',
    win32metadata: {
      ProductName: 'Growth OS',
      CompanyName: 'Growth OS Team',
      FileDescription: 'Growth OS - AI Sales System',
    },
    defaultIgnore: false,
    ignore: [
      /\.gitignore/,
      /\.git/,
      /\.env/,
      /src/,
      /scripts/,
      /vite\.config\.js/,
      /node_modules\/\.bin/,
      /\.map$/,
      /README\.md/,
    ],
  });

  console.log('App packaged successfully!');
  console.log('Output:', appPaths.join('\n'));

  // Verify dist/ was included in asar
  const asarPath = path.join(appPaths[0], 'resources', 'app.asar');
  if (fs.existsSync(asarPath)) {
    const { execSync } = require('child_process');
    const list = execSync(`npx asar list "${asarPath}" 2>&1`, { encoding: 'utf8' });
    if (list.includes('dist/index.html')) {
      console.log('✅ dist/index.html verified in asar!');
    } else {
      console.error('❌ dist/ NOT found in asar. Listing contents:');
      execSync(`npx asar list "${asarPath}" 2>&1`, { encoding: 'utf8', stdio: 'inherit' });
    }
  }
}

build().catch(err => {
  console.error('Packaging failed:', err.message);
  process.exit(1);
});
