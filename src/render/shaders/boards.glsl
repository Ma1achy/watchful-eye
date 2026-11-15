// A board in its tile: placement, the knock-out fall and spin twist, walls and hit tests.
float AL=1., CDROP=0.; int SIDE=0;
vec2 xform(vec2 l,int side,vec4 an){ vec2 piv=vec2(float(side)*22.+11.,24.); CDROP=0.;
  if(an.r>0.){ float T=an.r*1.3, dir=an.g>.5?1.:-1.; float dt=max(0.,T-.06);
    // it drops, and twists as it drops: the turn grows with the fall (to ~55 degrees as it fades), none before it goes
    float th=dir*(.12*dt+1.15*dt*dt); vec2 d=l-piv-vec2(dir*1.2*dt,-80.*dt*dt); float c=cos(th), s=sin(th);
    AL=1.-smoothstep(.55,1.15,T);   // a board and a half down by the time it's gone
    return piv+vec2(c*d.x+s*d.y,-s*d.x+c*d.y); }
  if(an.b<.999){ float u=an.b, e=1.-pow(1.-u,3.), sc=mix(.03,1.,e); vec2 cen=vec2(float(side)*22.+11.,12.); AL=smoothstep(0.,.35,u); return cen+(l-cen)/sc; }
  // the winner rumbles its board empty: a quick left-right shake, the pieces sliding out through the floor
  if(an.a>0.){ float T=an.a; CDROP=30.*T*T; AL=1.; float amp=.5*sin(3.1416*min(1.,T*1.25)); return l-vec2(sin(T*62.)*amp,0.); }
  AL=1.; return l; }
bool bWall(vec2 q,int s){ float x0=s==1?28.:6.; bool side=(q.x>x0-.5&&q.x<x0-.1)||(q.x>x0+10.1&&q.x<x0+10.5); return (side&&q.y>.5&&q.y<21.)||(q.y>.5&&q.y<.9&&q.x>x0-.5&&q.x<x0+10.5); }
bool inB(vec2 q,int s){ return q.x>=float(s)*22.&&q.x<float(s)*22.+22.&&q.y>-.6&&q.y<24.6; }   // strictly its own columns: never the neighbour's hold or queue
// does this point of a board have something on it (a piece, a wall, the garbage bar, the hold or the queue)
bool hitB(vec2 q,int s){ float lx=q.x-float(s)*22., sh=0.; q.y+=0.;
  if(lx>.5&&lx<5.4&&q.y>24.-6.5) sh=metaAt(2+s*6).r; else if(lx>16.5&&lx<21.9){ int si=int(clamp(floor((24.-3.5-q.y)/3.),0.,4.)); sh=metaAt(3+s*6+si).r; }
  float x0=s==1?28.:6., incN=metaAt(s).g*255.; if(incN>.5&&q.x>x0-.98&&q.x<x0-.62&&q.y>1.&&q.y<1.+min(incN,20.)) return true;
  return cellAt(ivec2(floor(q-vec2(sh,-CDROP)))).r>0||bWall(q,s); }
bool pickB(vec2 w,out vec2 lo){ vec2 ti=floor(w/TS), l=w-ti*TS; lo=l; CDROP=0.;
  vec2 mm=ti-mapO; bool nf=mm.x>=0.&&mm.y>=0.&&mm.x<mapN.x&&mm.y<mapN.y&&texelFetch(mapT,ivec2(mm),0).b>.5;   // a falling board near?
  BO=blockOf(slotOf(ti)); bool mv=metaAt(16).r>.5; vec4 a0=metaAt(14), a1=metaAt(15);
  // the boards still in play: drawn as ever; where one falls past, the live board's pieces and walls stay in front
  bool have=false; vec2 qh=l; int sh=0; float alh=1., cdh=0.;
  if(!mv){ if(l.x<45.+gap&&l.y<24.8){ int s0=l.x>=22.+gap*.5?1:0; vec2 lb=l-vec2(float(s0)*gap,0.); bool inGap=lb.x<float(s0)*22.||lb.x>=float(s0)*22.+22.; if(!inGap&&(!nf||hitB(lb,s0))){ lo=lb; AL=1.; SIDE=s0; return true; } if(!inGap){ have=true; qh=lb; sh=s0; } } }   // the pair's boards sit gap apart (and in the gap, neither board: no reading past its edge into the other's hold or queue) (set to suit the screen)
  else for(int s=0;s<2;s++){ vec4 an=s==0?a0:a1; if(an.r>0.) continue; vec2 q=xform(l-vec2(float(s)*gap,0.),s,an);
    if(AL>.003&&inB(q,s)){ if(!nf||hitB(q,s)){ lo=q; SIDE=s; return true; } if(!have){ have=true; qh=q; sh=s; alh=AL; cdh=CDROP; } } }
  // the falling ones: this tile's, the two above, and up and to either side (tipped over into this one)
  if(nf||mv) for(int k=0;k<9;k++){ int dy=k/3, km=k-(k/3)*3, dx=km==0?0:km==1?1:-1; if(dx==1&&l.x<38.+gap) continue; if(dx==-1&&l.x>24.) continue; if(!nf&&k>0) break; vec2 dv=vec2(float(dx),float(dy));
    BO=blockOf(slotOf(ti+dv)); if(metaAt(16).r<.5) continue; vec2 lj=l-dv*TS; vec4 b0=metaAt(14), b1=metaAt(15);
    for(int s=0;s<2;s++){ vec4 an=s==0?b0:b1; if(an.r<=0.||(dx==1&&s==1)||(dx==-1&&s==0)) continue; vec2 q=xform(lj-vec2(float(s)*gap,0.),s,an); if(AL>.003&&inB(q,s)&&(!nf||hitB(q,s))){ lo=q; SIDE=s; return true; } } }
  if(have){ BO=blockOf(slotOf(ti)); lo=qh; SIDE=sh; AL=alh; CDROP=cdh; return true; }
  AL=0.; return false; }
float WT_=.3;   // wall thickness in cells: at least a pixel and a bit, so far-off walls don't break up as they move
float wallAt(vec2 q0,vec4 W,float wn){ float o=.14+WT_;
  bool wl=q0.x>W.x-o+wn&&q0.x<W.x-.14+wn, wr=q0.x>W.x+W.z+.14+wn&&q0.x<W.x+W.z+o+wn;
  bool inY=q0.y>W.y-o&&q0.y<W.y+W.w+.02, fl=q0.y>W.y-o+wn&&q0.y<W.y-.14+wn&&q0.x>W.x-o&&q0.x<W.x+W.z+o;
  return (((wl||wr)&&inY)||fl)?1.:0.; }
// what a far-off pixel shows: the share of its footprint that's ink, and the ink
