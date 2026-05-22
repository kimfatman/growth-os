const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ELECTRON_SRC = path.join(ROOT, 'node_modules', 'electron', 'dist');
const RELEASE = path.join(ROOT, 'release');
const APP_DIR = path.join(RELEASE, 'GrowthOS');
const APP_SRC = path.join(APP_DIR, 'app');

function copyDir(src, dest, filter) {
  if (!fs.existsSync(src)) return;
  if (filter && !filter(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      if (!filter || filter(s)) copyDir(s, d, filter);
    } else if (!filter || filter(s)) {
      fs.copyFileSync(s, d);
    }
  }
}

function build() {
  console.log('=== Building Growth OS for Windows ===\n');

  if (fs.existsSync(RELEASE)) fs.rmSync(RELEASE, { recursive: true });

  // 1. Copy Electron runtime (excluding default_app.asar)
  console.log('[1/4] Copying Electron runtime...');
  copyDir(ELECTRON_SRC, APP_DIR, (p) => {
    const rel = path.relative(ELECTRON_SRC, p);
    return !rel.startsWith('resources');
  });
  // Manually copy resources except default_app.asar
  const elRes = path.join(ELECTRON_SRC, 'resources');
  if (fs.existsSync(elRes)) {
    const resDir = path.join(APP_DIR, 'resources');
    fs.mkdirSync(resDir, { recursive: true });
    for (const item of fs.readdirSync(elRes)) {
      if (item === 'default_app.asar') continue;
      const s = path.join(elRes, item);
      const d = path.join(resDir, item);
      if (fs.statSync(s).isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }

  // 2. Create app directory
  console.log('[2/4] Creating application bundle...');
  fs.mkdirSync(APP_SRC, { recursive: true });
  copyDir(DIST, path.join(APP_SRC, 'dist'));
  copyDir(path.join(ROOT, 'electron'), APP_SRC);
  const pkg = { name: 'growth-os', version: '1.0.0', main: 'main.cjs' };
  fs.writeFileSync(path.join(APP_SRC, 'package.json'), JSON.stringify(pkg, null, 2));

  // 3. Create launchers
  console.log('[3/4] Creating launchers...');

  // method 1: batch file (primary launcher)
  const batContent = `@echo off
cd /d "%~dp0app"
start "" "%~dp0electron.exe" .
exit`;
  fs.writeFileSync(path.join(APP_DIR, '启动GrowthOS.bat'), batContent);

  // method 3: PowerShell script
  const psContent = `$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "$PSScriptRoot\\electron.exe"
$psi.Arguments = "$PSScriptRoot\\app"
$psi.UseShellExecute = $true
[System.Diagnostics.Process]::Start($psi) | Out-Null`;
  fs.writeFileSync(path.join(APP_DIR, '启动GrowthOS.ps1'), psContent);

  // 4. Verify
  console.log('[4/4] Verification:');
  const checks = [
    ['electron.exe', path.join(APP_DIR, 'electron.exe')],
    ['app/main.cjs', path.join(APP_SRC, 'main.cjs')],
    ['app/dist/index.html', path.join(APP_SRC, 'dist', 'index.html')],
    ['启动GrowthOS.bat', path.join(APP_DIR, '启动GrowthOS.bat')],
  ];
  let ok = true;
  for (const [name, p] of checks) {
    const exists = fs.existsSync(p);
    console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    if (!exists) ok = false;
  }

  const size = (getDirSize(APP_DIR) / 1024 / 1024).toFixed(0);
  console.log(`\n   Total: ${size} MB`);
  console.log(ok ? '\n✅ Build complete!' : '\n❌ Issues found!');
}

function getDirSize(dir) {
  let s = 0;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, item.name);
    if (item.isFile()) s += fs.statSync(f).size;
    else if (item.isDirectory()) s += getDirSize(f);
  }
  return s;
}

build();
