// ---------- The sea: a few hundred games at once, printed the same way ----------
// The hero opens on one board, as before. Drag, pinch or scroll out and it turns out to be one of a crowd: pairs of bots
// playing each other in every direction, as far as you can zoom. The world is tiled with pairs; each tile reads one of
// NP games from an atlas (a hash of the tile picks which, so there is no edge and no visible repeat). The pair you
// settle on plays with the full planner; the crowd plays a light one, each game started at a different point.
import { SEA_SHADER } from '../render/sea-shader.js';
import { SEAW } from '../engine/pool.js';
import { SHAPES } from '../engine/shapes.js';
import { createPair } from '../match/pair.js';
import { createPainter } from './paint.js';
import { seaSlot } from './slots.js';

export function ScanTetrisSea(ad,opt){
  opt=opt||{}; var gl=ad.gl, prog=ad.prog(SEA_SHADER);
  var NBX=opt.nbx||16, NBY=opt.nby||((typeof SEAW!=="undefined"&&SEAW.on)? Math.max(10,Math.min(48,Math.ceil(SEAW.nw*48/16))) : 10), NP=NBX*NBY, AW=NBX*44, AH=NBY*25, sheet=new Uint8Array(AW*AH*4), tex=gl.createTexture(), texInit=false;
  gl.bindTexture(gl.TEXTURE_2D,tex); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  var seedBase=opt.seed!=null? opt.seed>>>0 : ((Date.now()^Math.floor(Math.random()*1e9))>>>0)%1000000;
  /* the eye's taste, which it never shows: for a minute or two it's after setups and spins, or after matches on a knife edge, or after
     stories (chains at stake, players it remembers, battles), or just somewhere new; the four axes weighted to suit */
  var TASTE=[1,1,1,1], tasteUntil=0, TASTES=[[.7,1.6,.9,.8],[1.6,.9,1.1,.6],[.9,1,1.6,.8],[.9,.9,.9,1.5]];
  function ACAP0(){ return Math.round(RCAP*.6); } var GOV=1, lastGov=0, jsEma=8, ffR=0, remote=[], RCAP=10, frEma=1/60, lastRaw=0, lastRemote=0, lastTurn=0, rrR=0, STYLES=['tspin','quad','pc','combo'], last=0, inks=opt.inks||0, px=.5, py=.5, lit=0, focus=-1, ftile=[0,0], fside=0, rr=0;
  var now=function(){ return (typeof performance!=='undefined'?performance.now():Date.now()); };
  // one pair of bots playing each other: the versus rules of the single hero (Tetra League's), per pair
  function G0REF(){ return SHAPES; }
  var pairCtx={seedBase:seedBase, now:now, STYLES:STYLES, G0REF:G0REF, ffQ:null, legacy:opt.legacy||null, taste:function(){ return TASTE; }};

  var ffQ=[], pairs=[]; pairCtx.ffQ=ffQ; for(var i=0;i<NP;i++){ pairs.push(createPair(i,pairCtx)); ffQ.push(pairs[i]); }
  // which tile each game is playing on. Tiles in view get a game of their own, seeded from where they are (so the world
  // goes on in every direction, new games starting as you pan); the longest-unseen game is the one moved. Out where more
  // tiles are in view than there are games, the rest borrow one by hash.
  // endless: a game that goes out of view is given a new seed and run on out of sight, so whatever comes into view next is
  // a game not seen before, already under way (and a board you come back to has moved on to another)
  var fresh=new Uint8Array(NP), needFresh=new Uint8Array(NP), wasVis=new Uint8Array(NP), freshN=0;
  var MW=128, MH=96, mapBuf=new Uint8Array(MW*MH*4), mapTex=gl.createTexture(), tileOf=new Array(NP).fill(null), seen=new Float64Array(NP), byKey={}, mapO=[0,0], mapN=[0,0];
  gl.bindTexture(gl.TEXTURE_2D,mapTex); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,MW,MH,0,gl.RGBA,gl.UNSIGNED_BYTE,mapBuf);
  function tileSeed(tx,ty){ var h=(Math.imul(tx|0,374761393)+Math.imul(ty|0,668265263)+seedBase)>>>0; h=Math.imul(h^(h>>>13),1274126177)>>>0; return (h^(h>>>16))>>>0; }
  function assign(tx,ty,t,pin){ var key=tx+','+ty, s=byKey[key]; if(s!=null){ seen[s]=pin?1e12:t; return s; }
    var best=-1, bt=Infinity, hs0=seaSlot(tx,ty,NP); if(seen[hs0]<t&&(hs0!==focus||pin)) best=hs0;
    if(best<0) for(var f=0;f<NP;f++){ if(fresh[f]&&pairs[f].ff()<=0&&seen[f]<t&&f!==focus){ best=f; break; } }   // a new game, already run on
    if(best<0) for(var i=0;i<NP;i++){ if(i===focus&&!pin) continue; if(tileOf[i]===null){ best=i; break; } if(seen[i]<bt&&seen[i]<t){ bt=seen[i]; best=i; } }
    if(best<0) return -1; if(tileOf[best]!==null) delete byKey[tileOf[best]]; tileOf[best]=key; byKey[key]=best; seen[best]=pin?1e12:t; fresh[best]=0; return best; }
