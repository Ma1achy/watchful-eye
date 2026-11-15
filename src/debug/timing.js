// Start-up timings: each stage of the first load, in milliseconds from navigation. Always kept (window.__timing) and
// logged to the console; with ?timing they're also shown in a corner of the page.
const t = [];
let box = null;

export function mark(what) {
  const ms = Math.round(performance.now());
  t.push([what, ms]);
  if (typeof console !== 'undefined') console.info('[watchful-eye] ' + what + ': ' + ms + ' ms');
  if (box) box.textContent = t.map((e) => e[1].toString().padStart(6) + '  ' + e[0]).join('\n');
}

export function showTimings() {
  box = document.createElement('pre');
  box.className = 'timings';
  document.body.appendChild(box);
  mark('timings shown');
}

if (typeof window !== 'undefined') window.__timing = t;
