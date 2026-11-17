// Builds data/book.txt. Inputs (not kept in this repository): the Mosaic opener database's trie.json and popular.json,
// beside this script's working copy. Usage: node tools/build-book.cjs [most pieces a stage may reach]
// The opener book rebuilt from the Mosaic opener database (trie.json): for each opener the first-bag diagrams its
// primary sources draw, and every later stage down each line that ends in a T-spin of two lines or more or a
// perfect clear. Lines that lead nowhere are left out. Writes book lines (and the sources' links, by name).
const fs=require('fs'); const T=JSON.parse(fs.readFileSync(__dirname+'/trie.json')); const pop=JSON.parse(fs.readFileSync(__dirname+'/popular.json'));
const N=T.nodes, R=T.records; const MAXPC=+process.argv[2]||21;
const byI=new Map(); N.forEach(n=>byI.set(n.i,n));
const lines=c=>/T-spin triple/i.test(c)?3:/T-spin double/i.test(c)?2:/T-spin single/i.test(c)?1:0;
const pays=c=>/T-spin (double|triple)/i.test(c)||/PC/.test(c);
const member=(n,ri)=>n.members&&n.members.find(m=>m[0]===ri);
const popW={}; pop.forEach(p=>popW[p.id]=p.share['x+']);
const score=r=>(r.coverPct||0)/100*((r.estAttack&&r.estAttack.total)||0);
// (nothing is carried over from an earlier book: every line comes from the database)
const hand=new Set(); const keepOld=[];
function cellsOf(n){ const out=[]; (n.plc||[]).forEach(s=>{ const k=s[0]; s.slice(1).split(';').forEach(q=>{ const [x,y]=q.split(',').map(Number); out.push([k,x,y]); }); }); return out; }
// the diagram of a node: its parent's field as already built (X), the node's own pieces by letter. A T that spins
// (the node's clear is a T-spin) is not drawn: the bot's own slot play takes it.
function grid(n,par){ const base=par?par.rows:[]; let h=base.length; const cs=cellsOf(n); cs.forEach(c=>{ if(c[2]+1>h) h=c[2]+1; });
  const g=[]; for(let y=0;y<h;y++) g.push('..........'.split(''));
  base.forEach((row,i)=>{ const y=base.length-1-i; for(let x=0;x<10;x++) if(row[x]!=='_') g[y][x]='X'; });
  const spin=/T-spin/i.test(n.est&&n.est.clear||''); let other=0, hasT=false, bad=false;
  cs.forEach(([k,x,y])=>{ if(k==='T'&&spin) return; if(g[y][x]!=='.') bad=true; if(k==='T') hasT=true; other++; g[y][x]=k; });
  const rows=g.map(r=>r.join('')).reverse(); while(rows.length&&rows[0]==='..........') rows.shift(); return {rows,other,hasT,bad}; }
const mir=r=>r.split('').reverse().map(c=>({J:'L',L:'J',S:'Z',Z:'S'})[c]||c).join('');
const out=[], links={}, names=new Set(hand), seenFirst=new Set(); const stat={records:0,roots:0,dead:0,stages:0,primary:0,secondary:0};
R.forEach((r,ri)=>{
  const roots=N.filter(n=>n.p===0&&!n.grey&&n.pc<=8&&member(n,ri)); if(!roots.length) return;
  const prim=roots.filter(n=>member(n,ri)[1]===0); const use=(prim.length?prim:roots).sort((a,b)=>a.i-b.i); if(prim.length) stat.primary++; else stat.secondary++;
  // does anything under this node (within the opener) pay?
  const memo=new Map(); const leads=n=>{ if(memo.has(n.i)) return memo.get(n.i); let v=pays(n.est&&n.est.clear||''); for(const k of n.kids||[]){ const c=byI.get(k); if(c&&member(c,ri)&&c.pc<=MAXPC&&leads(c)) v=true; } memo.set(n.i,v); return v; };
  let base=(r.en||r.id).split(' / ')[0].replace(/, not confirmed.*$/,'').replace(/[|]/g,'/').trim().slice(0,40); if(names.has(base)) base=base+' ['+r.id+']'; names.add(base);
  const w=popW[r.id]? Math.max(.5,popW[r.id]) : .02+.05*Math.min(1,score(r)/20);
  let firsts=0, any=false;
  for(const root of use){ if(!leads(root)){ stat.dead++; continue; }
    const G=grid(root,null); if(G.bad||!G.other||G.rows.join('').replace(/[.X]/g,'').length%4) continue;
    const key=G.rows.join('/'); if(seenFirst.has(key)) continue; seenFirst.add(key);
    const name=base+(firsts++?' '+firsts:''); any=true; stat.roots++;
    const rootE={kind:'O',n:name,k:G.hasT?'X':'T',after:'',w,sp:0,r:G.rows}; out.push(rootE);
    // the stages under it
    const walk=(n,ownerE,ownerName)=>{ let idx=0; for(const kid of n.kids||[]){ const c=byI.get(kid); if(!c||!member(c,ri)||c.pc>MAXPC) continue;
        const cl=c.est&&c.est.clear||''; const Gc=grid(c,n);
        if(!Gc.other){ // the spin itself: what the stage above was for
          ownerE.sp=Math.max(ownerE.sp,lines(cl)); if(lines(cl)) ownerE.k='T'; walk(c,ownerE,ownerName); continue; }
        if(!leads(c)||Gc.bad||Gc.rows.join('').replace(/[.X]/g,'').length%4) continue;
        const e={kind:'C',n:ownerName+' · '+(++idx),k:Gc.hasT?'X':'T',after:ownerName,w:1,sp:lines(cl),r:Gc.rows}; out.push(e); stat.stages++; walk(c,e,e.n); } };
    walk(root,rootE,name); }
  if(any){ stat.records++; links[base]=(r.links||[]).map(l=>({label:l.label,url:l.url})); }
});
const text=[]; const emit=f=>text.push(f.join('|'));
keepOld.forEach(emit);
out.forEach(e=>{ emit([e.kind,e.n,e.k,e.after,e.kind==='O'?+e.w.toFixed(4):1,e.sp,e.r.join('/')]);
  const m=e.r.map(mir); if(m.join('/')!==e.r.join('/')) emit([e.kind,e.n+' (mirror)',e.k,e.after?e.after+' (mirror)':'',e.kind==='O'?+e.w.toFixed(4):1,e.sp,m.join('/')]); });
fs.writeFileSync(process.argv[3]||__dirname+'/../book.new.txt','# kind|name|kept piece|after|weight|spin rank|rows top to bottom (letters: piece, *: any piece, X: already built, .: empty)\n'+text.join('\n')+'\n');
fs.writeFileSync((process.argv[3]||__dirname+'/../book.new.txt').replace(/\.txt$/,'')+'.links.json',JSON.stringify(links));
console.log(JSON.stringify(stat),'kept hand-written lines',keepOld.length,'lines in all',text.length);
