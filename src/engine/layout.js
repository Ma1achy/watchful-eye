// The layout of a match snapshot (Int32 words) and of a lock event, as the WebAssembly module writes them.
// LEN and PF are confirmed by the module itself when a worker starts (sea_snapshot_len), so the two sides can't drift.
export const L = { HEADER: 8, CELLS: 43, ROWS: 24 };
L.PIDS = L.CELLS + L.ROWS * 10;
L.EVC = L.PIDS + L.ROWS * 10;
L.EVF = L.EVC + 8;
L.BOOK = L.EVF + 1;
L.BUILD = L.EVF + 3;
L.PF = L.EVF + 5;
L.LEN = L.HEADER + 2 * L.PF;
L.EVLEN = 18 + 2 * L.ROWS * 10;

/** Called with the module's own snapshot length. */
export function confirmLayout(len) {
  if (len) {
    L.LEN = len;
    L.PF = (len - L.HEADER) / 2;
  }
}
