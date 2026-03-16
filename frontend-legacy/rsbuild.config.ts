import { defineConfig } from '@rsbuild/core';
import { pluginSass } from '@rsbuild/plugin-sass';
import { join } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  source: {
    entry: {
      index: join(__dirname, 'src/main.ts'),
    },
  },
  output: {
    distPath: {
      root: 'dist/browser',
    },
    cleanDistPath: false,
    sourceMap: {
      js: false,
      css: false,
    },
  },
  html: {
    template: './src/index.html',
    scriptLoading: 'defer',
  },
  performance: {
    profile: false,
    buildCache: true,
    printFileSize: true,
  },
  dev: {
    progressBar: true,
    lazyCompilation: false,
  },
  plugins: [pluginSass()],
  // Copy WinBox asset after build
  hooks: {
    onAfterBuild: () => {
      const winboxSrc = join(__dirname, 'node_modules/winbox/dist/js/winbox.min.js');
      const winboxDest = join(__dirname, 'dist/browser/static/js/winbox.min.js');
      const destDir = join(__dirname, 'dist/browser/static/js');
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      if (existsSync(winboxSrc)) {
        copyFileSync(winboxSrc, winboxDest);
        console.log('Copied winbox.min.js to dist/browser/static/js/');
      }
    },
  },
});
