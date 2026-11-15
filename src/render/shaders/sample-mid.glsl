// In between: flat cells with an outline.
vec4 midSample0(vec2 l,float cs);
vec4 midSample(vec2 w,float cs){ vec2 ti=floor(w/TS), l; if(!pickB(w,l)) return vec4(0.); float al=AL; if(all(equal(ti,ftile))) l.y+=fbump*.12;
  vec4 r=midSample0(l,cs); r.a*=al; return r; }
vec4 midSample0(vec2 l,float cs){
  int side=SIDE; vec4 m0=metaAt(side); vec4 WR=side==1?vec4(28,1,10,20):vec4(6,1,10,20);
  float lx=mod(l.x,22.), sh=0.;
  if(lx>.5&&lx<5.4&&l.y>24.-6.5) sh=metaAt(2+side*6).r; else if(lx>16.5&&lx<21.9){ int si=int(clamp(floor((24.-3.5-l.y)/3.),0.,4.)); sh=metaAt(3+side*6+si).r; }
  vec2 qc=l-vec2(sh,0.); qc.y+=CDROP; ivec2 c=ivec2(floor(qc)); ivec4 me=cellAt(c);
  if(me.r>0){ vec2 f=fract(qc); float d=9.;
    if(!same(me,cellAt(c+ivec2(-1,0)))) d=min(d,f.x); if(!same(me,cellAt(c+ivec2(1,0)))) d=min(d,1.-f.x);
    if(!same(me,cellAt(c+ivec2(0,-1)))) d=min(d,f.y); if(!same(me,cellAt(c+ivec2(0,1)))) d=min(d,1.-f.y);
    float edge=1.-smoothstep(.06,.2,d), flash=float(me.a)/255.; vec3 ink=inkOf(me.r);
    if(me.b==1) return vec4(ink*.85,edge*.6);
    if(me.b==2) ink=mix(ink,vec3(.45),.5);
    // weight as the chisel prints it: full on the face, tapering to nothing right at the outline
    return vec4(mix(ink,vec3(.93,.9,.82),flash*.7),mix(1.,.35,edge)); }
  WT_=max(.3,1.3/cs);
  if(wallAt(l,WR,0.)>0.) return vec4(mix(vec3(70,112,100)/255.,vec3(150,58,66)/255.,m0.r),.8);
  float incN=m0.g*255.; if(incN>.5&&l.x>WR.x-.98&&l.x<WR.x-.62&&l.y>WR.y&&l.y<WR.y+min(incN,WR.w)) return vec4(vec3(196,56,44)/255.,.9);
  return vec4(0.); }
// printed the way the full-size board is: ink laid down as lines on the page's pitch, each line as thick as the ink is
// heavy there (a pixel half covered prints a thinner line, as a half-lit bevel does up close), ragged at the edges, a
// little uneven in density, with the faint halo round each line
