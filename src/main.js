// Watchful Eye: the sea and nothing else, filling whatever holds it (a window, an iframe of any shape).
//
// Address options: ?seed=123 picks the sea; ?still turns off dragging and scrolling (for embeds that shouldn't take the
// page's scroll); ?js runs the original JavaScript bots instead of Four's engine; ?timing shows the start-up timings.
import { MiniGL, fit } from './gl/minigl.js';
import { ScanTetrisSea } from './world/sea.js';
import { SeaCamera } from './camera/camera.js';
import { SEAW, startPool } from './engine/pool.js';
import { bootEngine } from './engine/boot.js';
import { trackPointer } from './input/pointer.js';
import { reveal } from './reveal.js';
import { mark, showTimings } from './debug/timing.js';
import { readOptions } from './options.js';

const opts = readOptions(location.search);
mark('script running');
if (opts.timing) showTimings();

// The engine first, so the workers are busy before anything else is set up: they get their matches as soon as the sea
// has drawn its players (below) and their module when it has downloaded.
const wasm = !opts.js && startPool({ manual: !!window.SEAW_MANUAL });
// The first draw compiles the sea's shader, which can hold the page for a moment where the browser can't do it in the
// background; the engine's hand-off to the workers goes first (or after a second and a half, come what may).
let engineOff = !wasm;
if (wasm) {
  bootEngine().catch((e) => console.error('[watchful-eye] engine', e)).finally(() => { engineOff = true; });
  setTimeout(() => { engineOff = true; }, 1500);
}

const stage = document.getElementById('stage'), cv = document.getElementById('cv');
fit(cv, 1.5);
const G = MiniGL(cv);
if (!G) document.getElementById('nogl').style.display = 'flex';
else if (wasm) start(null);
else loadLegacy().then(start);

function loadLegacy() {
  // the original JavaScript engine and bots: only for ?js, or where there are no workers or WebAssembly
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = new URL('legacy.js', import.meta.url).href;
    s.onload = () => res(window.ScanTetrisGame); s.onerror = rej;
    document.head.appendChild(s);
  });
}

function start(legacy) {
  const gl = G.gl;
  let seaProg = null;
  const ad = {
    gl,
    prog(body) { return (seaProg = G.prog(body)); },
    use(p) { gl.useProgram(p); },
    arr(p, n, d, k) { const l = G.loc(p, n); if (l) gl['uniform' + k + 'fv'](l, d); },
    run(p, u) { G.pass(p, u); },
  };
  const T = ScanTetrisSea(ad, { seed: opts.seed, legacy });
  mark('sea laid out');
  const C = SeaCamera(stage, cv, {
    cinema: true, sea: T, anchor: [.5, .5], fill: .9, visW: .97, pairMax: .98, gapK: .55,
    onFocus(b) { T.focus(b.tx, b.ty, b.side); },
  });
  window.__C = C;
  if (opts.still) {
    stage.classList.add('still');
    ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'touchstart', 'touchmove'].forEach((ev) =>
      stage.addEventListener(ev, (e) => e.stopPropagation(), true));
  }
  const P = trackPointer(cv);
  if (!wasm) reveal.hidden = false;

  let t0 = performance.now(), hidden = document.hidden, drawn = false;
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; });
  function loop(now) {
    requestAnimationFrame(loop);
    if (hidden) return;
    fit(cv, 1.5);
    if (!engineOff || !G.ready(seaProg)) { t0 = now; return; }   // the engine's still being handed over, or the shader compiling
    if (!drawn) { drawn = true; mark('first frame'); }
    if (SEAW.on) {
      const ld = SEAW.isLoaded();
      if (ld && reveal.hidden) reveal.at = performance.now();
      reveal.hidden = !ld;
      if (!ld) t0 = now;
    }
    const t = (now - t0) / 1000, cam = C.frame(t);
    T.frame(t, P, cam, C.def(), 6);
    P.pressed = false;
  }
  requestAnimationFrame(loop);
}
