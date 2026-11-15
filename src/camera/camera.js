import { along, pointOn } from './flight.js';

// the camera: one board at rest, the crowd when you go looking. Drag to pan; pinch, ctrl-scroll, or (once you're out)
// the wheel to zoom about the pointer; near an edge, once out, it drifts that way. Let go near a board and it settles
// back onto it, framed as the hero always was.
export function SeaCamera(root,cv,opt){ var A=opt.anchor||[.729,.49], A1=A[1], topLay=false, TSX=62, TSY=38;   // (TSX, TSY: the spacing of the matches, opened up to suit the screen)
  var autoAt=-1, cam={x:11,y:12,cs:40,anchor:A}, def=40, target=null, lastIn=-9, drag=null, pts={}, edge=[0,0], tNow=0, onFocus=opt.onFocus||function(){};
  function dpr(){ return cv.width/Math.max(1,cv.clientWidth); }
  function boardAt(x,y){ var tx=Math.floor(x/TSX), ty=Math.floor(y/TSY), lx=x-tx*TSX, side=lx>=22+GAP*.5?1:0; return {tx:tx,ty:ty,side:side,x:tx*TSX+side*(22+GAP)+11,y:ty*TSY+12}; }
  function exploring(){ return cam.cs<def*.93||target===null&&Math.abs(cam.cs-def)>1; }
  function zoomAt(f,cx,cy){ // cx,cy: canvas pixels from the bottom-left
    var ax=A[0]*cv.width, ay=A[1]*cv.height, wx=(cx-ax)/cam.cs+cam.x, wy=(cy-ay)/cam.cs+cam.y;
    cam.cs=Math.max(def*.004,Math.min(def*2.2,cam.cs*f)); cam.x=wx-(cx-ax)/cam.cs; cam.y=wy-(cy-ay)/cam.cs; }
  function local(e){ var r=cv.getBoundingClientRect(), d=dpr(); return [(e.clientX-r.left)*d,(r.bottom-e.clientY)*d,e.clientX-r.left,e.clientY-r.top,r]; }
  // the director (cinema): opens far out and falls into a pair, shows both boards, picks one; every half a minute or so it
  // pulls back, travels to another pair and does it again. Any touch hands the camera over; it picks up again when idle.
  var vel={x:0,y:0}, zvel=0, lp=null, VH=1, GAP=0;
  var shots=[], nextExc=opt.cinema?-1:Infinity, rng=opt.rng||Math.random, settledAt=-1, lastGlance=-9, lastLook=-9;
  function pairView(tx,ty){ return {x:tx*TSX+22+GAP*.5,y:ty*TSY+12,cs:Math.min(def*(opt.pairMax||.62),cv.width*(topLay?.94:(opt.visW||.54))/(47+GAP))}; }   /* opt.pairMax: how close a match framed whole may come, against a board alone (a page that's all sea lets it fill the screen) */
  function boardView(tx,ty,sd){ return {x:tx*TSX+sd*(22+GAP)+11,y:ty*TSY+12,cs:def}; }
  // a cluster: three or more matches within a couple of tiles all worth watching (or two right next to each other, both
  // hot): framed together, the camera backed off just enough to take them all in
  var lastClu=-9, cluAt=-99;
  function cluster(tx0,ty0,ref){ var sea=opt.sea; if(!sea||!sea.scout) return null; var M=[], hot=0;
    for(var dx=-2;dx<=2;dx++) for(var dy=-2;dy<=2;dy++){ var I=sea.scout(tx0+dx,ty0+dy); if(!I) continue; if(I.s>=.8*ref){ M.push({tx:tx0+dx,ty:ty0+dy,s:I.s,adj:Math.abs(dx)<=1&&Math.abs(dy)<=1}); if(I.s>=1.1*ref) hot++; } }
    var adj=M.filter(function(m){ return m.adj; });
    if(!(M.length>=3||(adj.length>=2&&hot>=2))) return null;
    if(M.length>4){ M.sort(function(p,q){ return (q.s-.6*Math.hypot(q.tx-tx0,q.ty-ty0))-(p.s-.6*Math.hypot(p.tx-tx0,p.ty-ty0)); }); M=M.slice(0,4); }
    var x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity; M.forEach(function(m){ x0=Math.min(x0,m.tx); x1=Math.max(x1,m.tx); y0=Math.min(y0,m.ty); y1=Math.max(y1,m.ty); });
    var wW=(x1-x0)*TSX+47+GAP, hH=(y1-y0)*TSY+26, vw=cv.width*(topLay?.94:(opt.visW||.54)), csf=Math.min(vw/(wW*1.08),cv.height*VH*.92/(hH*1.1));
    if(csf>pairView(tx0,ty0).cs*.8) return null;   // no wider than the pair view: nothing to gain
    return {x:(x0+x1)/2*TSX+22+GAP*.5,y:(y0+y1)/2*TSY+12,cs:csf,m:M,len:4+M.length*2}; }
  function cluBest(cl){ var sea=opt.sea, best=null; cl.m.forEach(function(m){ if(cl.from&&m.tx===cl.from.tx&&m.ty===cl.from.ty) return; var I=sea.scout(m.tx,m.ty); if(!I) return; var sc=I.s+(I.why.some(function(w){ return /^soon|cannon|tst|tower|ko|pc/.test(w); })?2:0);
      if(!best||sc>best.sc){ var scn=Math.min(I.sc[0],I.sc[1]), scm=Math.max(I.sc[0],I.sc[1]); best={sc:sc,tx:m.tx,ty:m.ty,side:I.side,both:(scn>2&&scn>=.65*scm)||I.why.indexOf('battle')>=0}; } }); return best; }
  function cluHot(cl){ var sea=opt.sea; return cl.m.some(function(m){ var I=sea.scout(m.tx,m.ty); return I&&I.why.some(function(w){ return /^soon:(tst|tsd|pc|setup)|ko/.test(w); }); }); }
  // a flight: out and over, along a curve rather than straight, as high as the distance calls for (and sometimes higher,
  // for the view), sometimes by way of somewhere else; then it hangs over the pair, drifting across both boards, before
  // it settles on one of them
  // each leg of a flight gets its own shape and its own way of moving along it: straight, a single arc, an S (a cubic
  // with its handles on opposite sides), or a wander (the arc with a lateral sway of one to three waves, fading in and out
  // at the ends); and a speed profile, from a gentle ease to a hard launch and a long glide, with surges and lulls on top
  function flightPath(d){ var r=rng();   // a camera operator's moves: a line or a single sweep mostly, now and then a gentle S
    if(r<.3) return {type:'line'};
    if(r<.85) return {type:'arc'};
    var b=(.1+rng()*.14)*d*(rng()<.5?-1:1); return {type:'s',b1:b,b2:-b*(.7+rng()*.5)}; }
  function flightEase(){ return {p:1.7+rng()*.8,a:(rng()*2-1)*.1}; }   // a steady ease in and out: no lurches


  // the pointer, resting over the games, has a say: where it sits (from the middle of the view) is the way the next trip
  // goes, and how far out it sits is how far; in flight the camera leans toward it; over a pair, the board it's nearer is
  // the one picked. Hovering doesn't take the camera, a drag or a click still does
  var hov=null, lean={x:0,y:0}, base=null;   // base: where the flight itself is; the camera is that plus the lean
  function hovering(){ return hov&&tNow-hov.t<4; }
  // after you've had the camera, the director waits before taking it back: ten seconds at least, thirty while the pointer
  // is still over the view (a finger lifted off a touch screen isn't)
  var inside=false; function quiet(){ return inside?30:10; }
  // the watchful eye: where to next is drawn several times over (the same mix of near and far, nudged the same way by the
  // pointer), and each place is weighed by what's going on there: a T-spin waiting with a T on the way, a stack near the
  // top, a dig through garbage, a back-to-back chain charging a surge, a combo, a perfect clear in reach, the two trading
  // garbage, a round just starting or just won. Far places have no game yet: the most worth-watching game out of sight is
  // put there, held still until the camera arrives. The pick is weighted, not the top every time, so it still wanders
  var eye=null;
  function tripLen(){ var r=rng(); return Math.min(55,2+(-Math.log(1-r*.9999))*14); }
  function draw(cur,R0){ var R=R0!=null? R0*(.8+.4*rng()) : tripLen(), an=rng()*Math.PI*2;
    if(hovering()){ var hx=hov.x-A[0]*cv.width, hy=hov.y-A[1]*cv.height, hd=Math.hypot(hx,hy); if(hd>cv.width*.03){   // a nudge, not the wheel:
        var pa=Math.atan2(hy*TSX/TSY,hx), f=Math.min(1,hd/(cv.width*.42)), da=Math.atan2(Math.sin(pa-an),Math.cos(pa-an)); an+=da*(.35+.3*f); R*=.85+.5*f; } }   // the way it was going anyway, turned partly toward the pointer
    var tx=cur.tx+Math.round(Math.cos(an)*R), ty=cur.ty+Math.round(Math.sin(an)*R*.8); if(tx===cur.tx&&ty===cur.ty) tx+=rng()<.5?-1:1; return {tx:tx,ty:ty}; }
  // how far is drawn first, as it always was (mostly near, now and then a long way); the eye only chooses which way
  /* the area it's been keeping to: once it has stayed around one patch of the sea for a while, places there count for less and less, and after a minute or two it goes somewhere else altogether */
  var home=null; function homeDist(tx,ty){ return home? Math.hypot(tx-home.tx,(ty-home.ty)*TSY/TSX) : 99; }
  function dwell(){ return home? Math.min(1,Math.max(0,(tNow-home.t-25)/50)) : 0; }
  function pick(cur,Rf,away){ var sea=opt.sea; if(!sea) return draw(cur);
    var R0=Rf||tripLen(), pool=sea.pool(), est=pool.length? (pool[0].s+(pool[1]||pool[0]).s+(pool[2]||pool[0]).s)/3 : 0, C=[], tw=0;
    for(var k=0;k<9;k++){ var c=draw(cur,R0), dd=Math.hypot(c.tx-cur.tx,(c.ty-cur.ty)*TSY/TSX), I=sea.scout(c.tx,c.ty,dd<3.2?5.5+2.4*dd:4.6+2.2*Math.log(1+dd)/Math.LN2); c.I=I; c.s=(I?I.s-(eye&&I.kind===eye.kind?1.5:0):est)-(beenAt(c.tx,c.ty,I?I.slot:null)?8:0)-(homeDist(c.tx,c.ty)<6?(away?9:3.5*dwell()):0)-(hopLeft<=0&&dd<3.5?1.6:0); c.w=Math.exp(c.s/1.3); tw+=c.w; C.push(c); }
    if(sea.remotes){ sea.remotes().forEach(function(I){ if(beenAt(I.tx,I.ty,I.slot)) return; var c={tx:I.tx,ty:I.ty,I:I,s:I.s,remote:1}; c.w=Math.exp(c.s/1.3)*(mood==='voyage'||away?4:1.4+2*dwell()); tw+=c.w; C.push(c); }); }   // live games far off: a long way to go, so only now and then (a voyage's first choice)
    var r=rng()*tw, ch=C[0]; for(k=0;k<C.length;k++){ r-=C[k].w; if(r<=0){ ch=C[k]; break; } } if(ch.remote&&typeof window!=='undefined') window.__rt=(window.__rt||0)+1;
    if(!ch.I) ch.I=sea.cast(ch.tx,ch.ty,rng,eye&&eye.kind,been.filter(function(B){ return tNow-B.t<120; }).map(function(B){ return B.slot; })); else if(ch.I.remote&&sea.holdFor) sea.holdFor(ch.I.slot); return ch; }
  // the eye's moods: how it goes looking. A leap (straight off to the best find, on an arc), a wander (prowling at middling
  // height on a zigzag or a looping meander, pouncing when something good passes under it), a perch (pulled back a little,
  // sitting and drifting, watching several matches at once), a soar (high over a stretch of the sea, then a long dive), a run
  // of hops (short quick looks from one neighbour to the next). A busy sea makes it leap and hop; a quiet one, wander and perch
  var roam=null, hopLeft=0, mood='leap', punch=0, lastEvK='';
  // where it's been: matches it watched in the last two minutes are passed over (it doesn't go straight back to one it left)
  var been=[]; function beenAt(tx,ty,slot){ for(var i=0;i<been.length;i++){ var B=been[i]; if(tNow-B.t>120) continue; if((B.tx===tx&&B.ty===ty)||(slot!=null&&B.slot===slot)) return true; } return false; }
  function markBeen(tx,ty){ been.push({tx:tx,ty:ty,slot:opt.sea&&opt.sea.focusSlot?opt.sea.focusSlot():null,t:tNow}); if(been.length>40) been.shift(); }
  function seaRef(){ var P0=opt.sea?opt.sea.pool():[]; return P0.length? (P0[0].s+(P0[2]||P0[0]).s+(P0[5]||P0[0]).s)/3 : 6; }
  function excursion(first){ base=null; lean={x:0,y:0};
    var cur0=boardAt(cam.x,cam.y); if(!home||homeDist(cur0.tx,cur0.ty)>7) home={tx:cur0.tx,ty:cur0.ty,t:tNow};
    var away=!first&&tNow-home.t>(home.lim||(home.lim=35+rng()*30));   /* been round here long enough: off somewhere new, a real distance, not another drift or perch nearby */
    if(away){ hopLeft=0; mood=rng()<.35?'voyage':'leap'; if(typeof window!=='undefined') window.__mood=mood+'(away)'; }
    else if(!first&&opt.sea&&hopLeft<=0){ var ref=seaRef(), busy=Math.max(0,Math.min(1,(ref-6)/6)), W={leap:.3+.15*busy,wander:.24-.1*busy,perch:.16-.05*busy,soar:.09,hop:.13+.05*busy,voyage:.08}, tw=0, r=rng(); for(var m in W) tw+=W[m]; r*=tw;
      for(m in W){ r-=W[m]; if(r<=0){ mood=m; break; } }
      if(typeof window!=='undefined') window.__mood=mood;
      if(mood==='wander'||mood==='perch'||mood==='soar'){ startRoam(mood); return; }
      if(mood==='hop') hopLeft=1+Math.floor(rng()*2); }
    var cur=boardAt(cam.x,cam.y), tx, ty, sd=rng()<.5?0:1;
    if(first){ var ch0=opt.sea? pick(cur,2+rng()*3) : null; if(ch0){ tx=ch0.tx; ty=ch0.ty; if(ch0.I) sd=ch0.I.side; } else { var R=2+rng()*3, an=rng()*Math.PI*2; tx=cur.tx+Math.round(Math.cos(an)*R); ty=cur.ty+Math.round(Math.sin(an)*R*.8); if(tx===cur.tx&&ty===cur.ty) tx+=1; } }   // the opening goes where the eye would: the best of what's there   // in on a match at its edge: just won, or about to begin
    else { var ch=pick(cur,away?(rng()<.5?22+rng()*25:9+rng()*12):hopLeft>0?1+rng()*1.6:mood==='voyage'?22+rng()*25:null,away); /* a voyage: a long way off, to the best game out there */ tx=ch.tx; ty=ch.ty; if(ch.I&&rng()<.8) sd=ch.I.side; eye={t:tNow,tx:tx,ty:ty,why:ch.I?ch.I.why:[],s:ch.I?ch.I.s:0,kind:ch.I?ch.I.kind:'',mood:hopLeft>0?'hop':mood==='voyage'?'voyage':'leap'}; if(typeof window!=='undefined') window.__eye=eye; }
    trip(tx,ty,sd,first,mood==='voyage'?'crane':null); }
  // roaming: the camera steered by hand, so to speak, until something under it is worth stopping for
  function startRoam(m){ shots=[]; target=null; settledAt=-1; var an=rng()*Math.PI*2; if(typeof window!=='undefined'){ (window.__shotlog||(window.__shotlog=[])).push({t:tNow,k:'roam-'+m,from:+(cam.cs/def).toFixed(3)}); }
    roam={m:m,t0:tNow,dur:m==='wander'?11+rng()*9:m==='perch'?7+rng()*8:3.5+rng()*3, h:an, turn:0, seg:0, zig:rng()<.55, sp:m==='wander'?TSX*(.45+rng()*.35):m==='soar'?TSX*(2.2+rng()*1.6):TSX*(.08+rng()*.1),
      cs:m==='wander'?pairView(0,0).cs*(.5+rng()*.25):m==='perch'?def*(.1+rng()*.08):def*(.045+rng()*.02), look:0, ph:rng()*6.3}; }
  function stepRoam(t,dt){ var R=roam, age=t-R.t0, ramp=Math.min(1,age/2.5), k=1-Math.exp(-dt*(R.m==='soar'?.9:.7)*ramp*ramp);   // the zoom eases into its drift, never lurches
    // the heading: zigzags (turning a set way, then back), or a loose meander; and leaning toward the pointer
    if(R.zig){ if(t>=R.seg){ R.seg=t+2.2+rng()*2; R.turn=(R.turn>=0?-1:1)*(.4+rng()*.4); } R.tv=(R.tv||0)+(R.turn-(R.tv||0))*(1-Math.exp(-dt*1.2)); R.h+=R.tv*dt*.9; }
    else { R.h+=Math.sin(t*.37+R.ph)*dt*.8+Math.sin(t*1.13+R.ph*2)*dt*.35; }
    if(hovering()){ var hx=hov.x-A[0]*cv.width, hy=hov.y-A[1]*cv.height; var pa=Math.atan2(hy,hx), da=Math.atan2(Math.sin(pa-R.h),Math.cos(pa-R.h)); R.h+=da*dt*.6; }
    var sp=R.sp*(R.m==='perch'?(.6+.4*Math.sin(t*.5+R.ph)):1)*(.5-.5*Math.cos(Math.PI*Math.min(1,age/3.5)));   // eases up to speed
    cam.x+=Math.cos(R.h)*sp*dt; cam.y+=Math.sin(R.h)*sp*dt*.8; cam.cs=Math.exp(Math.log(cam.cs)+(Math.log(R.cs*(1+.04*Math.sin(t*.6+R.ph)))-Math.log(cam.cs))*k);
    // looking: what's in view, every half second; something good enough and it goes for it
    if(t-R.look>.5&&age>2.5&&opt.sea){ R.look=t; var span=Math.max(1,Math.min(5,cv.width/cam.cs/TSX*.5)), c0=boardAt(cam.x,cam.y), best=null, ref=seaRef();
      for(var dx=-Math.ceil(span);dx<=Math.ceil(span);dx++) for(var dy=-Math.ceil(span*.7);dy<=Math.ceil(span*.7);dy++){ var I=opt.sea.scout(c0.tx+dx,c0.ty+dy); if(!I) continue;
        var sc=I.s+(I.why.some(function(w){ return /^soon|spin|cannon|tst|pc|ko/.test(w); })?2:0)-.25*Math.hypot(dx,dy*1.5)-(beenAt(c0.tx+dx,c0.ty+dy,I.slot)?8:0); if(!best||sc>best.sc) best={sc:sc,tx:c0.tx+dx,ty:c0.ty+dy,I:I}; }
      var thr=ref*(R.m==='wander'?.85:.95)-age*.06;
      if(best&&(best.sc>=thr||age>R.dur)){ roam=null; eye={t:t,tx:best.tx,ty:best.ty,why:best.I.why,s:best.I.s,kind:best.I.kind,mood:R.m}; if(typeof window!=='undefined') window.__eye=eye;
        trip(best.tx,best.ty,best.I.side,false); return; } }
    if(age>R.dur+(R.m==='soar'?2:8)){ roam=null; mood='leap'; excursion(false); } }
  // the style of a flight, like a camera move: a crane (up high and down), a skim (low over the boards, close enough to
  // watch them pass), a sweep (a wide curve at middling height), or a dolly (a level track, the zoom held). Near hops are
  // drifts; the rest draw a style, a long voyage cranes
  function flightStyle(d,force){ if(force) return force; var r=rng(); if(d<TSX*3.2) return 'drift';
    if(d<TSX*10&&r<.25) return 'skim'; if(r<.45) return 'dolly'; if(r<.7) return 'sweep'; return 'crane'; }
  function trip(tx,ty,sd,first,force,dive){
    var pv=pairView(tx,ty), bv=boardView(tx,ty,sd); shots=[]; target=null; base=null; lean={x:0,y:0};   // a flight starts from where the camera really is
    var arrive={x:pv.x+(sd?-1:1)*6,y:pv.y+(rng()-.5)*2,cs:pv.cs*(.92+rng()*.1)};   // come in over the board it won't pick, then drift across
    var I0=!first&&opt.sea? opt.sea.scout(tx,ty) : null, imm=dive||I0&&I0.why.some(function(w){ return /^soon|ko/.test(w); });
    var hold={drift:{x:(sd?1:-1)*(5+rng()*4),y:(rng()-.5)*2,z:rng()<.4?1.12:1}, dur:imm?1.2+rng()*.8:3.8+rng()*2.6};   // something about to happen: straight in
    if(first){ cam.x=arrive.x+(rng()*2-1)*TSX*5; cam.y=arrive.y+(rng()*2-1)*TSY*4; cam.cs=Math.max(def*.004,.42*cv.width/1400); }   // boards a few pixels wide, whatever the screen: the sea starts as a field of specks
    var legs=[], from={x:cam.x,y:cam.y}, D=Math.hypot(arrive.x-from.x,arrive.y-from.y);
    if(!first&&D>TSX*3&&rng()<.45){ var nx=-(arrive.y-from.y)/D, ny=(arrive.x-from.x)/D, side=rng()<.5?-1:1, f=.35+rng()*.3;   // by way of somewhere else
      legs.push({x:from.x+(arrive.x-from.x)*f+nx*side*D*(.25+rng()*.3),y:from.y+(arrive.y-from.y)*f+ny*side*D*(.25+rng()*.3)}); }
    legs.push(arrive);
    var px=from.x, py=from.y;
    var sty=first?'crane':flightStyle(D,force); if(typeof window!=='undefined') window.__fstyle=sty;
    // one height for the whole flight: out once, across (by way of anywhere), in once. Never out, in a little, out again
    var cruise=null; if(!first&&D>=TSX*3.2){ cruise=Math.max(def*.04,Math.min(def*.3,cv.width*.5/(D*1.15+80))); if(sty==='crane') cruise=Math.max(def*.04,cruise*.7); else if(sty==='skim') cruise=Math.max(cruise,def*.22); else if(sty==='dolly') cruise=Math.max(cruise*1.4,Math.min(def*.35,cruise*2.2)); }
    legs.forEach(function(L,i){ var d=Math.hypot(L.x-px,L.y-py)||1, nx=-(L.y-py)/d, ny=(L.x-px)/d, near=d<TSX*3.2, bend=(rng()*2-1)*d*(near?.12:sty==='sweep'?.45:sty==='dolly'||sty==='skim'?.06:.28);
      if(sty==='sweep') bend=(bend<0?-1:1)*Math.max(Math.abs(bend),d*.3);
      // as high as the distance calls for and no higher. A neighbour a board or two away is a slow drift across: only as far
      // out as it takes to keep both in frame (often not out at all), on a gentle line, with no surges. Far trips climb, up to
      // the opening shot's height for the farthest
      var last=i===legs.length-1, peak=null;
      if(!first){ if(near){ var fit=cv.width*.85/(d+46); peak=fit<arrive.cs*.98? Math.max(def*.05,fit) : null; }
        else { peak=Math.max(def*.04,Math.min(def*.3,cv.width*.5/(d*1.15+80)));   // never further out than about twenty-five boards across
          if(sty==='crane') peak=Math.max(def*.04,peak*.7); else if(sty==='skim') peak=Math.max(peak,def*.22); else if(sty==='dolly') peak=Math.max(peak*1.4,Math.min(def*.35,peak*2.2)); } }
      if(cruise&&!near){ peak=cruise; } if(cruise&&legs.length>1){ if(!last){ peak=null; } else { peak=null; } }   // with a waypoint: up to the cruise on the first leg, down from it on the last
      var to=last?arrive:{x:L.x,y:L.y,cs:cruise||(peak?peak*1.6:def*.1)};
      var dur=first? 5.5+1.2*Math.log(1+d/TSX)/Math.LN2 : near? 5.5+2.4*d/TSX+rng()*1.5 : (4.6+2.2*Math.log(1+d/TSX)/Math.LN2+(peak&&peak<def*.02?2:0));
      if(!first&&!near){ if(sty==='skim') dur=Math.max(dur,2.6+.55*d/TSX); else if(sty==='crane') dur*=1.15; else if(sty==='sweep') dur*=1.1; }   // a skim is slow enough to watch the boards go by
      shots.push({to:to,dur:dur,peak:peak,ctrl:{x:(px+L.x)/2+nx*bend,y:(py+L.y)/2+ny*bend},path:near?{type:rng()<.5?'line':'arc'}:sty==='dolly'||sty==='skim'?{type:'line'}:sty==='sweep'?{type:'arc'}:flightPath(d),ease:near?{p:1.5+rng()*.6,a:0}:sty==='dolly'?{p:1.5,a:0}:flightEase(),
        hold:last?hold.dur:0,drift:last?hold.drift:null,focus:last?{tx:tx,ty:ty,side:sd}:null}); px=L.x; py=L.y; });
    if(first||dive) shots.forEach(function(S){ S.intro=true; if(dive) S.dur=Math.min(S.dur,S.settle?1.8:3.6); });   // a dive onto a match's end: quicker
    var Ib=!first&&opt.sea? opt.sea.scout(tx,ty) : null, both=first||dive||Ib&&((Math.min(Ib.sc[0],Ib.sc[1])>2&&Math.min(Ib.sc[0],Ib.sc[1])>=.65*Math.max(Ib.sc[0],Ib.sc[1]))||Ib.why.indexOf('battle')>=0);   // both worth watching: frame the pair
    var fin=both? {x:pv.x,y:pv.y,cs:pv.cs} : bv;
    shots.push({intro:!!first,choose:!first&&!both,to:fin,dur:2.4+rng()*.8,hold:0,ctrl:{x:(px+hold.drift.x+fin.x)/2,y:(py+fin.y)/2+(rng()-.5)*3},settle:{tx:tx,ty:ty,side:sd,x:fin.x,y:fin.y,cs:both?pv.cs:null,both:both}}); }
  // the opening shot plays through untouched: until it lands, the pointer and wheel are ignored (the page still scrolls)
  function locked(){ return shots.length>0&&!!shots[0].intro; }
  function touch(){ lastIn=tNow; target=null; roam=null; hopLeft=0; if(shots.length){ shots=[]; } if(opt.cinema) nextExc=tNow+28; }
  // the cover (the tan page with the title) isn't part of the view: nothing done over it pans, zooms or picks a board
  function overCover(e){ var c=opt.cover&&opt.cover(); if(!c) return false; var r=c.getBoundingClientRect(); return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; }
  function skip(e){ return (e.target.closest&&e.target.closest('a,button,input,[data-noseas]'))||overCover(e); }
  root.addEventListener('pointerdown',function(e){ if(skip(e)||locked()) return; pts[e.pointerId]=local(e); if(Object.keys(pts).length===1) drag={x:e.clientX,y:e.clientY,moved:0,t0:Date.now(),multi:false}; else if(drag) drag.multi=true; touch(); try{ root.setPointerCapture(e.pointerId); }catch(_){} root.style.cursor='grabbing'; });
  root.addEventListener('pointermove',function(e){ var oc=!(e.pointerId in pts)&&overCover(e); inside=!oc&&e.pointerType!=='touch'; if(!oc){ var Lh=local(e); hov={x:Lh[0],y:Lh[1],t:tNow}; } else hov=null; if(!Object.keys(pts).length) root.style.cursor=oc?'default':''; if(locked()||oc){ edge=[0,0]; return; } var L=local(e), r=L[4];
    edge=[0,0]; if(r&&L[2]>=0&&L[3]>=0&&L[2]<=r.width&&L[3]<=r.height){ var m=70; edge=[L[2]<m?-(m-L[2])/m:L[2]>r.width-m?(L[2]-r.width+m)/m:0, L[3]<m?(m-L[3])/m:L[3]>r.height-m?-(L[3]-r.height+m)/m:0]; } if(e.pointerType==='touch') edge=[0,0];   // the edge drift is for a mouse; a finger near the edge is just holding the phone
    if(!(e.pointerId in pts)) return; if(drag) drag.moved=Math.max(drag.moved,Math.hypot(e.clientX-drag.x,e.clientY-drag.y)); var prev=pts[e.pointerId]; pts[e.pointerId]=L; var ids=Object.keys(pts);
    if(ids.length===2){ var a=pts[ids[0]], b=pts[ids[1]], o=ids[0]==e.pointerId?pts[ids[1]]:pts[ids[0]];
      var d1=Math.hypot(prev[0]-o[0],prev[1]-o[1]), d2=Math.hypot(L[0]-o[0],L[1]-o[1]); if(d1>4) zoomAt(d2/d1,(a[0]+b[0])/2,(a[1]+b[1])/2);
      cam.x-=(L[0]-prev[0])/2/cam.cs; cam.y-=(L[1]-prev[1])/2/cam.cs; touch(); return; }
    cam.x-=(L[0]-prev[0])/cam.cs; cam.y-=(L[1]-prev[1])/cam.cs; touch(); });
  // a click (no drag) while out among the crowd: fly to the board under the pointer and settle on it
  function up(e){ if(locked()){ delete pts[e.pointerId]; return; } var single=Object.keys(pts).length===1&&(e.pointerId in pts); delete pts[e.pointerId];
    if(single&&drag&&!drag.multi&&drag.moved<8&&Date.now()-drag.t0<450&&exploring()&&!skip(e)){ var L=local(e), ax=A[0]*cv.width, ay=A[1]*cv.height, b=boardAt((L[0]-ax)/cam.cs+cam.x,(L[1]-ay)/cam.cs+cam.y);
      shots=[{to:{x:b.x,y:b.y,cs:def},dur:Math.min(3.2,1.2+.5*Math.log(def/cam.cs+1)),hold:0,settle:b}]; onFocus(b); }
    if(!Object.keys(pts).length){ drag=null; root.style.cursor=''; } }
  root.addEventListener('pointerup',up); root.addEventListener('pointercancel',up); root.addEventListener('pointerleave',function(){ edge=[0,0]; inside=false; });
  root.addEventListener('wheel',function(e){ if(locked()||overCover(e)) return; var L=local(e), ex=exploring();
    var mouse=e.deltaMode!==0||(e.deltaX===0&&Math.abs(e.deltaY)>=50&&Math.abs(e.deltaY-Math.round(e.deltaY))<1e-6);
    if(e.ctrlKey){ e.preventDefault(); zoomAt(Math.exp(-e.deltaY*.012),L[0],L[1]); touch(); return; }
    if(!ex) return;   // at rest the page scrolls as usual
    e.preventDefault();
    if(mouse) zoomAt(Math.exp(-(e.deltaMode===1?e.deltaY*33:e.deltaY)*.0016),L[0],L[1]);
    else { var d=dpr(); cam.x+=e.deltaX*d/cam.cs; cam.y-=e.deltaY*d/cam.cs; }
    touch(); },{passive:false});
  return {
    cam:cam,
    frame:function(t){ var dt=Math.min(.05,t-tNow||0); tNow=t; if(lp&&dt>0){ var k9=1-Math.exp(-dt*8); vel.x+=((cam.x-lp.x)/dt-vel.x)*k9; vel.y+=((cam.y-lp.y)/dt-vel.y)*k9; if(lp.cs) zvel+=(Math.log(cam.cs/lp.cs)/dt-zvel)*k9; } lp={x:cam.x,y:cam.y,cs:cam.cs};
      // the board sits in the middle of what the cover leaves: to its right on a wide screen; under it on a phone, where the
      // cover runs across the top (and the board's sized to the space below)
      var vh=1; if(opt.cover){ var cvr=opt.cover(); if(cvr){ var rr=root.getBoundingClientRect(), cr=cvr.getBoundingClientRect(); if(rr.width>0&&rr.height>0){
        if(cr.width>=rr.width*.9&&cr.height>0&&cr.height<rr.height*.9){ var tb=Math.max(0,Math.min(rr.height,cr.bottom-rr.top)); A[0]=.5; vh=(rr.height-tb)/rr.height; A[1]=vh/2; topLay=true; VH=vh; }
        else { var l=Math.max(0,cr.right-rr.left); A[0]=(l+rr.width)/2/rr.width; A[1]=A1; topLay=false; VH=1; } } } }
      var visW=topLay? cv.width : 2*(1-A[0])*cv.width, d0=Math.floor(Math.min(visW/22,cv.height*vh/24)*(opt.fill||.9));   /* sized to the part of the screen the cover leaves */ if(d0!==def){ if(Math.abs(cam.cs-def)<.5||!this.init) cam.cs=d0; def=d0; } if(!this.init){ this.init=true; target={tx:0,ty:0,side:0,x:11,y:12}; }
      // the two boards of a pair sit apart by as much as the screen needs: a board framed alone shows (1-anchor) of the view
      // either side of its middle; the neighbour's hold or queue starts half a cell past the gap, so the gap clears that
      { var dd=Math.max(1,def), hu=(topLay?cv.width:2*(1-A[0])*cv.width)/2/dd, hv=(cv.height*vh)/2/dd;
        // a board framed alone, and nothing else in view: its opponent pushed past the edge by the gap, the next matches by the
        // spacing (across: the opponent's far side plus the next match's near side; down: the rows above and below)
        var g=Math.max(0,hu-11.1)*(opt.gapK||1), nx=Math.max(62,Math.ceil((hu+g+33.2+Math.max(6,.6*g))*2)/2),   /* the matches further apart than a match's own two boards, always (on a wide screen the two gaps had come out the same, and which boards were a pair got hard to read) */
            ny=Math.max(38,Math.ceil((hv+12.9)*2)/2);
        if(Math.abs(g-GAP)>.05||nx!==TSX||ny!==TSY){ var ox=TSX, oy=TSY; cam.x=cam.x/ox*nx; cam.y=cam.y/oy*ny; GAP=g; TSX=nx; TSY=ny;
          if(target&&!target.cluster){ var nv=target.both? pairView(target.tx,target.ty) : boardView(target.tx,target.ty,target.side); target.x=nv.x; target.y=nv.y; } }
        cam.gap=GAP; cam.ts=[TSX,TSY]; }
      // (wider than that, nothing can hide the neighbour without running into the next pair: it's shown, and a good part of it)
      if(false&&cam.cs<def*.93&&(edge[0]||edge[1])&&!Object.keys(pts).length){   /* no drifting at the screen's edges: moving about is a click and drag, on purpose */ var sp=cv.width*.6*dt/cam.cs; cam.x+=edge[0]*Math.abs(edge[0])*sp; cam.y+=edge[1]*Math.abs(edge[1])*sp; lastIn=t; }
      // settling: let go near enough to a board and the camera eases back onto it at the hero's framing
      // while it sits on a board: stays while something's happening (up to a point), moves on sooner from a quiet one, and
      // looks across at the other board when that's become the one to watch
      if(opt.cinema&&opt.sea&&!shots.length&&target&&settledAt>=0&&t-lastIn>quiet()&&t-lastLook>.5){ lastLook=t; var fi=opt.sea.focusInterest();
        if(fi){ var dw=t-settledAt, P0=opt.sea.pool(), ref=P0.length? (P0[0].s+(P0[2]||P0[0]).s+(P0[5]||P0[0]).s)/3 : 6, big=fi.why.some(function(w){ return /danger|spin|surge|pc|ko|combo|cannon|tst|soon|battle/.test(w); }),
            soon=fi.why.some(function(w){ return /^soon|tower|cannon/.test(w); }), fe=opt.sea.focusEvents?opt.sea.focusEvents():null, le=fe&&fe.length?fe[fe.length-1]:null, sim=opt.sea.focusSimTime?opt.sea.focusSimTime():t;
          // leaving is timed like a cut: after the punchline (a big clear just landed and nothing else is brewing), not halfway through a build
          if(le&&/ko|tsd|tst|pc|quad|surge/.test(le.k)&&sim-le.t<2.5&&dw>11&&!soon&&!target.cluster) nextExc=Math.min(nextExc,t+1.6+rng()*.8);
          else if(big&&fi.s>=.7*ref&&nextExc-t<3&&dw<28) nextExc=t+3;   // something's happening: see it through
          else if(fi.s<.4*ref&&dw>14&&!target.cluster) nextExc=Math.min(nextExc,t+2.5);   // nothing much: go and look elsewhere
          var battle=fi.why.indexOf('battle')>=0, ms=fi.side, os=1-ms, scm=Math.max(fi.sc[0],fi.sc[1]), scn=Math.min(fi.sc[0],fi.sc[1]);
          if(target.cluster){   // watching a cluster: after a while (or when one of them is about to go off) down into the best of them
            if(dw>8+(target.cluster.len||6)||(dw>7&&cluHot(target.cluster))){ var bm=cluBest(target.cluster); if(bm){ var bb5=bm.both?pairView(bm.tx,bm.ty):boardView(bm.tx,bm.ty,bm.side);
                shots=[{to:bb5,dur:3.4+rng()*.8,hold:0,path:{type:'arc'},ctrl:{x:(cam.x+bb5.x)/2+(rng()-.5)*TSX*.3,y:(cam.y+bb5.y)/2-TSY*.2},ease:{p:2,a:0},settle:{tx:bm.tx,ty:bm.ty,side:bm.side,x:bb5.x,y:bb5.y,cs:bm.both?bb5.cs:null,both:bm.both}}]; target=null; } } }
          else if(t-lastClu>3&&dw>8&&t-cluAt>25&&nextExc-t<1.5&&dwell()<.4){   /* a cluster dives to a neighbour: not once it's been round here a while */ lastClu=t; var cl=cluster(target.tx,target.ty,ref); if(cl){ cl.from={tx:target.tx,ty:target.ty}; cl.m=cl.m.filter(function(m){ return !(m.tx===target.tx&&m.ty===target.ty); }); if(cl.m.length<2) cl=null; }   // leaving: back off over a cluster first, then down into one of the others   // several good ones close by: back off to take them all in
            if(cl){ cluAt=t; var cdur=3.6+rng()*.8; nextExc=t+cdur+40;   /* the dive moves it on (and its settle sets the next leaving) */ shots=[{glance:true,to:{x:cl.x,y:cl.y,cs:cl.cs},dur:cdur,hold:0,path:{type:'line'},ease:{p:2,a:0},settle:{tx:target.tx,ty:target.ty,side:target.side,x:cl.x,y:cl.y,cs:cl.cs,cluster:cl}}]; target=null; settledAt=t+cdur; } }   // the clock starts when it gets there
          if(!target||shots.length||target.cluster){}   // over a cluster: only its own dive moves it
          else if(target.both){ if(!battle&&Math.abs(fi.sc[0]-fi.sc[1])>3.5&&scn<.45*scm&&t-lastGlance>12&&dw>6){ lastGlance=t; var sd4=fi.sc[1]>fi.sc[0]?1:0, b4=boardView(target.tx,target.ty,sd4);   // one's pulled ahead: in on it
              shots=[{glance:true,to:b4,dur:2.8,hold:0,path:{type:'line'},ease:{p:1.9,a:0},settle:{tx:target.tx,ty:target.ty,side:sd4,x:b4.x,y:b4.y}}]; target=null; } }
          else if(dw>4&&t-lastGlance>12&&((scn>2.2&&scn>=.72*scm)||battle)){ lastGlance=t; var pv5=pairView(target.tx,target.ty);   // both worth it (or slugging it out): ease back a little to hold the pair
            shots=[{glance:true,to:{x:pv5.x,y:pv5.y,cs:pv5.cs},dur:2.8+rng()*.6,hold:0,path:{type:'line'},ease:{p:1.9,a:0},settle:{tx:target.tx,ty:target.ty,side:target.side,x:pv5.x,y:pv5.y,cs:pv5.cs,both:true}}]; target=null; }
          else { var os2=1-target.side; if(fi.sc[os2]>fi.sc[target.side]+2.5&&t-lastGlance>12&&dw>5){ lastGlance=t; var ob=boardView(target.tx,target.ty,os2);
            shots=[{glance:true,to:ob,dur:2.8+rng()*.6,hold:0,path:{type:'line'},ease:{p:1.9,a:0},settle:{tx:target.tx,ty:target.ty,side:os2,x:ob.x,y:ob.y}}]; target=null; } } } }
      if(opt.cinema&&opt.sea&&!shots.length&&target){ var fe=opt.sea.focusEvents?opt.sea.focusEvents():null, le=fe&&fe.length?fe[fe.length-1]:null;   // a reaction: a small push in on the big moments
        if(le&&le.t+':'+le.k!==lastEvK){ lastEvK=le.t+':'+le.k; } }   // (the push-in on big moments read as a twitch when the camera was meant to be still: off)
      /* browsing by hand and then resting on a board (or a match): after a moment it straightens up on it, a single board when zoomed in,
         both boards of the match when zoomed out to about a match's width. Still the viewer's camera: the eye takes over only as before */
      if(lastIn>0&&autoAt!==lastIn&&!shots.length&&!Object.keys(pts).length&&t-lastIn>2.5&&t-lastIn<quiet()){ autoAt=lastIn;
        var atx=Math.floor((cam.x+(TSX-(44+GAP))/2)/TSX), aty=Math.round((cam.y-12)/TSY), alx=cam.x-atx*TSX, asd=alx<22+GAP*.5?0:1, PV=pairView(atx,aty), BV=boardView(atx,aty,asd), av=null, ab=false;
        if(cam.cs>=def*.72) av=BV; else if(cam.cs>=PV.cs*.7&&cam.cs<def*.72){ av=PV; ab=true; }
        if(av&&(Math.abs(av.x-cam.x)*cam.cs>6||Math.abs(av.y-cam.y)*cam.cs>6||Math.abs(av.cs/cam.cs-1)>.04)){ var keepIn=lastIn; shots=[{to:{x:av.x,y:av.y,cs:av.cs},dur:1.1,hold:0,path:{type:'line'},ease:{p:2,a:0},settle:{tx:atx,ty:aty,side:asd,x:av.x,y:av.y,both:ab,cs:av.cs},auto:true}]; } }
      if(roam&&!shots.length&&!Object.keys(pts).length&&t-lastIn>quiet()){ stepRoam(t,dt); if(roam) return cam; }
      if(opt.cinema&&nextExc>=0&&!shots.length&&!roam&&t>=nextExc&&!Object.keys(pts).length&&t-lastIn>quiet()) excursion(false);
      if(opt.cinema&&nextExc<0){ nextExc=Infinity; excursion(true); }
      /* the area it's in, tracked all the time from where it actually is (not only when it sets off): hops and dives between neighbours
         were keeping it in one patch for minutes. Overdue, and settled, it goes now, unless a spin or a knockout is a second or two off */
      if(opt.cinema&&opt.sea){ var cA=boardAt(cam.x,cam.y); if(!home||homeDist(cA.tx,cA.ty)>7) home={tx:cA.tx,ty:cA.ty,t:t}; else if(!shots.length&&!roam&&t-home.t>(home.lim||(home.lim=35+rng()*30))+12&&nextExc-t>2&&t-settledAt>6){ var fiA=opt.sea.focusInterest&&opt.sea.focusInterest(); if(!fiA||!fiA.why.some(function(w){ return /^soon|^ko|danger/.test(w); })) nextExc=t+1; } }
      if(shots.length){ var S=shots[0]; if(!S.from){ S.prevT=target; S.from={x:base?base.x:cam.x,y:base?base.y:cam.y,cs:cam.cs}; S.t0=t; if(typeof window!=='undefined'){ var LG=window.__shotlog||(window.__shotlog=[]); LG.push({t:t,from:+(cam.cs/def).toFixed(3),to:+(S.to.cs/def).toFixed(3),peak:S.peak?+(S.peak/def).toFixed(3):null,dur:+S.dur.toFixed(1),k:S.intro?'intro':S.glance?'glance':S.settle?'settle':S.focus?'leg-last':'leg',tile:S.settle?S.settle.tx+','+S.settle.ty:null,clu:!!(S.settle&&S.settle.cluster),both:!!(S.settle&&S.settle.both),mood:mood,sty:window.__fstyle}); if(LG.length>400) LG.shift(); }
          // momentum: the move is planned from rest, and the speed (and zoom speed) the camera already has is added on top,
          // fading out over the move: u(1-u)^2 starts at the inherited speed exactly and ends at nothing
          S.mv={x:vel.x*S.dur,y:vel.y*S.dur}; S.mz=zvel*S.dur;
          if(S.focus&&!S.intro&&hovering()&&shots[1]&&shots[1].settle){ var qx=(hov.x-A[0]*cv.width)/(cv.width*.4), qy=(hov.y-A[1]*cv.height)/(cv.height*.4);
            var mxn=Math.abs(qx)>.45&&rng()<.7?(qx>0?1:-1):0, myn=Math.abs(qy)>.5&&rng()<.6?(qy>0?1:-1):0;   // drifted a match or so off course, toward the pointer
            if(mxn||myn){ var ntx=S.focus.tx+mxn, nty=S.focus.ty+myn, dx3=mxn*TSX, dy3=myn*TSY;
              S.to={x:S.to.x+dx3,y:S.to.y+dy3,cs:S.to.cs}; S.focus={tx:ntx,ty:nty,side:S.focus.side}; if(S.ctrl) S.ctrl={x:S.ctrl.x+dx3*.5+(rng()-.5)*TSX,y:S.ctrl.y+dy3*.5+(rng()-.5)*TSY};
              var S2=shots[1], nb2=boardView(ntx,nty,S2.settle.side); S2.to=nb2; S2.settle={tx:ntx,ty:nty,side:S2.settle.side,x:nb2.x,y:nb2.y}; S2.ctrl={x:(S.to.x+nb2.x)/2,y:(S.to.y+nb2.y)/2}; } }
          if(S.choose&&hovering()){ var st0=S.settle, wx=(hov.x-A[0]*cv.width)/cam.cs+cam.x, sd2=wx<st0.tx*TSX+22+GAP*.5?0:1;   // the board the pointer is nearer
            if(sd2!==st0.side){ var nb=boardView(st0.tx,st0.ty,sd2); S.to=nb; S.settle={tx:st0.tx,ty:st0.ty,side:sd2,x:nb.x,y:nb.y}; S.ctrl={x:(cam.x+nb.x)/2,y:(cam.y+nb.y)/2}; } } }
        var u=Math.min(1,(t-S.t0)/S.dur), e=S.ease?along(S,u):u*u*u*(u*(u*6-15)+10), pq=pointOn(S,e);
        cam.x=pq[0]; cam.y=pq[1];
        var la=Math.log(S.from.cs), lb=Math.log(S.to.cs), H=S.peak&&S.peak<Math.min(S.from.cs,S.to.cs)*.92?Math.max(0,(la+lb)/2-Math.log(S.peak)):0;
        var mo=u*(1-u)*(1-u); if(S.mv){ cam.x+=S.mv.x*mo; cam.y+=S.mv.y*mo; }
        cam.cs=Math.exp(la+(lb-la)*e-H*Math.sin(Math.PI*e)+(S.mz||0)*mo);   // the zoom always starts and ends at rest, whatever the travel does
        if(u>=1&&S.drift&&S.hold){ var k=Math.min(1,(t-S.t0-S.dur)/S.hold), ke=k*k*(3-2*k); cam.x=S.to.x+S.drift.x*ke; cam.y=S.to.y+S.drift.y*ke; cam.cs=S.to.cs*Math.pow(S.drift.z,ke); }
        // the lean toward the pointer, eased in and out (not in the opening shot)
        var lt=hovering()&&!S.intro? {x:(hov.x-A[0]*cv.width)/cam.cs*.22,y:(hov.y-A[1]*cv.height)/cam.cs*.22} : {x:0,y:0}, lk=1-Math.exp(-dt*1.6);
        base={x:cam.x,y:cam.y}; lt.x*=.7; lt.y*=.7; lean.x+=(lt.x-lean.x)*lk; lean.y+=(lt.y-lean.y)*lk; cam.x+=lean.x; cam.y+=lean.y;
                if(S.focus&&!S.focused&&u>.55){ S.focused=true; onFocus(S.focus); }
        if(u>=1&&t>=S.t0+S.dur+(S.hold||0)){ shots.shift(); if(S.settle){ base=null; lean={x:0,y:0}; target=S.settle;  onFocus(S.settle); markBeen(S.settle.tx,S.settle.ty); if(opt.cinema&&!S.glance){ nextExc=hopLeft>0? t+7+rng()*4 : t+11+rng()*8; if(hopLeft>0) hopLeft--; settledAt=t; lastGlance=t; }
            else if(opt.cinema&&S.glance&&S.settle&&(!S.prevT||S.prevT.tx!==S.settle.tx||S.prevT.ty!==S.settle.ty)){ settledAt=t; lastGlance=t; nextExc=t+9+rng()*6; }   /* a dive that lands on a different match is an arrival too: it gets its stay (it was leaving straight away, the clock still running from the last board) */ } }
        return cam; }
      if(!Object.keys(pts).length&&t-lastIn>(opt.cinema?quiet():1.3)&&cam.cs>def*.42){ if(!target){ var b=boardAt(cam.x,cam.y); target=b; onFocus(b); } }
      if(target){ var k=1-Math.exp(-dt*4.2), tcs=(target.cs||def)*(1+.07*punch); punch*=Math.exp(-dt*2.2); cam.x+=(target.x-cam.x)*k; cam.y+=(target.y-cam.y)*k; cam.cs=Math.exp(Math.log(cam.cs)+(Math.log(tcs)-Math.log(cam.cs))*k);
        if(punch<.01&&Math.abs(target.x-cam.x)<.01&&Math.abs(target.y-cam.y)<.01&&Math.abs(cam.cs-tcs)<.05){ cam.x=target.x; cam.y=target.y; cam.cs=tcs; } }
      return cam; },
    def:function(){ return def; }, geo:function(){ return {VH:VH,topLay:topLay,GAP:GAP,A:A.slice()}; }, exploring:exploring, setSea:function(v){ opt.sea=v; }, busy:function(){ return shots.length>0; } };
}
