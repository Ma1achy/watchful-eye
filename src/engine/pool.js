// The page's side of the engine: a pool of workers, one per spare core, each owning some of the matches. The page draws
// from the latest snapshot each match sent; it never waits on a worker.
//
// Start-up is overlapped: the workers are made at once (so the page knows how many there are when it lays out the sea),
// matches are posted to them as soon as the page has drawn its players, and the module, compiled once on the main
// thread, follows as soon as it has downloaded. A worker holds what arrives before the module and plays it then.
import { L, confirmLayout } from './layout.js';
import { createGameView, posOf, COL, NAME } from './game-view.js';
import { mark } from '../debug/timing.js';

export const SEAW = {
  on: false, nw: 0, snap: {}, ev: {}, L: L, workers: [], owner: {}, ready: false, seen: {},
  book: '', setups: '', added: 0, firstSnap: 0, load: 0, offFull: true,
  COL: COL, NAME: NAME, game: createGameView, posOf: posOf,
};

/** Make the workers (they wait for `init`). Returns false where workers or WebAssembly aren't available. */
export function startPool(opts) {
  if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const n = Math.max(1, Math.min(16, cores - 1));
  SEAW.manualMode = !!(opts && opts.manual);
  let left = n;
  for (let w = 0; w < n; w++) {
    const wk = new Worker(new URL('./worker.js', import.meta.url));
    wk.onmessage = (m) => {
      const d = m.data;
      if (d.ready) {
        confirmLayout(d.len);
        if (--left === 0) { SEAW.ready = true; mark('workers ready'); }
        return;
      }
      if (d.snaps) {
        SEAW.load = d.load; SEAW.offFull = d.full;
        for (const x of d.snaps) {
          if (x.s) {
            if (!SEAW.firstSnap) { SEAW.firstSnap = performance.now(); mark('first match ready'); }
            SEAW.snap[x.id] = x.s;
          }
          if (x.ev) {
            const q = SEAW.ev[x.id] || (SEAW.ev[x.id] = []);
            for (let j = 0; j + L.EVLEN <= x.ev.length; j += L.EVLEN) q.push(x.ev.subarray(j, j + L.EVLEN));
            if (q.length > 48) q.splice(0, q.length - 48);
          }
        }
        if (d.done && SEAW._wait && --SEAW._wait.n === 0) { const r = SEAW._wait.res; SEAW._wait = null; r(); }
      }
    };
    SEAW.workers.push(wk);
  }
  SEAW.on = true; SEAW.nw = n;
  // which matches are on screen: those big enough to see send every frame, those a few pixels across fifteen a second
  setInterval(() => {
    const now = performance.now(), hi = SEAW.workers.map(() => []), lo = SEAW.workers.map(() => []);
    for (const id in SEAW.seen) {
      const v = SEAW.seen[id];
      if (now - v.t < 1000 && SEAW.owner[id] != null) (v.hi ? hi : lo)[SEAW.owner[id]].push(+id);
    }
    hi.forEach((l, w) => SEAW.workers[w].postMessage({ want: l, lo: lo[w] }));
  }, 100);
  return true;
}

/** Hand the workers the compiled module and the bots' book and setup library. */
export function initPool(module, book, setups) {
  SEAW.book = book; SEAW.setups = setups;
  for (const wk of SEAW.workers) wk.postMessage({ init: true, module, manual: SEAW.manualMode, book, setups });
}

function post(w, m) { SEAW.workers[w].postMessage(m); }

// a match for pair `id`: skills 0..1; `head` frames played before it's first seen (so the sea starts mid-game)
SEAW.add = function (id, a, b, seed, head) {
  if (SEAW.owner[id] != null) return SEAW.replace(id, a, b, seed, head);
  const w = id % SEAW.nw; SEAW.owner[id] = w; SEAW.added++;
  post(w, { add: true, id, a, b, seed, head: head | 0 });
};
SEAW.replace = function (id, a, b, seed, head) {
  delete SEAW.snap[id]; SEAW.ev[id] = [];
  post(SEAW.owner[id], { replace: true, id, a, b, seed, head: head | 0 });
};
// the player the page drew (character, pace, this round's main and well), for the bot to play as
SEAW.persona = function (id, p, v) { if (SEAW.owner[id] != null) post(SEAW.owner[id], { persona: true, id, p, v }); };
SEAW.pause = function (id, on) { post(SEAW.owner[id], { pause: true, id, on: !!on }); };

// the recorder's clock: run every match on by `frames` and wait for the workers to answer, so each video frame shows
// exactly the sea at that moment however long the frame takes to draw
SEAW.bankF = 0; SEAW._chain = Promise.resolve();
SEAW.advance = function (frames) {
  SEAW.bankF += frames;
  if (!SEAW.ready || !SEAW.manualMode) return Promise.resolve();
  if (SEAW._wait) return SEAW._chain;   // one step at a time: what's asked meanwhile waits in the bank and goes with the next
  const n = Math.floor(SEAW.bankF); SEAW.bankF -= n;
  SEAW._chain = new Promise((res) => { SEAW._wait = { n: SEAW.workers.length, res }; SEAW.workers.forEach((w) => w.postMessage({ tick: n })); });
  return SEAW._chain;
};

// the book's names, in the module's own entry order: which line a bot is playing, for the camera
SEAW.bookNames = function () {
  if (SEAW._bn) return SEAW._bn;
  const out = [];
  SEAW.book.split('\n').forEach((l) => {
    if (!l || l.charAt(0) === '#') return;
    const f = l.split('|'); if (f.length < 7) return;
    const n = f[6].split('/').filter((r) => r.length === 10).length; if (n < 1 || n > 12) return;
    out.push(f[1]);
  });
  return (SEAW._bn = out);
};
SEAW.setupNames = function () {
  if (SEAW._sn) return SEAW._sn;
  const out = [];
  SEAW.setups.split('\n').forEach((l) => {
    if (!l || l.charAt(0) === '#') return;
    const f = l.split('|'); if (f.length < 14) return;
    out.push(f[1] || (+f[4] >= 3 ? 'TST' : 'TSD'));
  });
  return (SEAW._sn = out);
};

// The sea can be shown once the matches have played their way to mid-game and sent a first state. Not every last one:
// the stragglers are a few pixels across in the opening shot and come in as they arrive. Or after a few seconds, come
// what may.
SEAW.isLoaded = function () {
  if (SEAW.loaded) return true;
  if (!SEAW.t0) SEAW.t0 = performance.now();
  const have = Object.keys(SEAW.snap).length, el = performance.now() - SEAW.t0;
  if ((SEAW.added && have >= SEAW.added * READY_SHARE) || el > 8000) { SEAW.loaded = true; mark('sea shown'); }
  return SEAW.loaded;
};
// the share of matches that must be ready: the last few are those with the longest head starts (the ones run on to
// their last moments), and they're specks in the opening shot
export const READY_SHARE = .85;

if (typeof window !== 'undefined') window.SEAW = SEAW;   // for the console and the tests
