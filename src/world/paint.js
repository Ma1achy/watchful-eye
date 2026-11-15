// Painting the atlas: every game the sea holds has a 44x25 block of an RGBA8 texture, its two boards, holds and queues
// cell by cell (kind, piece id, flags), and a row of metadata (danger, garbage, the knock-out fall, the spin twist).
import { SEAW } from '../engine/pool.js';
import { reveal } from '../reveal.js';

export function createPainter(ctx){ var sheet=ctx.sheet, AW=ctx.AW, NBX=ctx.NBX;
  function setCell(bx,by,x,y,t,pid,flag,fl){ if(x<0||y<0||x>=44||y>=24) return; var j=((by+y)*AW+bx+x)*4; sheet[j]=t; sheet[j+1]=pid; sheet[j+2]=flag; sheet[j+3]=fl; }
  function paintPlayer(c,bx,by,ox,t){ var g=c.g, st=g.st, ov=c.overAt>=0&&t-c.overAt<.4? Math.sin(Math.max(0,t-c.overAt)/.4*Math.PI)*.85 : 0, WX=ox+6, H=g.H, W=g.W, b=st.b, y0=H-23;
    for(var y=Math.max(0,y0);y<H;y++){ var by_=1+(H-1-y); for(var x=0;x<W;x++){ var v=b[y*W+x]; if(!v) continue; var fl=0;
      if(c.flash&&c.flash.rows.indexOf(y)>=0) fl=Math.round(255*Math.min(1,Math.sin(Math.min(1,(t-c.flash.t)/c.flash.d)*Math.PI)*1.2));
      if(ov) fl=Math.round(255*ov); setCell(bx,by,WX+x,by_,v,st.pid[y*W+x],0,fl); } }
    if(st.cur&&st.pos&&!st.over&&(c.mode==='move'||c.mode==='think')){ var gy=g.ghostY(), s=g.ROT[st.cur][st.pos.r], ti=g.NAMES.indexOf(st.cur)+1;
      if(gy!==st.pos.y) s.forEach(function(q){ setCell(bx,by,WX+st.pos.x+q[0],1+(H-1-(gy+q[1])),ti,249,1,0); });
      s.forEach(function(q){ setCell(bx,by,WX+st.pos.x+q[0],1+(H-1-(st.pos.y+q[1])),ti,248,0,0); }); }
    function shape(k,x0,top,pid,flag){ var s=g.ROT[k][0], mx=9, my=9; s.forEach(function(q){ mx=Math.min(mx,q[0]); my=Math.min(my,q[1]); }); s.forEach(function(q){ setCell(bx,by,x0+q[0]-mx,top-(q[1]-my),g.NAMES.indexOf(k)+1,pid,flag,0); }); }
    if(st.hold) shape(st.hold,ox+1,19,250,st.held?2:0);
    for(var i=0;i<5;i++) if(st.queue[i]) shape(st.queue[i],ox+17,19-i*3,251+i,0); }
  function meta(bx,by,i,r,g2,b2,a){ var j=((by+24)*AW+bx+i)*4; sheet[j]=r; sheet[j+1]=g2; sheet[j+2]=b2; sheet[j+3]=a; }
  function paintPair(P,t,dt){ if(typeof SEAW!=="undefined"&&SEAW.on){ SEAW.seen[P.idx]={t:performance.now(),hi:!P.tn}; P.wsync(t); } var bx=(P.idx%NBX)*44, by=Math.floor(P.idx/NBX)*25;
    for(var y=0;y<25;y++){ var j=((by+y)*AW+bx)*4; sheet.fill(0,j,j+44*4); }
    var moving=false;
    P.PL.forEach(function(c,k){ var fu=c.overAt>=0? Math.max(0,Math.min(1,(t-c.overAt-.35)/1.3)) : 0, eu=reveal.hidden? 0 : Math.min(Math.max(0,Math.min(1,(t-c.enterAt)/.85)), reveal.at? Math.max(0,Math.min(1,(performance.now()-reveal.at)/1400)) : 1),   /* after the preload every board comes in together */ su=c.wonAt>=0? Math.max(0,Math.min(1,(t-c.wonAt-.5)/1.5)) : 0;
      if(fu>0||eu<1||su>0) moving=true; meta(bx,by,14+k,fu>0?Math.max(1,Math.round(fu*255)):0,c.fdir>0?255:0,Math.round(eu*255),su>0?Math.max(1,Math.round(su*255)):0); });
    meta(bx,by,16,moving?255:0,0,0,0);
    P.PL.forEach(function(c,k){ paintPlayer(c,bx,by,k*22,t);
      for(var s=0;s<6;s++){ var hh=dt/6; c.twv+=(-900*c.tw-34*c.twv)*hh; c.tw+=c.twv*hh; } c.tw=Math.max(-.055,Math.min(.055,c.tw)); c.bump*=Math.pow(.0005,dt);
      var g=c.g, dg=0, R=g.st.b; for(var y=g.H-24;y<g.H;y++){ var any=false; for(var x=0;x<g.W;x++) if(R[y*g.W+x]){ any=true; break; } if(any){ dg=g.H-y; break; } }
      var n=P.inc(c), dz=Math.max(0,Math.min(1,(dg+n-(g.VIS-6))/5));
      meta(bx,by,k,Math.round(dz*255),Math.min(255,n),P.hot(c,t)*255,Math.round((c.tw/.12+.5)*255));
      var st=g.st, Wd=function(q){ return !q?0:q==='I'?0:q==='O'?255:128; }; meta(bx,by,2+k*6,Wd(st.hold),0,0,0); for(var q=0;q<5;q++) meta(bx,by,3+k*6+q,Wd(st.queue[q]),0,0,0); }); }
  return {paintPair:paintPair}; }
