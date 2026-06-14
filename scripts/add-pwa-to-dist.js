const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  copied: ${entry.name}`);
    }
  }
}

console.log('Copying public/ → dist/');
copyDir(publicDir, distDir);

const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('rel="manifest"')) {
  html = html.replace(
    '<link rel="icon"',
    '<link rel="manifest" href="/manifest.json" />\n<link rel="apple-touch-icon" href="/icons/icon-512.png" />\n<link rel="icon"'
  );
}

if (!html.includes('serviceWorker')) {
  const swScript = `  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  </script>`;
  html = html.replace('</body>', swScript + '\n</body>');
}

fs.writeFileSync(indexPath, html);
console.log('Patched index.html with manifest link and SW registration');