var painter=createPainter({sheet:sheet,AW:AW,NBX:NBX}), paintPair=painter.paintPair;
  function setFocus(tx,ty,side){ if(focus>=0){ seen[focus]=last; var OPr=pairs[focus], la=OPr.lastAx; if(la&&la[1]+la[2]>6){ OPr.PL.forEach(function(c){ c.star=last; }); OPr.star=last; } } var s=assign(tx,ty,last,true); if(s<0) s=seaSlot(tx,ty,NP); ftile=[tx,ty]; fside=side||0; pairs[s].held=0; if(s===focus) return; if(focus>=0) pairs[focus].lite(!pairs[focus].remote); focus=s; pairs[s].shallow=GOV<.75, pairs[s].lite(false,GOV>=.75); }
  setFocus(0,0,0);
  return {
    _pairs:pairs, _tileOf:function(i){ return tileOf[i]; }, _fresh:function(){ return freshN; }, NP:NP, slot:function(tx,ty){ return seaSlot(tx,ty,NP); }, focus:setFocus, focusSide:function(){ return fside; },
    inks:function(k){ inks=k; },
    // the director's eye. scout: what's going on in the game at a tile, if it has one; cast: put the most worth-watching game
    // that's out of sight on a tile (weighted, not always the very top), held still until the camera gets there
    scout:function(tx,ty,lead){ var s=byKey[tx+','+ty]; if(s==null||pairs[s].ff()>0) return null; var I=pairs[s].interest(last,lead); I.slot=s; return I; },
    pool:function(){ var L=[]; for(var i=0;i<NP;i++){ if(i===focus||wasVis[i]||pairs[i].held||pairs[i].remote||pairs[i].ff()>0) continue; var I=pairs[i].interest(last); I.slot=i; L.push(I); }
      L.sort(function(a,b){ return b.s-a.s; }); return L; },
    /* the eye has set off for a far match: it waits for the eye (its clock stops while it's out of sight, never once it's in view), so what's about to happen there happens with the eye on it */
    holdFor:function(slot){ if(slot!=null&&pairs[slot]&&pairs[slot].remote&&!pairs[slot].held){ pairs[slot].held=last||1e-3; pairs[slot].hf=1; } },
    cast:function(tx,ty,rnd,avoid,skip){ var L=this.pool(); if(skip&&skip.length) L=L.filter(function(I){ return skip.indexOf(I.slot)<0; }); if(!L.length) return null; var top=L.slice(0,10), tw=0; top.forEach(function(I){ I.w=Math.exp((I.s-(avoid&&I.kind===avoid?1.5:0))/1.4); tw+=I.w; });
      var r=(rnd||Math.random)()*tw, I=top[0]; for(var k=0;k<top.length;k++){ r-=top[k].w; if(r<=0){ I=top[k]; break; } }
      var key=tx+','+ty, old=byKey[key]; if(old!=null&&old!==focus) tileOf[old]=null;
      if(tileOf[I.slot]!==null) delete byKey[tileOf[I.slot]]; tileOf[I.slot]=key; byKey[key]=I.slot; seen[I.slot]=1e12; fresh[I.slot]=0; needFresh[I.slot]=0; pairs[I.slot].held=last||1e-3; return I; },
    // the opening shot lands on a round's edge: a match just won (the K.O. caught as it happens), or, failing that, a fresh
    // round held at its start, its boards coming in from the distance as the camera gets there
    remotes:function(){ var L=[]; remote.forEach(function(r){ var P=pairs[r.slot]; if(!P||P.ff()>0) return; var I=P.interest(last); I.slot=r.slot; I.tx=r.tx; I.ty=r.ty; L.push(I); }); return L; },
    focusSlot:function(){ return focus; }, focusSimTime:function(){ return focus>=0&&pairs[focus].last>=0? pairs[focus].last : last; }, focusEvents:function(){ return focus>=0? pairs[focus].events : null; },
    focusInterest:function(){ return focus>=0? pairs[focus].interest(last) : null; },
    status:function(){ return pairs[focus].status(last); },
    frame:function(t,ptr,cam,csd,budget){ var dt=Math.min(.05,t-last||0); last=t; var t0=now();
      if(t>tasteUntil){ TASTE=TASTES[Math.floor(Math.random()*TASTES.length)]; tasteUntil=t+50+Math.random()*60; }
      /* a governor: on a device that can't keep up (frames slower than about 40 a second), fewer far-off games at full fidelity; back up again once it's smooth */
      if(lastRaw&&t>lastRaw){ frEma+=(Math.min(.25,t-lastRaw)-frEma)*.05; if(frEma>1/40&&t-(lastGov||0)>1){ if(RCAP>2) RCAP--; GOV=Math.max(.5,GOV-.1); lastGov=t; } else if(frEma<1/52&&t-(lastGov||0)>4){ if(RCAP<(jsEma<11&&frEma<1/55?16:10)) RCAP++; GOV=Math.min(1,GOV+.1); lastGov=t; } else if(RCAP>10&&jsEma>12&&t-(lastGov||0)>2){ RCAP--; lastGov=t; } }   /* far-off games at full fidelity: as many as the device has room for, from two on a struggling phone to sixteen (and ten that stay put) on a fast machine */ lastRaw=t;
      // what's in view: give each tile its game (when there are enough to go round) and write the window of the map
      var Wd=gl.drawingBufferWidth, Hd=gl.drawingBufferHeight, A=cam.anchor||[.5,.5], TX=cam.ts?cam.ts[0]:62, TY=cam.ts?cam.ts[1]:38;
      var tx0=Math.floor((cam.x-A[0]*Wd/cam.cs)/TX), tx1=Math.floor((cam.x+(1-A[0])*Wd/cam.cs)/TX), ty0=Math.floor((cam.y-A[1]*Hd/cam.cs)/TY), ty1=Math.floor((cam.y+(1-A[1])*Hd/cam.cs)/TY);
      var nV=(tx1-tx0+1)*(ty1-ty0+1), cx=Math.floor(cam.x/TX), cy=Math.floor(cam.y/TY);
      var vis=new Uint8Array(NP), allVis=nV>NP-2;
      if(!allVis){ for(var yy=ty0;yy<=ty1;yy++) for(var xx=tx0;xx<=tx1;xx++){ var sv=assign(xx,yy,t,false); if(sv>=0) vis[sv]=1; } } else vis.fill(1);
      if(focus>=0) vis[focus]=1;
      for(var v=0;v<NP;v++){ if(wasVis[v]&&!vis[v]&&pairs[v].star&&t-pairs[v].star<300&&!pairs[v].remote&&tileOf[v]&&remote.length<RCAP+ACAP0()+3){ var kk=tileOf[v].split(','); pairs[v].remote=1; pairs[v].lite(false); seen[v]=1e12; remote.push({slot:v,tx:+kk[0],ty:+kk[1],at:t,anc:true,star:true}); wasVis[v]=false; continue; }   /* a star leaving view stays in play, at full fidelity, for the eye to come back to */
        if(wasVis[v]&&!vis[v]) needFresh[v]=1; wasVis[v]=vis[v]; if(pairs[v].held&&pairs[v].hf&&(vis[v]||t-pairs[v].held>30)){ pairs[v].held=0; pairs[v].hf=0; } if(pairs[v].held&&t-pairs[v].held>45){ pairs[v].held=0; if(seen[v]>1e11) seen[v]=t; } }
      for(var nf=0,v2=0;v2<NP&&nf<3;v2++){ if(!needFresh[v2]||vis[v2]||v2===focus||pairs[v2].held||pairs[v2].remote) continue; needFresh[v2]=0; nf++;
        if(tileOf[v2]!==null){ delete byKey[tileOf[v2]]; tileOf[v2]=null; }
        pairs[v2].reseed((seedBase*31+(++freshN)*104729+v2*7919)>>>0,t); fresh[v2]=1; }
      mapO=[Math.max(tx0,cx-(MW>>1)),Math.max(ty0,cy-(MH>>1))]; mapN=[Math.min(MW,tx1-mapO[0]+1),Math.min(MH,ty1-mapO[1]+1)];
      mapBuf.fill(255); for(var k2 in byKey){ var c2=k2.split(','), mx=+c2[0]-mapO[0], my=+c2[1]-mapO[1]; if(mx<0||my<0||mx>=mapN[0]||my>=mapN[1]) continue; var sI=byKey[k2], j2=(my*MW+mx)*4; mapBuf[j2]=sI&255; mapBuf[j2+1]=sI>>8; }
      for(var jb=2;jb<mapBuf.length;jb+=4) mapBuf[jb]=0;
      for(var k3 in byKey){ var P3=pairs[byKey[k3]]; if(!P3.PL.some(function(c){ return c.overAt>=0&&t-c.overAt>.3&&t-c.overAt<1.9; })) continue;
        var c3=k3.split(','), fx=+c3[0]-mapO[0], fy=+c3[1]-mapO[1];
        for(var ddx=-1;ddx<2;ddx++) for(var ddy=0;ddy<3;ddy++){ var ux=fx-ddx, uy=fy-ddy; if(ux>=0&&uy>=0&&ux<mapN[0]&&uy<mapN[1]) mapBuf[(uy*MW+ux)*4+2]=255; } }
      gl.bindTexture(gl.TEXTURE_2D,mapTex); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,MW,MH,gl.RGBA,gl.UNSIGNED_BYTE,mapBuf);
      // far off, out of sight: up to ten games kept playing at random spots fifteen to forty tiles from the camera, so a long
      // trip goes to one that's really under way. Reached (in view), it's an ordinary game; another starts somewhere else
      for(var ri=remote.length-1;ri>=0;ri--){ var Rm=remote[ri]; if(vis[Rm.slot]||byKey[Rm.tx+','+Rm.ty]!==Rm.slot){ pairs[Rm.slot].remote=0; if(Rm.slot!==focus) pairs[Rm.slot].lite(true); seen[Rm.slot]=t; remote.splice(ri,1); } }
      // the set turns over slowly: every forty-five seconds or so the longest-running one goes back to the crowd and a fresh
      // spot elsewhere takes its place, so in time the full-fidelity games have been everywhere
      var ACAP=Math.round(RCAP*.6), nRot=remote.filter(function(R){ return !R.anc; }).length, nAnc=remote.length-nRot;
      while(remote.length>RCAP+ACAP){ var Rx=remote.pop(); pairs[Rx.slot].remote=0; if(Rx.slot!==focus) pairs[Rx.slot].lite(true); seen[Rx.slot]=t; }
      if(nRot>=RCAP&&t-(lastTurn||0)>45+Math.random()*15){ lastTurn=t; var oi=-1, oa=Infinity; remote.forEach(function(Rm,i){ var P=pairs[Rm.slot]; if(Rm.slot===focus||P.held||Rm.anc) return; if(Rm.at<oa){ oa=Rm.at; oi=i; } });
        if(oi>=0){ var Ro=remote[oi]; pairs[Ro.slot].remote=0; pairs[Ro.slot].lite(true); seen[Ro.slot]=t; remote.splice(oi,1); } }
      /* and a second set that stays put: further out (twenty-five to sixty tiles), scattered, each kept playing at full fidelity until the camera gets there */
      var wantAnc=nAnc<ACAP&&nRot>=Math.min(RCAP,4);
      if((nRot<RCAP||wantAnc)&&t-(lastRemote||0)>.5){ lastRemote=t; var an=Math.random()*Math.PI*2, rd=wantAnc&&nRot>=RCAP?25+Math.random()*35:15+Math.random()*25, rtx=cx+Math.round(Math.cos(an)*rd), rty=cy+Math.round(Math.sin(an)*rd*.8), rkey=rtx+','+rty;
        if(byKey[rkey]==null&&(rtx<tx0-1||rtx>tx1+1||rty<ty0-1||rty>ty1+1)){ var pick=-1; for(var q9=0;q9<NP;q9++){ var Q9=pairs[(q9+rr*7)%NP], qi=(q9+rr*7)%NP; if(vis[qi]||qi===focus||Q9.held||Q9.remote||Q9.ff()>0) continue; pick=qi; break; }
          if(pick>=0){ if(tileOf[pick]!==null) delete byKey[tileOf[pick]]; tileOf[pick]=rkey; byKey[rkey]=pick; seen[pick]=1e12; fresh[pick]=0; needFresh[pick]=0; pairs[pick].remote=1; pairs[pick].lite(false); remote.push({slot:pick,tx:rtx,ty:rty,at:t,anc:wantAnc&&nRot>=RCAP}); } } }   // full fidelity: the planner the camera's own game gets
      var F=pairs[focus]; if((GOV<.75)!==!!F.shallow){ F.shallow=GOV<.75; F.lite(false,!F.shallow); } F.step(t,4);   /* the watched match keeps its thinking time; on a slow device it searches narrower instead */
      if(remote.length&&(GOV>.75||(rrR&1))){ var rl=t0+(budget||6)*1.6*GOV; for(var rk=0;rk<remote.length&&rk<(GOV>.9?Math.max(3,Math.ceil(RCAP/4)):2)&&now()<rl;rk++){ var RP=pairs[remote[(rk+(rrR++))%remote.length].slot]; if(RP!==F&&!RP.held&&RP.ff()<=0) RP.step(t,1.2*GOV); } }
      // the crowd: as many as the frame's budget allows, round the ring; head starts get worked off first
      // head starts first, each game's run on several pieces at a time (the newest tiles in view were queued last, so
      // they're taken from the back), with more of the frame given over while there's a backlog
      var lim=t0+(ffQ.length?(budget||6)*(cam.cs<(csd||cam.cs)*.25?3.5:1.7):(budget||6)), n=0;
      // head starts: the ones in view first, a couple of pieces each in turn, so every board on screen fills in together
      // (like quick play) instead of sitting empty while another runs on; then the rest, one after another
      var vq=[]; for(var qv=0;qv<ffQ.length;qv++){ var Qv=ffQ[qv]; if(Qv!==F&&Qv.ff()>0&&vis[Qv.idx]) vq.push(Qv); }
      for(var qx=0;qx<ffQ.length;qx++){ if(!vis[ffQ[qx].idx]) ffQ[qx].vff=0; } vq.forEach(function(Qv){ if(!Qv.vff) Qv.vff=t; if(Qv.ff()>12&&Qv.cutFF&&(Qv.isLate()||t-Qv.vff>1.2)) Qv.cutFF(); });   /* in view and still being run on (to its end): it plays live from here instead of standing there with no piece in play */
      while(vq.length&&now()<lim){ var Qr=vq[(ffR++)%vq.length]; Qr.ffStep(t); if(Qr.ff()>0) Qr.ffStep(t); if(Qr.ff()<=0) vq.splice(vq.indexOf(Qr),1); }
      while(ffQ.length&&now()<lim){ var Q=ffQ[ffQ.length-1]; if(Q===F||Q.ff()<=0){ ffQ.pop(); continue; } for(var q=0;q<6&&Q.ff()>0;q++) Q.ffStep(t); }
      for(var ai=0;ai<NP;ai++){ var PA=pairs[ai]; if(vis[ai]&&PA!==F&&!PA.remote&&PA.ff()<=0&&PA.anim(t)) PA.step(t,1); }   /* a death or a restart in view runs every frame (it costs nothing): skipped frames made the fall stutter */
      var tinyNow=!!(cam&&csd&&cam.cs<csd*.14);   /* far out, the boards are a few pixels: the crowd plays by straight drops */
      lim=Math.max(lim,now()+(budget||6)*.8*GOV);   // the games on screen get their own time: a backlog of head starts elsewhere must never stall them
      while(now()<lim&&n<NP){ var P=pairs[rr]; rr=(rr+1)%NP; n++; if(P===F||P.ff()>0||!vis[P.idx]||P.remote) continue; P.tiny(tinyNow); P.step(t,2.5*GOV,true); }
      for(var i=0;i<NP;i++) if(vis[i]){ var Pi=pairs[i], tl=Pi.last>=0? Math.min(t,Pi.last+.12) : t; paintPair(Pi,tl,dt); }   // each game drawn on its own clock: one the budget skipped holds still rather than running ahead and jumping back
      jsEma+=(now()-t0-jsEma)*.05;
      gl.bindTexture(gl.TEXTURE_2D,tex);
      if(!texInit){ gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,AW,AH,0,gl.RGBA,gl.UNSIGNED_BYTE,sheet); texInit=true; }
      else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,AW,AH,gl.RGBA,gl.UNSIGNED_BYTE,sheet);
      var tin=ptr&&ptr.in?1:0; lit+=(tin-lit)*Math.min(1,dt*6); if(ptr&&ptr.in){ px=ptr.x; py=ptr.y; }
      var fb=F.PL[fside].bump;
      var tO=[Math.floor(cam.x/(cam.ts?cam.ts[0]:62)),Math.floor(cam.y/(cam.ts?cam.ts[1]:38))], TSv=cam.ts||[62,38];   /* positions relative to the tile in the middle: float32 holds a cell to a tiny fraction there, where far out (thousands of tiles) it rounds to whole pixels */
      ad.run(prog,{mapT:mapTex,mapO:[mapO[0]-tO[0],mapO[1]-tO[1]],mapN:mapN,tO:tO,sheet:tex,nb:[NBX,NBY],NP:NP,cam:[cam.x-tO[0]*TSv[0],cam.y-tO[1]*TSv[1],cam.cs],csd:csd,anchor:cam.anchor||[.5,.5],now:t,ptr:[px,py],ptrIn:lit,inks:inks,gap:cam.gap||0,TS:cam.ts||[62,38],ftile:[ftile[0]-tO[0],ftile[1]-tO[1]],fbump:Math.sin(fb*3.1416)*fb}); }
  }; }
