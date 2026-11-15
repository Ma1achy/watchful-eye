// Close up: the full chiselled, striped print of every cell.
vec3 nearShade(vec3 col,vec2 p,vec2 w,float cs,float P,float ph,float yy,vec2 mp){
  vec3 col0=col; vec2 ti=floor(w/TS); vec2 l; if(!pickB(w,l)) return col; float al=AL;
  bool isF=all(equal(ti,ftile)); if(isF) l.y+=fbump*.12;
  int side=SIDE; vec4 m0=metaAt(side);
  float danger=m0.r, incN=m0.g*255., hot=m0.b, twist=(m0.a-.5)*.12;
  vec4 WR=side==1?vec4(28,1,10,20):vec4(6,1,10,20);
  vec2 C=WR.xy+WR.zw*.5, d0=l-C; vec2 prt=C+vec2(cos(twist)*d0.x-sin(twist)*d0.y,sin(twist)*d0.x+cos(twist)*d0.y);
  vec2 q0=prt; float wn=sc_f(p/(cs*.12))*.035*min(1.,cs/12.); WT_=max(.3,1.3/cs);
  float lx=mod(q0.x,22.); float sh=0.;
  if(lx>.5&&lx<5.4&&q0.y>24.-6.5) sh=metaAt(2+side*6).r;
  else if(lx>16.5&&lx<21.9){ int si=int(clamp(floor((24.-3.5-q0.y)/3.),0.,4.)); sh=metaAt(3+side*6+si).r; }
  vec2 qc=q0-vec2(sh,0.); qc.y+=CDROP;
  // how much of the print's striping a cell this size can carry: none until a cell is about a line pitch tall (striping
  // anything smaller makes cells drop between the lines and flicker as the camera moves), all of it by twice that
  float sk=clamp((cs-5.)/4.,0.,1.);
  float w1=wallAt(q0,WR,wn);
  if(w1>0.){ float wa=mix(.5,clamp((.33-abs(ph))*P/1.6,0.,1.),sk)*(.8+.2*sc_f(p/(cs*.9)+1.));
    vec3 wc=mix(vec3(70,112,100)/255.,vec3(150,58,66)/255.,danger); col=mix(col,wc,wa); }
  if(incN>.5&&q0.x>WR.x-.98&&q0.x<WR.x-.62&&q0.y>WR.y&&q0.y<WR.y+min(incN,WR.w)){ float ma=mix(.75,clamp((.4-abs(ph))*P/1.6,0.,1.),sk)*(.85+.15*sc_f(p/(cs*.5)+4.));
    vec3 mc=mix(vec3(196,56,44)/255.,vec3(.95,.9,.8),hot*(.5+.5*sin(now*16.))); col=mix(col,mc,ma); }
  ivec2 c=ivec2(floor(qc)); ivec4 me=cellAt(c);
  { float lq=mod(qc.x,22.); if(sh>0.&&((lx<5.4&&(lq<1.||lq>=5.))||(lx>16.5&&(lq<17.||lq>=21.)))) me=ivec4(0); }
  if(me.r>0){
    vec2 reg=floor((vec2(sc_h(vec2(float(me.g),1.)),sc_h(vec2(float(me.g),2.)))-.5)*vec2(4.6,2.6))*min(1.,cs/30.);
    vec2 q=qc-reg/cs; ivec2 c2=ivec2(floor(q)); ivec4 m2=cellAt(c2);
    if(m2.r>0&&m2.g==me.g){ me=m2; c=c2; vec2 f=fract(q);
      bool oL=!same(me,cellAt(c+ivec2(-1,0))), oR=!same(me,cellAt(c+ivec2(1,0))), oD=!same(me,cellAt(c+ivec2(0,-1))), oU=!same(me,cellAt(c+ivec2(0,1)));
      float d=9.; vec2 o=vec2(0,1);
      if(oL&&f.x<d){ d=f.x; o=vec2(-1,0); } if(oR&&1.-f.x<d){ d=1.-f.x; o=vec2(1,0); } if(oD&&f.y<d){ d=f.y; o=vec2(0,-1); } if(oU&&1.-f.y<d){ d=1.-f.y; o=vec2(0,1); }
      if(!oL&&!oD&&!same(me,cellAt(c+ivec2(-1,-1)))){ float k=length(f); if(k<d){ d=k; o=-normalize(f+1e-4); } }
      if(!oR&&!oD&&!same(me,cellAt(c+ivec2(1,-1)))){ vec2 g=f-vec2(1,0); float k=length(g); if(k<d){ d=k; o=-normalize(g+1e-4); } }
      if(!oL&&!oU&&!same(me,cellAt(c+ivec2(-1,1)))){ vec2 g=f-vec2(0,1); float k=length(g); if(k<d){ d=k; o=-normalize(g+1e-4); } }
      if(!oR&&!oU&&!same(me,cellAt(c+ivec2(1,1)))){ vec2 g=f-vec2(1,1); float k=length(g); if(k<d){ d=k; o=-normalize(g+1e-4); } }
      float bev=.24; float t=d<bev? clamp((bev-d)/(bev*.25),0.,1.) : clamp(1.-(d-bev)/(1.-bev),0.,1.)*.5;
      vec3 N=normalize(vec3(o*t,1.));
      vec3 Ld=normalize(vec3(-.55,.62,.56)); vec2 lv=(mp-p)/cs; vec3 Lp=normalize(vec3(lv,4.)); float lw=ptrIn*exp(-dot(lv,lv)/60.); vec3 Lt=normalize(mix(Ld,Lp,lw*.9));
      float lit=.12+clamp(dot(N,Lt),0.,1.)*(1.+.25*lw);
      float tip=clamp(d/(.07*max(1.,6./cs)),0.,1.); float th=lit*tip;
      float flash=float(me.a)/255.; vec3 ink=inkOf(me.r);
      if(me.b==1){ th=(d<bev*.6? .62:.07)*tip; ink*=.85; }
      if(me.b==2){ th*=.55; ink=mix(ink,vec3(.45),.5); }
      th=mix(th,1.25,flash); ink=mix(ink,vec3(.93,.9,.82),flash*.7);
      float ragged=sc_n(p/(csd*.058))*.022+sc_n(p/(csd*.7)+5.)*.04;
      float half_=clamp(pow(th,1.25)*.42+ragged*step(.04,th),0.,.5);
      float phk=fract((yy+reg.y)/P+.5)-.5;
      float a=clamp((half_-abs(phk))*P/1.6,0.,1.);
      // a cell only a few lines tall can't carry the stripes: it fades to a flat print of the same weight
      a=mix(clamp(half_*2.,0.,.95),a,sk);
      float dn=.86+.10*sc_n(p/(csd*.47)+11.)+.05*sc_n(p/(csd*.09)+13.);
      float halo=clamp((half_+.10-abs(phk))*P/5.,0.,1.)*.10;
      col=mix(col,ink,clamp(a*dn,0.,1.))+ink*halo*(1.-a);
    }
  }
  return mix(col0,col,al); }
// between the two: each cell flat, its piece's outline cut in darker (the chisel, reduced to a line), the walls and the
// garbage bar drawn plainly, four looks per pixel so the outlines hold still while the camera moves
