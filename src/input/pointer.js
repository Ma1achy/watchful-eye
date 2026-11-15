// The pointer over the sea, in the canvas's own 0..1 (y up): the sea's light leans toward it. Heard on the window in the
// capture phase, so ?still (which keeps drags and wheels from the camera) still lets the light follow.
export function trackPointer(cv) {
  const P = { x: .5, y: .5, in: false, down: false, pressed: false };
  function set(e) {
    const r = cv.getBoundingClientRect();
    P.x = (e.clientX - r.left) / r.width; P.y = 1 - (e.clientY - r.top) / r.height;
    P.in = P.x >= 0 && P.x <= 1 && P.y >= 0 && P.y <= 1;
  }
  addEventListener('pointermove', set, true);
  addEventListener('pointerdown', (e) => { set(e); P.down = true; P.pressed = true; }, true);
  addEventListener('pointerup', () => { P.down = false; }, true);
  document.documentElement.addEventListener('pointerleave', () => { P.in = false; P.down = false; });
  addEventListener('blur', () => { P.in = false; });
  return P;
}
