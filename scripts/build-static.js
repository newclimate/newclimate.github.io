#!/usr/bin/env node
/**
 * Static export build script.
 *
 * The dashboard is a fully client-side app. Its server-side API routes
 * (src/app/api/*) are only needed when running under the Express/Next.js
 * server. For static hosting (GitHub Pages / Netlify) we temporarily move the
 * API routes aside so `next build` can produce a pure static `out/` export,
 * then restore them afterwards.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'src', 'app', 'api');
const apiBackup = path.join(root, '.api-backup');
const outDir = path.join(root, 'out');

const isGhPages = process.argv.includes('--gh-pages');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', env });
}

let env;

function main() {
  env = { ...process.env, STATIC_EXPORT: 'true' };
  if (isGhPages) {
    env.GITHUB_PAGES = 'true';
    env.BASE_PATH = process.env.BASE_PATH || path.basename(root);
  }

  // 1. Move API routes out of the way so the static export can compile.
  let moved = false;
  if (fs.existsSync(apiDir)) {
    console.log('Moving server API routes aside for static export...');
    fs.renameSync(apiDir, apiBackup);
    moved = true;
  }

  try {
    // 2. Run the static export.
    run('npx next build');
    console.log('\n✓ Static export written to ./out');

    // 3. Make the standalone dashboard (index.html, client.js, style.css,
    //    data.json) the root of the export, so visiting "/" serves the app
    //    directly instead of a redirect wrapper.
    const copy = (src, dest) => {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    };
    copy(path.join(root, 'index.html'), path.join(outDir, 'index.html'));
    copy(path.join(root, 'client.js'), path.join(outDir, 'client.js'));
    copy(path.join(root, 'style.css'), path.join(outDir, 'style.css'));
    copy(path.join(root, 'data.json'), path.join(outDir, 'data.json'));

    // PWA assets: manifest, service worker and app icons.
    copy(path.join(root, 'public', 'manifest.json'), path.join(outDir, 'manifest.json'));
    copy(path.join(root, 'public', 'sw.js'), path.join(outDir, 'sw.js'));
    const iconsDir = path.join(root, 'public', 'icons');
    const outIconsDir = path.join(outDir, 'icons');
    if (fs.existsSync(iconsDir)) {
      fs.mkdirSync(outIconsDir, { recursive: true });
      for (const f of fs.readdirSync(iconsDir)) {
        copy(path.join(iconsDir, f), path.join(outIconsDir, f));
      }
    }
    console.log('✓ Copied standalone dashboard + PWA assets into ./out (root now serves the app).');
  } finally {
    // 4. Restore the API routes.
    if (moved && fs.existsSync(apiBackup)) {
      fs.renameSync(apiBackup, apiDir);
      console.log('Restored server API routes.');
    }
  }
}

main();
