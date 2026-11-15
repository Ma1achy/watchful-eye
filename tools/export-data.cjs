// Writes the bots' data from the original JavaScript engine (src/legacy/scantetris.js): data/book.txt, the opener book
// (openers and their continuations), and data/setups.txt, the library of verified setup shapes. The WebAssembly bots
// read both at start-up; neither is compiled into the module.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let src = fs.readFileSync(path.join(root, 'src/legacy/scantetris.js'), 'utf8');
src = src.replace('  function openerPlan(b,seq,all){', '  G.__BOOK=function(){ return {BOOK:BOOK,BOOK2:BOOK2,OPENERS:OPENERS}; };\n  function openerPlan(b,seq,all){');
const m = { exports: {} };
new Function('module', 'exports', src)(m, m.exports);
const g = m.exports.ScanTetrisGame({ seed: 1 });

// the opener book
const D = g.__BOOK ? g.__BOOK() : null;
if (!D) { console.error('no book hook in the engine'); process.exit(1); }
const clean = (s) => String(s).replace(/[|\n]/g, ' ');
const book = [];
D.BOOK.forEach((e) => book.push(['O', clean(e.n), e.k, '', e.w || 1.5, 0, e.r.join('/')].join('|')));
D.BOOK2.forEach((e) => book.push(['C', clean(e.n), e.k, clean(e.after || ''), 1, e.sp || 0, e.r.join('/')].join('|')));
D.OPENERS.forEach((t) => {
  const rows = [];
  for (let i = 0; i < 4; i++) rows.push(t.slice(i * 10, i * 10 + 10).replace(/1/g, '*').replace(/0/g, '.'));
  book.push(['O', 'solver', 'T', '', 1.5, 0, rows.join('/')].join('|'));
});
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/book.txt'), '# kind|name|kept piece|after|weight|spin rank|rows top to bottom (letters: piece, *: any piece, X: already built, .: empty)\n' + book.join('\n') + '\n');

// the setup library
const g2 = m.exports.ScanTetrisGame({ seed: 1 });
const LIB = (g2._dbg || g2).LIB ? (g2._dbg || g2).LIB() : null;
if (!LIB) { console.error('no setup library in the engine'); process.exit(1); }
const one = (S, kind) => [kind, S.name || '', S.w, S.h, S.L, S.L2 || 0, S.chain ? 1 : 0, S.wl ? 1 : 0, S.wr ? 1 : 0, S.fill.join(','), S.emp.join(','), S.tr.join(','), S.vfy ? 1 : 0, S.resid ? 1 : 0].join('|');
const setups = LIB.S.map((S) => one(S, 'S')).concat(LIB.C.map((S) => one(S, 'C')));
fs.writeFileSync(path.join(root, 'data/setups.txt'), '# kind|name|w|h|L|L2|chain|wall-left|wall-right|fill masks|empty masks|T rows|verified|residue\n' + setups.join('\n') + '\n');
console.log('book: %d openers, %d continuations, %d solver shapes; setups: %d', D.BOOK.length, D.BOOK2.length, D.OPENERS.length, setups.length);
