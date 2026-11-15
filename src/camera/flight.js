// The shape of a camera move: how far along its path it is at time u (an ease, or a given start speed), and where.
export function along(S,u){ if(S.m0!=null){ var m=S.m0; return Math.min(1,Math.max(0,(u*u*u-2*u*u+u)*m+(3*u*u-2*u*u*u))); }   // carrying on at the speed it had, easing to a stop
  var E=S.ease||{p:3,a:0}, b=Math.pow(u,E.p)/(Math.pow(u,E.p)+Math.pow(1-u,E.p)); return Math.min(1,Math.max(0,b+E.a*Math.sin(2*Math.PI*b)/(2*Math.PI))); }
export function pointOn(S,e){ var F=S.from, T=S.to, P=S.path||{type:'arc'}, dx=T.x-F.x, dy=T.y-F.y, d=Math.hypot(dx,dy)||1, nx=-dy/d, ny=dx/d, ie=1-e, x, y;
  if(P.type==='line'){ x=F.x+dx*e; y=F.y+dy*e; }
  else if(P.type==='s'){ var c1x=F.x+dx/3+nx*P.b1, c1y=F.y+dy/3+ny*P.b1, c2x=F.x+dx*2/3+nx*P.b2, c2y=F.y+dy*2/3+ny*P.b2;
    x=ie*ie*ie*F.x+3*ie*ie*e*c1x+3*ie*e*e*c2x+e*e*e*T.x; y=ie*ie*ie*F.y+3*ie*ie*e*c1y+3*ie*e*e*c2y+e*e*e*T.y; }
  else { var C=S.ctrl||{x:F.x+dx/2,y:F.y+dy/2}; x=ie*ie*F.x+2*ie*e*C.x+e*e*T.x; y=ie*ie*F.y+2*ie*e*C.y+e*e*T.y;
    if(P.type==='wiggle'){ var w=P.amp*Math.sin(Math.PI*P.n*e+P.ph)*Math.sin(Math.PI*e); x+=nx*w; y+=ny*w; } }
  return [x,y]; }
