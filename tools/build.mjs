// Bundles src/ into dist/: the page (app.js), the engine's worker (worker.js) and the ?js fallback (legacy.js).
// GLSL is imported as text. `node tools/build.mjs --watch` rebuilds on change.
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const common = { bundle: true, minify: true, sourcemap: true, target: ['es2020'], logLevel: 'info', loader: { '.glsl': 'text', '.vert': 'text' } };
const builds = [
  { ...common, entryPoints: ['src/main.js'], outfile: 'dist/app.js', format: 'esm' },
  { ...common, entryPoints: ['src/engine/worker.js'], outfile: 'dist/worker.js', format: 'iife' },
  // the engine alone, for tools/bench/engine.html
  { ...common, entryPoints: ['src/bench-entry.js'], outfile: 'dist/bench.js', format: 'esm' },
];

// the original JavaScript engine is a classic script that defines ScanTetrisGame: squeezed, not bundled
function legacy() {
  mkdirSync('dist', { recursive: true });
  const src = readFileSync('src/legacy/scantetris.js', 'utf8');
  const out = esbuild.transformSync(src, { minifyWhitespace: true, minifySyntax: true, target: 'es2020' });
  writeFileSync('dist/legacy.js', out.code + '\nwindow.ScanTetrisGame=ScanTetrisGame;\n');
}

if (watch) {
  for (const b of builds) (await esbuild.context(b)).watch();
  legacy();
} else {
  await Promise.all(builds.map((b) => esbuild.build(b)));
  legacy();
}
