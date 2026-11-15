// What the address asks for (see main.js).
export function readOptions(search) {
  const q = new URLSearchParams(search);
  const flag = (k) => q.has(k) && q.get(k) !== '0' && q.get(k) !== 'false';
  return {
    seed: +q.get('seed') || Math.floor(Math.random() * 1e6),
    still: flag('still'),
    js: flag('js'),
    timing: flag('timing'),
  };
}
