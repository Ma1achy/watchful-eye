// What the sea reads a game through. With the WebAssembly engine a game is a snapshot from a worker, so this is a
// stand-in for the old JavaScript game object: the state the sea draws (filled in from snapshots), and every other
// call it might make (setStyle, setDig, ...) a no-op.

// Four's piece codes (Z1 L2 O3 S4 I5 J6 T7, garbage 8/9) to the sea's (its NAMES 'IOTSZJL' + 1, garbage 8)
export const COL = [0, 5, 7, 2, 4, 1, 6, 3, 8, 8];
export const NAME = [null, 'Z', 'L', 'O', 'S', 'I', 'J', 'T'];

export function createGameView(ROT, NAMES) {
  const W = 10, H = 40;
  const st = {
    b: new Uint8Array(W * H), pid: new Uint16Array(W * H), cur: null, pos: null, hold: null, held: false, queue: [],
    incoming: [], b2bN: 0, combo: 0, pieces: 0, lines: 0, level: 1, score: 0, over: false, spin: null, callout: null, attack: 0,
  };
  const base = {
    st, W, H, VIS: 20, ROT, NAMES, gy: 0, coolOf,
    ghostY() { return this.gy; },
    reset() { st.b.fill(0); st.pid.fill(0); st.over = false; st.cur = null; st.pieces = 0; st.lines = 0; st.incoming = []; },
  };
  const noop = function () {};
  return new Proxy(base, {
    get(o, k) {
      return k in o ? o[k] : (typeof k === 'string' && /^(set|get|do|plan|quick|spike|cool|setup|ff|act|lock|spawn|clear)/.test(k) ? noop : undefined);
    },
  });
}

// How much of a show an opener or setup is: 0 plain, 1 ordinary, 2 the cannons, towers and named spin lines. The
// camera weighs book lines by it. (Without it here, every game read through this view scored NaN while it played a
// book line, and the camera never chose one.)
export function coolOf(n) {
  n = (n || '').replace(/ \(mirror\)/g, '');
  if (/^SingleYou|^solver|^Unnamed|開幕TSD|^LAST|^Sus Opener/.test(n)) return 0;
  if (/Cannon|DT|Hachispin|Stickspin|Fairy|TST|Tsar|Gamushiro|C-Spin|Speedboat|MKO|Imperial|STSD|山岳|Mountain|Albatross|Pelican|Kaidan|Trinity|Cyclone|Dragon|Toro|PC-Spin|Castella/i.test(n)) return 2;
  return 1;
}

// where a piece sits in the sea's own shape tables, from the four cells Four reports
export function posOf(ROT, name, r, cells) {
  const s = ROT[name][r];
  let mx = 99, my = 99, cx = 99, cy = 99;
  s.forEach((q) => { mx = Math.min(mx, q[0]); my = Math.min(my, q[1]); });
  for (let j = 0; j < 4; j++) { cx = Math.min(cx, cells[2 * j]); cy = Math.min(cy, cells[2 * j + 1]); }
  return { r, x: cx - mx, y: cy - my };
}
