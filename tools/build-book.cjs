// Builds data/book.txt (then checked line by line on the engine: Four's four-sea example book_check, which writes it
// again without the lines that fail). Inputs (not kept in this repository): the Mosaic opener database's trie.json and
// popular.json beside this script's working copy. Usage: node tools/build-book.cjs [most pieces a stage may reach] [out.txt]
//
// The database is one tree of positions: a first bag is a root, and every later bag hangs from the position it is
// built on, whichever named openers pass through it. The book keeps that tree whole. A first bag shared by several
// openers (SingleYou and Stickspin begin the same way) is one line with every continuation of all of them under it;
// a later bag is never a line on its own. Lines that end in neither a T-spin of two lines or more nor a perfect
// clear are left out.
const fs=require('fs'); const T=JSON.parse(fs.readFileSync(__dirname+'/trie.json')); const pop=JSON.parse(fs.readFileSync(__dirname+'/popular.json'));
const N=T.nodes, R=T.records; const MAXPC=+process.argv[2]||21; const OUT=process.argv[3]||__dirname+'/../book.new.txt';
const byI=new Map(); N.forEach(n=>byI.set(n.i,n));
const lines=c=>/T-spin triple/i.test(c)?3:/T-spin double/i.test(c)?2:/T-spin single/i.test(c)?1:0;
const pays=c=>/T-spin (double|triple)/i.test(c)||/PC/.test(c);
const popW={}; pop.forEach(p=>popW[p.id]=p.share['x+']);
const score=r=>(r.coverPct||0)/100*((r.estAttack&&r.estAttack.total)||0);
const label=r=>(r.en||r.id).split(' / ')[0].replace(/, not confirmed.*$/,'').replace(/[|]/g,'/').trim().slice(0,40);
const generic=r=>/^(Unnamed|Partial) bag/i.test(r.en||r.id);
function cellsOf(n){ const out=[]; (n.plc||[]).forEach(s=>{ const k=s[0]; s.slice(1).split(';').forEach(q=>{ const [x,y]=q.split(',').map(Number); out.push([k,x,y]); }); }); return out; }
// the diagram of a node: its parent's field as already built (X), the node's own pieces by letter. A T that spins
// (the node's clear is a T-spin) is not drawn: the bot's own slot play takes it.
function grid(n,par){ const base=par?par.rows:[]; let h=base.length; const cs=cellsOf(n); cs.forEach(c=>{ if(c[2]+1>h) h=c[2]+1; });
  const g=[]; for(let y=0;y<h;y++) g.push('..........'.split(''));
  base.forEach((row,i)=>{ const y=base.length-1-i; for(let x=0;x<10;x++) if(row[x]!=='_') g[y][x]='X'; });
  // the rows the node's pieces complete, the T's among them: the database names the clear on most nodes; on the rest
  // a T that completes rows is a spin when its corners say so, and a plain piece (drawn, like any other) when not
  const all=g.map(r=>r.slice()); cs.forEach(([k,x,y])=>{ all[y][x]=k; });
  const full=all.map(r=>r.every(c=>c!=='.')); const tRows=new Set(cs.filter(c=>c[0]==='T').map(c=>c[2]));
  // (a spin by the corners: three of the four cells diagonal to the T's middle filled, walls and floor counting)
  const tc=cs.filter(c=>c[0]==='T'); const mid=tc.find(c=>tc.filter(d=>Math.abs(d[1]-c[1])+Math.abs(d[2]-c[2])===1).length===3);
  const filled=(x,y)=>x<0||x>9||y<0||(y<all.length&&all[y][x]!=='.');
  const corners=mid?[[-1,-1],[1,-1],[-1,1],[1,1]].filter(([dx,dy])=>filled(mid[1]+dx,mid[2]+dy)).length:0;
  const tClears=tc.length===4&&corners>=3?[...tRows].filter(y=>full[y]).length:0; const said=n.est&&n.est.clear||'';
  // (only a double or a triple is left to the bot's slot play, undrawn; a T that takes one line or none, spun or
  // mini or plain, is a piece of the diagram like the rest)
  let spinLines=/mini/i.test(said)?0:lines(said)||(!said&&tClears?Math.min(3,tClears):0); if(spinLines<2) spinLines=0;
  const spin=spinLines>=2; let other=0, hasT=false, bad=false;
  // (two of a kind lying against each other: the second is written small, so the two are told apart)
  const pcs=[]; (n.plc||[]).forEach(p=>{ const k=p[0]; pcs.push({k,cells:p.slice(1).split(';').map(q=>q.split(',').map(Number))}); });
  const drawn=[];
  pcs.forEach(pc=>{ if(pc.k==='T'&&spin) return; const touch=drawn.filter(d=>d.k===pc.k&&d.cells.some(a=>pc.cells.some(b=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1)));
    pc.ch=touch.some(d=>d.ch===pc.k)&&!touch.some(d=>d.ch!==pc.k)?pc.k.toLowerCase():pc.k; drawn.push(pc);
    pc.cells.forEach(([x,y])=>{ if(g[y][x]!=='.') bad=true; g[y][x]=pc.ch; }); if(pc.k==='T') hasT=true; other++; });
  const rows=g.map(r=>r.join('')).reverse(); while(rows.length&&rows[0]==='..........') rows.shift(); return {rows,other,hasT,bad,spinLines,pays:spinLines>=2}; }
