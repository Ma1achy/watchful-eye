// Getting the engine going: the module (compiled once, here, while it downloads, then handed to every worker) and the
// bots' opener book and setup library, all fetched in parallel. The page doesn't wait for any of it; matches it adds
// meanwhile are held by the workers until the module arrives.
import { initPool } from './pool.js';
import { mark } from '../debug/timing.js';

const base = new URL('../', import.meta.url);   // dist/ -> the site root

function text(path) {
  return fetch(new URL(path, base)).then((r) => { if (!r.ok) throw new Error(path + ': ' + r.status); return r.text(); });
}

function compile(path) {
  const url = new URL(path, base);
  if (WebAssembly.compileStreaming) {
    return WebAssembly.compileStreaming(fetch(url)).catch(() =>
      // a server that doesn't send application/wasm: compile from the bytes instead
      fetch(url).then((r) => r.arrayBuffer()).then((b) => WebAssembly.compile(b)));
  }
  return fetch(url).then((r) => r.arrayBuffer()).then((b) => WebAssembly.compile(b));
}

export function bootEngine() {
  const module = compile('engine/four_sea.wasm').then((m) => { mark('engine compiled'); return m; });
  const book = text('data/book.txt');
  const setups = text('data/setups.txt');
  return Promise.all([module, book, setups]).then(([m, b, s]) => {
    mark('engine downloaded');
    initPool(m, b, s);
  });
}
