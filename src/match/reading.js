// Reading a board the way a viewer would: its surface, T-slots, what a player looks set to do, and a summary for
// the director.
import { inc } from './garbage.js';

export function statOf(c,t){ var s=c.g.st; return {name:c.name,skill:Math.round(c.skill*100),style:c.style,method:c.style==='quad'||c.style==='tspin'? c.well+'-'+(9-c.well) : '',tac:c.g.st.tac||'play',wins:c.wins,score:s.score,lines:s.lines,level:s.level,pieces:s.pieces,
    sent:c.sent,incoming:inc(c),callout:c.call&&t-c.callT<2.2?c.call.text:'',atk:c.call&&c.call.atk||0}; }

// how much is going on: a score for the pair, the board that's the more worth watching, and why. Read off the games as
// they stand (a game out of view stands still, so what it's about to do it's still about to do when the camera gets there)
export function surface(g){ var b=g.st.b, W=g.W, H=g.H; for(var y=H-24;y<H;y++) for(var x=0;x<W;x++) if(b[y*W+x]) return H-y; return 0; }

export function tSlot(g){ // a T-spin double waiting: a T-shaped hole pointing down, three corners filled, the roof over it, both rows near full
  var b=g.st.b, W=g.W, H=g.H, f=function(x,y){ return x<0||x>=W||y>=H||!!b[y*W+x]; }, best=0;
  for(var y=Math.max(1,H-22);y<H-1;y++) for(var x=1;x<W-1;x++){
    if(f(x-1,y)||f(x,y)||f(x+1,y)||f(x,y+1)) continue; if(!f(x,y+2)&&y+2<H) continue;
    var cn=(f(x-1,y-1)?1:0)+(f(x+1,y-1)?1:0)+(f(x-1,y+1)?1:0)+(f(x+1,y+1)?1:0); if(cn<3||!(f(x-1,y-1)||f(x+1,y-1))) continue;
    var r1=0, r2=0; for(var k=0;k<W;k++){ if(f(k,y)) r1++; if(f(k,y+1)) r2++; }
    var v=(r1>=7?1:0)+(r2>=9?1:0); if(v>best) best=v; }
  return best; }

export function hasT(st){ if(st.cur==='T'||st.hold==='T') return 2; for(var i=0;i<3;i++) if(st.queue[i]==='T') return 1; return 0; }

// what each bot is about to do, read off its own plans: a perfect clear it has worked out (and how many pieces off), the
// rest of an opener or a continuation it's following (most end in a spin or a clear), a T-spin slot built with a T in
// hand or a piece or two away, a well four deep with an I coming, a stack about to top out. Each with how soon, in
// pieces; the eye wants the ones it can get to just in time
export function intents(c){ var g=c.g, st=g.st, L=[], q=st.queue, pos=function(k){ if(st.cur===k||st.hold===k) return 1; for(var i=0;i<5;i++) if(q[i]===k) return i+2; return 99; };
  if(st.pcPlan&&st.pcPlan.length) L.push({k:'pc',eta:st.pcPlan.length+1,w:5});
  if(st.target&&st.buildName==='TST') L.push({k:'tst',eta:Math.ceil((st.tgtBestN||12)/4)+1,w:4.5});
  if(st.openPlan&&st.openPlan.length){ var nm=(st.stage2||st.openerName||'')+''; L.push({k:/pc|perfect/i.test(nm)?'pc':'setup',eta:st.openPlan.length+1,w:/pc|perfect/i.test(nm)?4.5:3,name:nm}); }
  var su=g.setupScan? g.setupScan() : null, tp=pos('T');
  if(su&&su.n&&tp<99){ var best=null; su.hits.forEach(function(h){ if(h.miss===0&&h.M<=4&&(!best||h.L>best.L)) best=h; }); if(best) L.push({k:best.L>=3?'tst':'tsd',eta:tp,w:best.L>=3?4.5:3.5}); }
  var W=g.W, H=g.H, b=st.b, deep=0, wx=-1; for(var y=H-1;y>=H-20;y--){ var e=-1, n=0, gb=false; for(var x=0;x<W;x++){ if(!b[y*W+x]){ n++; e=x; } else if(st.pid[y*W+x]>=241) gb=true; } if(gb) continue; if(n===1&&(wx<0||e===wx)){ wx=e; deep++; } else break; }   // a built well, not garbage's own column
  if(deep>=4){ var ip=pos('I'); if(ip<99) L.push({k:'quad',eta:ip,w:2.5}); }
  var h=0; for(var y2=H-24;y2<H&&!h;y2++) for(var x2=0;x2<W;x2++) if(b[y2*W+x2]){ h=H-y2; break; } var room=20-h-inc(c); if(room<5) L.push({k:'ko',eta:Math.max(1,room),w:3});
  if(st.b2bN>=4&&L.some(function(z){ return /tsd|tst|pc|quad/.test(z.k); })) L.push({k:'surge',eta:L[0].eta,w:2});
  return L; }