const mir=r=>r.split('').reverse().map(c=>({J:'L',L:'J',S:'Z',Z:'S',j:'l',l:'j',s:'z',z:'s'})[c]||c).join('');
const memo=new Map(); const leads=n=>{ if(memo.has(n.i)) return memo.get(n.i); let v=pays(n.est&&n.est.clear||'')||grid(n,byI.get(n.p)||null).pays; for(const k of n.kids||[]){ const c=byI.get(k); if(c&&c.pc<=MAXPC&&leads(c)) v=true; } memo.set(n.i,v); return v; };
const out=[], links={}, labels={}, used={}, stat={firstBags:0,shared:0,dead:0,stages:0,merged:0};
const roots=N.filter(n=>n.p===0&&!n.grey&&n.pc<=8&&n.members&&n.members.length).sort((a,b)=>a.i-b.i);
// one line for one diagram: the database holds the same position more than once (reached by another order of
// pieces, or entered from another source), and what hangs from each copy hangs from the one line here
const rootBy=new Map();
const walk=(n,ownerE)=>{ for(const kid of n.kids||[]){ const c=byI.get(kid); if(!c||c.pc>MAXPC) continue;
    const cl=c.est&&c.est.clear||''; const Gc=grid(c,n);
    if(!Gc.other){ ownerE.sp=Math.max(ownerE.sp,Gc.spinLines); if(Gc.spinLines) ownerE.k='T'; walk(c,ownerE); continue; }
    if(!leads(c)||Gc.bad||Gc.rows.join('').replace(/[.X]/g,'').length%4) continue;
    const key=Gc.rows.join('/').toUpperCase(); let e=ownerE.kids.get(key);
    if(!e){ e={kind:'C',n:ownerE.n+' · '+(++ownerE.idx),k:Gc.hasT?'X':'T',after:ownerE.n,w:1,sp:Gc.spinLines,r:Gc.rows,kids:new Map(),idx:0,who:new Set()}; ownerE.kids.set(key,e); out.push(e); stat.stages++; }
    else { e.sp=Math.max(e.sp,Gc.spinLines); stat.merged++; }
    (c.members||[]).forEach(m=>{ if(!generic(R[m[0]])) e.who.add(label(R[m[0]])); });
    walk(c,e); } };
for(const root of roots){
  if(!leads(root)){ stat.dead++; continue; }
  const G=grid(root,null); if(G.bad||!G.other||G.rows.join('').replace(/[.X]/g,'').length%4) continue;
  // the openers that begin with this bag: the ones whose own page draws it first, the named before the nameless,
  // the most played first. The first names the line; all of them are its sources
  const recs=[...new Map(root.members.map(m=>[m[0],m[1]])).entries()].map(([ri,flag])=>({r:R[ri],flag}))
    .sort((a,b)=>(generic(a.r)-generic(b.r))||(a.flag-b.flag)||((popW[b.r.id]||0)-(popW[a.r.id]||0))||(score(b.r)-score(a.r)));
  const w=Math.max(...recs.map(x=>popW[x.r.id]? Math.max(.5,popW[x.r.id]) : .02+.05*Math.min(1,score(x.r)/20)));
  const key=G.rows.join('/').toUpperCase(); let rootE=rootBy.get(key);
  if(!rootE){ const base=label(recs[0].r); used[base]=(used[base]||0)+1; const name=base+(used[base]>1?' '+used[base]:'');
    rootE={kind:'O',n:name,k:G.hasT?'X':'T',after:'',w,sp:G.spinLines,r:G.rows,kids:new Map(),idx:0,who:new Set(),links:[]}; rootBy.set(key,rootE); out.push(rootE); stat.firstBags++; }
  else { rootE.w=Math.max(rootE.w,w); stat.merged++; }
  recs.forEach(x=>{ if(!generic(x.r)) rootE.who.add(label(x.r)); (x.r.links||[]).forEach(l=>{ if(!rootE.links.some(q=>q.url===l.url)) rootE.links.push({label:l.label,url:l.url}); }); });
  walk(root,rootE);
}
out.forEach(e=>{ if(e.kind==='O'){ links[e.n]=e.links; if(e.who.size>1) stat.shared++; }
  const who=[...e.who].join(' / '); if(who) labels[e.n]=who; });
const text=[]; const emit=f=>text.push(f.join('|'));
out.forEach(e=>{ emit([e.kind,e.n,e.k,e.after,e.kind==='O'?+e.w.toFixed(4):1,e.sp,e.r.join('/')]);
  const m=e.r.map(mir); if(m.join('/')!==e.r.join('/')) emit([e.kind,e.n+' (mirror)',e.k,e.after?e.after+' (mirror)':'',e.kind==='O'?+e.w.toFixed(4):1,e.sp,m.join('/')]); });
fs.writeFileSync(OUT,'# kind|name|kept piece|after|weight|spin rank|rows top to bottom (letters: piece, *: any piece, X: already built, .: empty)\n'+text.join('\n')+'\n');
fs.writeFileSync(OUT.replace(/\.txt$/,'')+'.links.json',JSON.stringify(links));
fs.writeFileSync(OUT.replace(/\.txt$/,'')+'.labels.json',JSON.stringify(labels));
console.log(JSON.stringify(stat),'lines in all',text.length);
