var SCAN_BODY=`
uniform highp sampler2D sheet; uniform vec2 sheetN; uniform vec4 wellR; uniform float now; uniform vec2 ptr; uniform float ptrIn;
uniform float inks; uniform float bump; uniform float danger; uniform vec2 anchor; uniform float fill;
uniform vec4 wellR2; uniform float danger2; uniform vec2 meter1; uniform vec2 meter2; uniform float slotSh[12]; uniform float twist1; uniform float twist2;
float sc_h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float sc_n(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(sc_h(i),sc_h(i+vec2(1,0)),u.x),mix(sc_h(i+vec2(0,1)),sc_h(i+vec2(1,1)),u.x),u.y)*2.-1.; }
float sc_f(vec2 p){ return (sc_n(p)+.5*sc_n(p*2.03+7.)+.25*sc_n(p*4.1+3.))/1.75; }
vec3 inkOf(int t){
  if(t==8) return vec3(.6,.6,.57);                                    // garbage
  if(inks<.5){ // the cover's three inks
    vec3 G=vec3(36,150,92)/255., M=vec3(170,52,140)/255., O=vec3(238,92,44)/255.;
    if(t==1) return G; if(t==2) return O; if(t==3) return G; if(t==4) return M; if(t==5) return O; if(t==6) return M; return G; }
  if(t==1) return vec3(49,199,239)/255.; if(t==2) return vec3(247,211,8)/255.; if(t==3) return vec3(173,77,156)/255.; if(t==4) return vec3(66,182,66)/255.;
  if(t==5) return vec3(239,32,41)/255.; if(t==6) return vec3(90,101,173)/255.; return vec3(239,121,33)/255.; }
ivec4 cellAt(ivec2 c){ if(c.x<0||c.y<0||c.x>=int(sheetN.x)||c.y>=int(sheetN.y)) return ivec4(0); return ivec4(texelFetch(sheet,c,0)*255.+.5); }
bool same(ivec4 a,ivec4 b){ return b.r>0 && a.g==b.g && a.b==b.b; }
float wallAt(vec2 q0,vec4 W,float wn){ if(W.z<.5) return 0.;
  bool wl=q0.x>W.x-.44+wn&&q0.x<W.x-.14+wn, wr=q0.x>W.x+W.z+.14+wn&&q0.x<W.x+W.z+.44+wn;
  bool inY=q0.y>W.y-.44&&q0.y<W.y+W.w+.02, fl=q0.y>W.y-.44+wn&&q0.y<W.y-.14+wn&&q0.x>W.x-.44&&q0.x<W.x+W.z+.44;
  return (((wl||wr)&&inY)||fl)?1.:0.; }
vec2 meterAt(vec2 q0,vec4 W,vec2 M){ if(W.z<.5||M.x<.01) return vec2(0.); bool on=q0.x>W.x-.98&&q0.x<W.x-.62&&q0.y>W.y&&q0.y<W.y+min(M.x,W.w); return on?vec2(1.,M.y):vec2(0.); }
vec4 run(){
  vec2 p=uv*res; float cs=floor(min(res.x/sheetN.x,res.y/sheetN.y)*fill); vec2 org=floor(res*anchor-cs*sheetN*.5); org.y-=bump*cs*.12;
  float P=max(4.,cs/4.3);                                                   // stripe pitch
  vec2 mp=ptr*res; float pr=length(p-mp)/(cs*3.2); float near=ptrIn*exp(-pr*pr);
  // the page lines part around the pointer, as if it pressed into the paper
  float yy=p.y;
  float ph=fract(yy/P+.5)-.5;
  // ground: mottled charcoal, teal page lines on the pitch, faint maroon between
  float mott=(sc_f(p/(cs*1.6))*7.+sc_f(p/(cs*.3))*3.+(sc_h(floor(p))-.5)*4.4)/255.;
  vec3 ground=vec3(42,45,43)/255.+mott; vec3 col=ground;
  float dens=(.75+.25*sc_f(p/(cs*1.05)+3.))*(1.+.9*near);
  col+=clamp(1.-abs(ph)/.055,0.,1.)*dens*(vec3(58,128,118)/255.-ground)*.85;
  col+=clamp(1.-abs(abs(ph)-.5)/.04,0.,1.)*(.5+.5*sc_f(p/(cs*.8)+9.))*(vec3(92,44,54)/255.-ground)*.35;
  // the well: walls and floor in page-line teal, printed as stripes, going maroon as the stack nears the top
  // a spin tips the board a few degrees its way; the print's lines stay level
  vec2 prt=p; { bool s2=(p.x-org.x)/cs>=22.; float a=s2?twist2:twist1; vec4 W=s2?wellR2:wellR; vec2 C=org+(W.xy+W.zw*.5)*cs, d=p-C; prt=C+vec2(cos(a)*d.x-sin(a)*d.y,sin(a)*d.x+cos(a)*d.y); }
  vec2 q0=(prt-org)/cs; float wn=sc_f(p/(cs*.12))*.035;
  // the hold and next pieces sit centred in their boxes: shift each slot by half its spare width
  float lx=mod(q0.x,22.); int side=q0.x>=22.?6:0; float sh=0.;
  if(lx>.5&&lx<5.4&&q0.y>sheetN.y-6.5) sh=slotSh[side];
  else if(lx>16.5&&lx<21.9){ int si=int(clamp(floor((sheetN.y-3.5-q0.y)/3.),0.,4.)); sh=slotSh[side+1+si]; }
  vec2 pc=prt-vec2(sh*cs,0.); vec2 qc=(pc-org)/cs;
  float w1=wallAt(q0,wellR,wn), w2=wallAt(q0,wellR2,wn);
  if(w1+w2>0.){ float wa=clamp((.33-abs(ph))*P/1.6,0.,1.)*(.8+.2*sc_f(p/(cs*.9)+1.));
    vec3 wc=mix(vec3(70,112,100)/255.,vec3(150,58,66)/255.,w1>0.?danger:danger2); col=mix(col,wc,wa); }
  // the incoming-garbage bar beside each well, red, flashing once it's about to come up
  vec2 mt=meterAt(q0,wellR,meter1)+meterAt(q0,wellR2,meter2);
  if(mt.x>0.){ float ma=clamp((.4-abs(ph))*P/1.6,0.,1.)*(.85+.15*sc_f(p/(cs*.5)+4.));
    vec3 mc=mix(vec3(196,56,44)/255.,vec3(.95,.9,.8),mt.y*(.5+.5*sin(now*16.))); col=mix(col,mc,ma); }
  // which cell, and the piece there; each piece is printed a pixel or two out of register
  ivec2 c=ivec2(floor(qc)); ivec4 me=cellAt(c);
  { float lq=mod(qc.x,22.); if(sh>0.&&((lx<5.4&&(lq<1.||lq>=5.))||(lx>16.5&&(lq<17.||lq>=21.)))) me=ivec4(0); }   // a shifted box only ever reads itself
  if(me.r>0){
    vec2 reg=floor((vec2(sc_h(vec2(float(me.g),1.)),sc_h(vec2(float(me.g),2.)))-.5)*vec2(4.6,2.6))*min(1.,cs/30.);
    vec2 q=(pc-reg-org)/cs; ivec2 c2=ivec2(floor(q)); ivec4 m2=cellAt(c2);
    if(m2.r>0&&m2.g==me.g){ me=m2; c=c2; vec2 f=fract(q);
      // distance to the piece's own outline (none where its own blocks meet), and which way is out
      bool oL=!same(me,cellAt(c+ivec2(-1,0))), oR=!same(me,cellAt(c+ivec2(1,0))), oD=!same(me,cellAt(c+ivec2(0,-1))), oU=!same(me,cellAt(c+ivec2(0,1)));
      float d=9.; vec2 o=vec2(0,1);
      if(oL&&f.x<d){ d=f.x; o=vec2(-1,0); } if(oR&&1.-f.x<d){ d=1.-f.x; o=vec2(1,0); } if(oD&&f.y<d){ d=f.y; o=vec2(0,-1); } if(oU&&1.-f.y<d){ d=1.-f.y; o=vec2(0,1); }
      if(!oL&&!oD&&!same(me,cellAt(c+ivec2(-1,-1)))){ float k=length(f); if(k<d){ d=k; o=-normalize(f+1e-4); } }
      if(!oR&&!oD&&!same(me,cellAt(c+ivec2(1,-1)))){ vec2 g=f-vec2(1,0); float k=length(g); if(k<d){ d=k; o=-normalize(g+1e-4); } }
      if(!oL&&!oU&&!same(me,cellAt(c+ivec2(-1,1)))){ vec2 g=f-vec2(0,1); float k=length(g); if(k<d){ d=k; o=-normalize(g+1e-4); } }
      if(!oR&&!oU&&!same(me,cellAt(c+ivec2(1,1)))){ vec2 g=f-vec2(1,1); float k=length(g); if(k<d){ d=k; o=-normalize(g+1e-4); } }
      // a crisp chisel round the outline, a cushioned face inside it
      float bev=.24; float t=d<bev? clamp((bev-d)/(bev*.25),0.,1.) : clamp(1.-(d-bev)/(1.-bev),0.,1.)*.5;
      vec3 N=normalize(vec3(o*t,1.));
      vec3 Ld=normalize(vec3(-.55,.62,.56)); vec2 lv=(mp-p)/cs; vec3 Lp=normalize(vec3(lv,4.)); float lw=ptrIn*exp(-dot(lv,lv)/60.); vec3 Lt=normalize(mix(Ld,Lp,lw*.9));
      float lit=.12+clamp(dot(N,Lt),0.,1.)*(1.+.25*lw);
      float tip=clamp(d/.07,0.,1.); float th=lit*tip;
      float flash=float(me.a)/255.; vec3 ink=inkOf(me.r);
      if(me.b==1){ th=(d<bev*.6? .62:.07)*tip; ink*=.85; }                 // the ghost: the same chisel, as a hairline outline
      if(me.b==2){ th*=.55; ink=mix(ink,vec3(.45),.5); }                      // the held piece, spent for this turn
      th=mix(th,1.25,flash); ink=mix(ink,vec3(.93,.9,.82),flash*.7);
      float ragged=sc_n(p/(cs*.058))*.022+sc_n(p/(cs*.7)+5.)*.04;
      float half_=clamp(pow(th,1.25)*.42+ragged*step(.04,th),0.,.5);
      float phk=fract((yy+reg.y)/P+.5)-.5;
      float a=clamp((half_-abs(phk))*P/1.6,0.,1.);
      float dn=.86+.10*sc_n(p/(cs*.47)+11.)+.05*sc_n(p/(cs*.09)+13.);
      float fk=sc_h(floor(p/1.7)+floor(now*0.)); dn*=fk>.997?.35:1.;
      float halo=clamp((half_+.10-abs(phk))*P/5.,0.,1.)*.10;
      col=mix(col,ink,a*dn)+ink*halo*(1.-a);
    }
  }
  if(sc_h(floor(p/1.3)+71.)>.99965) col+=.16;                               // dust
  return vec4(col,1.); }`;function ScanTetrisGame(opt){opt=opt||{};var W=10,VIS=20,BUF=20,H=VIS+BUF,NAMES="IOTSZJL",BASE={I:[[0,1],[1,1],[2,1],[3,1]],O:[[1,0],[2,0],[1,1],[2,1]],T:[[1,0],[0,1],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]]},ROT={};NAMES.split("").forEach(function(k){for(var n=k==="I"?4:3,r=[BASE[k]],i=1;i<4;i++)r.push(k==="O"?BASE[k]:r[i-1].map(function(c){return[n-1-c[1],c[0]]}));ROT[k]=r});var KJ={"01":[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],10:[[0,0],[1,0],[1,-1],[0,2],[1,2]],12:[[0,0],[1,0],[1,-1],[0,2],[1,2]],21:[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],23:[[0,0],[1,0],[1,1],[0,-2],[1,-2]],32:[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],30:[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],"03":[[0,0],[1,0],[1,1],[0,-2],[1,-2]]},KI={"01":[[0,0],[1,0],[-2,0],[-2,-1],[1,2]],10:[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],12:[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],21:[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],23:[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],32:[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],30:[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],"03":[[0,0],[-1,0],[2,0],[2,-1],[-1,2]]},K180={"02":[[0,0],[0,1],[1,1],[-1,1],[1,0],[-1,0]],20:[[0,0],[0,-1],[-1,-1],[1,-1],[-1,0],[1,0]],13:[[0,0],[1,0],[1,2],[1,1],[0,2],[0,1]],31:[[0,0],[-1,0],[-1,2],[-1,1],[0,2],[0,1]]},KI180={"02":[[0,0],[0,1]],20:[[0,0],[0,-1]],13:[[0,0],[1,0]],31:[[0,0],[-1,0]]};function mulberry(a){return function(){a|=0,a=a+1831565813|0;var t=Math.imul(a^a>>>15,1|a);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var G={W,H,VIS,BUF,ROT,NAMES};G.seed=opt.seed!=null?opt.seed>>>0:((Date.now()^Math.floor(Math.random()*1e9))>>>0)%1e6;var rnd;function rowsOf(b){var R=b.__r;if(R)return R;R=new Int32Array(H);for(var y=0;y<H;y++){for(var m=0,o=y*W,x=0;x<W;x++)b[o+x]&&(m|=1<<x);R[y]=m}return b.__r=R,R}var PMR={};NAMES.split("").forEach(function(k){PMR[k]=ROT[k].map(function(s){var rows={},mn=9,mx=-9;s.forEach(function(c){rows[c[1]]=(rows[c[1]]||0)|1<<c[0],mn=Math.min(mn,c[0]),mx=Math.max(mx,c[0])});var dy=[],m=[];for(var k2 in rows)dy.push(+k2),m.push(rows[k2]);return{dy,m,n:dy.length,minx:mn,maxx:mx}})});function fits(b,k,r,x,y){var p=PMR[k][r];if(x+p.minx<0||x+p.maxx>=W)return!1;for(var R=b.__r||rowsOf(b),i=0;i<p.n;i++){var yy=y+p.dy[i];if(yy<0||yy>=H||R[yy]&(x>=0?p.m[i]<<x:p.m[i]>>-x))return!1}return!0}function occ(b,x,y){return x<0||x>=W||y>=H||y>=0&&!!((b.__r||rowsOf(b))[y]>>x&1)}function rotate(b,k,r,x,y,dir){if(k==="O")return null;for(var r2=(r+dir+4)%4,K=dir===2?(k==="I"?KI180:K180)[""+r+r2]||[[0,0]]:(k==="I"?KI:KJ)[""+r+r2],i=0;i<K.length;i++){var nx=x+K[i][0],ny=y-K[i][1];if(fits(b,k,r2,nx,ny))return{r:r2,x:nx,y:ny,kick:i}}return null}function dropY(b,k,r,x,y){for(;fits(b,k,r,x,y+1);)y++;return y}function spawnState(b,k,clutch){var p={r:0,x:3,y:BUF-3};if(fits(b,k,p.r,p.x,p.y))return p;if(clutch){for(;p.y>0;)if(p.y--,fits(b,k,p.r,p.x,p.y))return p}return null}var FRONT=[[[0,0],[2,0]],[[2,0],[2,2]],[[0,2],[2,2]],[[0,0],[0,2]]];function spinOf(b,k,p,lastRot,kick){if(!lastRot)return null;if(k==="T"){var c=0,f=0;return[[0,0],[2,0],[0,2],[2,2]].forEach(function(q){occ(b,p.x+q[0],p.y+q[1])&&c++}),c>=3?(FRONT[p.r].forEach(function(q){occ(b,p.x+q[0],p.y+q[1])&&f++}),f===2||kick===4?"T":"Tmini"):!fits(b,k,p.r,p.x-1,p.y)&&!fits(b,k,p.r,p.x+1,p.y)&&!fits(b,k,p.r,p.x,p.y-1)?"Tmini":null}return!fits(b,k,p.r,p.x-1,p.y)&&!fits(b,k,p.r,p.x+1,p.y)&&!fits(b,k,p.r,p.x,p.y-1)?k:null}function place(b,k,r,x,y,val){for(var s=ROT[k][r],R0=b.__r||rowsOf(b),R=new Int32Array(H),y0=0;y0<H;y0++)R[y0]=R0[y0];for(var i=0;i<4;i++)R[y+s[i][1]]|=1<<x+s[i][0];for(var FULLR=(1<<W)-1,lines=0,dug=0,yy=Math.max(0,y-1);yy<Math.min(H,y+4);yy++)R[yy]===FULLR&&lines++;var nb;if(!lines){nb=b.slice();for(var i1=0;i1<4;i1++)nb[(y+s[i1][1])*W+x+s[i1][0]]=val||1;return nb.__r=R,{b:nb,lines:0,dug:0,pc:!1}}for(var tmp=b.slice(),i2=0;i2<4;i2++)tmp[(y+s[i2][1])*W+x+s[i2][0]]=val||1;nb=new Array(W*H);for(var NR=new Int32Array(H),dst=H-1,any=!1,sy=H-1;sy>=0;sy--){if(R[sy]===FULLR){for(var gx=0;gx<W;gx++)if(tmp[sy*W+gx]===8){dug++;break}continue}for(var xx=0;xx<W;xx++)nb[dst*W+xx]=tmp[sy*W+xx];NR[dst]=R[sy],R[sy]&&(any=!0),dst--}for(;dst>=0;dst--){for(var x2=0;x2<W;x2++)nb[dst*W+x2]=0;NR[dst]=0}return nb.__r=NR,{b:nb,lines,dug,pc:!any}}var WASMOK=opt.wasm!=null?opt.wasm:1,COMBAT=opt.combat!=null?opt.combat:0,QUICKN=opt.quickn!=null?opt.quickn:18,BAGX=opt.bagx!=null?opt.bagx:3,TINY=!1,SPAWNH=opt.spawnh!=null?opt.spawnh:1,VT=opt.vt!=null?opt.vt:0,VTF=opt.vtf!=null?opt.vtf:.55,CHAINOK=opt.chains!=null?opt.chains:1,SKIM=opt.skim!=null?opt.skim:0,LOOSE=opt.loose!=null?opt.loose:1,FORBID=null,TGT=null,TGTW=opt.tgtw!=null?opt.tgtw:.4,READY=opt.ready!=null?opt.ready:0,TIMING=opt.timing!=null?opt.timing:0,SALV=opt.salv!=null?opt.salv:0,TALL=opt.tall!=null?opt.tall:1,TALLL=opt.tallLite!=null?opt.tallLite:0,QUICK=opt.quick!=null?opt.quick:1,TGTN=opt.tgtn!=null?opt.tgtn:16,SBK={I:0,O:1,T:2,S:3,Z:4,J:5,L:6};function moves(b,k,start,cap){if(!start)return[];if(cap=cap||1400,WASMOK&&!FORBID&&typeof SEABRAIN<"u"&&SEABRAIN.ready){for(var R=b.__r||rowsOf(b),ms=SEABRAIN.moves(R,SBK[k],start.r,start.x,start.y,cap),mi=0;mi<ms.length;mi++)ms[mi].k=k;return ms}return movesJS(b,k,start,cap)}function actsFor(b,P){if(P.acts)return P.acts;for(var ms=movesJS(b,P.k,spawnState(b,P.k,st.lastClear)||spawnState(b,P.k,!0),1400),i=0;i<ms.length;i++){var m=ms[i];if(m.r===P.r&&m.x===P.x&&m.y===P.y&&(m.spin||null)===(P.spin||null))return m.acts}for(var cs=function(Q){return ROT[Q.k][Q.r].map(function(c){return(Q.y+c[1])*W+Q.x+c[0]}).sort(function(a,c){return a-c}).join()},want=cs(P),j=0;j<ms.length;j++)if(cs(ms[j])===want)return ms[j].acts;return["drop"]}function movesJS(b,k,start,cap){if(!start)return[];cap=cap||1400;var seen=new Uint8Array(4096*2),qx=[],qy=[],qr=[],ql=[],qk=[],qp=[],qa=[],out={},outList=[];function sk(x2,y2,r2,l2){return(r2*16+(x2+3))*64+y2<<1|(l2?1:0)}function push(x2,y2,r2,l2,kick,p,a){var kk=sk(x2,y2,r2,l2);seen[kk]||(seen[kk]=1,qx.push(x2),qy.push(y2),qr.push(r2),ql.push(l2),qk.push(kick),qp.push(p),qa.push(a))}function acts(i,last){for(var seq=[last];i>0;)seq.push(qa[i]),i=qp[i];return seq.reverse()}push(start.x,start.y,start.r,!1,-1,-1,null);for(var head=0;head<qx.length&&head<cap;head++){var x=qx[head],y=qy[head],r=qr[head],l=ql[head],yd=dropY(b,k,r,x,y),fl=yd===y?l:!1,fk=yd===y?qk[head]:-1,spin=spinOf(b,k,{x,y:yd,r},fl,fk),s=ROT[k][r],c0=x+s[0][0]+(yd+s[0][1])*W,c1=x+s[1][0]+(yd+s[1][1])*W,c2=x+s[2][0]+(yd+s[2][1])*W,c3=x+s[3][0]+(yd+s[3][1])*W;if(!(FORBID&&(FORBID[c0/W|0]>>c0%W&1||FORBID[c1/W|0]>>c1%W&1||FORBID[c2/W|0]>>c2%W&1||FORBID[c3/W|0]>>c3%W&1))){for(var lo=Math.min(c0,c1,c2,c3),hi=Math.max(c0,c1,c2,c3),key=lo*4096+hi*4+(c0+c1+c2+c3)%4+"|"+(spin||""),len=0,i0=head;i0>0;i0=qp[i0])len++;(!out[key]||out[key].len>len)&&(out[key]={k,r,x,y:yd,spin,len,i:head})}if(fits(b,k,r,x-1,y)&&push(x-1,y,r,!1,-1,head,"L"),fits(b,k,r,x+1,y)&&push(x+1,y,r,!1,-1,head,"R"),y===start.y){for(var xl=x;fits(b,k,r,xl-1,y);)xl--;xl<x-1&&push(xl,y,r,!1,-1,head,"DL");for(var xr=x;fits(b,k,r,xr+1,y);)xr++;xr>x+1&&push(xr,y,r,!1,-1,head,"DR")}yd!==y&&push(x,yd,r,!1,-1,head,"SD");for(var d=1;d>=-1;d-=2){var ro=rotate(b,k,r,x,y,d);ro&&push(ro.x,ro.y,ro.r,!0,ro.kick,head,d>0?"cw":"ccw")}if(k!=="O"){var rf=rotate(b,k,r,x,y,2);rf&&push(rf.x,rf.y,rf.r,!0,rf.kick,head,"flip")}}for(var c in out){var o=out[c];outList.push({k:o.k,r:o.r,x:o.x,y:o.y,spin:o.spin,acts:acts(o.i,"drop")})}return outList}var FRONT_ALL=FRONT,CORN=[[0,0],[2,0],[0,2],[2,2]];function topRow(b){for(var R=b.__r||rowsOf(b),y=0;y<H&&!R[y];)y++;return y}function tops(b){for(var t=[],R=b.__r||rowsOf(b),y0=topRow(b),x=0;x<W;x++){for(var y=y0,m=1<<x;y<H&&!(R[y]&m);)y++;t.push(y)}return t}function canReach(b,r,x,y,depth){if(openAbove(b,r,x,y))return!0;for(var sd=-1;sd<=1;sd+=2)for(var x2=x+sd;fits(b,"T",r,x2,y);x2+=sd)if(openAbove(b,r,x2,y))return!0;if(depth<=0)return!1;for(var yy=y;yy>=Math.max(0,y-3)&&fits(b,"T",r,x,yy);yy--)for(var dir=-1;dir<=1;dir+=2)for(var r0=(r-dir+4)%4,K=KJ[""+r0+r],i=0;i<K.length;i++){var px=x-K[i][0],py=yy+K[i][1];if(fits(b,"T",r0,px,py)){var ro=rotate(b,"T",r0,px,py,dir);if(!(!ro||ro.x!==x||ro.y!==yy||ro.r!==r)&&canReach(b,r0,px,py,depth-1))return!0}}return!1}function reachSpin(b,x,y,r){for(var dir=-1;dir<=1;dir+=2)for(var r0=(r-dir+4)%4,K=KJ[""+r0+r],i=0;i<K.length;i++){var px=x-K[i][0],py=y+K[i][1];if(fits(b,"T",r0,px,py)){var ro=rotate(b,"T",r0,px,py,dir);if(!(!ro||ro.x!==x||ro.y!==y||ro.r!==r)&&canReach(b,r0,px,py,1))return ro.kick}}return-1}function openAbove(b,r,x,y){for(var yy=y-1;yy>=0;yy--)if(!fits(b,"T",r,x,yy))return!1;return!0}function slots(b,tp){if(b.__s)return b.__s;for(var best={n:0,miss:9,r:void 0},second=0,RB=b.__r||rowsOf(b),FULLR=(1<<W)-1,x=-1;x<W-1;x++){for(var mt=H,c=Math.max(0,x-1);c<=Math.min(W-1,x+3);c++)mt=Math.min(mt,tp[c]);for(var y=Math.max(0,mt-3);y<=Math.min(H-2,mt+5);y++)for(var r=0;r<4;r++)if(!(!fits(b,"T",r,x,y)||fits(b,"T",r,x,y+1))){for(var cc=0,i=0;i<4;i++)occ(b,x+CORN[i][0],y+CORN[i][1])&&cc++;if(!(cc<3)){var kick=reachSpin(b,x,y,r);if(!(kick<0)&&spinOf(b,"T",{x,y,r},!0,kick)==="T"){for(var pm=PMR.T[r],n=0,miss=0,i2=0;i2<pm.n;i2++){var ry=y+pm.dy[i2],tm=x>=0?pm.m[i2]<<x:pm.m[i2]>>-x,m=pop(FULLR&~(RB[ry]|tm));m===0?n++:miss+=Math.min(m,5)}var score=n*10-miss;score>best.n*10-best.miss?(second=Math.max(second,best.n),best={n,miss,x,y,r}):second=Math.max(second,n)}}}}return best.second=second,b.__s=best,best}function tsdBuild(b,tp){for(var best={v:0,cov:0},x=0;x<W-2;x++){var m=x+1,Y=tp[m]-2;if(!(Y<1)&&!(b[Y*W+x]||b[Y*W+m]||b[Y*W+x+2]||b[(Y+1)*W+m])){for(var yy=Y-1;yy>=0;yy--)if(b[yy*W+m]){Y=-1;break}if(!(Y<0)){var oL=b[(Y-1)*W+x]?1:0,oR=b[(Y-1)*W+x+2]?1:0;if(!(oL&&oR)){for(var openSide=oL?x+2:x,ok=!0,y2=Y-1;y2>=0;y2--)if(b[y2*W+openSide]){ok=!1;break}if(ok){for(var cL=b[(Y+1)*W+x]?1:0,cR=b[(Y+1)*W+x+2]?1:0,r1=0,r2=0,xx=0;xx<W;xx++)(xx<x||xx>x+2)&&b[Y*W+xx]&&r1++,xx!==m&&b[(Y+1)*W+xx]&&r2++;var fill=(r1+r2)/16,v=fill*fill*3+(cL+cR)*.6+(cL&&cR&&(oL||oR)?1.6:0);v>best.v&&(best={v,cov:(oL||oR)&&cL&&cR?1:0})}}}}}return best}var TSTE=[[0,0],[0,-1],[1,-1],[0,-2],[0,-3],[1,-3],[2,-3]],TSTF=[[-1,0],[1,0],[-1,-1],[2,-1],[-1,-2],[1,-2],[-1,-3],[0,-4]],FLAIR=opt.flair!=null?opt.flair:0,SETW=opt.setw!=null?opt.setw:1.3,TSTW=opt.tstw!=null?opt.tstw:0,FLOAT=opt.float!=null?opt.float:0,SPEC=opt.spec!=null?opt.spec:1,TST3=opt.tst3!=null?opt.tst3:0,LITET=opt.litet!=null?opt.litet:1.6,OVH=opt.ovh!=null?opt.ovh:opt.lite?1:0,NTB=opt.ntb!=null?opt.ntb:2,CCH=opt.cch!=null?opt.cch:.5,HOLDV=opt.holdv!=null?opt.holdv:0,SURGE=opt.surge!=null?opt.surge:0,OPPD=opt.oppd!=null?opt.oppd:0,CCS=opt.ccs!=null?opt.ccs:1,LITE2=opt.lite2!=null?opt.lite2:1,LITEOP=opt.liteop!=null?opt.liteop:1,OVW=opt.ovw!=null?opt.ovw:.2,BUILD=opt.build!=null?opt.build:0,STRAT=opt.strat!=null?opt.strat:0,REOPEN=opt.reopen!=null?opt.reopen:0,L3M=opt.l3m!=null?opt.l3m:1,DIGC=opt.digc!=null?opt.digc:0,DIGS=opt.digs!=null?opt.digs:0,CHAINS=[],SETUPS=(function(raw){var out=[],seen={};function add(t,L,wl,wr){var k=t.join("|")+wl+wr;if(!seen[k]){seen[k]=1;for(var h=t.length,w=t[0].length,fill=[],emp=[],fc=0,tr=[],r=0;r<h;r++){for(var f=0,e=0,c=0;c<w;c++){var ch=t[r][c];ch==="#"?(f|=1<<c,fc++):(ch==="."||ch==="T")&&(e|=1<<c),ch==="T"&&tr.indexOf(r)<0&&tr.push(r)}fill.push(f),emp.push(e)}out.push({w,h,fill,emp,fc,tr,L:Math.min(3,L),wl,wr})}}return raw.forEach(function(o){add(o.t,o.L,o.wl,o.wr),add(o.t.map(function(r){return r.split("").reverse().join("")}),o.L,o.wr,o.wl)}),out})([{L:2,wl:!1,wr:!1,t:["#..##","#TTT#","##T##"]},{L:2,wl:!1,wr:!1,t:["...##","#TTT#","##T##"]},{L:2,wl:!1,wr:!1,t:["##...","#TTT#","##T##","#????"]},{L:2,wl:!1,wr:!1,t:["...##","#TTT#","##T##","????#"]},{L:2,wl:!1,wr:!1,t:["##..#","#TTT#","##T##"]},{L:2,wl:!1,wr:!1,t:["##...","#TTT#","##T##"]},{L:3,wl:!1,wr:!1,t:["...#","##T#","#TT#","##T#"]},{L:2,wl:!1,wr:!1,t:["#..##","#TTT#","##T##","???##"]},{L:2,wl:!0,wr:!1,t:["...##","#TTT#","##T##","?#?##"]},{L:3,wl:!0,wr:!1,t:["...#","##T#","#TT#","##T#"]},{L:2,wl:!0,wr:!1,t:["..##","TTT#","#T##","##?#"]},{L:2,wl:!1,wr:!1,t:["##..#","#TTT#","##T##","#????"]},{L:3,wl:!1,wr:!1,t:["...#","##T#","#TT#","##T#","#?##"]},{L:3,wl:!0,wr:!1,t:["#...","#T##","#TT#","#T##","##??"]},{L:2,wl:!0,wr:!1,t:["##..#","#TTT#","##T##"]},{L:2,wl:!1,wr:!0,t:["...#","##T#","#TT#","#.T#"]},{L:3,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T##","##?#"]},{L:2,wl:!1,wr:!0,t:["##..#","#TTT#","##T##"]},{L:3,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T##"]},{L:2,wl:!0,wr:!1,t:["#..##","#TTT#","##T##"]},{L:2,wl:!0,wr:!1,t:["#..##","#TTT#","##T##","#???#"]},{L:2,wl:!1,wr:!0,t:["##..#","#TTT#","##T##","##??#"]},{L:3,wl:!1,wr:!0,t:["...#","##T#","#TT#","##T#","???#"]},{L:2,wl:!0,wr:!1,t:["##...","#TTT#","##T##","#????"]},{L:2,wl:!0,wr:!1,t:["##..#","#TTT#","##T##","#????"]},{L:2,wl:!0,wr:!1,t:["...#","##T#","#TT#","#.T#"]},{L:2,wl:!0,wr:!1,t:["..##","TTT#","#T##"]},{L:2,wl:!1,wr:!1,t:["...#","##T#","#TT#","#.T#","??##"]},{L:3,wl:!0,wr:!1,t:["...#","##T#","#TT#","##T#","#??#"]},{L:2,wl:!1,wr:!0,t:["#..##","#TTT#","##T##"]},{L:3,wl:!1,wr:!0,t:["#...","#T##","#TT#","#T##"]},{L:2,wl:!1,wr:!1,t:["##..","##T#","#TT.","##T#"]},{L:2,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T.."]},{L:2,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T##","##??"]},{L:2,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T.#"]},{L:3,wl:!1,wr:!0,t:["#...","#T##","#TT#","#T##","#??#"]},{L:2,wl:!1,wr:!0,t:["##..","#TTT","##T#"]},{L:2,wl:!1,wr:!1,t:["...#","##T#","#TT#","#.T#"]},{L:2,wl:!0,wr:!1,t:["#...","#T##","#TT#","#T##"]},{L:2,wl:!1,wr:!1,t:["..##","#T##",".TT#","#T##"]},{L:2,wl:!0,wr:!1,t:["##...","#TTT#","##T##"]},{L:2,wl:!0,wr:!1,t:["#...","##T.","#TT#","##T#"]},{L:2,wl:!1,wr:!1,t:["#...","##T.","#TT#","##T#"]},{L:3,wl:!1,wr:!1,t:["....","##T#","#TT#","##T#"]},{L:2,wl:!1,wr:!0,t:["...##","#TTT#","##T##","???##"]},{L:3,wl:!1,wr:!1,t:["....","#T##","#TT#","#T##"]},{L:2,wl:!0,wr:!1,t:["#...","#T..","#TT#","#T##"]},{L:2,wl:!1,wr:!1,t:["#...","#T..","#TT#","#T##"]},{L:2,wl:!1,wr:!1,t:["..##","#T##",".TT#","#T##","??##"]},{L:3,wl:!1,wr:!0,t:["...#","##T#","#TT#","##T#"]},{L:2,wl:!1,wr:!1,t:["#...","#T..","#TT#","#T##","##??"]},{L:2,wl:!1,wr:!1,t:["....","#T..","#TT#","#T##","##??"]},{L:2,wl:!0,wr:!1,t:["#...","##T.","#TT#","##T#","###?"]},{L:2,wl:!1,wr:!1,t:["...#","..T#","#TT#","##T#"]},{L:2,wl:!1,wr:!1,t:["##.##","#TTT#","##T##","#???#"]},{L:2,wl:!1,wr:!1,t:["...#",".T##","#TT#","#T##"]},{L:2,wl:!1,wr:!1,t:["##..","##T#","#TT.","##T#","##??"]},{L:2,wl:!1,wr:!1,t:["....","..T#","#TT#","##T#","#??#"]},{L:2,wl:!1,wr:!1,t:["....",".T##","#TT#","#T##","?###"]},{L:2,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T.#","##?#"]},{L:2,wl:!1,wr:!1,t:["#...","#T##","#TT#","#T..","##??"]},{L:4,wl:!0,wr:!1,t:["#...","#T##","#TT#","#T##","####"]},{L:2,wl:!0,wr:!1,t:["##.##","#TTT#","##T##","##??#"]},{L:2,wl:!0,wr:!1,t:["#...","#T##","#TT#","#T.#"]},{L:2,wl:!1,wr:!0,t:["...##","#TTT#","##T##"]},{L:2,wl:!1,wr:!0,t:["..##","#T##",".TT#","#T##"]},{L:2,wl:!0,wr:!1,t:["#...","#T##","#TT#","#T.#","##?#"]},{L:2,wl:!1,wr:!0,t:["#...","#T##","#TT#","#T.#"]},{L:2,wl:!1,wr:!0,t:["##...","#TTT#","##T##","##?##"]},{L:2,wl:!1,wr:!1,t:["##...","#TTT#","##T##","#???#"]},{L:2,wl:!1,wr:!1,t:["###.","##..","##T#","#TT.","##T#"]},{L:2,wl:!1,wr:!1,t:["##..#","#TTT#","##T##","###?#"]},{L:2,wl:!0,wr:!1,t:["##.##","#..##","#TTT#","##T##","##?##"]},{L:3,wl:!0,wr:!1,t:["..##","...#","##T#","#TT#","##T#"]},{L:2,wl:!1,wr:!1,t:[".#...","##...","#TTT#","##T##","####?"]},{L:2,wl:!1,wr:!0,t:["...#.","...##","#TTT#","##T##","???##"]},{L:3,wl:!1,wr:!1,t:["##..","#...","#T##","#TT#","#T##","##?#"]},{L:2,wl:!1,wr:!1,t:["##..","#...","#T##","#TT#","#T.#"]},{L:2,wl:!1,wr:!1,t:["##..#","##..#","#TTT#","##T##"]},{L:3,wl:!1,wr:!1,t:["##..","#...","#T##","#TT#","#T##","####"]},{L:2,wl:!1,wr:!1,t:["##...","##...","#TTT#","##T##","##???"]},{L:2,wl:!1,wr:!1,t:["##...","##...","#TTT#","##T##","####?"]},{L:2,wl:!1,wr:!1,t:["...##","#..##","#TTT#","##T##","##?##"]},{L:2,wl:!1,wr:!1,t:["##...","##...","#TTT#","##T##","##?##"]},{L:2,wl:!1,wr:!1,t:["...##","#..##","#TTT#","##T##"]},{L:3,wl:!1,wr:!1,t:["##..","#...","#T##","#TT#","#T##","##??"]},{L:2,wl:!1,wr:!1,t:["##..","#...","#T##","#TT#","#T##","###?"]},{L:2,wl:!1,wr:!1,t:["##...","##...","#TTT#","##T##"]},{L:2,wl:!1,wr:!1,t:["##..#","##..#","#TTT#","##T##","##?##"]},{L:2,wl:!1,wr:!1,t:["...##","...##","#TTT#","##T##","?#?##"]},{L:2,wl:!1,wr:!1,t:["##..","#...","#T##","#TT#","#T.#","##?#"]},{L:2,wl:!1,wr:!1,t:["...##","#..##","#TTT#","##T##","#??##"]},{L:3,wl:!1,wr:!1,t:["..##","...#","##T#","#TT#","##T#","##?#"]},{L:3,wl:!1,wr:!1,t:["##..","....","#T##","#TT#","#T##"]},{L:2,wl:!1,wr:!1,t:["#...#","#..##","#TTT#","##T##"]},{L:2,wl:!1,wr:!1,t:["##...","##...","#TTT#","##T##","##??#"]},{L:2,wl:!1,wr:!1,t:["##...","#TTT#","##T##","####?"]}]),SETUPS_UNREACH=[6,7,12,13,18,19,20,21,24,25,32,33,38,39,42,43,44,45,46,47,48,49,50,51,52,53,54,55,58,59,60,61,62,63,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,103,104];SETUPS=SETUPS.filter(function(s,i){return SETUPS_UNREACH.indexOf(i)<0}),(function(P,C){function mk(t,L,wl,wr,tr){for(var h=t.length,w=t[0].length,fill=[],emp=[],fc=0,r=0;r<h;r++){for(var f=0,e=0,c=0;c<w;c++){var ch=t[r][c];ch==="#"?(f|=1<<c,fc++):(ch==="."||ch==="T")&&(e|=1<<c)}fill.push(f),emp.push(e)}return{w,h,fill,emp,fc,tr,L:Math.min(3,L),wl,wr}}P.forEach(function(o){var tR=[];o.t.forEach(function(r,i){r.indexOf("T")>=0&&tR.push(i)});var S2=mk(o.t,o.L,o.wl,o.wr,tR.slice(tR.length-o.L));S2.vfy=1,SETUPS.push(S2)}),C.forEach(function(o){var S2=mk(o.t,o.L,o.wl,o.wr,o.tr);S2.chain=1,S2.L2=o.L2,S2.resid=o.resid,S2.name=o.L===2&&o.L2===3?"DT cannon":o.L===2&&o.L2===2?o.resid?"STSD":"double-double":o.L===3&&o.L2===2?"triple-double":"triple-triple",CHAINS.push(S2)})})([{t:["##.?","#..?","#T##","#TT#","#T##"],L:3,wl:!0,wr:!1},{t:["..###","....#","##T##","##TT#","##T##"],L:3,wl:!0,wr:!1},{t:["###.?","#...?","##T##","##TT#","##T##"],L:3,wl:!0,wr:!1},{t:[".##.?","##..?","##T##","##TT#","##T##"],L:3,wl:!0,wr:!1},{t:[".##.?",".#..?","##T##","##TT#","##T##"],L:3,wl:!0,wr:!1},{t:[".###.?",".#...?","###T##","###TT#","###T##"],L:3,wl:!0,wr:!1},{t:["..##.?",".##..?","###T##","###TT#","###T##"],L:3,wl:!0,wr:!1},{t:["..##.?","..#..?","###T##","###TT#","###T##"],L:3,wl:!0,wr:!1},{t:["?.###.?","?.#...?","####T##","####TT#","####T##"],L:3,wl:!0,wr:!1},{t:["?..##.?","?.##..?","####T##","####TT#","####T##"],L:3,wl:!0,wr:!1},{t:["?..##.?","?..#..?","####T##","####TT#","####T##"],L:3,wl:!0,wr:!1},{t:["?.###.?","?.#...?","####T##","####TT#","####T##"],L:3,wl:!1,wr:!1},{t:["?..##.?","?.##..?","####T##","####TT#","####T##"],L:3,wl:!1,wr:!1},{t:["?..##.?","?..#..?","####T##","####TT#","####T##"],L:3,wl:!1,wr:!1},{t:["?.###.?","?.#...?","####T##","####TT#","####T##"],L:3,wl:!1,wr:!0},{t:["?..##.?","?.##..?","####T##","####TT#","####T##"],L:3,wl:!1,wr:!0},{t:["?..##.?","?..#..?","####T##","####TT#","####T##"],L:3,wl:!1,wr:!0},{t:["..###","....#","##T##","#TT##","##T##"],L:3,wl:!0,wr:!1},{t:["..##?","...#?","##T##","#TT##","##T##"],L:3,wl:!0,wr:!1},{t:["..##?","...##","##T##","#TT##","##T##"],L:3,wl:!0,wr:!1},{t:["...###",".....#","###T##","##TT##","###T##"],L:3,wl:!0,wr:!1},{t:["...##?","....#?","###T##","##TT##","###T##"],L:3,wl:!0,wr:!1},{t:["...##?","....##","###T##","##TT##","###T##"],L:3,wl:!0,wr:!1},{t:["?...###","?.....#","####T##","###TT##","####T##"],L:3,wl:!0,wr:!1},{t:["?...##?","?....#?","####T##","###TT##","####T##"],L:3,wl:!0,wr:!1},{t:["?...##?","?....##","####T##","###TT##","####T##"],L:3,wl:!0,wr:!1},{t:["?...###","?.....#","####T##","###TT##","####T##"],L:3,wl:!1,wr:!1},{t:["?...##?","?....#?","####T##","###TT##","####T##"],L:3,wl:!1,wr:!1},{t:["?...##?","?....##","####T##","###TT##","####T##"],L:3,wl:!1,wr:!1},{t:["?...###","?.....#","####T##","###TT##","####T##"],L:3,wl:!1,wr:!0},{t:["?.###.?","?.#...?","####T##","###TT##","####T##"],L:3,wl:!1,wr:!0},{t:["?...##?","?....#?","####T##","###TT##","####T##"],L:3,wl:!1,wr:!0},{t:["?...##?","?....##","####T##","###TT##","####T##"],L:3,wl:!1,wr:!0},{t:["?...##","?....#","####T#","###TT#","####T#"],L:3,wl:!1,wr:!0}],[{t:["##??","#.??","#.##","#..#","#.##","#.##","#..#","#.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["????????..","??????##..","#######...","########.#","#.########","#..#######","#.########"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???????#..","??????##..","#######...","########.#","#.########","#..#######","#.########"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["?##??","?#.??","##.##","##..#","##.##","?#.##","##..#","##.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["?##?????..","?#??????..","?#.#??##..","#######...","########.#","##..######","##.#######"],L:2,L2:2,tr:[3,4,5,6],wl:!0,wr:!0,resid:1},{t:["????????..","??????##..","#######...","########.#","?#.##??###","##..######","##.#######"],L:2,L2:2,tr:[2,3,5,6],wl:!0,wr:!0,resid:1},{t:["???????#..","??????##..","#######...","########.#","?#.##??###","##..######","##.#######"],L:2,L2:2,tr:[2,3,5,6],wl:!0,wr:!0,resid:1},{t:["?##??","?#.??","##.##","##..#","##.##","##.##","##..#","##.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["????????..","??????##..","#######...","########.#","##.#######","##..######","##.#######"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???????#..","??????##..","#######...","########.#","##.#######","##..######","##.#######"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??##??","??#.??","###.##","###..#","###.##","??#.##","###..#","###.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["??##????..","??#?????..","??#.#?##..","#######...","########.#","###..#####","###.######"],L:2,L2:2,tr:[3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??##??","??#.??","###.##","###..#","###.##","###.##","###..#","###.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["???##??","???#.??","####.##","####..#","####.##","???#.##","####..#","####.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["???##??","???#.??","####.##","####..#","####.##","####.##","####..#","####.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["?#..?","##..?","#...#","##.##","#...#","##.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["##..?","##..?","#...#","##.##","#...#","##.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["????????..","??????##..","#######...","########.#","#...######","##.#######"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["???????#..","??????##..","#######...","########.#","#...######","##.#######"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["????????##","????????.#","########.#","#######..#","########.#","#...######","##.#######"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["#?..?","##..?","#...#","##.##","#...#","##.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["##????","#.????","#.####","#..###","#.####","###???","##...#","###.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["???..?","?##..?","##...#","###.##","##...#","###.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["????????..","??????##..","#######...","########.#","##...#####","###.######"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["???????#..","??????##..","#######...","########.#","##...#####","###.######"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["????????##","????????.#","########.#","#######..#","########.#","##...#####","###.######"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??#..?","?##..?","##...#","###.##","##...#","###.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["?##..?","?##..?","##...#","###.##","##...#","###.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["?#?..?","?##..?","##...#","###.##","##...#","###.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["##?????","#.?????","#.#####","#..####","#.#####","####???","###...#","####.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["?##????","?#.????","##.####","##..###","##.####","?###???","###...#","####.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["?#..???","##..???","#...###","##.####","?###???","###...#","####.##"],L:2,L2:2,tr:[2,3,5,6],wl:!0,wr:!1,resid:0},{t:["#?..???","##..???","#...###","##.####","?###???","###...#","####.##"],L:2,L2:2,tr:[2,3,5,6],wl:!0,wr:!1,resid:0},{t:["##..???","##..???","#...###","##.####","?###???","###...#","####.##"],L:2,L2:2,tr:[2,3,5,6],wl:!0,wr:!1,resid:0},{t:["????..?","??##..?","###...#","####.##","###...#","####.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["???????#..","??????##..","#######...","########.#","###...####","####.#####"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["??##???","??.#???","##.####","#..####","##.####","?###???","###...#","####.##"],L:3,L2:2,tr:[2,3,4,6,7],wl:!0,wr:!1,resid:1},{t:["????????##","????????.#","########.#","#######..#","########.#","###...####","####.#####"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???#..?","??##..?","###...#","####.##","###...#","####.##"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!1,resid:0},{t:["?##???????","?#.???????","?#.##?????","##..######","##.#######","#######...","########.#"],L:2,L2:2,tr:[3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??##??????","??#.??????","??#.##????","###..#####","###.######","#######...","########.#"],L:2,L2:2,tr:[3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??##??????","??.#??????","##.#######","#..#######","##.#######","#######...","########.#"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???##?????","???.#?????","###.######","##..######","###.######","#######...","########.#"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["##????????","#.????????","#.########","#..#######","#.########","#######...","########.#"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["?##???????","?#.???????","##.#######","##..######","##.#######","#######...","########.#"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["?#..??????","##..??????","#...######","##.#######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["#?..??????","##..??????","#...######","##.#######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["##..??????","##..??????","#...######","##.#######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["????##????","????.#????","####.#####","###..#####","####.#####","#######...","########.#"],L:3,L2:2,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???..?????","?##..?????","##...#####","###.######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["??#..?????","?##..?????","##...#####","###.######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["?#?..?????","?##..?????","##...#####","###.######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["?##..?????","?##..?????","##...#####","###.######","#######...","########.#"],L:2,L2:2,tr:[2,3,4,5],wl:!0,wr:!0,resid:0},{t:["????????..","??????##..","#######...","########.#","##.#######","#..#######","##.#######"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???????#..","??????##..","#######...","########.#","##.#######","#..#######","##.#######"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??##?","??.#?","##.##","#..##","##.##","##.##","#..##","##.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["???##?","???.#?","###.##","##..##","###.##","###.##","##..##","###.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["????##?","????.#?","####.##","###..##","####.##","####.##","###..##","####.##"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!0,wr:!1,resid:1},{t:["?#..??????","##..??????","#...######","##.#######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["#?..??????","##..??????","#...######","##.#######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["##..??????","##..??????","#...######","##.#######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???..?????","?##..?????","##...#####","###.######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["??#..?????","?##..?????","##...#####","###.######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["?#?..?????","?##..?????","##...#####","###.######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["?##..?????","?##..?????","##...#####","###.######","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["????..????","??##..????","###...####","####.#####","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["???#..????","??##..????","###...####","####.#####","########.#","#######..#","########.#"],L:2,L2:3,tr:[2,3,4,5,6],wl:!0,wr:!0,resid:1},{t:["????##","????.#","####.#","###..#","####.#","####.#","###..#","####.#"],L:3,L2:3,tr:[2,3,4,5,6,7],wl:!1,wr:!0,resid:1}]);function pop(v){return v=v-(v>>1&1431655765),v=(v&858993459)+(v>>2&858993459),(v+(v>>4)&252645135)*16843009>>24}function setupShape(b,tp,minL){for(var rows=b.__r||rowsOf(b),top=H,x2=0;x2<W;x2++)top=Math.min(top,tp[x2]);for(var best=0,FULL=(1<<W)-1,i=0;i<SETUPS.length;i++){var S2=SETUPS[i];if(!S2.vfy&&!(minL&&S2.L<minL)){var xs=(S2.wl,0),xe=W-S2.w;S2.wl&&(xe=0),S2.wr&&(xs=W-S2.w);for(var tv=TSLOT[S2.L]*(S2.L>=3?L3M:1),x0=xs;x0<=xe;x0++){for(var lt=H,cx=x0;cx<x0+S2.w;cx++)lt=Math.min(lt,tp[cx]);for(var yT=S2.tr[0],y0=Math.max(0,lt-yT-1);y0<=Math.min(H-S2.h,lt-yT+2);y0++){for(var ok=!0,f=0,r=0;r<S2.h;r++){var row=rows[y0+r]>>x0;if(row&S2.emp[r]){ok=!1;break}f+=pop(row&S2.fill[r])}if(ok){var miss=S2.fc-f;if(!(miss>8)){for(var out=FULL&~((1<<S2.w)-1<<x0),rm=0,k=0;k<S2.tr.length;k++)rm+=pop(out&~rows[y0+S2.tr[k]]);var M=miss+rm;if(!(M>20)){for(var q=1-M/21,v=tv*q*q,hc=0,r2=0;r2<S2.h;r2++){var tm=S2.emp[r2];if(tm){for(var c2=0;c2<S2.w;c2++)if(tm>>c2&1){for(var xx=x0+c2,yy=y0+r2,ya=yy-1;ya>=top;ya--)if(rows[ya]>>xx&1){hc++;break}}}}if(miss||(v+=hc*((OVH?WT.holes*OVW:WT.holes)+WT.cover)*.9/SETW),FLOAT&&miss<=4){for(var cv=0,yb=y0+S2.h,c3=0;c3<S2.w;c3++){for(var xx3=x0+c3,roof=!1,r3=0;r3<S2.h;r3++)S2.fill[r3]>>c3&1&&rows[y0+r3]>>xx3&1&&(roof=!0);if(roof)for(var y3=yb;y3<Math.min(H,yb+3)&&!(rows[y3]>>xx3&1);y3++)cv++}cv&&(v+=Math.min(4,cv)*(WT.holes+WT.cover)*FLOAT*(1-miss/8)/SETW)}v>best&&(best=v)}}}}}}}return best}var LSTW=opt.lstw!=null?opt.lstw:0,OVL=[[[-2,-3],[-2,-2],[-2,-1],[-1,-1]],[[-2,-3],[-2,-2],[-1,-2],[-1,-1]],[[-2,-2],[-2,-1],[-1,-1],[-1,-2]]];function lstBook(b){for(var best=null,c=2;c<=W-3;c+=W-5){for(var yb=-1,y=H-1;y>=4;y--)if(!b[y*W+c]&&occ(b,c,y+1)){yb=y;break}if(!(yb<0)){for(var covered=!1,y0=yb-1;y0>=0;y0--)if(b[y0*W+c]){covered=!0;break}if(!covered){for(var r=yb-1,ok={},okT={},have=0,bad=0,d=-2;d<=2;d++)d&&(ok[yb*W+c+d]=1,b[yb*W+c+d]&&have++);for(var yo=r;yo>=r-3;yo--)ok[yo*W+c-2]=1,ok[yo*W+c+2]=1;b[r*W+c-2]&&have++,b[r*W+c+2]&&have++;var L=b[(r-1)*W+c-1]||b[(r-2)*W+c-1],Rr=b[(r-1)*W+c+1]||b[(r-2)*W+c+1],side=L?-1:Rr?1:0;L&&Rr&&(bad+=3);for(var m=-1;m<=1;m+=2)side&&m!==side||(ok[(r-1)*W+c+m]=1,ok[(r-2)*W+c+m]=1);for(var yy2=0;yy2<=yb;yy2++)for(var x=c-2;x<=c+2;x++)b[yy2*W+x]&&!ok[yy2*W+x]&&!(yy2===yb&&x!==c)&&bad++;[[c-1,r],[c,r],[c+1,r],[c,yb]].forEach(function(p){okT[p[1]*W+p[0]]=1});for(var rr=0,y3=yb;y3>=r;y3--){for(var full=!0,x3=0;x3<W;x3++)if(!(x3>=c-2&&x3<=c+2)&&!b[y3*W+x3]){full=!1;break}full&&rr++}var v=have*1.1+rr*.8+(side?2:0)-bad*2.5+(c===2||c===W-3?1:0);(!best||v>best.v)&&(best={v,bad,c,yb,ok,okT})}}}return best}function lstAllowed(lb,P){for(var s=ROT[P.k][P.r],i=0;i<4;i++){var x=P.x+s[i][0],y=P.y+s[i][1];if(!(x<lb.c-2||x>lb.c+2||y>lb.yb)&&!lb.ok[y*W+x]&&!(P.k==="T"&&lb.okT[y*W+x]))return!1}return!0}var TSTB=opt.tstb!=null?opt.tstb:0,TSTE=[[0,0],[0,-1],[1,-1],[0,-2],[0,-3],[1,-3],[2,-3]],TSTF=[[-1,0],[1,0],[-1,-1],[2,-1],[-1,-2],[1,-2],[-1,-3],[0,-4]];function tstBuild(b,tp){for(var best=0,c=0;c<W;c++){for(var yb=-1,y=H-1;y>=4;y--)if(!b[y*W+c]&&occ(b,c,y+1)){yb=y;break}if(!(yb<0))for(var m=-1;m<=1;m+=2){for(var ok=!0,i=0;i<TSTE.length;i++){var ex=c+m*TSTE[i][0],ey=yb+TSTE[i][1];if(ex<0||ex>=W||b[ey*W+ex]){ok=!1;break}}if(ok){for(var yy=yb-4;yy>=0&&ok;yy--)for(var dx=1;dx<=2;dx++)b[yy*W+c+m*dx]&&(ok=!1);if(ok){for(var nf=0,nr=0,j=0;j<TSTF.length;j++){var fx=c+m*TSTF[j][0],fy=yb+TSTF[j][1];occ(b,fx,fy)&&nf++}for(var ry=yb-2;ry<=yb;ry++)for(var xx=0;xx<W;xx++)Math.abs(xx-c)>2&&b[ry*W+xx]&&nr++;var fill=nf/TSTF.length,rows=nr/21,v=fill*fill*2.6+rows*rows*1.6;fill<.5&&(v*=.4),v>best&&(best=v)}}}}return best}function dangerH(f){for(var sh=0,x=3;x<=6;x++)sh=Math.max(sh,f.h[x]);return SPAWNH?Math.max(sh,f.maxH-3):f.maxH}function features(b){for(var tp=tops(b),h=[],holes=0,cover=0,rowTr=0,colTr=0,x=0;x<W;x++){h.push(H-tp[x]);for(var seen=0,y2=tp[x];y2<H;y2++)b[y2*W+x]?seen++:(holes++,cover+=Math.min(seen,5))}var yT=topRow(b);rowTr=2*yT;for(var y=yT;y<H;y++){for(var prev=1,x1=0;x1<W;x1++){var v=b[y*W+x1]?1:0;v!==prev&&rowTr++,prev=v}prev||rowTr++}for(var x2=0;x2<W;x2++)for(var pv=0,y3=tp[x2];y3<H;y3++){var v2=b[y3*W+x2]?1:0;v2!==pv&&colTr++,pv=v2}for(var maxH=0,agg=0,bump=0,wells=0,x3=0;x3<W;x3++)maxH=Math.max(maxH,h[x3]),agg+=h[x3];for(var x4=0;x4<W-1;x4++)bump+=Math.abs(h[x4]-h[x4+1]);for(var x5=0;x5<W;x5++)if(!(x5===WELL&&STYLE==="quad")){var l=x5===0?99:h[x5-1],r=x5===W-1?99:h[x5+1],dpt=Math.min(l,r)-h[x5];dpt>2&&(wells+=dpt-2)}for(var deps=[],a0=0;a0<W;a0++)for(var b0=a0;b0<W&&b0<a0+4;b0++){for(var lo=0,xi=a0;xi<=b0;xi++)lo=Math.max(lo,h[xi]);var wl=a0===0?-1:h[a0-1],wr=b0===W-1?-1:h[b0+1];if(!(wl<0&&wr<0)){var dd=Math.min(wl<0?99:wl,wr<0?99:wr)-lo;dd<3||wl>=0&&wl<=lo||wr>=0&&wr<=lo||deps.push({a:a0,b:b0,d:dd})}}var canyon=0;if(deps.length){for(var mine=-1,di=0;di<deps.length;di++){var D=deps[di];if((BASE_STYLE==="combo"||STYLE==="combo")&&D.a<=CW1&&D.b>=CW0){mine=di;break}if(STYLE==="quad"&&D.a<=WELL&&D.b>=WELL&&D.b-D.a===0){mine=di;break}}if(mine<0){for(var best=-1,dj=0;dj<deps.length;dj++)deps[dj].b===deps[dj].a&&(best<0||deps[dj].d>deps[best].d)&&(best=dj);mine=best}for(var dk=0;dk<deps.length;dk++)if(dk!==mine){var E=deps[dk];if(mine>=0){var M=deps[mine];if(E.a<=M.b&&E.b>=M.a)continue}canyon+=(E.d-2)*(1+.5*(E.b-E.a))}}var cav=0,ovh=0;if(OVH){for(var x6=0;x6<W;x6++)for(var y6=tp[x6]+1;y6<H;y6++)if(!b[y6*W+x6]){var lv=H-1-y6,oL=x6>1&&h[x6-1]<=lv&&h[x6-2]<=lv+1,oR=x6<W-2&&h[x6+1]<=lv&&h[x6+2]<=lv+1;oL||oR?ovh++:cav++}}return{tp,h,holes,cover,rowTr,colTr,maxH,agg,bump,wells,cav,ovh,canyon}}var STYLE=opt.style||"tspin",BASE_STYLE=STYLE;G.setStyle=function(x){STYLE=x,BASE_STYLE=x};var WELL=opt.well!=null?opt.well:W-1,WELL0=WELL;G.setWell=function(c){WELL=WELL0=c},G.well=function(){return WELL};var THREAT={oppH:0,oppInc:0};G.setThreat=function(t){THREAT=t},G.spikeEst=function(){var e=0,b2=st.b2bN||0;st.pcPlan&&st.pcPlan.length<=2&&(e=Math.max(e,10));var tNear=st.cur==="T"||st.hold==="T"||st.queue[0]==="T";if(tNear){st.b.__s=null;var sl=slots(st.b,tops(st.b));sl.r!==void 0&&sl.n>=2&&(e=Math.max(e,[0,2,4,6][Math.min(3,sl.n)]+(b2?1:0)+(b2>=4&&sl.n<2?b2-1:0)))}if(STYLE==="combo"){var cs=comboShape(st.b,features(st.b));cs.ready>=8&&(e=Math.max(e,6))}return b2>=5&&(e=Math.max(e,b2-1)),e};function attackOf(spin,n,b2b,combo,pc){if(!n)return 0;var base,hard=n===4||!!spin||!!pc,bn=b2b===!0?1:b2b===!1?0:b2b||0;spin==="T"?base=[0,2,4,6,10][n]:base=[0,0,1,2,4][n],hard&&bn>0&&(base+=1);var a=base;return combo>0&&(a*=1+.25*combo,combo>1&&(a=Math.max(a,Math.log(1+1.25*combo)))),a=Math.floor(a),pc&&(a+=5),!hard&&bn>4&&(a+=bn-1),a}var WT={holes:4.2,cover:.45,rowTr:.18,colTr:.3,bp:.3,bp2:.06,agg:.09,maxH2:.006,wells:.8,canyon:.7,danger:.65,well:.9,wellH:1.1,ts1:.7,ts2:5,ts3:7.8,tsdb:.5,b2b:4,mTSD:1.7,mQuad:1.25,mTSS:.8,b2bBreak:3.2,plain:1.96,plainN:.6,wastedT:3,mini:1.2,otherSpin:.2,defend:.9};if(opt.wt)for(var wk in opt.wt)WT[wk]=opt.wt[wk];G.WT=WT;var TSLOT=[0,WT.ts1,WT.ts2,WT.ts3];function cutout(b,f,nT,vT){var v=0,k=0,bb=b,tp=f.tp,fac=1;for(nT+=vT||0;k<nT;){vT&&k===nT-vT&&(fac*=VTF);var sl=slots(bb,tp);if(sl.r===void 0||sl.n<1)break;var r=place(bb,"T",sl.r,sl.x,sl.y);if(!r.lines)break;v+=TSLOT[Math.min(3,r.lines)]*fac,fac*=.85,bb=r.b,k++,tp=tops(bb)}return{b:bb,v,k}}var LCAN=opt.lcan!=null?opt.lcan:.9,CW0=3,CW1=6,CWR=3,CSAFE=!0;function comboShape(b,f){for(var mh=99,x=CW0;x<=CW1;x++)mh=Math.min(mh,f.h[x]);for(var yr=H-1-mh,resid=0,above=0,ready=0,x2=CW0;x2<=CW1;x2++)b[yr*W+x2]&&resid++;for(var y2=yr-1;y2>=0;y2--)for(var x6=CW0;x6<=CW1;x6++)b[y2*W+x6]&&above++;for(var y3=yr;y3>=0;y3--){for(var sd=!0,x3=0;x3<W;x3++)if((x3<CW0||x3>CW1)&&!b[y3*W+x3]){sd=!1;break}if(!sd)break;ready++}for(var y4=yr+1;y4<H;y4++){for(var hole=0,side=!0,x7=0;x7<W;x7++)if(!b[y4*W+x7]){if(x7<CW0||x7>CW1){side=!1;break}hole++}if(!side||!hole)break;ready++}for(var sb=0,x4=0;x4<CW0-1;x4++)sb+=Math.abs(f.h[x4]-f.h[x4+1]);for(var x5=CW1+1;x5<W-1;x5++)sb+=Math.abs(f.h[x5]-f.h[x5+1]);return{yr,resid,above,ready,sb}}function evalBoard(b,ctx,f){f=f||features(b);var s=0;if(ctx.mode==="pc")return s=-12*f.holes-.5*f.bump-6*Math.max(0,f.maxH-4),{s,f};if(ctx.mode==="clean")return s=-10*f.holes-1.5*f.cover-.45*f.bump-1.4*f.maxH-.12*f.agg-4*Math.max(0,f.maxH-4),{s,f};if(STYLE==="combo"){var cs=comboShape(b,f),dg=Math.max(0,f.maxH+ctx.inc-(VIS-(TALL&&CSAFE?3:6)));return s=-6*f.holes-.6*f.cover-.25*cs.sb-1.6*cs.above-1.2*Math.abs(cs.resid-CWR)+(cs.resid===CWR&&!cs.above?2.5:0)+.55*Math.min(cs.ready,TALL?16:11)-.8*dg*dg,{s,f}}var danger=Math.max(0,dangerH(f)+ctx.inc-(VIS-8));if(CCH){var hh=f.maxH+ctx.inc;s-=CCH*((CCS?0:.95*hh)+(hh>10?3.65:0)+(hh>15?12.4:0))}if(STRAT&&(THREAT.oppB2B||0)>=5&&(s-=.12*((THREAT.oppB2B||0)-4)*Math.max(0,f.maxH+ctx.inc-6)),STRAT>=2&&(THREAT.oppSpike||0)>=4&&(s-=.05*(THREAT.oppSpike||0)*Math.max(0,f.maxH+ctx.inc-7)),TGT&&!danger){var TN=tgtNeed(b,TGT);s+=TN?-TGTW*(TN.n+5*TN.bur):-TGTW*10}var cut={k:0,v:0};ctx.nT&&(!danger||STYLE==="tspin")&&(cut=cutout(b,f,ctx.nT,ctx.nT&&VT&&!danger?1:0),cut.k&&(b=cut.b,f=features(b)));for(var bp=0,bp2=0,x0=0;x0<W-1;x0++)if(!(x0===WELL||x0+1===WELL)){var dd=Math.abs(f.h[x0]-f.h[x0+1]);bp+=dd,bp2+=dd*dd}ctx.tac==="dig"&&(s-=1.6*f.holes+.5*f.cover),s+=-WT.holes*(OVH?f.cav*OVH+OVW*f.ovh:f.holes)-WT.cover*f.cover-WT.rowTr*f.rowTr-WT.colTr*f.colTr-WT.bp*bp-WT.bp2*bp2-WT.agg*f.agg-WT.maxH2*f.maxH*f.maxH-WT.wells*f.wells-WT.canyon*f.canyon-WT.danger*danger*danger;for(var well=WELL,rowsReady=0,y=f.tp[well]-1;y>=0;y--){for(var full=!0,x=0;x<W;x++)if(x!==well&&!b[y*W+x]){full=!1;break}if(full)rowsReady++;else break}if(STYLE==="tspin"&&LSTW){var lb=lstBook(b);lb&&!lb.bad&&(s+=LSTW*lb.v)}STYLE==="tspin"&&TSTB&&!ctx.inc&&(s+=TSTB*tstBuild(b,f.tp));var wq=STYLE==="quad"?1:STYLE==="pc"?.4:.15;s+=wq*Math.min(rowsReady,4)*WT.well-wq*WT.wellH*f.h[well]*(danger?0:1);var hasR=rowsReady>=2;if(cut.k){hasR=!0;var tq0=ctx.tAt<0?.45:ctx.tAt<=2?1:ctx.tAt<=5?.85:.7,ws0=STYLE==="tspin"?1:STYLE==="quad"?.45:.65;s+=ws0*tq0*cut.v;var tb0=tsdBuild(b,f.tp);s+=ws0*WT.tsdb*tb0.v,tb0.cov&&(s+=(OVH?WT.holes*OVW:WT.holes)+WT.cover),SETW&&!ctx.inc&&f.maxH<=VIS-12&&(ctx.b2b?TSTW&&(s+=ws0*TSTW*setupShape(b,f.tp,3)):s+=ws0*SETW*setupShape(b,f.tp))}else if(!danger||STYLE==="tspin"){var sl=slots(b,f.tp),tq=ctx.tAt<0?.35:ctx.tAt<=2?1:ctx.tAt<=5?.8:.6,ws=STYLE==="tspin"?1:STYLE==="quad"?.4:.6;if(sl.n>=2)hasR=!0,s+=ws*(ctx.tAt>=0&&ctx.tAt<=1?sl.n>=3?7:5:tq*(sl.n>=3?5.5:4));else if(sl.r!==void 0){var need=sl.r===2?2:3,fill=Math.max(0,1-sl.miss/(need*6));s+=ws*tq*(.8+3.2*fill*fill)}if(sl.n<2){var tb=tsdBuild(b,f.tp);s+=ws*(tq*.5+.5)*tb.v,tb.cov&&(s+=(OVH?WT.holes*OVW:WT.holes)+WT.cover),SETW&&!ctx.inc&&f.maxH<=VIS-12&&(!ctx.b2b||TSTW)&&(s+=ws*(tq*.5+.5)*(ctx.b2b?TSTW:SETW)*setupShape(b,f.tp,ctx.b2b?3:0))}sl.second>=2&&(s+=ws*tq*1.5)}if(READY){var hr=f.maxH+ctx.inc;hr>=7&&!hasR&&(s-=READY*Math.min(8,hr-6))}if(HOLDV&&ctx.holdK){var hk=ctx.holdK,hh2=f.maxH+ctx.inc;hk==="I"?s+=HOLDV*(STYLE==="quad"?1:.5)*(hh2>=8?1.5:1):(hk==="S"||hk==="Z"||hk==="O")&&hh2>=9&&(s-=HOLDV*.4)}if(OPPD){var spk=THREAT.oppSpike||0;if(spk>=5){var hr2=f.maxH+ctx.inc;hr2>=5&&!hasR&&(s-=OPPD*.12*spk*Math.min(8,hr2-4)),s-=OPPD*.06*spk*Math.max(0,hr2-6)}}return ctx.b2b&&(s+=STYLE==="quad"?WT.b2b*.75:WT.b2b),ctx.b2b>=2&&(s+=(WT.chain!=null?WT.chain:.35)*Math.min(ctx.b2b-1,10)),{s,f}}function rewardOf(P,r,ctx){var n=r.lines,sp=P.spin,hard=n===4||!!sp&&n>0,c4=0;if(ctx.tac==="kill"&&n?c4+=attackOf(sp,n,ctx.b2b,ctx.combo,r.pc)*.8:ctx.tac==="press"&&n&&(c4+=attackOf(sp,n,ctx.b2b,ctx.combo,r.pc)*.3),ctx.tac==="dig"&&n&&r.dug&&(c4+=1.2*r.dug),ctx.tac==="dig"&&DIGC&&(n&&ctx.combo>=1?c4+=DIGC*.7*Math.min(ctx.combo,8):!n&&ctx.combo>=2&&(c4-=DIGC*.6*Math.min(ctx.combo,8))),STYLE==="combo"&&ctx.mode!=="pc"){var a0=attackOf(sp,n,ctx.b2b,ctx.combo,r.pc),v0=a0*1.2;if(n?v0+=1.5+.55*Math.min(ctx.combo,14)-(ctx.combo>0?1.8*(n-1):0):ctx.combo>0&&(v0-=4+.9*Math.min(ctx.combo,14)),n&&!ctx.combo&&!ctx.inc){var f0=features(r.b),cs0=comboShape(r.b,f0);cs0.ready<(ctx.salv?8:TALL&&CSAFE?16:12)&&f0.maxH<VIS-(TALL&&CSAFE?3:5)&&(v0-=(TALL?10:8)-.6*cs0.ready)}return ctx.inc&&n&&(v0+=Math.min(ctx.inc,n*2+a0)*.6),v0+c4}if(ctx.mode==="pc"&&!r.pc&&n)return-6;if(ctx.mode==="clean")return(r.pc?30:0)+1.6*n+attackOf(sp,n,ctx.b2b,ctx.combo,r.pc)*.5+(ctx.inc&&n?Math.min(ctx.inc,n*2)*.6:0);var atk=attackOf(sp,n,ctx.b2b,ctx.combo,r.pc)+(SPEC&&hard&&r.dug?1:0),v=atk*(n===4?STYLE==="quad"?1.6:WT.mQuad:sp==="T"&&n>=2?STYLE==="tspin"?WT.mTSD:1.3:sp==="T"?WT.mTSS:1);r.pc&&(v+=STYLE==="pc"?30:18);var oppOpen=THREAT.oppH+THREAT.oppInc>=VIS-8;if(TIMING&&n&&!ctx.inc){var oh=THREAT.oppH+THREAT.oppInc;oh>=10||oh>=6&&(THREAT.oppSpike||0)===0?v+=TIMING*.3*atk:oh<=4&&atk>0&&atk<=2&&!ctx.high&&!hard&&(v-=TIMING*.35*atk)}if(STRAT>=2&&n){var spk=THREAT.oppSpike||0;spk>=4&&!ctx.inc&&(v+=.3*attackOf(sp,n,ctx.b2b,ctx.combo,r.pc)),ctx.inc&&ctx.incSoon&&(v+=.25*Math.min(ctx.incSoon,attackOf(sp,n,ctx.b2b,ctx.combo,r.pc)+n))}if(SURGE&&n&&!hard&&ctx.b2b>=4&&!ctx.high){var exposed=oppOpen||THREAT.oppSpent||(THREAT.oppSpike||0)<2;exposed?v+=SURGE*.6*(ctx.b2b-1):(THREAT.oppSpike||0)>=4&&(v-=SURGE*.3*ctx.b2b)}return n&&!hard&&ctx.b2b&&(STRAT&&ctx.b2b>=4&&(oppOpen||ctx.high)&&(STRAT<2||(THREAT.oppSpike||0)<4||ctx.high)?v+=.6*(ctx.b2b-1):v-=ctx.high?1:WT.b2bBreak),n&&!hard&&!ctx.high&&!ctx.inc&&ctx.tac!=="dig"&&ctx.tac!=="kill"&&(v-=WT.plain+WT.plainN*n),P.k==="T"&&!sp&&STYLE!=="pc"&&(v-=ctx.high?.5:WT.wastedT),sp==="Tmini"&&(v-=n?WT.mini:.5),sp&&sp!=="T"&&sp!=="Tmini"&&n&&(v-=WT.otherSpin),ctx.opening&&!r.pc&&(n&&!(sp==="T"&&n>=2)&&n!==4&&(v-=5),sp==="T"&&n>=2&&(v+=4),P.k==="T"&&!(sp==="T"&&n>=2)&&(v-=2)),ctx.inc&&n&&(v+=Math.min(ctx.inc,n*2+atk)*WT.defend),v+c4}function pcSolve(b,cur,hold,queue,ms){var now=typeof performance<"u"?function(){return performance.now()}:Date.now,dead=now()+ms,f=features(b);if(f.maxH>4)return null;for(var filled=0,i=0;i<b.length;i++)b[i]&&filled++;for(var hgt=-1,hh=Math.max(f.maxH,2);hh<=4;hh++)if((hh*W-filled)%4===0){hgt=hh;break}if(hgt<0)return null;var need=(hgt*W-filled)/4,known=1+queue.length+(hold?1:0);if(need>known||need<1)return null;var nodes=0;function ok(bd,lim){for(var seen=new Uint8Array(W*H),top=H-lim,y=top;y<H;y++)for(var x=0;x<W;x++){var j=y*W+x;if(!(bd[j]||seen[j])){var st2=[j],n=0;for(seen[j]=1;st2.length;){var c=st2.pop();n++;var cx=c%W,cy=c/W|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var xx=cx+d[0],yy=cy+d[1];if(!(xx<0||xx>=W||yy<top||yy>=H)){var jj=yy*W+xx;bd[jj]||seen[jj]||(seen[jj]=1,st2.push(jj))}})}if(n%4)return!1}}return!0}function rec(bd,c,hd,qi,lim,path){if((++nodes&7)===0&&now()>dead)return nodes=1e9,null;if(nodes>=1e9)return null;var opts=[{k:c,h:hd,q:qi,hold:!1}];hd&&hd!==c?opts.push({k:hd,h:c,q:qi,hold:!0}):!hd&&qi<queue.length&&opts.push({k:queue[qi],h:c,q:qi+1,hold:!0});for(var o=0;o<opts.length;o++)for(var O=opts[o],ps=moves(bd,O.k,spawnState(bd,O.k)),i2=0;i2<ps.length;i2++){var P=ps[i2];if(!(P.y+Math.min.apply(null,ROT[P.k][P.r].map(function(z){return z[1]}))<H-lim)){var r=place(bd,P.k,P.r,P.x,P.y),nl=lim-r.lines,step={hold:O.hold,P};if(r.pc)return path.concat([step]);if(!(nl<=0||!ok(r.b,nl))){var nq=O.q,nc=queue[nq];if(nc!==void 0){var sol=rec(r.b,nc,O.h,nq+1,nl,path.concat([step]));if(sol)return sol;if(nodes>=1e9)return null}}}}return null}return rec(b,cur,hold,0,hgt,[])}var PCC=ScanTetrisGame.__pc||(ScanTetrisGame.__pc={ok:new Map,ch:new Map}),PCOK=PCC.ok,PCCH=PCC.ch,FULLW=(1<<W)-1,PCN=NAMES.split("");function pcKey(rows){if(rows.length>4)return rows.join(",");for(var k=rows.length,i=0;i<rows.length;i++)k=k*1024+rows[i];return k}function pcParity(rows){for(var L=rows.length,seen=new Uint8Array(L*W),y=0;y<L;y++)for(var x=0;x<W;x++)if(!(rows[y]>>x&1||seen[y*W+x])){var stk=[y*W+x],n=0;for(seen[y*W+x]=1;stk.length;){var c=stk.pop(),cy=c/W|0,cx=c%W;n++,cx>0&&!(rows[cy]>>cx-1&1)&&!seen[c-1]&&(seen[c-1]=1,stk.push(c-1)),cx<W-1&&!(rows[cy]>>cx+1&1)&&!seen[c+1]&&(seen[c+1]=1,stk.push(c+1)),cy>0&&!(rows[cy-1]>>cx&1)&&!seen[c-W]&&(seen[c-W]=1,stk.push(c-W)),cy<L-1&&!(rows[cy+1]>>cx&1)&&!seen[c+W]&&(seen[c+W]=1,stk.push(c+W))}if(n%4)return!1}return!0}function pcKids(rows,k){var key=pcKey(rows)+":"+k,c=PCCH.get(key);if(c)return c;var L=rows.length,out=[],seenK={},PM=PMR[k];function ok(r3,x2,y2){var pm2=PM[r3];if(x2+pm2.minx<0||x2+pm2.maxx>=W)return!1;for(var i=0;i<pm2.n;i++){var yy=y2+pm2.dy[i];if(yy>=L||yy>=0&&rows[yy]&(x2>=0?pm2.m[i]<<x2:pm2.m[i]>>-x2))return!1}return!0}var y0=-3,NY=L+4,seen=new Uint8Array(64*NY),q=[];function push(r3,x2,y2){var i=(r3*16+x2+3)*NY+(y2-y0);seen[i]||(seen[i]=1,q.push(r3,x2,y2))}for(var r0=0;r0<4;r0++)for(var x0=-3;x0<W;x0++)ok(r0,x0,y0)&&push(r0,x0,y0);for(var h=0;h<q.length;h+=3){var r=q[h],x=q[h+1],y=q[h+2];if(ok(r,x-1,y)&&push(r,x-1,y),ok(r,x+1,y)&&push(r,x+1,y),ok(r,x,y+1))push(r,x,y+1);else if(y>=0||PM[r].dy.some(function(d2){return y+d2>=0})){for(var pm=PM[r],inw=!0,j=0;j<pm.n;j++)if(y+pm.dy[j]<0){inw=!1;break}if(inw){for(var nr=rows.slice(),j2=0;j2<pm.n;j2++)nr[y+pm.dy[j2]]|=x>=0?pm.m[j2]<<x:pm.m[j2]>>-x;nr=nr.filter(function(v){return v!==FULLW});var nk=pcKey(nr);seenK[nk]||(seenK[nk]=1,pcParity(nr)&&out.push({rows:nr,key:nk,r,x,y,lo:L-nr.length+y+pm.dy[pm.n-1]}))}}if(k!=="O"){for(var d=-1;d<=2;d++)if(d)for(var r2=(r+d+4)%4,K=d===2?(k==="I"?KI180:K180)[""+r+r2]:(k==="I"?KI:KJ)[""+r+r2],t=0;t<K.length;t++){var nx=x+K[t][0],ny=y-K[t][1];if(ny>=y0&&ny<L&&ok(r2,nx,ny)){push(r2,nx,ny);break}}}}return out.sort(function(a,b){return b.lo-a.lo}),PCCH.set(key,out),out}function pcOk(rows){if(!rows.length)return!0;var key=pcKey(rows),v=PCOK.get(key);if(v!==void 0)return v;if(v=!1,pcParity(rows))for(var i=0;i<7&&!v;i++)pcKids(rows,PCN[i]).length&&(v=!0);return PCOK.set(key,v),v}function pcSamples(seq,maskK,n,rng){for(var out=[],s0=0;s0<n;s0++){for(var q=seq.slice(),m=maskK||127;q.length<seq.length+11;){for(var left=[],i=0;i<7;i++)m>>i&1&&left.push(PCN[i]);for(var j=left.length-1;j>0;j--){var t=Math.floor(rng()*(j+1)),tmp=left[j];left[j]=left[t],left[t]=tmp}q=q.concat(left),m=127}out.push(q)}return out}function pcChance(samples,dead){var nodes=0;function solve(q,memo,rows,h,p,ch){if(!rows.length)return!0;if(p>=q.length||((++nodes&15)===0&&Date.now()>Math.min(dead.d,dead.s||1e15)&&(nodes=1e9),nodes>=1e9))return!1;var key=pcKey(rows)+"|"+h+"|"+p+(ch?1:0);if(memo.has(key))return!1;var c=q[p],ks=pcKids(rows,c),i;for(i=0;i<ks.length;i++)if(solve(q,memo,ks[i].rows,h,p+1,!0))return!0;if(ch&&h&&h!==c){var kh=pcKids(rows,h);for(i=0;i<kh.length;i++)if(solve(q,memo,kh[i].rows,c,p+1,!0))return!0}return ch&&!h&&solve(q,memo,rows,c,p+1,!1)?!0:(nodes<1e9&&memo.add(key),!1)}var memos=samples.map(function(){return new Set});return{N:samples.length,V1:function(rows,h,p,i){return nodes=0,solve(samples[i],memos[i],rows,h,p,!0)},V:function(rows,h,p){for(var n=0,i=0;i<samples.length;i++)solve(samples[i],memos[i],rows,h,p,!0)&&n++;return n/samples.length}}}function*pcLoopGen(st2,minP){var b=st2.b,R=b.__r||rowsOf(b),f=features(b),LM=opt.pclim||6;if(f.maxH>LM)return null;for(var filled=0,y=H-LM;y<H;y++)filled+=pop(R[y]);for(var u=st2.all.length-st2.queue.length+5,b0=Math.floor(u/7)*7,maskK=127,q=b0;q<u;q++)maskK&=~(1<<PCN.indexOf(st2.all[q]));var seq=[st2.cur].concat(st2.queue.slice(0,5)),dead={d:Date.now()+(opt.pcms||150)},bestv=-1,bestm=null,SMP=pcSamples(seq,maskK,opt.pcs||12,rnd);PCCH.size>2e5&&(PCCH.clear(),PCOK.clear());for(var lim=Math.max(f.maxH,1);lim<=LM&&!(lim>4&&f.maxH<=4&&bestv>.3);lim++)if(!((lim*W-filled)%4)){for(var win=[],yy=H-lim;yy<H;yy++)win.push(R[yy]);if(pcParity(win)){var ev=pcChance(SMP,dead),opts=[{k:st2.cur,hold:!1,h:st2.hold}];st2.held||(st2.hold&&st2.hold!==st2.cur?opts.push({k:st2.hold,hold:!0,h:st2.cur}):st2.hold||opts.push({k:st2.queue[0],hold:!0,h:st2.cur,skip:1})),yield 0;for(var o=0;o<opts.length;o++){var O=opts[o],ms=moves(b,O.k,spawnState(b,O.k)),tY0=Date.now();yield 0,dead.d+=Date.now()-tY0;for(var i=0;i<ms.length;i++){var P=ms[i],r=place(b,P.k,P.r,P.x,P.y),v;if(r.pc)v=1.01;else{for(var nl=lim-r.lines,R2=r.b.__r||rowsOf(r.b),ok=!0,y2=0;y2<H-nl;y2++)if(R2[y2]){ok=!1;break}if(!ok||nl<=0)continue;for(var w2=[],y3=H-nl;y3<H;y3++)w2.push(R2[y3]);if(!pcParity(w2))continue;for(var nOK=0,si=0;si<ev.N;si++)if(dead.s=Date.now()+8,ev.V1(w2,O.h||null,1+(O.skip||0),si)&&nOK++,si<ev.N-1){var tY1=Date.now();yield 0,dead.d+=Date.now()-tY1}dead.s=0,v=nOK/ev.N}v+=lim<4?.02:lim>4?-.15:0,v>bestv&&(bestv=v,bestm={hold:O.hold,P,pc:!0,pcP:v});var tY=Date.now();yield 0,dead.d+=Date.now()-tY}}}}return bestv>=(minP||0)?bestm:null}G._dbg_pc={ok:pcOk,kids:pcKids,chance:pcChance,move:function(m){var it=pcLoopGen(st,m),r;do r=it.next();while(!r.done);return r.value},size:function(){return[PCOK.size,PCCH.size]}};var OPENERS=["0001000000100111111010001111111101111111","0000111000000111100111111100011111111011","0001000000100111101110001111111101111111","0001000000111100101111100011111111011111","1000000000110011011111000111111110111111","0000001000110100111111110001111111101111","0110010000111001100011100011111111011111","0011000001101100001111100011111111011111","0000001000011111100111111100011111111011","0010011000011001110011000111111110111111","1000001100110000110111110001111111101111","0000100110000110011111110001111111101111","0000001000110111100111111100011111111011","0000010000100111101110001111111101111111"],BOOK=[{n:"TKI",k:"T",r:[".......J..","L..ZZ.SJJJ","L...ZZSSOO","LL.IIIISOO"]},{n:"TKI (mirror)",k:"T",r:["..L.......","LLLZ.SS..J","OOZZSS...J","OOZIIII.JJ"]},{n:"TKI flat",k:"T",r:["L..ZZ.S...","L...ZZSSOO","LL.IIIISOO"]},{n:"TKI flat (mirror)",k:"T",r:["...Z.SS..J","OOZZSS...J","OOZIIII.JJ"]},{n:"MKO",k:"T",r:["S.....Z..I","SS...ZZ..I","JS...ZLOOI","JJJ.LLLOOI"]},{n:"MKO (mirror)",k:"T",r:["I..S.....Z","I..SS...ZZ","IOOJS...ZL","IOOJJJ.LLL"]},{n:"MKO",k:"T",r:["S.....ZI..","SS...ZZI..","JS...ZLIOO","JJJ.LLLIOO"]},{n:"MKO (mirror)",k:"T",r:["..IS.....Z","..ISS...ZZ","OOIJS...ZL","OOIJJJ.LLL"]},{n:"Albatross",k:"T",r:["...ZZ....I","S...ZZJJJI","SS.OOLLLJI",".S.OOL...I"]},{n:"Albatross (mirror)",k:"T",r:["I....SS...","ILLLSS...Z","ILJJJOO.ZZ","I...JOO.Z."]},{n:"Viper",k:"T",r:["I......ZZ.","ILOOS...ZZ","ILOOSS.JJJ","ILL..S...J"]},{n:"Viper (mirror)",k:"T",r:[".SS......I","SS...ZOOJI","LLL.ZZOOJI","L...Z..JJI"]},{n:"PCO",k:"I",r:["LLL.....SS","LOO....SST","JOO...ZZTT","JJJ....ZZT"]},{n:"PCO (mirror)",k:"I",r:["ZZ.....JJJ","TZZ....OOJ","TTSS...OOL","TSS....LLL"]},{n:"DT Cannon",k:"T",r:["......I...","....SSIZZ.","OO.SSLIJZZ","OO.LLLIJJJ"]},{n:"DT Cannon (mirror)",k:"T",r:["...I......",".SSIZZ....","SSLIJZZ.OO","LLLIJJJ.OO"]},{n:"DT Cannon",k:"T",r:["......I...","....ZJILS.","OO.ZZJILSS","OO.ZJJILLS"]},{n:"DT Cannon (mirror)",k:"T",r:["...I......",".ZJILS....","ZZJILSS.OO","ZJJILLS.OO"]},{n:"Hachispin",k:"T",r:["......Z...","I....ZZ...","I.JJJZ....","ILLLJOO.SS","IL...OOSS."]},{n:"Hachispin (mirror)",k:"T",r:["...S......","...SS....I","....SLLL.I","ZZ.OOLJJJI",".ZZOO...JI"]},{n:"Ajanba TSD",k:"T",r:["S.........","SS..ZZ.LLL","JS...ZZLOO","JJJ.IIIIOO"]},{n:"Pelican",k:"T",r:[".....LL..I","SZZ...LOOI","SSZZ.JLOOI",".S...JJJ.I"]},{n:"Number One",k:"T",r:["....LL....",".....L..S.","IIII.LZZSS","JJJ..OOZZS","..J..OO..."]},{n:"BT Cannon",k:"X",r:["LLL..S....","LT...SS.OO","TTT.ZZSJOO","IIII.ZZJJJ"]},{n:"C-Spin",k:"X",r:["JJ........","J.........","J.TTT.....","L..TS...OO","L.ZZSS..OO","LL.ZZSIIII"]},{n:"Ajanba TSD (mirror)",k:"T",r:[".........Z","JJJ.SS..ZZ","OOJSS...ZL","OOIIII.LLL"]},{n:"Pelican (mirror)",k:"T",r:["I..JJ.....","IOOJ...SSZ","IOOJL.SSZZ","I.LLL...Z."]},{n:"Number One (mirror)",k:"T",r:["....JJ....",".Z..J.....","ZZSSJ.IIII","ZSSOO..LLL","...OO..L.."]},{n:"BT Cannon (mirror)",k:"X",r:["....Z..JJJ","OO.ZZ...TJ","OOLZSS.TTT","LLLSS.IIII"]},{n:"C-Spin (mirror)",k:"X",r:["........LL",".........L",".....TTT.L","OO...ZT..J","OO..ZZSS.J","IIIIZSS.JJ"]},{n:"Stickspin",k:"T",r:["........S.","I.......SS","IJJ......S","IJLLLZZ.OO","IJL...ZZOO"]},{n:"Stickspin (mirror)",k:"T",r:[".Z........","ZZ.......I","Z......LLI","OO.SSJJJLI","OOSS...JLI"]},{n:"Stickspin 2",k:"T",r:["........S.","I.......SS","ILJ......S","ILJJJZZ.OO","ILL...ZZOO"]},{n:"Stickspin 2 (mirror)",k:"T",r:[".Z........","ZZ.......I","Z......LJI","OO.SSLLLJI","OOSS...JJI"]},{n:"Fairy (Breakerspin)",k:"T",r:["I.........","I.........","I.Z.......","IZZ.....LL","JZ...SSOOL","JJJ.SS.OOL"]},{n:"Fairy (Breakerspin) (mirror)",k:"T",r:[".........I",".........I",".......S.I","JJ.....SSI","JOOZZ...SL","JOO.ZZ.LLL"]},{n:"Fairy (Breakerspin) 2",k:"T",r:["I.........","I.........","I.Z.......","IZZ.......","JZ...SSLLL","JJJ.SS.L.."]},{n:"Fairy (Breakerspin) 2 (mirror)",k:"T",r:[".........I",".........I",".......S.I",".......SSI","JJJZZ...SL","..J.ZZ.LLL"]},{n:"LaundrySpin",k:"T",r:["........S.","I.......SS","IJJLLL...S","IJ.L.ZZ.OO","IJ....ZZOO"]},{n:"LaundrySpin (mirror)",k:"T",r:[".Z........","ZZ.......I","Z...JJJLLI","OO.SS.J.LI","OOSS....LI"]},{n:"Speedboat",k:"T",r:["...LL....I","....LOOS.I","ZZ.JLOOSSI",".ZZJJJ..SI"]},{n:"Speedboat (mirror)",k:"T",r:["I....JJ...","I.ZOOJ....","IZZOOJL.SS","IZ..LLLSS."]},{n:"Sailboat",k:"T",r:["...LL....I","....LOO..I","ZZ.JLOOSSI",".ZZJJJSS.I"]},{n:"Sailboat (mirror)",k:"T",r:["I....JJ...","I..OOJ....","IZZOOJL.SS","I.ZZLLLSS."]},{n:"LAST",k:"T",r:["S.........","SS.......I","LS..J.Z..I","L...JZZOOI","LL.JJZ.OOI"]},{n:"LAST (mirror)",k:"T",r:[".........Z","I.......ZZ","I..S.L..ZJ","IOOSSL...J","IOO.SLL.JJ"]},{n:"PC-Spin",k:"X",r:["..Z.......",".ZZSS.....",".ZSSL....J","OOLLL.TTTJ","OOIIII.TJJ"]},{n:"PC-Spin (mirror)",k:"X",r:[".......S..",".....ZZSS.","L....JZZS.","LTTT.JJJOO","LLT.IIIIOO"]},{n:"PC-Spin 2",k:"X",r:[".......S..",".....ZZSS.","L....JZZS.","LTTT.JJJOO","LLT.IIIIOO"]},{n:"PC-Spin 2 (mirror)",k:"X",r:["..Z.......",".ZZSS.....",".ZSSL....J","OOLLL.TTTJ","OOIIII.TJJ"]},{n:"Gamushiro",k:"X",r:["S......I..","SS....TI..","JS.ZZTTIOO","JJJ.ZZTIOO"]},{n:"Gamushiro (mirror)",k:"X",r:["..I......Z","..IT....ZZ","OOITTSS.ZL","OOITSS.LLL"]},{n:"Gamushiro 2",k:"X",r:["........L.","S......IL.","SS....TILL","JS.ZZTTIOO","JJJ.ZZTIOO"]},{n:"Gamushiro 2 (mirror)",k:"X",r:[".J........",".JI......Z","JJIT....ZZ","OOITTSS.ZL","OOITSS.LLL"]},{n:"Sewer",k:"X",r:[".....I....",".....I....",".T...I....","TT.ZZI....","ST..ZZ..L.","SS.JJJOOL.",".S...JOOLL"]},{n:"Sewer (mirror)",k:"X",r:["....I.....","....I.....","....I...T.","....ISS.TT",".J..SS..TZ",".JOOLLL.ZZ","JJOOL...Z."]},{n:"Sewer 2",k:"X",r:["........T.","........TT","...OO...TI","SZZOO....I","SSZZL.JJJI",".SLLL...JI"]},{n:"Sewer 2 (mirror)",k:"X",r:[".T........","TT........","IT...OO...","I....OOSSZ","ILLL.JSSZZ","IL...JJJZ."]},{n:"F-Spin",k:"X",r:["........T.","...I...TTT","ZZ.I....SS","JZZIOO.SSL","JJJIOO.LLL"]},{n:"F-Spin (mirror)",k:"X",r:[".T........","TTT...I...","ZZ....I.SS","JZZ.OOISSL","JJJ.OOILLL"]},{n:"Chopin Trinity",k:"X",r:["LLL.......","LZ..S.....","ZZ..SS....","Z...TS....","OO.TTT.J..","OO.IIIIJJJ"]},{n:"Chopin Trinity (mirror)",k:"X",r:[".......JJJ",".....Z..SJ","....ZZ..SS","....ZT...S","..L.TTT.OO","LLLIIII.OO"]}];function shiftB(b,h){for(var nb=new b.constructor(b.length),y=0;y+h<H;y++)for(var x=0;x<W;x++)nb[(y+h)*W+x]=b[y*W+x];return nb.__r=null,nb.__s=null,nb}function stageMatch(b,maxShift){for(var R=b.__r||rowsOf(b),out=[],i=0;i<BOOK2.length;i++){var E=BOOK2[i];if(E._xm||(E._xm=E.r.map(function(row2){for(var m=0,x=0;x<W;x++)row2[x]==="X"&&(m|=1<<x);return m}),E._lm=E.r.map(function(row2){for(var m=0,x=0;x<W;x++)row2[x]!=="X"&&row2[x]!=="."&&row2[x]!=="*"&&(m|=1<<x);return m}),E._any=E._xm.some(function(m){return m})),!!E._any)for(var len=E.r.length,sh=0;sh<=maxShift;sh++){var y0=H-len-sh;if(y0<4)break;for(var ok=!0,ry=0;ry<len&&ok;ry++){var row=R[y0+ry];((row&E._xm[ry])!==E._xm[ry]||row&E._lm[ry])&&(ok=!1)}for(var ya=y0-1;ya>=y0-3&&ok;ya--)R[ya]&&(ok=!1);ok&&out.push({E,sh})}}return out}function coolOf(n){return n=(n||"").replace(/ \(mirror\)/g,""),/^SingleYou|^solver|^Unnamed|開幕TSD|^LAST|^Sus Opener/.test(n)?0:/Cannon|DT|Hachispin|Stickspin|Fairy|TST|Tsar|Gamushiro|C-Spin|Speedboat|MKO|Imperial|STSD|山岳|Mountain|Albatross|Pelican|Kaidan|Trinity|Cyclone|Dragon|Toro|PC-Spin|Castella/i.test(n)?2:1}function flairW(n){if(!FLAIR)return 1;var c=coolOf(n);return c===0?1/(1+2*FLAIR):c===2?1+3*FLAIR:1+FLAIR}function*openerGen(b,seq,all,only,hold0,low){var picks=[],lists=only?[only]:[BOOK.filter(function(e){return STYLE==="pc"?e.k==="I":e.k==="T"||e.k==="X"}),OPENERS.map(function(t2){for(var rows=[],i=0;i<4;i++)rows.push(t2.slice(i*10,i*10+10).replace(/1/g,"*").replace(/0/g,"."));return{n:"solver",k:"T",r:rows}})],big=!only&&lists[0].length>80,tries=0;if(big){var av={};seq.concat(hold0?[hold0]:[]).forEach(function(k){av[k]=(av[k]||0)+1});var rs=(G.seed>>>0^2654435769)>>>0,rr2=function(){return rs=rs*1664525+1013904223>>>0,(rs+.5)/4294967296};lists[0]=lists[0].filter(function(E2){if(!E2._c){var c={};E2.r.join("").replace(/[.X*]/g,"").split("").forEach(function(ch2){c[ch2]=(c[ch2]||0)+1});for(var k in c)c[k]=Math.ceil(c[k]/4);E2._c=c}for(var k2 in E2._c)if((av[k2]||0)<E2._c[k2])return!1;if(low){for(var lc=0;lc<low.length;lc++)for(var lr=0;lr<E2.r.length;lr++)if(E2.r[lr][low[lc]]!==".")return!1}return!(E2.k!=="X"&&E2._c[E2.k])}).map(function(E2){return E2._hc==null&&(openerGen._af||(openerGen._af={},BOOK2.forEach(function(e2){openerGen._af[e2.after]=1})),E2._hc=openerGen._af[E2.n]?1:0),{E:E2,key:-Math.log(rr2())/((E2.w||1.5)*(E2._hc?3:1)*flairW(E2.n))}}).sort(function(x2,y){return x2.key-y.key}).map(function(x2){return x2.E})}for(var li=0;li<lists.length&&!picks.length;li++)for(var t=0;t<lists[li].length;t++){let dropsInto2=function(bd,k){if(only&&LOOSE){for(var mv=bd["__m"+k]||(bd["__m"+k]=moves(bd,k,spawnState(bd,k),300)),o2=[],mi=0;mi<mv.length;mi++){for(var M=mv[mi],s2=ROT[k][M.r],ok2=!0,c2=0;c2<4;c2++){var w2=want[(M.y+s2[c2][1])*W+M.x+s2[c2][0]];if(!w2){ok2=!1;break}}ok2&&o2.push(M)}return o2}for(var out=[],r=0;r<(k==="O"?1:4);r++)for(var x2=-2;x2<W;x2++)if(fits(bd,k,r,x2,0)){for(var y=dropY(bd,k,r,x2,0),s=ROT[k][r],ok=!0,c=0;c<4;c++){var w=want[(y+s[c][1])*W+x2+s[c][0]];if(!w||w!=="*"&&w!==k&&!((E.after||only)&&LOOSE)){ok=!1;break}}ok&&out.push({k,r,x:x2,y})}return out},stillOpen2=function(bd){for(var j in want)if(j=+j,!bd[j]){for(var yy=(j/W|0)-1;yy>=0;yy--)if(bd[yy*W+j%W])return!1}return!0},rec2=function(bd,ci,cur,hold,path){if(++nodes>(only&&LOOSE?120:500)||(nodes&7)===0&&Date.now()>recDl)return null;if(path.length===need)return need===full||stillOpen2(bd)?path:null;var opts=[];cur&&cur!==keep&&opts.push({k:cur,hold:!1,nh:hold,nci:ci}),hold?hold!==keep&&cur&&opts.push({k:hold,hold:!0,nh:cur,nci:ci}):cur&&ci<seq.length&&seq[ci]!==keep&&opts.push({k:seq[ci],hold:!0,nh:cur,nci:ci+1});for(var o=0;o<opts.length;o++)for(var O=opts[o],ps=dropsInto2(bd,O.k),p=0;p<ps.length;p++){var P=ps[p],r=place(bd,O.k,P.r,P.x,P.y);if(!r.lines){var sol2=rec2(r.b,O.nci+1,seq[O.nci],O.nh,path.concat([{hold:O.hold,P}]));if(sol2)return sol2}}return null};var dropsInto=dropsInto2,stillOpen=stillOpen2,rec=rec2,E=lists[li][t],want={},nCells=0;if(big&&li===0&&(picks.length||++tries>80))break;for(var clash=!1,ry=0;ry<E.r.length;ry++)for(var x=0;x<W;x++){var ch=E.r[ry][x],j0=(H-E.r.length+ry)*W+x;if(ch==="X"){b[j0]||(clash=!0);continue}if(ch!=="."){if(b[j0]){if(E.after)continue;clash=!0}want[j0]=ch,nCells++}}if(!clash){var keep=E.k,need=Math.floor(nCells/4),full=nCells/4;if(!(nCells%4&&!(only&&LOOSE&&REOPEN>=2&&need>=1))){if(E.after){for(var vis=0,q=0;q<seq.length;q++)seq[q]!==keep&&vis++;need=Math.min(need,Math.max(1,vis-1))}var nodes=0,recDl=Date.now()+12,sol=rec2(b,1,seq[0],hold0||null,[]);if(sol&&(sol.name=E.n,sol.w=E.w||1.5,picks.push(sol),!all))break;yield 0}}}var tier=function(n){return/^solver/.test(n)?2:0};if(only&&picks.length){var spOf=function(p){for(var q2=0;q2<only.length;q2++)if(only[q2].n===p.name)return only[q2].sp||0;return 0},mx=Math.max.apply(null,picks.map(spOf));picks=picks.filter(function(p){return spOf(p)===mx})}if(picks.length){var bt=Math.min.apply(null,picks.map(function(p){return tier(p.name)}));picks=picks.filter(function(p){return tier(p.name)===bt})}if(!picks.length)return null;var tw=0;picks.forEach(function(p){p.w=(p.w||1)*flairW(p.name),tw+=p.w});for(var u=((G.seed>>>0)*2654435761>>>0)%1e5/1e5*tw,pi=0;pi<picks.length;pi++)if(u-=picks[pi].w||1,u<=0)return picks[pi];return picks[picks.length-1]}var BOOK2=[{n:"Hachispin TST",after:"Hachispin",k:"T",r:["JJ.....I..","J....SSIOO","J.ZZSSXIOO","X..ZZXXILL","X.XXXXXXXL","XX...XXXXL"],sp:3},{n:"Hachispin TST (mirror)",after:"Hachispin (mirror)",k:"T",r:["..I.....LL","OOIZZ....L","OOIXZZSS.L","JJIXXSS..X","JXXXXXXX.X","JXXXX...XX"],sp:3},{n:"TKI \xB7 1",after:"TKI",k:"T",r:["**..******","**..******","*...***X**","X*.XX*XXXX"],sp:2},{n:"TKI \xB7 2",after:"TKI",k:"T",r:["*****..***","*****..***","****...X**","X**XX.XXXX"],sp:2},{n:"TKI \xB7 3",after:"TKI",k:"T",r:["..********","..********","...****X**","X.*XX*XXXX"],sp:2},{n:"TKI \xB7 4",after:"TKI",k:"T",r:["*..*******","*..*******","*...***X**","X*.XX*XXXX"],sp:2},{n:"TKI \xB7 5",after:"TKI",k:"T",r:["****..****","****..****","****...X**","X**XX.XXXX"],sp:2},{n:"TKI \xB7 6",after:"TKI",k:"T",r:[".........I",".........I","JJJ...LLLI","OOJ...LZZI","OOSS...XZZ","XSSXX.XXXX"],sp:2},{n:"TKI \xB7 6 \xB7 1",after:"TKI \xB7 6",k:"T",r:["****..***X","****..***X","XXX...XXXX","XXX*.*XXXX"],sp:2},{n:"TKI \xB7 6 \xB7 2",after:"TKI \xB7 6",k:"T",r:["***..****X","***..****X","XXX...XXXX","XXX*.*XXXX"],sp:2},{n:"TKI \xB7 6 \xB7 3",after:"TKI \xB7 6",k:"T",r:[".........I",".........I",".........I","JJZ...LLLI","JZZ...LOOX","JZ...SSOOX","XXX.SSXXXX","XXX...XXXX"],sp:2},{n:"TKI \xB7 6 \xB7 4",after:"TKI \xB7 6",k:"T",r:[".........I",".........I",".........I","JJJ...SLLI","OOJ...SSLX","OOZZ...SLX","XXXZZ.XXXX","XXX...XXXX"],sp:2},{n:"TKI \xB7 7",after:"TKI",k:"T",r:[".........I",".........I","JJZ...OOLI","JZZ...OOLI","JZSS...XLL","XSSXX.XXXX"],sp:2},{n:"TKI \xB7 7 \xB7 1",after:"TKI \xB7 7",k:"T",r:["****..***X","****..***X","XXX...XXXX","XXX*.*XXXX"],sp:2},{n:"TKI \xB7 7 \xB7 2",after:"TKI \xB7 7",k:"T",r:["***..****X","***..****X","XXX...XXXX","XXX*.*XXXX"],sp:2},{n:"TKI \xB7 7 \xB7 3",after:"TKI \xB7 7",k:"T",r:[".........I",".........I",".........I","JJZ...LLLI","JZZ...LOOX","JZ...SSOOX","XXX.SSXXXX","XXX...XXXX"],sp:2},{n:"TKI \xB7 7 \xB7 4",after:"TKI \xB7 7",k:"T",r:[".........I",".........I",".........I","JJJ...SLLI","OOJ...SSLX","OOZZ...SLX","XXXZZ.XXXX","XXX...XXXX"],sp:2},{n:"TKI \xB7 8",after:"TKI",k:"T",r:["L..IIIIOOJ","L...SSZOOJ","LL.SSZZXJJ","X..XXZXXXX"],sp:2},{n:"TKI \xB7 1 (early)",after:"TKI",k:"T",r:[".......X..","X..XX.XXXX","X...XXXXXX","XX.XXXXXXX"],sp:2},{n:"TKI (mirror) \xB7 1",after:"TKI (mirror)",k:"T",r:["****..****","****..****","**X...****","XXXX.XX**X"],sp:2},{n:"TKI (mirror) \xB7 2",after:"TKI (mirror)",k:"T",r:["*******..*","*******..*","**X***...*","XXXX*XX.*X"],sp:2},{n:"TKI (mirror) \xB7 3",after:"TKI (mirror)",k:"T",r:["********..","********..","**X****...","XXXX*XX*.X"],sp:2},{n:"TKI (mirror) \xB7 4",after:"TKI (mirror)",k:"T",r:["***..*****","***..*****","**X...****","XXXX.XX**X"],sp:2},{n:"TKI (mirror) \xB7 5",after:"TKI (mirror)",k:"T",r:["******..**","******..**","**X***...*","XXXX*XX.*X"],sp:2},{n:"TKI (mirror) \xB7 6",after:"TKI (mirror)",k:"T",r:["I.........","I.........","IJJJ...LLL","ISSJ...LOO","SSX...ZZOO","XXXX.XXZZX"],sp:2},{n:"TKI (mirror) \xB7 6 \xB7 1",after:"TKI (mirror) \xB7 6",k:"T",r:["X****..***","X****..***","XXXX...XXX","XXXX*.*XXX"],sp:2},{n:"TKI (mirror) \xB7 6 \xB7 2",after:"TKI (mirror) \xB7 6",k:"T",r:["X***..****","X***..****","XXXX...XXX","XXXX*.*XXX"],sp:2},{n:"TKI (mirror) \xB7 6 \xB7 3",after:"TKI (mirror) \xB7 6",k:"T",r:["I.........","I.........","I.........","IJJJ...SLL","XOOJ...SSL","XOOZZ...SL","XXXXZZ.XXX","XXXX...XXX"],sp:2},{n:"TKI (mirror) \xB7 6 \xB7 4",after:"TKI (mirror) \xB7 6",k:"T",r:["I.........","I.........","I.........","IJJZ...LLL","XJZZ...LOO","XJZ...SSOO","XXXX.SSXXX","XXXX...XXX"],sp:2},{n:"TKI (mirror) \xB7 7",after:"TKI (mirror)",k:"T",r:["I.........","I.........","IJOO...SLL","IJOO...SSL","JJX...ZZSL","XXXX.XXZZX"],sp:2},{n:"TKI (mirror) \xB7 7 \xB7 1",after:"TKI (mirror) \xB7 7",k:"T",r:["X****..***","X****..***","XXXX...XXX","XXXX*.*XXX"],sp:2},{n:"TKI (mirror) \xB7 7 \xB7 2",after:"TKI (mirror) \xB7 7",k:"T",r:["X***..****","X***..****","XXXX...XXX","XXXX*.*XXX"],sp:2},{n:"TKI (mirror) \xB7 7 \xB7 3",after:"TKI (mirror) \xB7 7",k:"T",r:["I.........","I.........","I.........","IJJJ...SLL","XOOJ...SSL","XOOZZ...SL","XXXXZZ.XXX","XXXX...XXX"],sp:2},{n:"TKI (mirror) \xB7 7 \xB7 4",after:"TKI (mirror) \xB7 7",k:"T",r:["I.........","I.........","I.........","IJJZ...LLL","XJZZ...LOO","XJZ...SSOO","XXXX.SSXXX","XXXX...XXX"],sp:2},{n:"TKI (mirror) \xB7 8",after:"TKI (mirror)",k:"T",r:["LOOIIII..J","LOOSZZ...J","LLXSSZZ.JJ","XXXXSXX..X"],sp:2},{n:"TKI (mirror) \xB7 1 (early)",after:"TKI (mirror)",k:"T",r:["..X.......","XXXX.XX..X","XXXXXX...X","XXXXXXX.XX"],sp:2},{n:"TKI flat \xB7 1",after:"TKI flat",k:"T",r:["**..******","**..******","*...******","X*.XX*X***"],sp:2},{n:"TKI flat \xB7 2",after:"TKI flat",k:"T",r:["*****..***","*****..***","****...***","X**XX.X***"],sp:2},{n:"TKI flat \xB7 3",after:"TKI flat",k:"T",r:["*******..*","*******..*","******...*","X**XX*X.**"],sp:2},{n:"TKI flat \xB7 4",after:"TKI flat",k:"T",r:["********..","********..","*******...","X**XX*X*.*"],sp:2},{n:"TKI flat \xB7 5",after:"TKI flat",k:"T",r:["..********","..********","...*******","X.*XX*X***"],sp:2},{n:"TKI flat \xB7 6",after:"TKI flat",k:"T",r:["*..*******","*..*******","*...******","X*.XX*X***"],sp:2},{n:"TKI flat \xB7 7",after:"TKI flat",k:"T",r:["****..****","****..****","****...***","X**XX.X***"],sp:2},{n:"TKI flat \xB7 8",after:"TKI flat",k:"T",r:["******..**","******..**","******...*","X**XX*X.**"],sp:2},{n:"TKI flat \xB7 1 (early)",after:"TKI flat",k:"T",r:["X..XX.X...","X...XXXXXX","XX.XXXXXXX"],sp:2},{n:"TKI flat (mirror) \xB7 1",after:"TKI flat (mirror)",k:"T",r:["**..******","**..******","*...******","**.X*XX**X"],sp:2},{n:"TKI flat (mirror) \xB7 2",after:"TKI flat (mirror)",k:"T",r:["****..****","****..****","***...****","***X.XX**X"],sp:2},{n:"TKI flat (mirror) \xB7 3",after:"TKI flat (mirror)",k:"T",r:["*******..*","*******..*","******...*","***X*XX.*X"],sp:2},{n:"TKI flat (mirror) \xB7 4",after:"TKI flat (mirror)",k:"T",r:["********..","********..","*******...","***X*XX*.X"],sp:2},{n:"TKI flat (mirror) \xB7 5",after:"TKI flat (mirror)",k:"T",r:["..********","..********","...*******","*.*X*XX**X"],sp:2},{n:"TKI flat (mirror) \xB7 6",after:"TKI flat (mirror)",k:"T",r:["*..*******","*..*******","*...******","**.X*XX**X"],sp:2},{n:"TKI flat (mirror) \xB7 7",after:"TKI flat (mirror)",k:"T",r:["***..*****","***..*****","***...****","***X.XX**X"],sp:2},{n:"TKI flat (mirror) \xB7 8",after:"TKI flat (mirror)",k:"T",r:["******..**","******..**","******...*","***X*XX.*X"],sp:2},{n:"TKI flat (mirror) \xB7 1 (early)",after:"TKI flat (mirror)",k:"T",r:["...X.XX..X","XXXXXX...X","XXXXXXX.XX"],sp:2},{n:"MKO \xB7 1",after:"MKO",k:"T",r:["OO..JIIIIZ","OO..JJJLZZ","X...SSXLZX","XX.SSXXLLX","XX...XXXXX","XXX.XXXXXX"],sp:2},{n:"MKO \xB7 2",after:"MKO",k:"T",r:["OO....IIII","OO....LLJJ","X...SSXLJX","XX.SSXXLJX","XX...XXXXX","XXX.XXXXXX"],sp:2},{n:"MKO \xB7 3",after:"MKO",k:"T",r:[".S........","XSS...X..X","XXS..XX..X","XX...XXXXX","XXX.XXXXXX"],sp:2},{n:"MKO (mirror) \xB7 1",after:"MKO (mirror)",k:"T",r:["SIIIIL..OO","SSJLLL..OO","XSJXZZ...X","XJJXXZZ.XX","XXXXX...XX","XXXXXX.XXX"],sp:2},{n:"MKO (mirror) \xB7 2",after:"MKO (mirror)",k:"T",r:["IIII....OO","LLJJ....OO","XLJXZZ...X","XLJXXZZ.XX","XXXXX...XX","XXXXXX.XXX"],sp:2},{n:"MKO (mirror) \xB7 3",after:"MKO (mirror)",k:"T",r:["........Z.","X..X...ZZX","X..XX..ZXX","XXXXX...XX","XXXXXX.XXX"],sp:2},{n:"Albatross \xB7 1",after:"Albatross",k:"T",r:["..LL.Z....","...LZZ....","JJ.LZSIIII","J..XXSSOOX","JX.XXXSOOX"],sp:3},{n:"Albatross \xB7 1 \xB7 1",after:"Albatross \xB7 1",k:"T",r:["..S.......","..SS.ZI...","...SZZILOO","J.XXZXILOO","JJJXXXILL."],sp:2},{n:"Albatross \xB7 2",after:"Albatross",k:"T",r:["...SS.....","..SSZ.....","..IZZ....L","OOIZ...LLL","OOIXX.JJJX",".XIXXX..JX"],sp:2},{n:"Albatross \xB7 1 (early)",after:"Albatross",k:"T",r:["..LL.Z....","...LZZ....","JJ.LZSIIII","J..XXSSOOX","X...XXXXXX","XX.XXXXXXX","JX.XXXSOOX"],sp:3},{n:"Albatross (mirror) \xB7 1",after:"Albatross (mirror)",k:"T",r:["....S.JJ..","....SSJ...","IIIIZSJ.LL","XOOZZXX..L","XOOZXXX.XL"],sp:3},{n:"Albatross (mirror) \xB7 1 \xB7 1",after:"Albatross (mirror) \xB7 1",k:"T",r:[".......Z..","...IS.ZZ..","OOJISSZ...","OOJIXSXX.L",".JJIXXXLLL"],sp:2},{n:"Albatross (mirror) \xB7 2",after:"Albatross (mirror)",k:"T",r:[".....ZZ...",".....SZZ..","J....SSI..","JJJ...SIOO","XLLL.XXIOO","XL..XXXIX."],sp:2},{n:"Albatross (mirror) \xB7 1 (early)",after:"Albatross (mirror)",k:"T",r:["....S.JJ..","....SSJ...","IIIIZSJ.LL","XOOZZXX..L","XXXXXX...X","XXXXXXX.XX","XOOZXXX.XL"],sp:3},{n:"DT Cannon \xB7 1",after:"DT Cannon",k:"T",r:["...*******","*..***X***","*...XXXXX*","XX.XXXXXXX","XX.XXXXXXX"],sp:2},{n:"DT Cannon \xB7 1 \xB7 1",after:"DT Cannon \xB7 1",k:"T",r:[".....*....","..****...*","...***...*","**.XXXXXXX","X..XXXXXXX","XX.XXXXXXX"],sp:3},{n:"DT Cannon (mirror) \xB7 1",after:"DT Cannon (mirror)",k:"T",r:["*******...","***X***..*","*XXXXX...*","XXXXXXX.XX","XXXXXXX.XX"],sp:2},{n:"DT Cannon (mirror) \xB7 1 \xB7 1",after:"DT Cannon (mirror) \xB7 1",k:"T",r:["....*.....","*...****..","*...***...","XXXXXXX.**","XXXXXXX..X","XXXXXXX.XX"],sp:3},{n:"Hachispin \xB7 1 \xB7 1",after:"Hachispin \xB7 1",k:"T",r:[".......SSI","......SSLI","......LLLI",".....OOZZI","XX..JOOXZZ","X...JXXXXX","XX.JJXXXXX"],sp:2},{n:"Hachispin \xB7 1 \xB7 2",after:"Hachispin \xB7 1",k:"T",r:["..S.......","..SSIJJZ..","...SIJZZOO","XX.LIJZXOO","X..LIXXXXX","XX.LLXXXXX"],sp:3},{n:"Hachispin \xB7 1 \xB7 3",after:"Hachispin \xB7 1",k:"T",r:[".........I","...SS....I","..SSZ...LI","...ZZOO.LI","XX.ZJOOXLL","X...JXXXXX","XX.JJXXXXX"],sp:2},{n:"Hachispin \xB7 1 \xB7 4",after:"Hachispin \xB7 1",k:"T",r:["JJZ.......","JZZ...IIII","JZ....SSOO","XX.LLSSXOO","X...LXXXXX","XX..LXXXXX"],sp:2},{n:"Hachispin \xB7 1 \xB7 5",after:"Hachispin \xB7 1",k:"T",r:[".....JJ...","..LL.JIIII","...L.JSSOO","XX.LZSSXOO","X..ZZXXXXX","XX.Z.XXXXX"],sp:2},{n:"Hachispin \xB7 1 \xB7 6",after:"Hachispin \xB7 1",k:"T",r:["......I...","OO..LLIJJJ","OO...LIZZJ","XXSS.LIXZZ","XSS..XXXXX","XX...XXXXX"],sp:2},{n:"Hachispin \xB7 1",after:"Hachispin",k:"T",r:["JJ.....OO.","J....SSOO.","J.ZZSSXLLI","X..ZZXXXLI","X.XXXXXXLI","XX...XXXXI"],sp:3},{n:"Hachispin \xB7 2",after:"Hachispin",k:"T",r:[".......I..","JJ.....IL.","J....SSIL.","J.ZZSSXILL","X..ZZXXXOO","X.XXXXXXOO","XX...XXXX."],sp:3},{n:"Hachispin (mirror) \xB7 1 \xB7 1",after:"Hachispin (mirror) \xB7 1",k:"T",r:["IZZ.......","IJZZ......","IJJJ......","ISSOO.....","SSXOOL..XX","XXXXXL...X","XXXXXLL.XX"],sp:2},{n:"Hachispin (mirror) \xB7 1 \xB7 2",after:"Hachispin (mirror) \xB7 1",k:"T",r:[".......Z..","..SLLIZZ..","OOSSLIZ...","OOXSLIJ.XX","XXXXXIJ..X","XXXXXJJ.XX"],sp:3},{n:"Hachispin (mirror) \xB7 1 \xB7 3",after:"Hachispin (mirror) \xB7 1",k:"T",r:["I.........","I....ZZ...","IJ...SZZ..","IJ.OOSS...","JJXOOLS.XX","XXXXXL...X","XXXXXLL.XX"],sp:2},{n:"Hachispin (mirror) \xB7 1 \xB7 4",after:"Hachispin (mirror) \xB7 1",k:"T",r:[".......SLL","IIII...SSL","OOZZ....SL","OOXZZJJ.XX","XXXXXJ...X","XXXXXJ..XX"],sp:2},{n:"Hachispin (mirror) \xB7 1 \xB7 5",after:"Hachispin (mirror) \xB7 1",k:"T",r:["...LL.....","IIIIL.JJ..","OOZZL.J...","OOXZZSJ.XX","XXXXXSS..X","XXXXX.S.XX"],sp:2},{n:"Hachispin (mirror) \xB7 1 \xB7 6",after:"Hachispin (mirror) \xB7 1",k:"T",r:["...I......","LLLIJJ..OO","LSSIJ...OO","SSXIJ.ZZXX","XXXXX..ZZX","XXXXX...XX"],sp:2},{n:"Hachispin (mirror) \xB7 1",after:"Hachispin (mirror)",k:"T",r:[".OO.....LL",".OOZZ....L","IJJXZZSS.L","IJXXXSS..X","IJXXXXXX.X","IXXXX...XX"],sp:3},{n:"Hachispin (mirror) \xB7 2",after:"Hachispin (mirror)",k:"T",r:["..I.......",".JI.....LL",".JIZZ....L","JJIXZZSS.L","OOXXXSS..X","OOXXXXXX.X",".XXXX...XX"],sp:3},{n:"Ajanba TSD \xB7 1",after:"Ajanba TSD",k:"T",r:["I.........","I.........","IJJZ...LLL","IJZZ...LOO","XJZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 1 \xB7 1",after:"Ajanba TSD \xB7 1",k:"T",r:["I.........","I.........","I.........","IJJZ...LLL","XJZZ...LOO","XJZ...SSOO","XXXX.SSXXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 1 \xB7 2",after:"Ajanba TSD \xB7 1",k:"T",r:["I.........","I.........","I.........","ILOO...JJJ","XLOO...ZZJ","XLL...SSZZ","XXXX.SSXXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 1 \xB7 3",after:"Ajanba TSD \xB7 1",k:"T",r:["I.........","I.........","I.........","IJJJ...SLL","XOOJ...SSL","XOOZZ...SL","XXXXZZ.XXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 1 \xB7 4",after:"Ajanba TSD \xB7 1",k:"T",r:["I.........","I.........","I.........","ILLL...OOJ","XLSS...OOJ","XSSZZ...JJ","XXXXZZ.XXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 2",after:"Ajanba TSD",k:"T",r:["I.........","I.........","ILOO...JJJ","ILOO...ZZJ","XLLSS...ZZ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 2 \xB7 1",after:"Ajanba TSD \xB7 2",k:"T",r:["I.........","I.........","I.........","IJJZ...LLL","XJZZ...LOO","XJZ...SSOO","XXXX.SSXXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 2 \xB7 2",after:"Ajanba TSD \xB7 2",k:"T",r:["I.........","I.........","I.........","ILOO...JJJ","XLOO...ZZJ","XLL...SSZZ","XXXX.SSXXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 2 \xB7 3",after:"Ajanba TSD \xB7 2",k:"T",r:["I.........","I.........","I.........","IJJJ...SLL","XOOJ...SSL","XOOZZ...SL","XXXXZZ.XXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 2 \xB7 4",after:"Ajanba TSD \xB7 2",k:"T",r:["I.........","I.........","I.........","ILLL...OOJ","XLSS...OOJ","XSSZZ...JJ","XXXXZZ.XXX","XXXX...XXX"],sp:2},{n:"Ajanba TSD \xB7 3",after:"Ajanba TSD",k:"T",r:["*.........","**..**.***","X*...*****","XX*.XX*XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 1",after:"Ajanba TSD \xB7 3",k:"T",r:["I.........","I.........","IJJZ...LLL","IJZZ...LOO","XJZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 2",after:"Ajanba TSD \xB7 3",k:"T",r:["I.........","I.........","ILOO...JJJ","ILOO...ZZJ","XLLSS...ZZ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 3",after:"Ajanba TSD \xB7 3",k:"T",r:["*.........","**..**.***","X*...*****","XX*.XX*XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 4",after:"Ajanba TSD \xB7 3",k:"T",r:[".........*","***.**..**","X****...**","XX**XX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 5",after:"Ajanba TSD \xB7 3",k:"T",r:["ZZIIII..OO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 6",after:"Ajanba TSD \xB7 3",k:"T",r:["IIIISS..OO","XZZSS...OO","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 7",after:"Ajanba TSD \xB7 3",k:"T",r:[".........J","ZZIIII...J","XZZSS...JJ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 8",after:"Ajanba TSD \xB7 3",k:"T",r:[".........J","IIIISS...J","XZZSS...JJ","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 9",after:"Ajanba TSD \xB7 3",k:"T",r:[".......LLL","ZZ.....LOO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 10",after:"Ajanba TSD \xB7 3",k:"T",r:[".......OOJ","ZZ.....OOJ","XZZSS...JJ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 11",after:"Ajanba TSD \xB7 3",k:"T",r:["L........J","L........J","LL......JJ","ZZIIII..OO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 12",after:"Ajanba TSD \xB7 3",k:"T",r:["L........J","L........J","LL......JJ","IIIISS..OO","XZZSS...OO","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 3 \xB7 13",after:"Ajanba TSD \xB7 3",k:"T",r:["JJJ.......","OOJ......L","OO...SSLLL","XZZ.SSIIII","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 4",after:"Ajanba TSD",k:"T",r:[".........*","***.**..**","X****...**","XX**XX.XXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 1",after:"Ajanba TSD \xB7 4",k:"T",r:[".........I",".........I","JJJ...SLLI","OOJ...SSLI","OO...ZZSLX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 2",after:"Ajanba TSD \xB7 4",k:"T",r:[".........I",".........I","LLL...OOJI","LSS...OOJI","SS...ZZJJX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 3",after:"Ajanba TSD \xB7 4",k:"T",r:["*.........","**..**.***","**...****X","XXX.XX**XX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 4",after:"Ajanba TSD \xB7 4",k:"T",r:[".........*","***.**..**","*****...*X","XXX*XX.*XX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 5",after:"Ajanba TSD \xB7 4",k:"T",r:["OO..IIIISS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 6",after:"Ajanba TSD \xB7 4",k:"T",r:["OO..ZZIIII","OO...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 7",after:"Ajanba TSD \xB7 4",k:"T",r:["L.........","L...IIIISS","LL...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 8",after:"Ajanba TSD \xB7 4",k:"T",r:["L.........","L...ZZIIII","LL...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 9",after:"Ajanba TSD \xB7 4",k:"T",r:["JJJ.......","OOJ.....SS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 10",after:"Ajanba TSD \xB7 4",k:"T",r:["LOO.......","LOO.....SS","LL...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 11",after:"Ajanba TSD \xB7 4",k:"T",r:["L........J","L........J","LL......JJ","OO..IIIISS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 12",after:"Ajanba TSD \xB7 4",k:"T",r:["L........J","L........J","LL......JJ","OO..ZZIIII","OO...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD \xB7 4 \xB7 13",after:"Ajanba TSD \xB7 4",k:"T",r:[".......LLL","J......LOO","JJJZZ...OO","IIIIZZ.SSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD \xB7 5",after:"Ajanba TSD",k:"T",r:["ZZIIII..OO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 5 \xB7 1",after:"Ajanba TSD \xB7 5",k:"T",r:[".........*","***.**..**","*****...**","XXXXXX.*XX"],sp:2},{n:"Ajanba TSD \xB7 6",after:"Ajanba TSD",k:"T",r:["IIIISS..OO","XZZSS...OO","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 6 \xB7 1",after:"Ajanba TSD \xB7 6",k:"T",r:[".........*","***.**..**","*****...**","XXXXXX.*XX"],sp:2},{n:"Ajanba TSD \xB7 7",after:"Ajanba TSD",k:"T",r:[".........J","ZZIIII...J","XZZSS...JJ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 7 \xB7 1",after:"Ajanba TSD \xB7 7",k:"T",r:[".........*","***.**..**","*****...*X","XXXXXX.**X"],sp:2},{n:"Ajanba TSD \xB7 8",after:"Ajanba TSD",k:"T",r:[".........J","IIIISS...J","XZZSS...JJ","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 8 \xB7 1",after:"Ajanba TSD \xB7 8",k:"T",r:[".........*","***.**..**","*****...*X","XXXXXX.**X"],sp:2},{n:"Ajanba TSD \xB7 9",after:"Ajanba TSD",k:"T",r:[".......LLL","ZZ.....LOO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 9 \xB7 1",after:"Ajanba TSD \xB7 9",k:"T",r:["*.........","**..**.***","**...**XXX","XX*.***XXX"],sp:2},{n:"Ajanba TSD \xB7 10",after:"Ajanba TSD",k:"T",r:[".......OOJ","ZZ.....OOJ","XZZSS...JJ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 10 \xB7 1",after:"Ajanba TSD \xB7 10",k:"T",r:["*.........","**..**.***","**...**XXX","XX*.***XXX"],sp:2},{n:"Ajanba TSD \xB7 11",after:"Ajanba TSD",k:"T",r:["L........J","L........J","LL......JJ","ZZIIII..OO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 12",after:"Ajanba TSD",k:"T",r:["L........J","L........J","LL......JJ","IIIISS..OO","XZZSS...OO","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 13",after:"Ajanba TSD",k:"T",r:["JJJ.......","OOJ......L","OO...SSLLL","XZZ.SSIIII","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 13 \xB7 1",after:"Ajanba TSD \xB7 13",k:"T",r:[".........*","XXX.**..**","XXX**...*X","XXXXXX.XXX"],sp:2},{n:"Ajanba TSD \xB7 13 \xB7 2",after:"Ajanba TSD \xB7 13",k:"T",r:["OOLL..IIII","OO.L...JJZ","XXXLSS.JZZ","XXXSS..JZX","XXXXXX.XXX"],sp:3},{n:"Ajanba TSD \xB7 3 (early)",after:"Ajanba TSD",k:"T",r:["X.........","XX..XX.XXX","XX...XXXXX","XXX.XXXXXX"],sp:2},{n:"Pelican \xB7 1",after:"Pelican",k:"T",r:["..ZZ....L.","...ZZ...L.","JJ.IIIISLL","J..OOXXSSX","JX.OOXXXSX"],sp:3},{n:"Pelican \xB7 1 \xB7 1",after:"Pelican \xB7 1",k:"T",r:["*.........","**.....***","*****..***","**XX...*X*","***XX.**X*"],sp:2},{n:"Pelican \xB7 1 \xB7 2",after:"Pelican \xB7 1",k:"T",r:[".........*",".........*",".........*",".......***","****..****","**XX...*X*","***XX.**X*"],sp:2},{n:"Pelican \xB7 1 \xB7 3",after:"Pelican \xB7 1",k:"T",r:["**........","**........","**........","****......","*****..***","**XX...*X*","***XX.**X*"],sp:2},{n:"Pelican \xB7 2",after:"Pelican",k:"T",r:[".........*","........**","**.....***","**..******","**...XX**X","*X*.*XXX*X"],sp:2},{n:"Pelican \xB7 2 \xB7 1",after:"Pelican \xB7 2",k:"T",r:[".........*","........**","**.....**X","**..****XX","XX...**XXX","XX*.XXXXXX"],sp:2},{n:"Pelican \xB7 3",after:"Pelican",k:"T",r:["......I...","....LLI...",".....LIZZ.","OOJJ.LISZZ","OOJ..XXSSX",".XJ..XXXSX"],sp:2},{n:"Pelican \xB7 3 \xB7 1",after:"Pelican \xB7 3",k:"T",r:["......X...",".Z..XXXJJJ","ZZ...XXXXJ","ZXX.XXXXXX"],sp:2},{n:"Pelican \xB7 2 (early)",after:"Pelican",k:"T",r:[".....XX..X","XXX...XXXX","XXXX.XXXXX",".X...XXX.X"],sp:2},{n:"Pelican \xB7 3 (early)",after:"Pelican",k:"T",r:["......I...","....LLI...",".....LIZZ.","OOJJ.LISZZ","OOJ..XXSSX","XXX...XXXX","XXXX.XXXXX",".XJ..XXXSX"],sp:2},{n:"Number One \xB7 1",after:"Number One",k:"T",r:[".......ZS.","....XXZZSS","OO...XZJXS","OOX.XXXJJJ"],sp:2},{n:"Number One \xB7 2",after:"Number One",k:"T",r:["....XXS..J","OO...XSSXJ","OOX.XXXSJJ"],sp:2},{n:"Number One \xB7 3",after:"Number One",k:"T",r:["....XX.SS.","OO...XSSXL","OOX.XXXLLL"],sp:2},{n:"Number One \xB7 4",after:"Number One",k:"T",r:["....XX..LL","OO...XZZXL","OOX.XXXZZL"],sp:2},{n:"Number One \xB7 5",after:"Number One",k:"T",r:["..SS......",".SS.....LI","JJJ.XXLLLI","OOJ..XZZXI","OOX.XXXZZI"],sp:3},{n:"Number One \xB7 6",after:"Number One",k:"T",r:["OO........","OO........","I......ZS.","I.LLXXZZSS","I..L.XZJXS","I.XLXXXJJJ"],sp:2},{n:"Number One \xB7 6 \xB7 1",after:"Number One \xB7 6",k:"T",r:["L.........","L.........","LL..ZZ..JI","XX...ZZ.JI","XXSS.OOJJI","XSS..OOXXI","XXXX.XXXXX"],sp:3},{n:"Number One \xB7 7",after:"Number One",k:"T",r:["OO........","OO........","I.....ZZ..","I.LLXXSZZJ","I..L.XSSXJ","I.XLXXXSJJ"],sp:2},{n:"Number One \xB7 7 \xB7 1",after:"Number One \xB7 7",k:"T",r:["OO......I.","OO..ZZ..I.","XX...ZZLIJ","XXSS.LLLIJ","XSS...XXJJ","XXXX.XXXXX"],sp:2},{n:"Number One \xB7 8",after:"Number One",k:"T",r:["..SS......","ISS....ZZ.","IJJ.XXOOZZ","IJ...XOOXL","IJX.XXXLLL"],sp:2},{n:"Number One \xB7 9",after:"Number One",k:"T",r:["..SS......","JSS.....LI","JJJ.XXLLLI","OO...XZZXI","OOX.XXXZZI"],sp:2},{n:"C-Spin \xB7 1",after:"C-Spin",k:"T",r:[".........J",".........J","XX..SLLIJJ","X...SSLIOO","X.XXXSLIOO","X..XXZZIXX","X.XXXXZZXX","XX.XXXXXXX"],sp:3},{n:"C-Spin \xB7 1 \xB7 1",after:"C-Spin \xB7 1",k:"T",r:["S.........","SS.....I..","LS.....IJJ","L...ZOOIJX","LL.ZZOOIJX","XX.ZXXXXXX","X...XXXXXX","XX.XXXXXXX"],sp:2},{n:"C-Spin \xB7 2",after:"C-Spin",k:"T",r:["XX...JJLLL","X....JSLOO","X.XXXJSSOO","X..XXZZSXX","X.XXXXZZXX","XX.XXXXXXX"],sp:3},{n:"C-Spin \xB7 2 \xB7 1",after:"C-Spin \xB7 2",k:"T",r:[".........*",".........*","XX..*XXXXX","X...*XXXXX","XX.XXXXXXX"],sp:2},{n:"C-Spin \xB7 3",after:"C-Spin",k:"T",r:["XX..IIIISS","X.....ZSSL","X.XXXZZLLL","X..XXZOOXX","X.XXXXOOXX","XX.XXXXXXX"],sp:3},{n:"C-Spin \xB7 3 \xB7 1",after:"C-Spin \xB7 3",k:"T",r:[".........*",".........*","XX..XXXXXX","X...**XXXX","XX.XXXXXXX"],sp:2},{n:"C-Spin \xB7 4",after:"C-Spin",k:"T",r:["XX..IIIIOO","X.....SSOO","X.XXXSSLLL","X..XXZZLXX","X.XXXXZZXX","XX.XXXXXXX"],sp:3},{n:"C-Spin \xB7 4 \xB7 1",after:"C-Spin \xB7 4",k:"T",r:[".........*",".........*","XX..XXXXXX","X...**XXXX","XX.XXXXXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 1",after:"Ajanba TSD (mirror)",k:"T",r:[".........I",".........I","JJJ...SLLI","OOJ...SSLI","OO...ZZSLX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 1 \xB7 1",after:"Ajanba TSD (mirror) \xB7 1",k:"T",r:[".........I",".........I",".........I","JJJ...SLLI","OOJ...SSLX","OOZZ...SLX","XXXZZ.XXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 1 \xB7 2",after:"Ajanba TSD (mirror) \xB7 1",k:"T",r:[".........I",".........I",".........I","LLL...OOJI","LSS...OOJX","SSZZ...JJX","XXXZZ.XXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 1 \xB7 3",after:"Ajanba TSD (mirror) \xB7 1",k:"T",r:[".........I",".........I",".........I","JJZ...LLLI","JZZ...LOOX","JZ...SSOOX","XXX.SSXXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 1 \xB7 4",after:"Ajanba TSD (mirror) \xB7 1",k:"T",r:[".........I",".........I",".........I","LOO...JJJI","LOO...ZZJX","LL...SSZZX","XXX.SSXXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 2",after:"Ajanba TSD (mirror)",k:"T",r:[".........I",".........I","LLL...OOJI","LSS...OOJI","SS...ZZJJX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 2 \xB7 1",after:"Ajanba TSD (mirror) \xB7 2",k:"T",r:[".........I",".........I",".........I","JJJ...SLLI","OOJ...SSLX","OOZZ...SLX","XXXZZ.XXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 2 \xB7 2",after:"Ajanba TSD (mirror) \xB7 2",k:"T",r:[".........I",".........I",".........I","LLL...OOJI","LSS...OOJX","SSZZ...JJX","XXXZZ.XXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 2 \xB7 3",after:"Ajanba TSD (mirror) \xB7 2",k:"T",r:[".........I",".........I",".........I","JJZ...LLLI","JZZ...LOOX","JZ...SSOOX","XXX.SSXXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 2 \xB7 4",after:"Ajanba TSD (mirror) \xB7 2",k:"T",r:[".........I",".........I",".........I","LOO...JJJI","LOO...ZZJX","LL...SSZZX","XXX.SSXXXX","XXX...XXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3",after:"Ajanba TSD (mirror)",k:"T",r:["*.........","**..**.***","**...****X","XXX.XX**XX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 1",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["I.........","I.........","IJJZ...LLL","IJZZ...LOO","XJZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 2",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["I.........","I.........","ILOO...JJJ","ILOO...ZZJ","XLLSS...ZZ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 3",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["*.........","**..**.***","X*...*****","XX*.XX*XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 4",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:[".........*","***.**..**","X****...**","XX**XX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 5",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["ZZIIII..OO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 6",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["IIIISS..OO","XZZSS...OO","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 7",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:[".........J","ZZIIII...J","XZZSS...JJ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 8",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:[".........J","IIIISS...J","XZZSS...JJ","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 9",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:[".......LLL","ZZ.....LOO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 10",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:[".......OOJ","ZZ.....OOJ","XZZSS...JJ","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 11",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["L........J","L........J","LL......JJ","ZZIIII..OO","XZZSS...OO","XXSSXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 12",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["L........J","L........J","LL......JJ","IIIISS..OO","XZZSS...OO","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 3 \xB7 13",after:"Ajanba TSD (mirror) \xB7 3",k:"T",r:["JJJ.......","OOJ......L","OO...SSLLL","XZZ.SSIIII","XXZZXX.XXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4",after:"Ajanba TSD (mirror)",k:"T",r:[".........*","***.**..**","*****...*X","XXX*XX.*XX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 1",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:[".........I",".........I","JJJ...SLLI","OOJ...SSLI","OO...ZZSLX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 2",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:[".........I",".........I","LLL...OOJI","LSS...OOJI","SS...ZZJJX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 3",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["*.........","**..**.***","**...****X","XXX.XX**XX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 4",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:[".........*","***.**..**","*****...*X","XXX*XX.*XX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 5",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["OO..IIIISS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 6",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["OO..ZZIIII","OO...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 7",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["L.........","L...IIIISS","LL...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 8",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["L.........","L...ZZIIII","LL...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 9",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["JJJ.......","OOJ.....SS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 10",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["LOO.......","LOO.....SS","LL...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 11",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["L........J","L........J","LL......JJ","OO..IIIISS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 12",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:["L........J","L........J","LL......JJ","OO..ZZIIII","OO...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 4 \xB7 13",after:"Ajanba TSD (mirror) \xB7 4",k:"T",r:[".......LLL","J......LOO","JJJZZ...OO","IIIIZZ.SSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 5",after:"Ajanba TSD (mirror)",k:"T",r:["OO..IIIISS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 5 \xB7 1",after:"Ajanba TSD (mirror) \xB7 5",k:"T",r:["*.........","**..**.***","**...*****","XX*.XXXXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 6",after:"Ajanba TSD (mirror)",k:"T",r:["OO..ZZIIII","OO...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 6 \xB7 1",after:"Ajanba TSD (mirror) \xB7 6",k:"T",r:["*.........","**..**.***","**...*****","XX*.XXXXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 7",after:"Ajanba TSD (mirror)",k:"T",r:["L.........","L...IIIISS","LL...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 7 \xB7 1",after:"Ajanba TSD (mirror) \xB7 7",k:"T",r:["*.........","**..**.***","X*...*****","X**.XXXXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 8",after:"Ajanba TSD (mirror)",k:"T",r:["L.........","L...ZZIIII","LL...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 8 \xB7 1",after:"Ajanba TSD (mirror) \xB7 8",k:"T",r:["*.........","**..**.***","X*...*****","X**.XXXXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 9",after:"Ajanba TSD (mirror)",k:"T",r:["JJJ.......","OOJ.....SS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 9 \xB7 1",after:"Ajanba TSD (mirror) \xB7 9",k:"T",r:[".........*","***.**..**","XXX**...**","XXX***.*XX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 10",after:"Ajanba TSD (mirror)",k:"T",r:["LOO.......","LOO.....SS","LL...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 10 \xB7 1",after:"Ajanba TSD (mirror) \xB7 10",k:"T",r:[".........*","***.**..**","XXX**...**","XXX***.*XX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 11",after:"Ajanba TSD (mirror)",k:"T",r:["L........J","L........J","LL......JJ","OO..IIIISS","OO...ZZSSX","XXX.XXZZXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 12",after:"Ajanba TSD (mirror)",k:"T",r:["L........J","L........J","LL......JJ","OO..ZZIIII","OO...ZZSSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 13",after:"Ajanba TSD (mirror)",k:"T",r:[".......LLL","J......LOO","JJJZZ...OO","IIIIZZ.SSX","XXX.XXSSXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 13 \xB7 1",after:"Ajanba TSD (mirror) \xB7 13",k:"T",r:["*.........","**..**.XXX","X*...**XXX","XXX.XXXXXX"],sp:2},{n:"Ajanba TSD (mirror) \xB7 13 \xB7 2",after:"Ajanba TSD (mirror) \xB7 13",k:"T",r:["IIII..JJOO","SLL...J.OO","SSL.ZZJXXX","XSL..ZZXXX","XXX.XXXXXX"],sp:3},{n:"Ajanba TSD (mirror) \xB7 3 (early)",after:"Ajanba TSD (mirror)",k:"T",r:[".........X","XXX.XX..XX","XXXXX...XX","XXXXXX.XXX"],sp:2},{n:"Pelican (mirror) \xB7 1",after:"Pelican (mirror)",k:"T",r:[".J....SS..",".J...SS...","JJZIIII.LL","XZZXXOO..L","XZXXXOO.XL"],sp:3},{n:"Pelican (mirror) \xB7 1 \xB7 1",after:"Pelican (mirror) \xB7 1",k:"T",r:[".........*","***.....**","***..*****","*X*...XX**","*X**.XX***"],sp:2},{n:"Pelican (mirror) \xB7 1 \xB7 2",after:"Pelican (mirror) \xB7 1",k:"T",r:["........**","........**","........**","......****","***..*****","*X*...XX**","*X**.XX***"],sp:2},{n:"Pelican (mirror) \xB7 1 \xB7 3",after:"Pelican (mirror) \xB7 1",k:"T",r:["*.........","*.........","*.........","***.......","****..****","*X*...XX**","*X**.XX***"],sp:2},{n:"Pelican (mirror) \xB7 2",after:"Pelican (mirror)",k:"T",r:["*.........","**........","***.....**","******..**","X**XX...**","X*XXX*.*X*"],sp:2},{n:"Pelican (mirror) \xB7 2 \xB7 1",after:"Pelican (mirror) \xB7 2",k:"T",r:["*.........","**........","X**.....**","XX****..**","XXX**...XX","XXXXXX.*XX"],sp:2},{n:"Pelican (mirror) \xB7 3",after:"Pelican (mirror)",k:"T",r:["...I......","...IJJ....",".SSIJ.....","SSZIJ.LLOO","XZZXX..LOO","XZXXX..LX."],sp:2},{n:"Pelican (mirror) \xB7 3 \xB7 1",after:"Pelican (mirror) \xB7 3",k:"T",r:["...X......","LLLXXX..S.","LXXXX...SS","XXXXXX.XXS"],sp:2},{n:"Pelican (mirror) \xB7 2 (early)",after:"Pelican (mirror)",k:"T",r:["X..XX.....","XXXX...XXX","XXXXX.XXXX","X.XXX...X."],sp:2},{n:"Pelican (mirror) \xB7 3 (early)",after:"Pelican (mirror)",k:"T",r:["...I......","...IJJ....",".SSIJ.....","SSZIJ.LLOO","XZZXX..LOO","XXXX...XXX","XXXXX.XXXX","XZXXX..LX."],sp:2},{n:"Number One (mirror) \xB7 1",after:"Number One (mirror)",k:"T",r:[".ZS.......","ZZSSXX....","ZXLSX...OO","LLLXXX.XOO"],sp:2},{n:"Number One (mirror) \xB7 2",after:"Number One (mirror)",k:"T",r:["L..ZXX....","LXZZX...OO","LLZXXX.XOO"],sp:2},{n:"Number One (mirror) \xB7 3",after:"Number One (mirror)",k:"T",r:[".ZZ.XX....","JXZZX...OO","JJJXXX.XOO"],sp:2},{n:"Number One (mirror) \xB7 4",after:"Number One (mirror)",k:"T",r:["JJ..XX....","JXSSX...OO","JSSXXX.XOO"],sp:2},{n:"Number One (mirror) \xB7 5",after:"Number One (mirror)",k:"T",r:["......ZZ..","IJ.....ZZ.","IJJJXX.LLL","IXSSX..LOO","ISSXXX.XOO"],sp:3},{n:"Number One (mirror) \xB7 6",after:"Number One (mirror)",k:"T",r:["........OO","........OO",".ZS......I","ZZSSXXJJ.I","ZXLSX.J..I","LLLXXXJX.I"],sp:2},{n:"Number One (mirror) \xB7 6 \xB7 1",after:"Number One (mirror) \xB7 6",k:"T",r:[".........J",".........J","IL..SS..JJ","IL.SS...XX","ILLOO.ZZXX","IXXOO..ZZX","XXXXX.XXXX"],sp:3},{n:"Number One (mirror) \xB7 7",after:"Number One (mirror)",k:"T",r:["........OO","........OO","..SS.....I","LSSZXXJJ.I","LXZZX.J..I","LLZXXXJX.I"],sp:2},{n:"Number One (mirror) \xB7 7 \xB7 1",after:"Number One (mirror) \xB7 7",k:"T",r:[".I......OO",".I..SS..OO","LIJSS...XX","LIJJJ.ZZXX","LLXX...ZZX","XXXXX.XXXX"],sp:2},{n:"Number One (mirror) \xB7 8",after:"Number One (mirror)",k:"T",r:["......ZZ..",".SS....ZZI","SSOOXX.LLI","JXOOX...LI","JJJXXX.XLI"],sp:2},{n:"Number One (mirror) \xB7 9",after:"Number One (mirror)",k:"T",r:["......ZZ..","IJ.....ZZL","IJJJXX.LLL","IXSSX...OO","ISSXXX.XOO"],sp:2},{n:"C-Spin (mirror) \xB7 1",after:"C-Spin (mirror)",k:"T",r:["L.........","L.........","LLIJJZ..XX","OOIJZZ...X","OOIJZXXX.X","XXISSXX..X","XXSSXXXX.X","XXXXXXX.XX"],sp:3},{n:"C-Spin (mirror) \xB7 1 \xB7 1",after:"C-Spin (mirror) \xB7 1",k:"T",r:[".........Z","..I.....ZZ","LLI.....ZJ","XLIOOS...J","XLIOOSS.JJ","XXXXXXS.XX","XXXXXX...X","XXXXXXX.XX"],sp:2},{n:"C-Spin (mirror) \xB7 2",after:"C-Spin (mirror)",k:"T",r:["JJJLL...XX","OOJZL....X","OOZZLXXX.X","XXZSSXX..X","XXSSXXXX.X","XXXXXXX.XX"],sp:3},{n:"C-Spin (mirror) \xB7 2 \xB7 1",after:"C-Spin (mirror) \xB7 2",k:"T",r:["*.........","*.........","XXXXX*..XX","XXXXX*...X","XXXXXXX.XX"],sp:2},{n:"C-Spin (mirror) \xB7 3",after:"C-Spin (mirror)",k:"T",r:["ZZIIII..XX","JZZS.....X","JJJSSXXX.X","XXOOSXX..X","XXOOXXXX.X","XXXXXXX.XX"],sp:3},{n:"C-Spin (mirror) \xB7 3 \xB7 1",after:"C-Spin (mirror) \xB7 3",k:"T",r:["*.........","*.........","XXXXXX..XX","XXXX**...X","XXXXXXX.XX"],sp:2},{n:"C-Spin (mirror) \xB7 4",after:"C-Spin (mirror)",k:"T",r:["OOIIII..XX","OOZZ.....X","JJJZZXXX.X","XXJSSXX..X","XXSSXXXX.X","XXXXXXX.XX"],sp:3},{n:"C-Spin (mirror) \xB7 4 \xB7 1",after:"C-Spin (mirror) \xB7 4",k:"T",r:["*.........","*.........","XXXXXX..XX","XXXX**...X","XXXXXXX.XX"],sp:2},{n:"Stickspin \xB7 1",after:"Stickspin",k:"T",r:[".........I",".......OOI","S......OOI","SSJJJ...XI","XSLLJZ.XXX","XXXLZZ.XXX","XXXLZ.XXXX"],sp:2},{n:"Stickspin \xB7 1 \xB7 1",after:"Stickspin \xB7 1",k:"T",r:[".........I",".........I",".........I","..LL..ZZ.I","OOJL...ZZX","OOJLSS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 1 \xB7 2",after:"Stickspin \xB7 1",k:"T",r:["I.......OO","I..J..ZZOO","IL.J...ZZX","ILJJSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 1 \xB7 3",after:"Stickspin \xB7 1",k:"T",r:["I..L......","ILLL..ZZ..","IJJJ...ZZX","IOOJSS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 1 \xB7 4",after:"Stickspin \xB7 1",k:"T",r:["IJ........","IJJJ..ZZ..","ILOO...ZZX","ILOOSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 1 \xB7 5",after:"Stickspin \xB7 1",k:"T",r:["J..I......","JJJI..ZZ..","LLLI...ZZX","LOOISS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 1 \xB7 6",after:"Stickspin \xB7 1",k:"T",r:["........L.","...I....L.","...I..ZZLL","OOJI...ZZX","OOJISS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 2",after:"Stickspin",k:"T",r:[".........I",".......OOI","S......OOI","SSLLL...XI","XSLJJZ.XXX","XXXJZZ.XXX","XXXJZ.XXXX"],sp:2},{n:"Stickspin \xB7 2 \xB7 1",after:"Stickspin \xB7 2",k:"T",r:[".........I",".........I",".........I","..LL..ZZ.I","OOJL...ZZX","OOJLSS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 2 \xB7 2",after:"Stickspin \xB7 2",k:"T",r:["I.......OO","I..J..ZZOO","IL.J...ZZX","ILJJSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 2 \xB7 3",after:"Stickspin \xB7 2",k:"T",r:["I..L......","ILLL..ZZ..","IJJJ...ZZX","IOOJSS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 2 \xB7 4",after:"Stickspin \xB7 2",k:"T",r:["IJ........","IJJJ..ZZ..","ILOO...ZZX","ILOOSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 2 \xB7 5",after:"Stickspin \xB7 2",k:"T",r:["J..I......","JJJI..ZZ..","LLLI...ZZX","LOOISS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 2 \xB7 6",after:"Stickspin \xB7 2",k:"T",r:["........L.","...I....L.","...I..ZZLL","OOJI...ZZX","OOJISS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin \xB7 1 (early)",after:"Stickspin",k:"T",r:[".........I",".......OOI","S......OOI","SSJJJ...XI","XSLLJZ..XX","XXXLZZ...X","XXXXXXX.XX","XXXLZ.XXXX"],sp:2},{n:"Stickspin \xB7 2 (early)",after:"Stickspin",k:"T",r:[".........I",".......OOI","S......OOI","SSLLL...XI","XSLJJZ..XX","XXXJZZ...X","XXXXXXX.XX","XXXJZ.XXXX"],sp:2},{n:"Stickspin (mirror) \xB7 1",after:"Stickspin (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...LLLZZ","XXX.SLJJZX","XXX.SSJXXX","XXXX.SJXXX"],sp:2},{n:"Stickspin (mirror) \xB7 1 \xB7 1",after:"Stickspin (mirror) \xB7 1",k:"T",r:["I.........","I.........","I.........","I.SS..JJ..","XSS...JLOO","XXX.ZZJLOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 1 \xB7 2",after:"Stickspin (mirror) \xB7 1",k:"T",r:["OO.......I","OOSS..L..I","XSS...L.JI","XXX.ZZLLJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 1 \xB7 3",after:"Stickspin (mirror) \xB7 1",k:"T",r:["......J..I","..SS..JJJI","XSS...LLLI","XXX.ZZLOOI","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 1 \xB7 4",after:"Stickspin (mirror) \xB7 1",k:"T",r:["........LI","..SS..LLLI","XSS...OOJI","XXX.ZZOOJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 1 \xB7 5",after:"Stickspin (mirror) \xB7 1",k:"T",r:["......I..L","..SS..ILLL","XSS...IJJJ","XXX.ZZIOOJ","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 1 \xB7 6",after:"Stickspin (mirror) \xB7 1",k:"T",r:[".J........",".J....I...","JJSS..I...","XSS...ILOO","XXX.ZZILOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 2",after:"Stickspin (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...JJJZZ","XXX.SLLJZX","XXX.SSLXXX","XXXX.SLXXX"],sp:2},{n:"Stickspin (mirror) \xB7 2 \xB7 1",after:"Stickspin (mirror) \xB7 2",k:"T",r:["I.........","I.........","I.........","I.SS..JJ..","XSS...JLOO","XXX.ZZJLOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 2 \xB7 2",after:"Stickspin (mirror) \xB7 2",k:"T",r:["OO.......I","OOSS..L..I","XSS...L.JI","XXX.ZZLLJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 2 \xB7 3",after:"Stickspin (mirror) \xB7 2",k:"T",r:["......J..I","..SS..JJJI","XSS...LLLI","XXX.ZZLOOI","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 2 \xB7 4",after:"Stickspin (mirror) \xB7 2",k:"T",r:["........LI","..SS..LLLI","XSS...OOJI","XXX.ZZOOJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 2 \xB7 5",after:"Stickspin (mirror) \xB7 2",k:"T",r:["......I..L","..SS..ILLL","XSS...IJJJ","XXX.ZZIOOJ","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 2 \xB7 6",after:"Stickspin (mirror) \xB7 2",k:"T",r:[".J........",".J....I...","JJSS..I...","XSS...ILOO","XXX.ZZILOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin (mirror) \xB7 1 (early)",after:"Stickspin (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...LLLZZ","XX..SLJJZX","X...SSJXXX","XX.XXXXXXX","XXXX.SJXXX"],sp:2},{n:"Stickspin (mirror) \xB7 2 (early)",after:"Stickspin (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...JJJZZ","XX..SLLJZX","X...SSLXXX","XX.XXXXXXX","XXXX.SLXXX"],sp:2},{n:"Stickspin 2 \xB7 1",after:"Stickspin 2",k:"T",r:[".........I",".......OOI","S......OOI","SSJJJ...XI","XSLLJZ.XXX","XXXLZZ.XXX","XXXLZ.XXXX"],sp:2},{n:"Stickspin 2 \xB7 1 \xB7 1",after:"Stickspin 2 \xB7 1",k:"T",r:[".........I",".........I",".........I","..LL..ZZ.I","OOJL...ZZX","OOJLSS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 1 \xB7 2",after:"Stickspin 2 \xB7 1",k:"T",r:["I.......OO","I..J..ZZOO","IL.J...ZZX","ILJJSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 1 \xB7 3",after:"Stickspin 2 \xB7 1",k:"T",r:["I..L......","ILLL..ZZ..","IJJJ...ZZX","IOOJSS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 1 \xB7 4",after:"Stickspin 2 \xB7 1",k:"T",r:["IJ........","IJJJ..ZZ..","ILOO...ZZX","ILOOSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 1 \xB7 5",after:"Stickspin 2 \xB7 1",k:"T",r:["J..I......","JJJI..ZZ..","LLLI...ZZX","LOOISS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 1 \xB7 6",after:"Stickspin 2 \xB7 1",k:"T",r:["........L.","...I....L.","...I..ZZLL","OOJI...ZZX","OOJISS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 2",after:"Stickspin 2",k:"T",r:[".........I",".......OOI","S......OOI","SSLLL...XI","XSLJJZ.XXX","XXXJZZ.XXX","XXXJZ.XXXX"],sp:2},{n:"Stickspin 2 \xB7 2 \xB7 1",after:"Stickspin 2 \xB7 2",k:"T",r:[".........I",".........I",".........I","..LL..ZZ.I","OOJL...ZZX","OOJLSS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 2 \xB7 2",after:"Stickspin 2 \xB7 2",k:"T",r:["I.......OO","I..J..ZZOO","IL.J...ZZX","ILJJSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 2 \xB7 3",after:"Stickspin 2 \xB7 2",k:"T",r:["I..L......","ILLL..ZZ..","IJJJ...ZZX","IOOJSS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 2 \xB7 4",after:"Stickspin 2 \xB7 2",k:"T",r:["IJ........","IJJJ..ZZ..","ILOO...ZZX","ILOOSS.XXX","XLLSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 2 \xB7 5",after:"Stickspin 2 \xB7 2",k:"T",r:["J..I......","JJJI..ZZ..","LLLI...ZZX","LOOISS.XXX","XOOSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 2 \xB7 6",after:"Stickspin 2 \xB7 2",k:"T",r:["........L.","...I....L.","...I..ZZLL","OOJI...ZZX","OOJISS.XXX","XJJSS..XXX","XXXXXX.XXX","XXXXX.XXXX"],sp:3},{n:"Stickspin 2 \xB7 1 (early)",after:"Stickspin 2",k:"T",r:[".........I",".......OOI","S......OOI","SSJJJ...XI","XSLLJZ..XX","XXXLZZ...X","XXXXXXX.XX","XXXLZ.XXXX"],sp:2},{n:"Stickspin 2 \xB7 2 (early)",after:"Stickspin 2",k:"T",r:[".........I",".......OOI","S......OOI","SSLLL...XI","XSLJJZ..XX","XXXJZZ...X","XXXXXXX.XX","XXXJZ.XXXX"],sp:2},{n:"Stickspin 2 (mirror) \xB7 1",after:"Stickspin 2 (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...LLLZZ","XXX.SLJJZX","XXX.SSJXXX","XXXX.SJXXX"],sp:2},{n:"Stickspin 2 (mirror) \xB7 1 \xB7 1",after:"Stickspin 2 (mirror) \xB7 1",k:"T",r:["I.........","I.........","I.........","I.SS..JJ..","XSS...JLOO","XXX.ZZJLOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 1 \xB7 2",after:"Stickspin 2 (mirror) \xB7 1",k:"T",r:["OO.......I","OOSS..L..I","XSS...L.JI","XXX.ZZLLJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 1 \xB7 3",after:"Stickspin 2 (mirror) \xB7 1",k:"T",r:["......J..I","..SS..JJJI","XSS...LLLI","XXX.ZZLOOI","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 1 \xB7 4",after:"Stickspin 2 (mirror) \xB7 1",k:"T",r:["........LI","..SS..LLLI","XSS...OOJI","XXX.ZZOOJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 1 \xB7 5",after:"Stickspin 2 (mirror) \xB7 1",k:"T",r:["......I..L","..SS..ILLL","XSS...IJJJ","XXX.ZZIOOJ","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 1 \xB7 6",after:"Stickspin 2 (mirror) \xB7 1",k:"T",r:[".J........",".J....I...","JJSS..I...","XSS...ILOO","XXX.ZZILOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 2",after:"Stickspin 2 (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...JJJZZ","XXX.SLLJZX","XXX.SSLXXX","XXXX.SLXXX"],sp:2},{n:"Stickspin 2 (mirror) \xB7 2 \xB7 1",after:"Stickspin 2 (mirror) \xB7 2",k:"T",r:["I.........","I.........","I.........","I.SS..JJ..","XSS...JLOO","XXX.ZZJLOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 2 \xB7 2",after:"Stickspin 2 (mirror) \xB7 2",k:"T",r:["OO.......I","OOSS..L..I","XSS...L.JI","XXX.ZZLLJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 2 \xB7 3",after:"Stickspin 2 (mirror) \xB7 2",k:"T",r:["......J..I","..SS..JJJI","XSS...LLLI","XXX.ZZLOOI","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 2 \xB7 4",after:"Stickspin 2 (mirror) \xB7 2",k:"T",r:["........LI","..SS..LLLI","XSS...OOJI","XXX.ZZOOJI","XXX..ZZJJX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 2 \xB7 5",after:"Stickspin 2 (mirror) \xB7 2",k:"T",r:["......I..L","..SS..ILLL","XSS...IJJJ","XXX.ZZIOOJ","XXX..ZZOOX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 2 \xB7 6",after:"Stickspin 2 (mirror) \xB7 2",k:"T",r:[".J........",".J....I...","JJSS..I...","XSS...ILOO","XXX.ZZILOO","XXX..ZZLLX","XXX.XXXXXX","XXXX.XXXXX"],sp:3},{n:"Stickspin 2 (mirror) \xB7 1 (early)",after:"Stickspin 2 (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...LLLZZ","XX..SLJJZX","X...SSJXXX","XX.XXXXXXX","XXXX.SJXXX"],sp:2},{n:"Stickspin 2 (mirror) \xB7 2 (early)",after:"Stickspin 2 (mirror)",k:"T",r:["I.........","IOO.......","IOO......Z","IX...JJJZZ","XX..SLLJZX","X...SSLXXX","XX.XXXXXXX","XXXX.SLXXX"],sp:2},{n:"Fairy (Breakerspin) \xB7 1",after:"Fairy (Breakerspin)",k:"T",r:["OO.......Z","OO......ZZ","XJJ.....ZL","XJ...SSLLL","XJX.SSIIII","XXX.....XX","XXXXXX.XXX"],sp:2},{n:"Fairy (Breakerspin) \xB7 2",after:"Fairy (Breakerspin)",k:"T",r:["OO........","OO......ZI","XJJ....ZZI","XJ...SSZLI","XJX.SSLLLI","XXX.....XX","XXXXXX.XXX"],sp:2},{n:"Fairy (Breakerspin) (mirror) \xB7 1",after:"Fairy (Breakerspin) (mirror)",k:"T",r:["S.......OO","SS......OO","JS.....LLX","JJJZZ...LX","IIIIZZ.XLX","XX.....XXX","XXX.XXXXXX"],sp:2},{n:"Fairy (Breakerspin) (mirror) \xB7 2",after:"Fairy (Breakerspin) (mirror)",k:"T",r:["........OO","IS......OO","ISS....LLX","IJSZZ...LX","IJJJZZ.XLX","XX.....XXX","XXX.XXXXXX"],sp:2},{n:"LaundrySpin \xB7 1",after:"LaundrySpin",k:"T",r:[".........I","........ZI","OO....LZZI","OOSS..LZXI","XSS...LLXX","XXJX.XXXXX","XXJJJ.XXXX"],sp:2},{n:"LaundrySpin \xB7 1 \xB7 1",after:"LaundrySpin \xB7 1",k:"T",r:[".........I",".........I","......LLLI","......LOOI",".SS..ZZOOX","SSJ...ZZXX","XXJJJ.XXXX","XXXX..XXXX","XXXXX.XXXX"],sp:3},{n:"LaundrySpin \xB7 1 \xB7 2",after:"LaundrySpin \xB7 1",k:"T",r:[".........I",".........I",".........I","LOO..S..ZI","LOO..SSZZX","LLJ...SZXX","XXJJJ.XXXX","XXXX..XXXX","XXXXX.XXXX"],sp:3},{n:"LaundrySpin (mirror) \xB7 1",after:"LaundrySpin (mirror)",k:"T",r:["I.........","IS........","ISSJ....OO","IXSJ..ZZOO","XXJJ...ZZX","XXXXX.XLXX","XXXX.LLLXX"],sp:2},{n:"LaundrySpin (mirror) \xB7 1 \xB7 1",after:"LaundrySpin (mirror) \xB7 1",k:"T",r:["I.........","I.........","IJJJ......","IOOJ......","XOOSS..ZZ.","XXSS...LZZ","XXXX.LLLXX","XXXX..XXXX","XXXX.XXXXX"],sp:3},{n:"LaundrySpin (mirror) \xB7 1 \xB7 2",after:"LaundrySpin (mirror) \xB7 1",k:"T",r:["I.........","I.........","I.........","IS..Z..OOJ","XSSZZ..OOJ","XXSZ...LJJ","XXXX.LLLXX","XXXX..XXXX","XXXX.XXXXX"],sp:3},{n:"Speedboat \xB7 1",after:"Speedboat",k:"T",r:["........LL","...J.....L","IOOJJJSS.L","IOOXXSS..X","IXXXXXXX.X","IXXXXX..XX"],sp:3},{n:"Speedboat \xB7 2",after:"Speedboat",k:"T",r:["....ZJ..LL","...ZZJ...L","IOOZJJSS.L","IOOXXSS..X","IXXXXXXX.X","IXXXXX..XX"],sp:3},{n:"Speedboat \xB7 2 \xB7 1",after:"Speedboat \xB7 2",k:"T",r:["......OO..","......OO..","...L..I...","JLLLXXI.XX","JJJXXXI..X","XXXXXXI.XX"],sp:3},{n:"Speedboat \xB7 2 \xB7 2",after:"Speedboat \xB7 2",k:"T",r:["S....LLL..","SSOO.LI...","JSOOXXI.XX","JJJXXXI..X","XXXXXXI.XX"],sp:3},{n:"Speedboat \xB7 3",after:"Speedboat",k:"T",r:["...Z......","..ZZ....LL","..ZJ.....L","IOOJJJSS.L","IOOXXSS..X","IXXXXXXX.X","IXXXXX..XX"],sp:3},{n:"Speedboat \xB7 3 \xB7 1",after:"Speedboat \xB7 3",k:"T",r:["....I.JJ..","...XI.J...","OOXXISJ.XX","OOXXISS..X","XXXXXXS.XX"],sp:3},{n:"Speedboat (mirror) \xB7 1",after:"Speedboat (mirror)",k:"T",r:["JJ........","J.....L...","J.ZZLLLOOI","X..ZZXXOOI","X.XXXXXXXI","XX..XXXXXI"],sp:3},{n:"Speedboat (mirror) \xB7 2",after:"Speedboat (mirror)",k:"T",r:["JJ..LS....","J...LSS...","J.ZZLLSOOI","X..ZZXXOOI","X.XXXXXXXI","XX..XXXXXI"],sp:3},{n:"Speedboat (mirror) \xB7 2 \xB7 1",after:"Speedboat (mirror) \xB7 2",k:"T",r:["..OO......","..OO......","...I..J...","XX.IXXJJJL","X..IXXXLLL","XX.IXXXXXX"],sp:3},{n:"Speedboat (mirror) \xB7 2 \xB7 2",after:"Speedboat (mirror) \xB7 2",k:"T",r:["..JJJ....Z","...IJ.OOZZ","XX.IXXOOZL","X..IXXXLLL","XX.IXXXXXX"],sp:3},{n:"Speedboat (mirror) \xB7 3",after:"Speedboat (mirror)",k:"T",r:["......S...","JJ....SS..","J.....LS..","J.ZZLLLOOI","X..ZZXXOOI","X.XXXXXXXI","XX..XXXXXI"],sp:3},{n:"Speedboat (mirror) \xB7 3 \xB7 1",after:"Speedboat (mirror) \xB7 3",k:"T",r:["..LL.I....","...L.IX...","XX.LZIXXOO","X..ZZIXXOO","XX.ZXXXXXX"],sp:3},{n:"Sailboat \xB7 1",after:"Sailboat",k:"T",r:["...LLI....","...ZLIJJ..","OOZZLIJ...","OOZXXIJS.X",".XXXXXXSSX",".XXXXXXXSX"],sp:2},{n:"Sailboat \xB7 2",after:"Sailboat",k:"T",r:[".....Z..S.",".LOOZZ..SS","ILOOZJ...S","ILLXXJJJ.X","IXXXXXX..X","IXXXXXXX.X"],sp:3},{n:"Sailboat \xB7 3",after:"Sailboat",k:"T",r:[".L........",".L...Z..S.",".LL.ZZ..SS","IOO.ZJ...S","IOOXXJJJ.X","IXXXXXX..X","IXXXXXXX.X"],sp:3},{n:"Sailboat (mirror) \xB7 1",after:"Sailboat (mirror)",k:"T",r:["....IJJ...","..LLIJS...","...LIJSSOO","X.ZLIXXSOO","XZZXXXXXX.","XZXXXXXXX."],sp:2},{n:"Sailboat (mirror) \xB7 2",after:"Sailboat (mirror)",k:"T",r:[".Z..S.....","ZZ..SSOOJ.","Z...LSOOJI","X.LLLXXJJI","X..XXXXXXI","X.XXXXXXXI"],sp:3},{n:"Sailboat (mirror) \xB7 3",after:"Sailboat (mirror)",k:"T",r:["........J.",".Z..S...J.","ZZ..SS.JJ.","Z...LS.OOI","X.LLLXXOOI","X..XXXXXXI","X.XXXXXXXI"],sp:3},{n:"LAST \xB7 1",after:"LAST",k:"T",r:["S......OO.","SSI....OOZ","XSIJJ..LZZ","XXIJ...LZX","XXIJX.XLLX","XXXXXX.XXX"],sp:2},{n:"LAST \xB7 2",after:"LAST",k:"T",r:[".........Z","S.......ZZ","SSI.....ZL","XSIJJ..LLL","XXIJ...OOX","XXIJX.XOOX","XXXXXX.XXX"],sp:2},{n:"LAST \xB7 3",after:"LAST",k:"T",r:["J.......SS","JJJ....SSZ","XIIII..LZZ","XXOO...LZX","XXOOX.XLLX","XXXXXX.XXX"],sp:2},{n:"LAST \xB7 4",after:"LAST",k:"T",r:["...J.....I","S..J.....I","SSJJZ....I","XSLZZ....I","XXLZ...OOX","XXLLX.XOOX","XXXXXX.XXX"],sp:2},{n:"LAST (mirror) \xB7 1",after:"LAST (mirror)",k:"T",r:[".OO......Z","SOO....IZZ","SSJ..LLIZX","XSJ...LIXX","XJJX.XLIXX","XXX.XXXXXX"],sp:2},{n:"LAST (mirror) \xB7 2",after:"LAST (mirror)",k:"T",r:["S.........","SS.......Z","JS.....IZZ","JJJ..LLIZX","XOO...LIXX","XOOX.XLIXX","XXX.XXXXXX"],sp:2},{n:"LAST (mirror) \xB7 3",after:"LAST (mirror)",k:"T",r:["ZZ.......L","SZZ....LLL","SSJ..IIIIX","XSJ...OOXX","XJJX.XOOXX","XXX.XXXXXX"],sp:2},{n:"LAST (mirror) \xB7 4",after:"LAST (mirror)",k:"T",r:["I.....L...","I.....L..Z","I....SLLZZ","I....SSJZX","XOO...SJXX","XOOX.XJJXX","XXX.XXXXXX"],sp:2},{n:"PC-Spin \xB7 1",after:"PC-Spin",k:"T",r:["ILLLSS...J","ILXSS....J","IXXXX.ZZJJ","IXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin \xB7 2",after:"PC-Spin",k:"T",r:[".........J",".........J","ILLLSS..JJ","ILXSS...OO","IXXXX.ZZOO","IXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin \xB7 3",after:"PC-Spin",k:"T",r:[".........J","LL.......J","IL..SS..JJ","ILXSS...OO","IXXXX.ZZOO","IXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin \xB7 4",after:"PC-Spin",k:"T",r:[".........I","OO.......I","OO..SS..LI","JJXSS...LI","JXXXX.ZZLL","JXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin (mirror) \xB7 1",after:"PC-Spin (mirror)",k:"T",r:["L...ZZJJJI","L....ZZXJI","LLSS.XXXXI","XSS..XXXXI","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin (mirror) \xB7 2",after:"PC-Spin (mirror)",k:"T",r:["L.........","L.........","LL..ZZJJJI","OO...ZZXJI","OOSS.XXXXI","XSS..XXXXI","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin (mirror) \xB7 3",after:"PC-Spin (mirror)",k:"T",r:["L.........","L.......JJ","LL..ZZ..JI","OO...ZZXJI","OOSS.XXXXI","XSS..XXXXI","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin (mirror) \xB7 4",after:"PC-Spin (mirror)",k:"T",r:["I.........","I.......OO","IJ..ZZ..OO","IJ...ZZXLL","JJSS.XXXXL","XSS..XXXXL","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin 2 \xB7 1",after:"PC-Spin 2",k:"T",r:["L...ZZJJJI","L....ZZXJI","LLSS.XXXXI","XSS..XXXXI","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin 2 \xB7 2",after:"PC-Spin 2",k:"T",r:["L.........","L.........","LL..ZZJJJI","OO...ZZXJI","OOSS.XXXXI","XSS..XXXXI","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin 2 \xB7 3",after:"PC-Spin 2",k:"T",r:["L.........","L.......JJ","LL..ZZ..JI","OO...ZZXJI","OOSS.XXXXI","XSS..XXXXI","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin 2 \xB7 4",after:"PC-Spin 2",k:"T",r:["I.........","I.......OO","IJ..ZZ..OO","IJ...ZZXLL","JJSS.XXXXL","XSS..XXXXL","XXXX.XXXXX","XXX.XXXXXX"],sp:3},{n:"PC-Spin 2 (mirror) \xB7 1",after:"PC-Spin 2 (mirror)",k:"T",r:["ILLLSS...J","ILXSS....J","IXXXX.ZZJJ","IXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin 2 (mirror) \xB7 2",after:"PC-Spin 2 (mirror)",k:"T",r:[".........J",".........J","ILLLSS..JJ","ILXSS...OO","IXXXX.ZZOO","IXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin 2 (mirror) \xB7 3",after:"PC-Spin 2 (mirror)",k:"T",r:[".........J","LL.......J","IL..SS..JJ","ILXSS...OO","IXXXX.ZZOO","IXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"PC-Spin 2 (mirror) \xB7 4",after:"PC-Spin 2 (mirror)",k:"T",r:[".........I","OO.......I","OO..SS..LI","JJXSS...LI","JXXXX.ZZLL","JXXXX..ZZX","XXXXX.XXXX","XXXXXX.XXX"],sp:3},{n:"Gamushiro \xB7 1",after:"Gamushiro",k:"T",r:["IOO.......","IOO.......","IJJ.....LL","IJ....SSLL","XJ.ZZSSXLL","XX..ZZXXLL","XX.XXXXXXX","XXX.XXXXXX"],sp:3},{n:"Gamushiro \xB7 2",after:"Gamushiro",k:"T",r:["I.........","I.....OO..","IJJ...OOLL","IJ....SSLL","XJ.ZZSSXLL","XX..ZZXXLL","XX.XXXXXXX","XXX.XXXXXX"],sp:3},{n:"Gamushiro (mirror) \xB7 1",after:"Gamushiro (mirror)",k:"T",r:[".......OOI",".......OOI","JJ.....LLI","JJZZ....LI","JJXZZSS.LX","JJXXSS..XX","XXXXXXX.XX","XXXXXX.XXX"],sp:3},{n:"Gamushiro (mirror) \xB7 2",after:"Gamushiro (mirror)",k:"T",r:[".........I","..OO.....I","JJOO...LLI","JJZZ....LI","JJXZZSS.LX","JJXXSS..XX","XXXXXXX.XX","XXXXXX.XXX"],sp:3},{n:"Gamushiro 2 \xB7 1",after:"Gamushiro 2",k:"T",r:["I.......OO","I.......OO","IJJ.....LL","IJ....SSXL","XJ.ZZSSXXL","XX..ZZXXXX","XX.XXXXXXX","XXX.XXXXXX"],sp:3},{n:"Gamushiro 2 (mirror) \xB7 1",after:"Gamushiro 2 (mirror)",k:"T",r:["OO.......I","OO.......I","JJ.....LLI","JXZZ....LI","JXXZZSS.LX","XXXXSS..XX","XXXXXXX.XX","XXXXXX.XXX"],sp:3}];(function(fb,fc){var mir=function(r){return r.map(function(row){return row.split("").reverse().map(function(c){return{L:"J",J:"L",S:"Z",Z:"S"}[c]||c}).join("")})};fb.split(`
`).forEach(function(l){var f=l.split("|"),r=f[2].split("/"),w=+f[3];BOOK.push({n:f[0],k:f[1],r,w},{n:f[0]+" (mirror)",k:f[1],r:mir(r),w})}),fc.split(`
`).forEach(function(l){var f=l.split("|"),r=f[2].split("/"),sp=+f[3];BOOK2.push({n:f[0],after:f[4],k:f[1],r,sp},{n:f[0]+" (mirror)",after:f[4]+" (mirror)",k:f[1],r:mir(r),sp})})})(`Cerise Stacking|T|....S...../....SS..../.Z...SLOOJ/ZZ..LLLOOJ/Z...IIIIJJ|0.0328
HeboMAI Spin|T|....S...../....SSL..J/.Z...SL..J/ZZ..OOLLJJ/Z...OOIIII|0.0293
Crowbar v2|T|........S./LLL.....SS/LZJ......S/ZZJ.....OO/ZJJ.IIIIOO|0.07
Crowbar v2 2|T|........S./JJZ.....SS/JZZ......S/JZL.....OO/LLL.IIIIOO|0.07
Crowbar v1|X|I..Z....../ILZZJJJ.S./ILZOO.JTSS/ILLOO.TTTS|0.02
Re,MTD|T|I........J/I........J/I.....ZZJJ/ISS..OOZZL/SS...OOLLL|0.0513
Re,MTD 3|T|I........J/I........J/I.....SSJJ/I.ZZ.SSLOO/...ZZLLLOO|0.0513
510 Cannon|T|...S....../...SS....I/....S..ZJI/...LOOZZJI/.LLLOOZJJI|0.028
Boots M Slipper|T|OO......../OO......../I........./I.....ZZ../I.SSJJJZZL/ISS...JLLL|0.0275
Confirmed MC Cannon|T|I.....JJJ./I....SLLJ./I..ZZSSLOO/I...ZZSLOO|0.02
Confirmed MC Cannon 2|T|I.....OOL./I....SOOL./I..ZZSSJLL/I...ZZSJJJ|0.02
Crevasse Stacking|T|L........./L........I/LLSSZ....I/JSSZZ..OOI/JJJZ...OOI|0.0425
Dokpe TSM|T|IIII....../LLL.....ZJ/LSS..OOZZJ/SS...OOZJJ|0.0381
Dokpe TSM 2|T|IIII....../JJZ.....SS/JZZ..OOSSL/JZ...OOLLL|0.0381
Dokpe TSM 4|X|STTT....../SST.....OO/JSZZ.LLLOO/JJJZZLIIII|0.0381
Partial bag 1|T|.LS...JJJ./.LSS..ZZJ./.LLS...ZZ.|0.02
Drawbridge|T|.......ZL./......ZZL./......ZJLL/.SSIIIIJOO/SS....JJOO|0.0447
Fastest MD|T|.......SLL/.......SSL/.....OOJSL/.IIIIOOJJJ|0.0244
Fastest MD 2|T|.......JJJ/.ZZ....LSJ/..ZZ.OOLSS/.IIIIOOLLS|0.0244
Ghost Cannon|T|.Z......../ZZ.JJJ..LL/ZSSOOJ...L/SS.OOIIIIL|0.0269
I\u2019m T-spin|T|.Z..J...../ZZSSJ...LL/ZSSJJ..OOL/IIII...OOL|0.0256
Maya Mackerel|T|ZZ......../LZZ......./L........I/LL.......I/OO..SSJJJI/OO.SS...JI|0.0377
MC Cannon|T|........J./........J./.......JJI/......SLLI/OO..ZZSSLI/OO...ZZSLI|0.0334
MDF|T|....IIII../ZZ...SLL../JZZ..SSLOO/JJJ...SLOO|0.047
MDF 2|T|....IIII../JJ...SZZ../JOO..SSZZL/JOO...SLLL|0.047
MDF 3|T|....IIII../LS...JJJ../LSS..ZZJOO/LLS...ZZOO|0.047
Moose Stacking|T|.........J/.........J/I.......JJ/I.Z.....LL/IZZSS..OOL/IZSS...OOL|0.02
Unnamed bag 1 [b1-ca458972]|T|.........I/JJ.....S.I/JOO..ZZSSI/JOO...ZZSI|0.02
MS PC|T|......IIII/L..S...OOJ/LZZSS..OOJ/LLZZS...JJ|0.0279
MS PC 2|T|I......JJJ/I.ZZ....SJ/IOOZZL..SS/IOOLLL...S|0.0279
MS PC 3|T|..L....JJJ/..LZZ...SJ/OOLLZZ..SS/OOIIII...S|0.0279
New Freezer|T|..S......./..SS.....I/.OOS.....I/JOOLLLZZ.I/JJJL...ZZI|0.0392
Old Freezer|T|.S......../.SS......I/JJS......I/JOOLLLZZ.I/JOOL...ZZI|0.0522
Old Freezer 2|X|.J......../.JI.....SS/JJI....SST/OOILLLZZTT/OOIL...ZZT|0.0522
Parameter M|T|........I./........I./LOO.....IJ/LOOSSZZ.IJ/LLSS..ZZJJ|0.0325
Shiso Special|T|......JJJ./........JI/......SLLI/OO..ZZSSLI/OO...ZZSLI|0.0392
Soil MDDT|T|.......LLI/........LI/..SS....LI/JSSOO..ZZI/JJJOO...ZZ|0.0365
Unnamed bag 1 [b1-2f0a08b1] 2|T|.......LLI/........LI/..ZZ....LI/OOJZZ.SS.I/OOJJJSS...|0.02
Soy PC|T|.......JJJ/I.......SJ/IL......SS/IL.OO..ZZS/ILLOO...ZZ|0.0272
Soy PC 2|T|.......LLI/S.......LI/SS......LI/JS.OO..ZZI/JJJOO...ZZ|0.0272
Suspension Bridge TSM|T|....I...../....I...../LOOJI...../LOOJISSZZ./LLJJSS..ZZ|0.0512
Suspension Bridge TSM 2|T|....I...../....I...../JJLLI...../JOOLISSZZ./JOOLSS..ZZ|0.0512
Suspension Bridge TSM v2|T|........L./........L./.....OOJLL/.....OOJJJ/......IIII|0.0409
Suspension Bridge TSM v2 2|T|........I./........I./.....LLLIJ/.SSZZLOOIJ/SS..ZZOOJJ|0.0409
Suspension Bridge TSM v2 3|T|........J./........J./.....OOJJL/.SSZZOOLLL/SS..ZZIIII|0.0409
Suspension Bridge TSM v3|T|.......ZOO/.....LZZOO/...LLLZJJJ/.....IIIIJ|0.0496
Suspension Bridge TSM v3 2|T|.......LLL/.....ZZLOO/...JJJZZOO/.....JIIII|0.0496
Suspension Bridge TSM v3 3|T|.......OOI/.....ZZOOI/.SSJJJZZLI/SS...JLLLI|0.0496
You\u2019s Mechanical TSD|T|I........./I......JJJ/I.SSOO.ZZJ/ISS.OO..ZZ|0.0667
You\u2019s Mechanical TSD 2|T|I........./I.....ZZLL/I.SSOOJZZL/ISS.OOJJJL|0.0667
Ichinoseki Variable|T|I......LLL/I.Z....LOO/IZZSS..JOO/IZSS...JJJ|0.72
Joystick|T|......I.../......I.../.J....I.../.J....I.S./JJLZZ.OOSS/LLL.ZZOO.S|0.0403
Partial bag 1 [b1-32596543] 2|T|......I.../......I.../.L....I.../.L....I.S./JLLZZ.OOSS/JJJ.ZZOO.S|0.02
Milk Cannon|T|IIII....../ZZLL..S.../JZZL..SSOO/JJJL...SOO|0.0466
Milk Cannon 2|T|JJZI....../JZZI..S.../JZLI..SSOO/LLLI...SOO|0.0466
Milk Cannon 3|T|LLLI....../LZJI..S.../ZZJI..SSOO/ZJJI...SOO|0.0466
New MT Cannon|T|......JJLL/.Z....JOOL/ZZSS..JOOL/ZSS...IIII|0.0369
Organic MTP|T|.......OO./I......OO./I.....LLLJ/I..ZZ.LSSJ/I...ZZSSJJ|0.0473
Organic MTP 2|T|.......OO./I......OO./I.....ZZLL/I.SS..JZZL/ISS...JJJL|0.0473
Organic MTP 3|T|.......OO./I......OO./I.....LJJJ/I.SS..LZZJ/ISS...LLZZ|0.0473
Organic MTP 4|T|.......OO./I......OO./I.....JJSS/I..ZZ.JSSL/I...ZZJLLL|0.0473
Soy Sauce MTP|T|I........./I.......S./IJL....ZSS/IJL.OOZZ.S/JJLLOOZ...|0.0316
\u91A4\u6CB9MTP|T|I........./I........./IJL....Z../IJL.OOZZ../JJLLOOZ...|0.02
TD PC|T|...I....../...I....../JJJI.S..../OOJILSSZZ./OOLLL.S.ZZ|0.0493
Tendon PC|T|.I......../.I......../LIJJ.S..../LIJOOSSZZ./LLJOO.S.ZZ|0.0541
Unnamed bag 1 [tst-system]|T|.........I/.......OOI/.SSLLLJOOI/SS.L..JJJI|0.02
XZ Cannon|T|......JJJI/OO.....SJI/OOL..ZZSSI/LLL...ZZSI|0.0347
XZ Cannon 2|T|......IIII/LS.....OOJ/LSS..ZZOOJ/LLS...ZZJJ|0.0347
XZ Cannon 3|T|......IIII/JJ.....SLL/JOO..ZZSSL/JOO...ZZSL|0.0347
Partial bag 1 [b1-e9dda414]|T|JJ......LL/JOOS.....L/JOOSS..ZZL/IIIIS...ZZ|0.02
ZMT|T|IJJ......./IJ......../IJ......../IZ......S./ZZ.LOO..SS/ZLLLOO...S|0.0417
Zozozo MTDP|T|I........./I....JJ.../I....J..../I.S..J..../OOSSZZ.LLL/OO.S.ZZL..|0.03
Ayakuru Cannon|T|L......JJJ/LZZ.....SJ/LLZZOO..SS/IIIIOO...S|0.0357
Ayakuru Cannon 2|X|L......TTT/LZZ.....TJ/LLZZOO.SSJ/IIIIOOSSJJ|0.0357
Confirmed HeboMAI|T|....LL...I/.Z...L...I/ZZSSJL.OOI/ZSS.JJJOOI|0.02
Dakyou Stacking|T|..LLL...../..LS...OOJ/...SSZZOOJ/IIIIS.ZZJJ|0.0285
LIS MD PC|T|..LSZZ..../OOLSSZZ.../OOLLSIIII.|0.0283
MS PC Alpha|T|LLL...ZJ../LSS..ZZJ../SS...ZJJ..|0.0485
MS PC Alpha 2|T|IIII....../JJZ...SS../JZZ..SSLOO/JZ...LLLOO|0.0485
night blast|T|.......ZZ./........ZZ/JJIIII.SLL/JOO....SSL/JOO.....SL|0.04
FS Cannon|T|J........./JJJ......./I.......LL/I........L/I..SSOOZZL/I.SS.OO.ZZ|0.0343
Fumajime STD|T|.........L/.......LLL/SIIII...OO/SS..ZZ.JOO/.S...ZZJJJ|0.0316
Kvodeth\u2019s Single Double|T|.JJ......./.J......../.J.ZZ...SS/OO..ZZ.SSL/OO.IIIILLL|0.0324
Sailboat (X+)|T|...LL....I/....LOO..I/ZZ.JLOOSSI/.ZZJJJSS.I|0.0585
Unnamed bag 1 [b1-8ef91db6]|T|I....JJ.../I..OOJ..../IZZOOJL.SS/I.ZZLLLSS.|0.02
Single Sense Bath|T|......L.../....LLL.../J....Z..../JJJ.ZZSSOO/IIIIZSS.OO|0.0343
8282 Stacking|T|..L......./LLL......./I........./I......OOJ/I..SSZZOOJ/I.SS..ZZJJ|0.0585
Amaryllis SDP|T|........S./.LLL....SS/.L.......S/JIIIIZZ.OO/JJJ...ZZOO|0.0267
Bakkure SDT|T|I........./I........./I.Z......./IZZ....OO./JZ...SSOOL/JJJ.SS.LLL|0.0378
Chair SDT|T|.......S../.......SSI/...JJ...SI/LLLJZZ.OOI/L..J.ZZOOI|0.0556
Chin Anago Stacking|T|...SS...../..SS....../..Z......I/.ZZ......I/JZ....LOOI/JJJ.LLLOOI|0.0512
Crow Cannon|T|.........I/..J......I/..J......I/.JJ...LL.I/ZZ...SSLOO/.ZZ.SS.LOO|0.02
Cruise SD|T|.Z......../ZZ......L./Z....J..L./OO.SSJJJLL/OOSS..IIII|0.0407
\u30C7\u30FC\u30E2\u30F3SP|T|.Z.......I/ZZ.......I/Z.......LI/OO.SSJJJLI/OOSS...JLL|0.058
\u30C7\u30FC\u30E2\u30F3SP 2|T|.Z.......J/ZZ.......J/Z.......JJ/OO.SSIIIIL/OOSS...LLL|0.058
Dolphin|T|.......OO./I......OO./I.......SS/IJJJZZ.SSL/I..J.ZZLLL|0.066
\u821E\u6D5CSDT|T|.OO......./.OO......I/ZZ.......I/JZZ.SSLLLI/JJJSS.L..I|0.02
\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F|T|........S./..L.....SS/LLL......S/JIIIIZZ.OO/JJJ...ZZOO|0.07
Fake C-Spin|T|JJ......../J........./J........./L..Z....../L.ZZ....../LLZ...SSOO/IIII.SS.OO|0.0325
FD Cannon|T|..L......./LLL......./I........./I....ZZ.../I..SSJZZOO/I.SS.JJJOO|0.0612
FDPC|T|..L......./LLL......./I........./I......ZZ./I..SSOOJZZ/I.SS.OOJJJ|0.07
Final Bridge|T|........LL/J........L/JJJIIII.SL/OO....ZZSS/OO.....ZZS|0.0278
George SD|T|........LL/..Z......L/.ZZ....SSL/JZ....SSOO/JJJ.IIIIOO|0.0279
Gesso Special|T|.........I/.........I/......L..I/....LLLJ.I/ZZ...SSJOO/.ZZ.SSJJOO|0.0332
Gesso Stacking or AT Cannon, sources dis|T|I........./I........./I.......L./I.....LLLJ/OOZZ...SSJ/OO.ZZ.SSJJ|0.0316
Gill Bridge|T|.SS......Z/SS......ZZ/OOJ.IIIIZL/OOJJJ..LLL|0.0404
glyzSD|T|..Z......./IZZ......./IZ....J.../IOO.SSJJJL/IOOSS..LLL|0.0319
Goldmine|T|..Z......./IZZ......./IZ....L.../IOO.SSLJJJ/IOOSS.LL.J|0.032
Goldmine Revised|T|.Z......../ZZ.......I/Z....L...I/OO.SSLJJJI/OOSS.LL.JI|0.0439
Hachimaki Cannon|T|.........I/....L....I/....L....I/....LL.JJI/ZZ...SSJOO/.ZZ.SS.JOO|0.0422
Hummingbird (Late L)|T|.........I/.........I/....OO...I/....OO...I/ZZ...SSJJJ/.ZZ.SS...J|0.0249
Partial bag 1 [b1-7f69d256]|T|.........I/.OO....LLI/.OO.....LI/ZZ...SSJLI/.ZZ.SS.JJJ|0.02
Izu SD|T|...LOO..../JLLLOO..../JJJZZ...SS/IIIIZZ.SS.|0.0407
Izu SD 2|T|....SLLOO./....SSLOO./J....SLZZ./JJJ.IIIIZZ|0.0342
JA Cannon|T|I........./I........./I.Z......./IZZ...LL../JZ...SSLOO/JJJ.SS.LOO|0.0543
Jasper Cannon|T|.....LL..I/......LS.I/OOZZ.JLSSI/OO.ZZJJJSI|0.047
Jasper Cannon 2|T|.....LS..J/...LLLSS.J/OOZZ...SJJ/OO.ZZ.IIII|0.047
Unnamed bag 1 [juice-st]|T|.........Z/......OOZZ/......OOZJ/LLL....SSJ/LIIII.SSJJ|0.0382
Kakukaku Stacking|T|.I......S./.I......SS/.I..L....S/JILLLZZ.OO/JJJ...ZZOO|0.0365
Key Or PC|T|........S./I.......SS/I...L....S/IJLLLZZ.OO/IJJJ..ZZOO|0.0539
Curveball|T|......S.../I.....SS../I......SOO/ILLLJ.ZZOO/IL..JJJZZ.|0.0637
kluz cannon|T|........S./.J......SS/.J..L....S/JJLLLZZ.OO/.IIII.ZZOO|0.0331
lutz cannon|T|.Z......../ZZ......L./Z.....LLLJ/OO.SSIIIIJ/OOSS....JJ|0.0334
Maospin|T|J........./JJJ......./I........./I......LLL/I..SSZZLOO/I.SS..ZZOO|0.0538
mons|T|..Z......./IZZ......./IZ......LL/IOO.SSJJJL/IOOSS...JL|0.07
mons 2|T|..Z......./IZZ......./IZ......LJ/IOO.SSLLLJ/IOOSS...JJ|0.07
Moonstone Cannon|T|......Z.../.....ZZ.../....JZ..../IIIIJOO.SS/...JJOOSS.|0.0217
Unnamed bag 1 [b1-391893fa]|T|I........./I.....OOJ./I.....OOJ./I......JJ./LLLZZ...SS/L...ZZ.SS.|0.02
Muscle Cannon|T|I........./I.......J./I.......J./I......JJ./LLLZZ...SS/L...ZZ.SS.|0.0406
Okazu SD|T|..S......./..SS....../...SIIIILL/J.ZZ...OOL/JJJZZ..OOL|0.04
Old Key|T|I.Z......./IZZ......./IZ......../ISS.LJJJOO/SSLLL..JOO|0.0554
Outlogic SD|T|JJ......../J......ZZ./JSSOOLLLZZ/SS.OOL....|0.02
Outlogic SD 2|T|JJ......../J......ZZ./JSSOOLLLZZ/SS.OOLIIII|0.02
Unnamed bag 1 [b1-5ffce81b]|T|JJ......../J...IIIIOO/JSS...ZZOO/SS.....ZZ.|0.02
Unnamed bag 1 [b1-5ffce81b] 2|T|JJ......../J...IIIIOO/JSSLLLZZOO/SS.L...ZZ.|0.02
Pinwheel|T|..S.....LL/..SS.....L/...S.....L/J.ZZIIIIOO/JJJZZ...OO|0.0545
Pinwheel 3|X|..S.....LL/..SS.....L/JJZS.....L/JZZTIIIIOO/JZTTT...OO|0.0545
Ponponpo|T|...OO...../...OO....I/....SS...I/ZZ.SSLJJJI/.ZZLLL..JI|0.0494
Pure SDT|T|.......S../.......SSI/..LL....SI/JJJLZZ.OOI/..JL.ZZOOI|0.0462
Reflective Water Special|T|..ZZ....../...ZZJ..../LLLSSJJJOO/L.SSIIIIOO|0.0234
Regenerate SD|T|S.......OO/SS......OO/LS......ZJ/L......ZZJ/LL.IIIIZJJ|0.0266
S\xB9D|T|L........./L.......S./LL....ZZSS/OOJ....ZZS/OOJJJ.IIII|0.0331
SAZI SD|T|......Z.../.....ZZ..J/.....Z...J/OOLLLSS.JJ/OOL.SSIIII|0.0522
SCP-ginzan|T|LLL.....S./L.....ZZSS/OOJ....ZZS/OOJJJ.IIII|0.0265
SD Mechanical|T|.Z......../ZZ.......J/Z......L.J/OO.SSLLLJJ/OOSS..IIII|0.0359
SDD Attack|T|.........Z/........ZZ/........ZJ/..L......J/LLLIIII.JJ|0.0437
SDD Attack 2|T|.........Z/..S.....ZZ/OOSS....ZJ/OOLS.....J/LLLIIII.JJ|0.0437
SDDT Cannon|T|...S....../...SS....I/....S...JI/ZZ.OOLLLJI/.ZZOOL.JJI|0.0567
SDM\u2019s|T|....ZZ...I/JJ...ZZLLI/JOO.SS..LI/JOOSS...LI|0.0342
SDT Cannon|T|........OO/........OO/.........Z/.J..SS..ZZ/.J.SS...ZL/JJIIII.LLL|0.0262
SDT\u2019s|T|.Z......../ZZ.......I/Z...LL...I/OO.SSLJJJI/OOSS.L..JI|0.0462
Seagull Special|T|I......OO./I......OO./IZZ.....SS/I.ZZ...SS.|0.0413
Seagull Special 2|T|.OO......I/.OO..J...I/ZZ...J.SSI/.ZZ.JJSS.I|0.0413
Seagull Special 3|T|I..JJ..OO./I..JL..OO./IZZJL...SS/I.ZZLL.SS.|0.0413
Secret SD|T|........S./........SS/JJIIII...S/J...LZZ.OO/J.LLL.ZZOO|0.0233
Secspin|T|...S....../...SS....I/....SJJ..I/ZZ.OOJLLLI/.ZZOOJL..I|0.0331
SingleYou|T|........S./I.......SS/ILJ......S/ILJJJZZ.OO/ILL...ZZOO|22
SingleYou 2|T|........S./I.......SS/IJJ......S/IJLLLZZ.OO/IJL...ZZOO|22
Stickspin 3 (X+)|X|........T./J......TTI/JJJ....STI/OOLLLZZSSI/OOL...ZZSI|5.57
Snail SDT|T|....Z...../...ZZ...../L..ZJOO.S./L...JOO.SS/LL.JJIIIIS|0.03
Soleil Cannon|T|L...S...../L...SS..../LL...S..../OOJ.ZZIIII/OOJJJZZ...|0.0228
Staircase Stacking|T|...S....../...SS....I/....SL...I/ZZ.OOLJJJI/.ZZOOLL.JI|0.0445
Submarine|T|...LL....I/....LS...I/ZZ.JLSSOOI/.ZZJJJSOOI|0.0245
Submarine [b1-68faad62]|T|....JJ...I/...ZJ....I/OOZZJL.SSI/OOZLLLSS.I|0.02
Sudou-P|T|..Z......./IZZ......./IZ...SS.LL/IOO.SSJJJL/IOO.....JL|0.0472
Sure FD|T|....JJJ.../......J..I/......LS.I/OOZZ..LSSI/OO.ZZ.LLSI|0.02
Tabi TSS|T|S........./SS.......I/LS..J...ZI/L...JOOZZI/LL.JJOOZ.I|0.0503
Technical TSS|T|ZZ......../SZZ......./SS......../LS......OO/L......JOO/LL.IIIIJJJ|0.045
Terlance\u2019s STD|T|......OO../......OOS./L.....ZZSS/L.J....ZZS/LLJJJ.IIII|0.034
Terre Cannon|T|.LLL....S./.LZ.....SS/.ZZ......S/JZ......OO/JJJ.IIIIOO|0.0496
Tidal Waves|T|........S./I.......SS/I...L....S/IJJJLZZ.OO/I..JLLZZOO|0.0354
Toothpaste Cone|T|I........./I........./IL.....OO./IL.....OO./JLLZZ...SS/JJJ.ZZ.SS.|0.07
Toothpaste Cone 2|T|I........./I........./IJ.....OO./IJ.....OO./JJLZZ...SS/LLL.ZZ.SS.|0.07
True Hanpen|T|...S.....I/...SS....I/....S...LI/ZZ.OOJJJLI/.ZZOO..JLL|0.055
UNC.SD|T|........LL/...SS....L/OOSSJJJZZL/OOIIIIJ.ZZ|0.0566
Weak.FOD|T|.........L/.......LLL/..JJ.....I/..J......I/OOJSSZZ..I/OOSS..ZZ.I|0.0329
Zaptor Stacking|T|S......OO./SS.....OO./LS......ZJ/L......ZZJ/LL.IIIIZJJ|0.0443
Unnamed bag 1 [b1-0150117a]|T|S........./SS......../LS...OOZZ./L....OOJZZ/LL.IIIIJJJ|0.02
Unnamed bag 1 [b1-2e854fba]|T|S........./SS.....Z../LS....ZZOO/L.....ZJOO/LL.IIIIJJJ|0.02
ZIS Bridge|T|S........./SS......../LS...OO.ZJ/L....OOZZJ/LL.IIIIZJJ|0.0248
ZOS Tower|T|...S....../...SS...../....S...../....OO...I/....OO..JI/LLLZZ...JI/L...ZZ.JJI|0.0419
DoubleYou|T|.......S../.......SSI/L.......SI/LJJJZZ.OOI/LL.J.ZZOOI|0.0471
Faucet Stacking|T|..I......./..I.....J./..I.....J./OOI....JJ./OOLZZ...SS/LLL.ZZ.SS.|0.0433
Hachispin (X+)|T|...S....../...SS....I/....SLLL.I/ZZ.OOLJJJI/.ZZOO...JI|0.07
Mr. T-Spin Analogon|T|......I.../.L....I.../.L....I.../.LL..JI.S./ZZ...JOOSS/.ZZ.JJOO.S|0.0372
Mr. T-Spin\u2019s STD|T|.....L..../.....L..../..S..LL.../OOSSZZ..../OO.S.ZZ...|0.0558
Mr. T-Spin\u2019s STD 2|T|I........./I....L..../I....L..../I.S..LL..J/OOSSZZ...J/OO.S.ZZ.JJ|0.0558
Mr. T-Spin\u2019s STD 4|X|I...LL.ZS./IT...LZZSS/ITT.JLZOOS/IT..JJJOO.|0.0558
Mr. T-Spin\u2019s STD 5|X|I...LL.OO./IT...LSOOZ/ITT.JLSSZZ/IT..JJJSZ.|0.0558
Mr. T-Spin\u2019s STD 6|X|I...LL.ZZ./IT...LOOZZ/ITT.JLOOSS/IT..JJJSS.|0.0558
Mr. T-Spin\u2019s STD 7|X|I...ZZ.JS./IT...ZZJSS/ITT.OOJJLS/IT..OOLLL.|0.0558
Mr. T-Spin\u2019s STD 8|X|I...ZZ.LS./IT...ZZLSS/ITT.OOJLLS/IT..OOJJJ.|0.0558
Ms. T-Spin\u2019s STD|T|...OO....I/L..OO..ZJI/L...SSZZJI/LL.SS.ZJJI|0.0653
Speedboat (X+)|T|...LL....I/....LOOS.I/ZZ.JLOOSSI/.ZZJJJ..SI|0.07
Unnamed bag 1 [b1-903974f3]|T|I....JJ.../I.ZOOJ..../IZZOOJL.SS/IZ..LLLSS.|0.02
ST PC|T|S........./SS.....ZZ./LS......ZZ/L....JJJOO/LL.IIIIJOO|0.0329
ST Spin|T|........S./L.....ZZSS/L.J....ZZS/LLJJJ.IIII|0.0246
Unnamed setup|T|....OO..../..SSOOZZ../.SSIIIIZZ.|0.02
Unnamed setup 2|T|.......JJJ/........SJ/OO....ZZSS/OO.....ZZS|0.02
Unnamed setup 3|X|......J.../...TZZJJJL/..TTTZZLLL|0.02
Unnamed setup 4|X|.........I/LS......TI/LSSOOZZTTI/LLSOO.ZZTI|0.02
Unnamed setup 5|X|..T......./.TT......./.ST......./.SS......./OOS....JJJ/OOL....ZZJ/LLL.....ZZ|0.02
Unnamed setup 6|X|..T......./.TT......./.ST......./.SS......./OOS....JJZ/OOL....JZZ/LLL....JZ.|0.02
Unnamed setup 7|X|......L.../......L.../IS....LL../ISS....T../IJS.ZZTTOO/IJJJ.ZZTOO|0.02
Unnamed setup 8|X|........S./........SS/ZZIIII.OOS/JZZ.T..OOL/JJJTTT.LLL|0.02
Unnamed setup 9|X|........S./........SS/OOIIII.ZZS/OOL.T..JZZ/LLLTTT.JJJ|0.02
Unnamed setup 10|X|........S./........SS/JJZTTT.OOS/JZZ.T..OOL/JZIIII.LLL|0.02
Unnamed setup 11|X|........S./........SS/LOOTTT.ZZS/LOO.T..JZZ/LLIIII.JJJ|0.02
Unnamed setup 12|X|.Z......../ZZT......./ZTT......./JJT....SLL/JOO....SSL/JOOIIII.SL|0.02
Unnamed setup 13|X|..Z......./.ZZ......./.ZT......./.TT......./JJT....SLL/JOO....SSL/JOOIIII.SL|0.02
Unnamed setup 14|X|.Z......../ZZT......./ZTT......./JJT....LLL/JOO....LSS/JOOIIIISS.|0.02
Unnamed setup 15|X|.S......../TSS......./TTS......./TLLJJZ..../OOLJZZ..../OOLJZ.IIII|0.02
Unnamed setup 16|X|S........./SS......../TS......../TT......../TLLJJZ..../OOLJZZ..../OOLJZ.IIII|0.02
Unnamed setup 17|X|.Z......../ZZT......./ZTT......./JJT....SLL/JOO....SSL/JOO.IIIISL|0.02
Unnamed setup 18|X|..Z......./.ZZ......./.ZT......./.TT......./JJT....SLL/JOO....SSL/JOO.IIIISL|0.02
Unnamed setup 19|X|.S......../TSS......./TTS......./TZL....OOJ/ZZL....OOJ/Z.LLIIIIJJ|0.02
Unnamed setup 20|X|..T......./.TT......./.ST......./.SS......./JJS....LLL/JZZ....LOO/J.ZZIIIIOO|0.02
Unnamed setup 21|X|.S......../TSS......./TTS......./TLLJJZ..../OOLJZZ..../OOLJZIIII.|0.02
Unnamed setup 22|X|S........./SS......../TS......../TT......../TLLJJZ..../OOLJZZ..../OOLJZIIII.|0.02
Unnamed setup 23|X|.S......../TSS......./TTS......./TZJJLL..../ZZJOOL..../Z.JOOLIIII|0.02
Unnamed setup 24|X|S........./SS......../TS......../TT......../TZJJLL..../ZZJOOL..../Z.JOOLIIII|0.02
Unnamed setup 25|X|.S......../TSS......./TTS......./TLL....JJJ/OOL....ZZJ/OOLIIII.ZZ|0.02
Unnamed setup 26|X|.S......../TSS......./TTS......./TLL....JJZ/OOL....JZZ/OOLIIIIJZ.|0.02
Unnamed setup 27|X|..Z......./.ZZ......./.ZT......./.TT......./JJT....LLL/JOO....LSS/JOOIIIISS.|0.02
Unnamed bag 1 [b1-b78ffe4d]|T|......JJS./......J.SS/......J..S/IIIILZZ.OO/..LLL.ZZOO|0.02
STD PC|T|........S./........SS/.........S/IIIILZZ.OO/..LLL.ZZOO|0.0307
JOS|T|I..SSZ..../I.SSZZ..../IOOJZ....L/IOOJJJ.LLL|0.033
Boomerang DD|T|...Z....JJ/..ZZSS..J./OOZSS...JL/OOIIII.LLL|0.04
Unnamed bag 1 [dd-motor]|T|..Z......./.ZZ..OOSLL/JZ...OOSSL/JJJ.IIIISL|0.025
DS63|T|S.....LL../SS..ZZ.L../JS...ZZLOO/JJJ.IIIIOO|0.0283
2(LT)|T|.....S..../L..ZZSSJJ./L...ZZSJOO/LL.IIIIJOO|0.061
428 Cannon|T|.Z....JJ../ZZSS..J.../ZSS...JLOO/IIII.LLLOO|0.0375
Ajanba\xA0TSD|T|.......JJZ/.......JZZ/.......JZ.|0.0417
Ajanba\xA0TSD 2|T|S........./SS..ZZ.LLL/JS...ZZLOO/JJJ.IIIIOO|0.0417
Amino TSD|T|L..ZZ.S.../L...ZZSSOO/LL.IIIISOO|0.0528
Amino TSD 2|T|...S....../L..SSOOZZ./L...SOOJZZ/LL.IIIIJJJ|0.0528
Partial bag 1 [captain-stacking]|T|...S....../L..SS...../L...SJJJOO/LL.IIIIJOO|0.0476
Black Tea Cannon|T|JJ.....S../JOO....SS./JOOZZ...SL/IIIIZZ.LLL|0.0282
Black Tea Cannon 2|T|.......S../J......SS./JJJZZ...SL/IIIIZZ.LLL|0.0282
Cerulean\u2019s DD PC|T|..L...OO../.ZL...OO.J/ZZLL...SSJ/ZIIII.SSJJ|0.0386
DRUF Cannon|T|........L./.ZOO..LLLJ/ZZOO...SSJ/ZIIII.SSJJ|0.0253
DRUF Cannon 2|T|........S./.OOL..ZZSS/JOOL...ZZS/JJJLL.IIII|0.0253
\u98A8\u5473|T|..SSZ...../.SSZZ..J../LLLZ...JOO/LIIII.JJOO|0.0433
\u98A8\u5473 3|T|..LLL...../.ZLSS..J../ZZSS...JOO/ZIIII.JJOO|0.0433
Unnamed bag 1 [b1-8d3d7866]|T|.....SZZ../..L..SSZZ./OOL...SJJJ/OOLL.IIIIJ|0.02
Partial bag 1 [b1-8d3d78663deca69b]|T|.....JJJ../..L..ZZJS./OOL...ZZSS/OOLL.IIIIS|0.02
Glitter Brooch|T|.....S..OO/L....SS.OO/LZZ...SJJJ/LLZZ.IIIIJ|0.0493
Glitter Brooch 3|T|.....S.OO./L....SSOO./LZZ...SJJJ/LLZZ.IIIIJ|0.0493
Great DDT|T|...Z....../OOZZ..JJJ./OOZ...SSJL/IIII.SSLLL|0.0623
Great DDT 2|T|...Z....../OOZZ..JLS./OOZ...JLSS/IIII.JJLLS|0.0623
\u77F3\u898B\u306E\u5149\u30DB\u30FC\u30EB\u30C9\u4E0D\u53EFver|T|.....OOJ../L....OOJS./LZZ...JJSS/LLZZ.IIIIS|0.02
\u77F3\u898B\u306E\u5149\u30DB\u30FC\u30EB\u30C9\u4E0D\u53EFver 2|T|.....SZZ../J....SSZZ./JJJ...SLOO/IIII.LLLOO|0.02
\u77F3\u898B\u306E\u5149\u30DB\u30FC\u30EB\u30C9\u4E0D\u53EFver 4|T|.....OOS../J....OOSS./JJJZZ...SL/IIIIZZ.LLL|0.02
Partial bag 1 [b1-c1273f0e]|T|..LOO...../.ZLOO....J/ZZLL...SSJ/ZIIII.SSJJ|0.02
Partial bag 1 [b1-c1273f0e] 2|T|..SSZ...../.SSZZ....L/OOJZ...LLL/OOJJJ.IIII|0.02
Partial bag 1 [b1-14ba637f]|T|....Z...../...ZZ....L/OOJZ...LLL/OOJJJ.IIII|0.02
Partial bag 1 [b1-14ba637f] 2|T|....Z...../...ZZ....J/LLLZ...SSJ/LIIII.SSJJ|0.02
Mechanical TSD v3|T|...OOJ..../L..OOJ..S./L...JJZZSS/LL.IIIIZZS|0.07
Mechanical TSD|X|......TLLL/...ZZTTLOO/....ZZTJOO/.....SSJJJ/....SSIIII|0.02
Mechanical TSD 2|X|......TOOI/...ZZTTOOI/....ZZTJLI/.....SSJLI/....SSJJLL|0.02
Mortar TSD|T|S........./SS.......L/JS.....LLL/JJJ...IIII|0.0353
Mortar TSD 2|T|I..OO...../IL.OO....J/ILZZ...SSJ/ILLZZ.SSJJ|0.0353
Pseudo 91 DT|T|...Z....../OOZZ..J.SS/OOZ...JSSL/IIII.JJLLL|0.0348
Reliable TSD|T|.........Z/....S...ZZ/....SS..ZJ/OOLLLS...J/OOLIIII.JJ|0.07
Rich DDP|T|..JJ...S../OOJ....SS./OOJZZ...SL/IIIIZZ.LLL|0.0425
Unnamed bag 1 [b1-1b6d2410]|T|..Z...LL../.ZZ....LOO/JZ...SSLOO/JJJ.SSIIII|0.02
Slider TSD|T|..Z......./.ZZ......L/JZ...SSLLL/JJJ.SSIIII|0.029
Sugar Cannon|T|...OO..Z../L..OO.ZZ../L...SSZJJJ/LL.SSIIIIJ|0.0402
Variable DDT|T|..OO.....I/L.OO....JI/LZZ...SSJI/LLZZ.SSJJI|0.0435
Variable DDT 2|T|..OO.....Z/J.OO....ZZ/JJJ...SSZL/IIII.SSLLL|0.0435
Zorzu|T|..Z......./.ZZ....S../.ZJ....SS./OOJJJ...SL/OOIIII.LLL|0.0241
91DT|T|.Z......../ZZSS..J.LL/ZSS...JOOL/IIII.JJOOL|0.0452
Trustworthy DT|T|....Z...../OO.ZZSS..J/OOLZSS...J/LLLIIII.JJ|0.69
Partial bag 1 [b1-ba9381ebf89455fb]|T|........S./JJ.L..ZZSS/JOOL...ZZS/JOOLL.IIII|0.02
Partial bag 1 [b1-df46823a]|T|.........J/.........J/L..ZZ.S.JJ/L...ZZSSOO/LL.IIIISOO|0.02
Crown TSD|T|...S....../L..SSOO.ZJ/L...SOOZZJ/LL.IIIIZJJ|0.0454
Fast DT|T|........L./........L./.Z.SS..JLL/ZZSS...JOO/ZIIII.JJOO|0.07
TKI-3 3|T|.....JJ.../.....J..../L..ZZJS.../L...ZZSSOO/LL.IIIISOO|5.45
Birdie TSD|T|..J......./..JJJ...../IIII...SSZ/OOLLL.SSZZ/OOL.....Z.|0.0272
Dragon Special|T|...Z....../..ZZ.....I/OOZ...JJJI/OOSS.LLLJI/.SS..L...I|0.055
Insurance Cannon Revised|T|.SS..OOJ../SS...OOJJJ/LLL.ZZIIII/L....ZZ...|0.033
King Cannon|T|..OO....../..OO....L./SZZ...LLLJ/SSZZ.IIIIJ/.S......JJ|0.0277
Par TSD|T|....SS...I/JJJSS...ZI/OOJLLL.ZZI/OO.L...Z.I|0.0311
DMD Cannon 2|T|I....SS.../ILOOSS...Z/ILOOJJJ.ZZ/ILL...J.Z.|0.0332
Flamingo (Long Platform)|T|.Z......../ZZ......S./Z...IIIISS/OO.LLLJJJS/OO.L....J.|0.0356
Absence TSD|T|....ZZ.J../OO...ZZJJJ/OOL.IIIISS/LLL....SS.|0.0328
Akaho TSD|T|.....L..../.....L..../.....LL.../SZZ...IIII/SSZZ.OOJJJ/.S...OO..J|0.0339
Albatross TSD (X+)|T|I...ZZ..../IS...ZZJJJ/ISS.OOLLLJ/I.S.OOL...|0.0505
Albatross TSD 3|X|....OO..../T...OOLJJJ/TTSSLLLZZJ/TSS.IIIIZZ|0.0505
Bogey Special|T|...J....../...JJJ..../S...ZZIIII/SS.OOZZLLL/.S.OO..L..|0.0368
Dried Squid Special|T|L........./L........./LL......../S...ZZIIII/SS.OOZZJJJ/.S.OO....J|0.0341
Eagle DD|T|.SS..OO..L/SS...OOLLL/JJJ.ZZIIII/..J..ZZ...|0.0355
Eagle SP|T|.SS......I/SS...ZZLLI/JJJ.OOZZLI/..J.OO..LI|0.02
\u30A4\u30FC\u30B0\u30EBTSD|T|I.SS....../ISS...ZZLL/IJJJ.OOZZL/I..J.OO..L|0.02
Flamingo (Cornerstone)|T|.Z......../ZZ......L./Z...SSLLLJ/OO.SSIIIIJ/OO......JJ|0.0289
Flamingo (Cradle)|T|.Z......../ZZ.......I/Z...SSJJJI/OO.SSLLLJI/OO...L...I|0.0503
Flamingo (Jagged Prop)|T|.Z......../ZZ....L.../Z...LLLJJJ/OO.IIIISSJ/OO....SS..|0.0339
Flamingo (Space)|T|.Z......../ZZ......S./Z...IIIISS/OO.JJJLLLS/OO...JL...|0.0368
Flamingo DT|T|..Z......./IZZ......./IZ...SSJJJ/IOO.SSLLLJ/IOO...L...|0.0558
Float TSD|T|..L.SS..OO/LLLSS...OO/ZZIIII.JJJ/.ZZ......J|0.0392
Gelato Stacking|T|....Z.SS../OOJZZSS.../OOJZIIII.L/.JJ....LLL|0.0289
DD Lion|T|....Z.SS../JJJZZSS.../OOJZIIII.L/OO.....LLL|0.0274
Horizon Special|T|....ZZ...L/JJ...ZZLLL/JOO.IIIISS/JOO....SS.|0.0369
IKcco Stacking|T|.SS......I/SS...ZOOJI/LLL.ZZOOJI/L...Z..JJI|0.02
Mochi\u2019s Anger|T|..JJ.....I/OOJ...SSZI/OOJL.SSZZI/.LLL...Z.I|0.0623
My Fountain TSD|T|I....SS.../ILLLSS...Z/ILOOJJJ.ZZ/I.OO..J.Z.|0.058
Pah! DD|T|...ZZ....I/S...ZZLLLI/SS.JJJLOOI/.S...J.OOI|0.0532
Pelican (X+)|T|SZZ....OO./SSZZ.J.OO./.S...JJJ..|0.055
Pelican 2 (X+)|T|.....LL..I/SZZ...LOOI/SSZZ.JLOOI/.S...JJJ.I|0.055
Petrel|T|...L....../...L....../...LL...../S...ZZIIII/SS.OOZZJJJ/.S.OO....J|0.0342
Scallop Cannon|T|.....L..../...LLL..../S...ZZIIII/SS.OOZZJJJ/.S.OO....J|0.0386
Sugar DDP|T|...ZZ...L./S...ZZLLLJ/SS.OOIIIIJ/.S.OO...JJ|0.0439
Umbrella TSD|T|.Z..IIII../ZZ...SSJJJ/ZOO.SSLLLJ/.OO...L...|0.0374
Waverider|T|...ZZ.I.../S...ZZILOO/SS.JJJILOO/.S...JILL.|0.0253
Albatross Special (X+)|T|I....SS.../ILLLSS...Z/ILJJJOO.ZZ/I...JOO.Z.|0.0612
Cage TSD|T|.Z.SS...../ZZSS...JJJ/ZIIII.LOOJ/....LLLOO.|0.0274
Coon-Dragon|T|......S.../.J....SS../LJJJ...SOO/LIIII.ZZOO/LL.....ZZ.|0.0321
DMD Cannon|T|...OO...../I..OO...../ILLL...SSZ/ILJJJ.SSZZ/I...J...Z.|0.0236
Dodo|T|....J...../....J...../...JJ...../S...IIIIOO/SS.LLLZZOO/.S.L...ZZ.|0.0276
DSPD Cannon|T|....S...../.Z..SS..../ZZ...SIIII/ZOO.LLLJJJ/.OO.L....J|0.0278
Number One (X+)|T|....LL..../.....L..S./IIII.LZZSS/JJJ..OOZZS/..J..OO...|0.0335
Partial bag 1 [b1-742010c2]|T|..Z......./.ZZ....L../JZ...LLLOO/JJJ.IIIIOO|0.02
Partial bag 1 [b1-10d75641]|T|..L..ZZ.S./OOL...ZZSS/OOLL.IIIIS|0.02
Partial bag 1 [b1-2e0d1f7f]|T|.....S..../..L..SS.../OOL...SJJJ/OOLL.IIIIJ|0.02
Unnamed bag 1 [b1-f18dccf2]|T|..Z..LS.../.ZZ..LSS../JZ...LLSOO/JJJ.IIIIOO|0.02
\u7720\u6C17\u30AD\u30E3\u30CE\u30F3|T|...Z....JJ/OOZZ....J./OOZ...SSJL/IIII.SSLLL|0.02
Unnamed bag 1 [b1-8cb4a7a6]|T|.ZJ..S..../ZZJ..SS.../ZJJ...SLOO/IIII.LLLOO|0.02
Unnamed bag 1 [b1-4bc60125]|T|JJ.....Z../J.SS..ZZ../JSS...ZLOO/IIII.LLLOO|0.02
Unnamed bag 1 [b1-10093e30]|T|...J....../...J....../L.JJ..OOS./LZZ...OOSS/LLZZ.IIIIS|0.02
Unnamed bag 1 [b1-f6ae1dfb]|T|..S......./..SS...Z../..LS..ZZ../OOL...ZJJJ/OOLL.IIIIJ|0.02
\u5973\u5150\u30D0\u30BA\u30FC\u30AB|T|L........./L........./LL......../S...IIIIOO/SS.JJJZZOO/.S...J.ZZ.|0.02
Pigeon|T|...ZZ....I/S...ZZLOOI/SS.JJJLOOI/.S...JLL.I|0.02
Unnamed bag 1 [b1-532e3cea]|T|...ZZ.I.../S...ZZILLL/SS.JJJILOO/.S...JI.OO|0.02
\u30BE\u30A4\u30B5\u30A4\u30C8TSD|T|.J......../.J......../JJ......../S...ZZIIII/SS.OOZZLLL/.S.OO..L..|0.02
\u30A2\u30EB\u30D0\u30C8\u30ED\u30B9SP|T|...ZZ....I/S...ZZJJJI/SS.OOLLLJI/.S.OOL...I|0.02
\u30AC\u30FC\u30CD\u30C3\u30C8TSD|T|...OO...../...OO.L.../S...LLLJJJ/SS.ZZIIIIJ/.S..ZZ....|0.02
\u30A2\u30AF\u30A2\u30DE\u30EA\u30F3TSD|T|OO......../OO....L.../S...LLLJJJ/SS.ZZIIIIJ/.S..ZZ....|0.02
Unnamed bag 1 [b1-18bd6b71]|T|...JJJ..../S...ZJIIII/SS.ZZOOLLL/.S.Z.OOL..|0.02
\u904BTSD|T|...JJJ..../S...ZJIIII/SS.ZZLLLOO/.S.Z.L..OO|0.02
SZDDT Cannon|T|.J......../.J......../JJ......../S...IIIIOO/SS.LLLZZOO/.S.L...ZZ.|0.02
SZDDT Cannon 2|X|.J......../.J......../JJ......../SIIIILLLOO/SSTTTLZZOO/.S.T...ZZ.|0.02
SZDDT Cannon 3|X|I..TTT..../IL..TS.ZZ./IL.OOSSJZZ/ILLOO.SJJJ|0.02
Unnamed bag 1 [b1-8fd1af33]|T|...ZZ.I.../S...ZZIOOJ/SS.LLLIOOJ/.S.L..I.JJ|0.02
Unnamed bag 1 [b1-532f4933]|T|...ZZ.I.../S...ZZIJJJ/SS.LLLIOOJ/.S.L..IOO.|0.02
Unnamed bag 1 [b1-ceb0d65a]|T|.SS......J/SS...IIIIJ/LLL.OOZZJJ/L...OO.ZZ.|0.02
Unnamed bag 1 [b1-76d9956f]|T|.SS..J..OO/SS...JJJOO/LLL.ZZIIII/L....ZZ...|0.02
\u5FEB\u6674\u7832|T|.SS......I/SS...ZJJJI/LLL.ZZOOJI/L...Z.OO.I|0.02
Unnamed bag 1 [b1-73d4c3ab]|T|.SS...I.../SS...ZIOOJ/LLL.ZZIOOJ/L...Z.I.JJ|0.02
Unnamed bag 1 [b1-7b37edab]|T|.SS...I.../SS...ZIJJJ/LLL.ZZIOOJ/L...Z.IOO.|0.02
\u30CD\u30D5\u30E9\u30A4\u30C8TSD|T|....S...../.Z..SS..../ZZ...SIIII/ZOO.JJJLLL/.OO...JL..|0.02
Unnamed bag 1 [b1-8608bb55]|T|I...ZZ..../IS...ZZLOO/ISS.JJJLOO/I.S...JLL.|0.02
Unnamed bag 1 [b1-da6bee08]|T|I...ZZ..../IS...ZZOOJ/ISS.LLLOOJ/I.S.L...JJ|0.02
Unnamed bag 1 [b1-e1cf1808]|T|I...ZZ..../IS...ZZJJJ/ISS.LLLOOJ/I.S.L..OO.|0.02
\u30DB\u30FC\u30AFTSD\u4E9C\u7A2E|T|.SS....LOO/SS...LLLOO/JJJ.ZZIIII/..J..ZZ...|0.02
Unnamed bag 1 [b1-2df0abbf]|T|.SS......I/SS...ZLLLI/JJJ.ZZLOOI/..J.Z..OOI|0.02
Unnamed bag 1 [b1-3ce6ed81]|T|.SS......I/SS...ZLOOI/JJJ.ZZLOOI/..J.Z.LL.I|0.02
Unnamed bag 1 [b1-0d61c944]|T|.SS...I.../SS...ZILOO/JJJ.ZZILOO/..J.Z.ILL.|0.02
Unnamed bag 1 [b1-4a03ef44]|T|.SS...I.../SS...ZILLL/JJJ.ZZILOO/..J.Z.I.OO|0.02
Unnamed bag 1 [b1-ec8632ea]|T|OO..ZZ...L/OO...ZZLLL/JJJ.IIIISS/..J....SS.|0.02
Gogol_WELL\uFF3FTSD|T|.Z.SS...../ZZSS...OOJ/ZIIII.LOOJ/....LLL.JJ|0.02
\u30C0\u30C1\u30E7\u30A6TSD|T|.....S..../.....SS..I/LLL...SOOI/LJJJ.ZZOOI/...J..ZZ.I|0.02
Unnamed bag 1 [b1-4f0b703f]|T|IIII....S./LLL...ZZSS/LJJJ.OOZZS/...J.OO...|0.02
O\u51A0|T|.....OO.../.....OO..I/LLL...SSZI/LJJJ.SSZZI/...J...Z.I|0.02
O\u5C06|T|..OO....../..OO.....I/LLL...SSZI/LJJJ.SSZZI/...J...Z.I|0.02
Unnamed bag 1 [b1-c1f01cf9]|T|I.SS....../ISS...ZOOJ/ILLL.ZZOOJ/IL...Z..JJ|0.02
Unnamed bag 1 [b1-839ab6f9]|T|I.SS....../ISS...ZJJJ/ILLL.ZZOOJ/IL...Z.OO.|0.02
Unnamed bag 1 [b1-4bd22eff]|T|I.SS....../ISS...ZLOO/IJJJ.ZZLOO/I..J.Z.LL.|0.02
Unnamed bag 1 [b1-454904ff]|T|I.SS....../ISS...ZLLL/IJJJ.ZZLOO/I..J.Z..OO|0.02
Unnamed bag 1 [b1-6de33597]|T|...L....../.LLL....../SZZ...IIII/SSZZ.JJJOO/.S.....JOO|0.02
Unnamed bag 1 [b1-37b9df00]|T|...J....../...J....../..JJ....../SZZ...IIII/SSZZ.OOLLL/.S...OOL..|0.02
Unnamed bag 1 [b1-65d4f89c]|T|...L....../.LLL....../SZZ...IIII/SSZZ.OOJJJ/.S...OO..J|0.02
\u30D1\u30FC\u30D5\u30A7\u30AF\u30C8\u30B9\u30AB\u30A4|T|......OO../I.....OO../ILLL...SSZ/ILJJJ.SSZZ/I...J...Z.|0.02
Unnamed bag 1 [b1-becc6ac4]|T|...J....../...J....../..JJ....../SZZ...IIII/SSZZ.LLLOO/.S...L..OO|0.02
O\u7832|T|.....OO.../.....OO.L./SZZ...LLLJ/SSZZ.IIIIJ/.S......JJ|0.02
Unnamed bag 1 [b1-5407362c]|T|....J...../....J...../...JJ...../IIII...SSZ/OOLLL.SSZZ/OOL.....Z.|0.02
Unnamed bag 1 [b1-aaa1960a]|T|...L....../...L....../...LL...../IIII...SSZ/OOJJJ.SSZZ/OO..J...Z.|0.02
\u30E1\u30BF\u30EA\u30C3\u30AFDT|T|......J.../......J.../.....JJ.../SZZ...IIII/SSZZ.OOLLL/.S...OOL..|0.02
Unnamed bag 1 [b1-22a8ca7b]|T|....J...../....JJJ.../OOIIII...Z/OOSSLLL.ZZ/.SS.L...Z.|0.02
Unnamed bag 1 [b1-377425f4]|T|......L.../....LLL.../OOIIII...Z/OOSSJJJ.ZZ/.SS...J.Z.|0.02
\u4EEE\u540D\u7832|T|.......L../.....LLL../SZZ...IIII/SSZZ.OOJJJ/.S...OO..J|0.02
3D Cannon|T|.....LLZZ./....OOLJZZ/....OOLJJJ|0.0557
3D Cannon 2|X|I....T..../I...TTT.../I....ZJOO./ISS.ZZJOOL/SS..ZJJLLL|0.0557
airDT|X|.......TTT/........TI/JJZZ...SSI/JOOZZ.SSLI/JOO...LLLI|0.0486
airDT 2|X|.......JJJ/........SJ/IIII...ZSS/OOLLL.ZZTS/OOL...ZTTT|0.0486
Airin TSD Variant|X|.........I/.........I/JJ.......I/J.....ZOOI/JSST.ZZOOL/SSTTTZ.LLL|0.07
Antifate TSD|X|ITTT....../ILT...SSOO/ILZZ.SSJOO/ILLZZ..JJJ|0.0446
Antifate TSD 2|X|ILLL....../ILZ...SSOO/IZZT.SSJOO/IZTTT..JJJ|0.0446
Antifate TSD 3|X|IIII....../JJZ...SSLL/JZZT.SSOOL/JZTTT..OOL|0.0446
Antifate TSD 4|X|IIII....../TTT...SSLL/JTZZ.SSOOL/JJJZZ..OOL|0.0446
Antifate TSD 5|X|IIII....../LLL...SSOO/LTZZ.SSJOO/TTTZZ..JJJ|0.0446
Antifate TSD 6|X|IIII....../LOO...SSZJ/LOOT.SSZZJ/LLTTT..ZJJ|0.0446
AntiRotationDT|X|....T...../...TTTZZ../....SSJZZ./OO.SSLJJJ./OO.LLLIIII|0.0376
ATSD|X|........S./L......ZSS/L.....ZZTS/LL....ZTTT|0.0342
ATSD 2|X|I........./I........./I........./I.......S./LOOJ...ZSS/LOOJ..ZZTS/LLJJ..ZTTT|0.0342
Back Gassho|T|......ZZLL/IIII...ZZL/OOJJJ.SSTL/OO..JSSTTT|0.0546
Back Gassho 2|T|......IIII/JJZS...LLL/JZZSS.TLOO/JZ..STTTOO|0.0546
Back Gassho 3|X|......IIII/LOOS...JJJ/LOOSS.TZZJ/LL..STTTZZ|0.0546
Back Gassho 4|X|......TTTZ/IIII...TZZ/OOJJJ.SSZL/OO..JSSLLL|0.0546
Bakaimaku|X|........SS/..TTT..SSI/..LT....JI/OOLZZ...JI/OOLLZZ.JJI|0.02
Bakaimaku 2|X|........SS/..LLL..SSI/..LZ....JI/OOZZT...JI/OOZTTT.JJI|0.02
Bakaimaku 3|X|........SS/..IJJ..SSZ/..IJ....ZZ/OOIJT...ZL/OOITTT.LLL|0.02
Bakaimaku 4|X|........SS/..TTT..SSZ/..JT....ZZ/OOJJJ...ZL/OOIIII.LLL|0.02
Bank Cannon|X|....T...../...TT..S../....TZZSSJ/OO.LLLZZSJ/OO.LIIIIJJ|0.02
BC Cannon|X|.T......../ITTJJ...../ITZJ...SS./IZZJL.SSOO/IZLLL...OO|0.0407
bimyou|X|JJ......../JI......../JI......../LIT...S.../LITTZZSSOO/LLT..ZZSOO|0.02
bimyou 2|X|LL......../IL......../IL......../IJT...S.../IJTTZZSSOO/JJT..ZZSOO|0.02
BT Cannon (X+)|X|.........I/.Z...SS..I/ZZT.SSOO.I/ZTTT..OO.I|0.02
BT Cannon 2 (X+)|X|JJJ.....S./OOJ.T...SS/OOLTTT.ZZS/LLLIIII.ZZ|0.02
BT Cannon 3 (X+)|X|JJJ.....S./OOJ.L...SS/OOLLLT.ZZS/IIIITTT.ZZ|0.02
BT Cannon 4 (X+)|X|.Z.....JJJ/ZZ...T.OOJ/ZSS.TTTOOL/SS.IIIILLL|0.02
BT Cannon 5 (X+)|X|.Z.....OOI/ZZ...J.OOI/ZSS.TJJJLI/SS.TTTLLLI|0.02
Castella Stacking|X|L........./L........./LL.S....../JJZSS...OO/JZZTS...OO/JZTTT.IIII|0.0626
Center DT Cannon|X|.......T../......TTTI/..LS...ZJI/OOLSS.ZZJI/OOLLS.ZJJI|0.0685
Center DT Cannon 2|X|.......T../......TTTI/..ZZ...SSI/OOJZZ.SSLI/OOJJJ.LLLI|0.0685
Classic TSD|X|.......T../......TTTI/JJZZ...SSI/JOOZZ.SSLI/JOO...LLLI|0.02
Coffee Stacking|X|S........./SS......Z./LS..JOOZZT/L...JOOZTT/LL.JJIIIIT|0.0328
Crescent DT|X|.IT......./.ITT....../LIT...Z..J/LIOO.ZZSSJ/LLOO.ZSSJJ|0.042
Okey-Cannon|X|.........I/.........I/.......SSI/......SSTI/..ZZ....TT/OOJZZ...TL/OOJJJ..LLL|0.0237
Okey-Cannon 2|X|I........./I......SS./I.....SST./I.ZZ....TT/OOJZZ...TL/OOJJJ..LLL|0.0237
CT Scan Stacking|X|....SS..Z./...SSLLZZ./.....JLZT./.....JLTTT/....JJIIII|0.07
CT Scan Stacking 2|X|....SS..I./...SSTTTI./.....JTZI./.....JZZIL/....JJZLLL|0.07
CT Scan Stacking 3|X|....SS..I./...SSJJJI./.....ZZJI./OO...TZZIL/OO..TTTLLL|0.07
Cycle DT|T|I........./I........./IJLS.....Z/IJLSSOO.ZZ/JJLLSOO.Z.|0.0243
DDT Cannon|T|.....SSZZ./....SSLJZZ/....LLLJJJ|0.02
DDT Cannon 2|T|.....LLLS./....JLZZSS/....JJJZZS|0.02
DDT Cannon 3|T|.....ZJJJ./....ZZSSJL/....ZSSLLL|0.02
DDT Cannon 4|X|.....T..../I...TTT.../I....ZJLS./IOO.ZZJLSS/IOO.ZJJLLS|0.02
DT Cannon (X+)|T|....ZJ.LS./...ZZJ.LSS/...ZJJ.LLS|0.5
DT Cannon 2 (X+)|T|....SS.ZZ./...SSL.JZZ/...LLL.JJJ|0.5
DT Cannon 3 (X+)|X|....T...../...TTTI.../....SSIZZ./OO.SSLIJZZ/OO.LLLIJJJ|0.5
DT Cannon (TZ Base)|X|....J...../....J...../...JJ....I/....Z.SLLI/OO.ZZTSSLI/OO.ZTTTSLI|0.0297
DT Cannon (TZ Base) 2|X|....J...../....J...../...JJ....I/....Z.TTTI/OO.ZZSSTLI/OO.ZSSLLLI|0.0297
Unnamed bag 1 [b1-0260648a]|X|...JJJ...I/....ZJSLLI/OO.ZZTSSLI/OO.ZTTTSLI|0.02
DT Cannon 2 (X+)|X|....ZZ..../.....ZZ.../TTT.LLL.OO/JT..LSS.OO/JJJ.SSIIII|0.037
DT Cannon Well n(((|X|.......SS./......SSZ./...IIIIZZ./.....JLZT./OO...JLTT./OO..JJLLT.|0.0451
DT Cannon Well n((( 2|X|.......ZI./......ZZI./...JJJZTI./.....JTTI./OO...SSTL./OO..SSLLL.|0.0451
Ehehe Stacking|X|.......LL./........L./........LT/........TT/.Z..J....T/ZZSSJJJ.OO/ZSSIIII.OO|0.0479
ET Cannon|X|T........./TT......../T......S.I/JJLL...SSI/JOOL..ZZSI/JOOL...ZZI|0.02
ET Cannon 2|X|T........./TT......../T......S.I/LOOJ...SSI/LOOJ..ZZSI/LLJJ...ZZI|0.02
Exoq|X|.SS......./SST......./ITTT....../IJJLL...../IJOOL..ZZ./IJOOL...ZZ|0.02
Exoq 2|X|.SS......./SST......./ITTT....../ILOOJ...../ILOOJ..ZZ./ILLJJ...ZZ|0.02
Exoq 3|X|.OO......./IOO......./ILLL....../ILJJJ...../ISSTJ..ZZ./SSTTT...ZZ|0.02
Exoq 4|X|.OO......./IOO......./ILLS....../IJLSS...../IJLTS..ZZ./JJTTT...ZZ|0.02
Exoq 5|X|.SS......./SST......./JTTT....../JJJOO...../LLLOO..ZZ./LIIII...ZZ|0.02
Exoq 6|X|.JJ......./LJI......./LJIS....../LLISS...../OOITS..ZZ./OOTTT...ZZ|0.02
Exoq 7|X|.OO......./IOO......./ISLL....../ISSLJ...../ITSLJ..ZZ./TTTJJ...ZZ|0.02
Exoq 8|X|.LL......./OOL......./OOLS....../JJTSS...../JTTTS..ZZ./JIIII...ZZ|0.02
Exoq 9|X|.SS......./SSL......./LLLT....../OOTTT...../OOJJJ..ZZ./IIIIJ...ZZ|0.02
Exoq 10|X|.OO......./IOO......./ITTT....../IJTSS...../IJSSL..ZZ./JJLLL...ZZ|0.02
FDDP|X|.T......../TTT......./I.....Z.../I....ZZ.OO/I..SSZLJOO/I.SSLLLJJJ|0.0383
Full Bloom L(ST)\xB2 PC|X|.....TTTZI/......TZZI/OO...SSZLI/OO..SSLLLI|0.0416
Genkotsu PC|X|.....ZZTTT/......ZZTJ/.......SSJ/......SSJJ|0.0505
Genkotsu PC 2|X|I....ZZJJJ/IOO...ZZSJ/IOOL...TSS/ILLL..TTTS|0.0505
Gill DT|X|S........./SS....ZJ../LS...ZZJOO/L...TZJJOO/LL.TTTIIII|0.0265
Gill DT 2|X|S........./SS....OO../LS...TOOZJ/L...TTTZZJ/LL.IIIIZJJ|0.0265
Ginzan Stacking|X|...LL....I/....L...TI/OO.JLZZTTI/OO.JJJZZTI|0.02
Ginzan Stacking Revised|X|......Z.../...LLZZS../....LZTSS./OO.JLTTTS./OO.JJJIIII|0.0393
Ginzan Stacking Revised\xB2|X|OO......../OO......../L....JJJ../LZZ....JS./LLZZ...TSS/IIII..TTTS|0.0378
Ginzan Stacking Revised\xB3|X|......T.../...JJJTTZI/.....JTZZI/OO...SSZLI/OO..SSLLLI|0.042
Ginzan\u2019s Cut Copy Opener|X|........Z./.......ZZI/OO.T...ZJI/OOLTT.SSJI/LLLT.SSJJI|0.0279
Ginzan\u2019s Imperial Cross Opener|T|L..ZZ...../L...ZZ.J../LL.IIIIJJJ|0.0507
Ginzan\u2019s Imperial Cross Opener 2|T|L..ZZ...../L...ZZ..OO/LL.IIII.OO|0.0507
Ginzan\u2019s Imperial Cross Opener 3|T|.........I/.....LLLJI/.....LSSJI/.....SSJJI|0.0507
Ginzan\u2019s Imperial Cross Opener 4|T|......JJJI/......LSJI/......LSSI/......LLSI|0.0507
Ginzan\u2019s Imperial Cross Opener 5|X|S........./SS......../LS.ZZTTTOO/L...ZZTJOO/LL.IIIIJJJ|0.0507
Ginzan\u2019s Imperial Cross Opener 6|X|S........./SS......../LS.IIIIOOJ/L...TZZOOJ/LL.TTTZZJJ|0.0507
Partial bag 1 [tetrismaps-202]|T|......IJJJ/......IOOJ/......IOOL/......ILLL|0.02
Greenwich Cannon|X|.........L/.......LLL/TIIII...OO/TTSSZZ.JOO/TSS..ZZJJJ|0.0413
GT Cannon|X|.........I/.........I/LOO....Z.I/LOOSS.ZZTI/LLSS..ZTTT|0.0473
Hart v2|X|.....ZZTTT/......ZZTI/.....JJSSI/.....JSSLI/.....JLLLI|0.02
Hart v2 2|X|.....IIIIL/......ZLLL/.....ZZJJJ/.....ZSSTJ/.....SSTTT|0.02
Hart v2 3|X|.....ZZTTT/......ZZTI/.....LLLJI/.....LSSJI/.....SSJJI|0.02
Hart v2 4|X|.....TTTSS/......TSSI/.....LJJJI/OO...LZZJI/OO...LLZZI|0.02
Hart v2 5|X|.....ZZTTT/......ZZTI/.....JJSSI/OO...JSSLI/OO...JLLLI|0.02
Hart v2 6|X|.....TTTSS/......TSSI/.....ZZLLI/OO...JZZLI/OO...JJJLI|0.02
Hart v2 7|X|.....ZZTTT/......ZZTI/.....LLLJI/OO...LSSJI/OO...SSJJI|0.02
Hart v2 8|X|.....IIIIL/......ZLLL/.....ZZJJJ/OO...ZSSTJ/OO...SSTTT|0.02
Hijiki DT|X|..S......./JJSS....../JOOS...TTT/JOOZZ...TL/IIIIZZ.LLL|0.0393
Hijiki DT 2|X|..S......./OOSS....../OOLS...JJJ/LLLZZ...TJ/IIIIZZ.TTT|0.0393
Hijiki PC|X|LLLS....../LZZSS..JJJ/OOZZS...TJ/OOIIII.TTT|0.0257
HOLE DTD|X|I......SS./I.....SSZ./I....JLZZ./IT...JLZOO/TTT.JJLLOO|0.0423
Unnamed bag 1 [b1-4e2960a6]|X|I......SS./I.....SSZ./IJJJ..LZZ./IT.J..LZOO/TTT...LLOO|0.02
Illuminate DT|X|....SST.Z./...SSTTZZ./.....JTZL./.....JLLL./....JJIIII|0.0383
Illuminate DT 2|X|....SST.Z./...SSTTZZ./.....JTZL./.....JJJL./....IIIILL|0.0383
Illuminate DT 3|X|....SST.J./...SSLTTJ./.....LTJJ./OO...LLZZ./OO..IIIIZZ|0.0383
Jizou TSD|X|I........./I......S../I......SS./IZ.....JS./ZZ.LTTTJOO/ZLLL.TJJOO|0.0573
Magic Key|X|I.Z....JJJ/IZZ....OOJ/IZSST..OOL/ISSTTT.LLL|0.02
Magic Key 2|X|I.Z....LLL/IZZ....LOO/IZSST..JOO/ISSTTT.JJJ|0.02
Meaty Cannon|X|....J...../....J...../...JJT..../....TTTZZ./...OOLLLZZ/...OOLIIII|0.02
Meaty Cannon 2|X|....J...../....J...../...JJL..../S...ZLTTT./SS.ZZLLTOO/.S.ZIIIIOO|0.02
More\u2019s QT|X|....T...../...TT....I/S...TLJJJI/SS.OOLZZJI/.S.OOLLZZI|0.047
More\u2019s QT 2|X|....T...../...TT....I/S...TZZLLI/SS.OOJZZLI/.S.OOJJJLI|0.047
Muko DT|X|....T....I/...TTTZS.I/.....ZZSSI/OO...ZLJSI/OO..LLLJJJ|0.038
Mura TSD|X|T........I/TT.......I/T...SSZJLI/OO.SSZZJLI/OO...ZJJLL|0.02
Navel Dot PC|X|STTT....../SST......./JSZZ....../JJJZZ.....|0.0391
Navel Dot PC 2|X|JJSS....OO/JSS.....OO/JTZZ.IIIIL/TTTZZ..LLL|0.0391
NEWDT Cannon|X|....T...../...TTTL.../....OOLZZ./...JOOLLZZ/...JJJIIII|0.0294
NEWDT Cannon 2|X|....T...../...TTTI.../S...ZJIOO./SS.ZZJIOOL/.S.ZJJILLL|0.0294
notIFF|X|ILLL....../IL......Z./IJ.....ZZ./IJ..SSTZOO/JJ.SSTTTOO|0.0222
Parallel DT|T|........I./........I./.....SSZI./OO.JSSZZIL/OO.JJJZLLL|0.027
Pyramid DT|X|........L./...JJJLLLT/.....JZZTT/.....SSZZT/....SSIIII|0.042
Pyramid DT 2|X|...JJJ...T/.....JSSTT/OO...SSZZT/OO..IIIIZZ|0.042
Pyramid DT 3|X|........L./...JJJLLLT/.....JSSTT/OO...SSZZT/OO..IIIIZZ|0.042
QT Cannon|X|....T...../...TTI..../S...TIZZLL/SS.OOIJZZL/.S.OOIJJJL|0.0297
QT Cannon 2|X|....T...../...TTI..../S...TILJJJ/SS.OOILZZJ/.S.OOILLZZ|0.0297
Reason Spin|X|........T./.....SS.TT/OO..SS..TJ/OOLZZIIIIJ/LLL.ZZ..JJ|0.0358
Reuse TSD PC|X|IS......../ISS..TTT../IJS...TLOO/IJJJ.LLLOO|0.0446
Reuse TSD PC 2|X|LS......../LSS..JJJ../LLS...TJOO/IIII.TTTOO|0.0446
Risou Stacking|X|T........./TT......../TZ...S.J../ZZ...SSJJJ/Z.....SLOO/IIII.LLLOO|0.0291
Risu DT|X|.........I/....LLL.TI/OO.JLZZTTI/OO.JJJZZTI|0.02
Rizel Special|X|T........./TT.......I/T...ZLLLJI/OO.ZZLSSJI/OO.Z.SSJJI|0.0297
SE Cannon|X|I........./I........./I........./IT......../TTS...ZZ../JTSS...ZZL/JJJS...LLL|0.0228
Unnamed bag 1 [b1-257873b2]|X|I........./I........./I........./IS......../TSS...ZJ../TTSL.ZZJOO/TLLL.ZJJOO|0.02
SE Cannon 2|X|.T......LL/TTS...ZOOL/JTSS.ZZOOL/JJJS.ZIIII|0.0274
SE Cannon 2 2|X|.S......OO/TSS...ZJOO/TTSL.ZZJJJ/TLLL.ZIIII|0.0274
Sharp Jasda Logistics DT|X|....TZZ.../...TTTZZ.I/.....JLS.I/OO...JLSSI/OO..JJLLSI|0.0449
SkDPC|X|I........./I........./I......JJJ/ILL.....SJ/OOLTTTZZSS/OOL.T..ZZS|0.0433
Partial bag 1 [speerde-stacking]|T|.......JJJ/..ZZ...OOJ/.SSZZ..OOL/SSIIII.LLL|0.051
Partial bag 1 [speerde-stacking] 2|T|.......LLL/..SS...LOO/.SSZZ..JOO/IIIIZZ.JJJ|0.051
Starlight DT|X|........Z./..LS...ZZT/LLLSS.JZTT/IIIIS.JJJT|0.0241
STSD.io|X|...OO...SS/...OOL.SST/...LLLZZTT/...IIIIZZT|0.027
STSD.io 2|X|...ZZ...LL/JJ.TZZ.OOL/J..TTSSOOL/J..TSSIIII|0.027
Super Speed BT Cannon|X|IJJJ....S./IOOJ....SS/IOOL.T.ZZS/ILLLTTT.ZZ|0.02
Super Speed BT Cannon 2|X|ILLL....S./ILOO....SS/IJOO.T.ZZS/IJJJTTT.ZZ|0.02
Super Speed DT Cannon|X|...L....../...L....../...LL....I/....Z.JJJI/OO.ZZSSTJI/OO.ZSSTTTI|0.02
Super Speed DT Cannon 2|X|...L....../...L....../...LL....J/....Z.TTTJ/OO.ZZSSTJJ/OO.ZSSIIII|0.02
SZDT 2|X|....T...../...TTT...I/....ZJLS.I/OO.ZZJLSSI/OO.ZJJLLSI|0.02
SZDT 2 2|X|....T...../...TTT...I/....LLLS.I/OO.JLZZSSI/OO.JJJZZSI|0.02
SZDT 2 3|X|....T...../...TTT...I/....ZJJJ.I/OO.ZZSSJLI/OO.ZSSLLLI|0.02
SZDT 2 4|X|....T...../...TTT...I/....SSZZ.I/OO.SSLJZZI/OO.LLLJJJI|0.02
SZDT Cannon Opener|T|.........I/......L..I/......L..I/......LLSI/OO....ZZSS/OO.....ZZS|0.0407
SZDT Cannon Opener 2|X|.........I/......L..I/...JJJL..I/.....JLLSI/OO...TZZSS/OO..TTTZZS|0.0407
T Base LST Stacking|X|.........I/.........I/L...J....I/L...J...TI/LL.JJ..TTT|0.027
T Base LST Stacking 2|X|.........I/......SSZI/L...JSSZZI/L...JOOZTI/LL.JJOOTTT|0.027
Terlance\u2019s STSD Opener|X|......L.../...JLLLS.I/...JJJZSSI/...OOZZTSI/...OOZTTTI|0.02
Terlance\u2019s STSD Opener 2|X|......Z.../...OOZZS.I/...OOZLSSI/...JLLLTSI/...JJJTTTI|0.02
Terlance\u2019s STSD Opener 3|X|......S.../...IOOSS.Z/...IOOTSZZ/...IJTTTZL/...IJJJLLL|0.02
Terlance\u2019s STSD Opener 4|X|......T.../...ISTTT.Z/...ISSOOZZ/...IJSOOZL/...IJJJLLL|0.02
Terlance\u2019s STSD Opener 5|X|......S.../...JJJSS.Z/...OOJTSZZ/...OOTTTZL/...IIIILLL|0.02
Terlance\u2019s STSD Opener 6|X|......T.../...ZZTTT.L/...JZZSLLL/...JJJSSOO/...IIIISOO|0.02
Toro DTD|T|JJSS.....I/JSS...OO.I/J.ZZ..OOLI/...ZZ.LLLI|0.07
Toro DTD 2|X|STTT.....I/SST...OO.I/JSZZ..OOLI/JJJZZ.LLLI|0.07
Trinity Opener|X|.....LOOS./TTT..LOOSS/JT...LLZZS/JJJ.IIIIZZ|0.0417
Trinity Opener 2|X|.....JJJS./LLL..OOJSS/LT...OOZZS/TTT.IIIIZZ|0.0417
Trinity Opener 3|X|.....LSZZ./TTT..LSSZZ/JT...LLSOO/JJJ.IIIIOO|0.0417
Trinity Opener 4|X|.....OOZZ./LLL..OOJZZ/LT...SSJJJ/TTT.SSIIII|0.0417
Triple TSD Opener|X|.T......../TTT......I/JJ....SLLI/JOO.ZZSSLI/JOO..ZZSLI|0.02
TSF(D)T|X|.IIII...../JJJ......./OOJ.....S./OOL..TZZSS/LLL.TTTZZS|0.0289
TSF(D)T 2|X|.ZLLL...../ZZL......./ZOO.....T./JOO..SSTTT/JJJ.SSIIII|0.0289
\u4E8C\u65B9\u6CD5\u7832v1|X|.S......../.SS....Z../.TS...ZZLL/.TT...ZOOL/JT.....OOL/JJJ...IIII|0.0372
Two Ways Cannon v2|X|T........./TTZ......./TZZSS....L/JZSS...LLL/JJJ...IIII|0.0416
Two Ways Cannon v2 2|X|T........./TTJ......./TZJJJ....L/ZZSS...LLL/ZSS...IIII|0.0416
Two Ways Cannon v3|X|.Z......../ZZ...S...L/ZTTT.SSLLL/OOT...SJJJ/OO...IIIIJ|0.0358
Unbalance DT|X|T........./TT...S..../T....SSJJJ/OO.LLLSZZJ/OO.LIIIIZZ|0.02
Vase PC 2|T|S........Z/SS......ZZ/JS......ZL/JJJ....LLL|0.0272
Vase PC 2 2|X|SIIII....Z/SSOO....ZZ/JSOOT...ZL/JJJTTT.LLL|0.0272
Vriwgurs|X|......ZZLL/I......ZZL/IJJ.....SL/IJOO...TSS/IJOO..TTTS|0.02
Vriwgurs 2|X|......TTTZ/I......TZZ/IOO.....ZJ/IOOL...SSJ/ILLL..SSJJ|0.02
Wossoleoi|X|........T./I......TTT/I.SS.....J/ISSLOO...J/ILLLOO..JJ|0.0287
Zakomi|X|LLL......./LZJ...S.../ZZJ..TSSOO/ZJJ.TTTSOO|0.02
ZH Mecha P|X|T.....JJJI/TT....OOJI/TSS...OOLI/SS....LLLI|0.0342
:-0 Stacking|X|.........I/.........I/.........I/...Z..T..I/OOZZSSTT.L/OOZSS.TLLL|0.02
1-5th End Cannon|X|...J....../...J....../..JJ....../..SS....../.SSL....T./.OOL.ZZTT./.OOLL.ZZT.|0.0274
1-11th Compromise Cannon|X|.S......../.SS......./JJS......./JOO....TL./JOO.ZZTTL./IIII.ZZTLL|0.041
Aichi TST|X|.........J/.........J/........JJ/.........T/........TT/.......ZZT/....IIIIZZ|0.0295
Aichi TST 2|X|.........J/.........J/.S......JJ/.SS......T/OOS.....TT/OOL....ZZT/LLL.IIIIZZ|0.0295
Aitch Stacking|X|JJ......../J........./J........./L..T.ZOOS./L.TTZZOOSS/LL.TZIIIIS|0.02
TKI\u7A4D\u307F(TZJ Core) (Aitch Stacking)|X|L..T.ZOOS./L.TTZZOOSS/LL.TZIIIIS|0.0238
Aitch Stacking [b1-afadcd2b]|X|..JJJ...../L..TJZOOS./L.TTZZOOSS/LL.TZIIIIS|0.02
Always C-Spin|X|JJ......../J....SS.../J...SSI.../L....TI.../L.ZZTTI.OO/LL.ZZTI.OO|0.032
Unnamed bag 1 [b1-f5cba75c]|X|.SS......./SS......../JJ......../J........./J.....I.../L....TI.../L.ZZTTI.OO/LL.ZZTI.OO|0.02
Anytime PC|X|......IIII/L....SSJJJ/L.OOSSTZZJ/LLOO.TTTZZ|0.07
Atlas Stacking|X|...SS....I/JJSSZ..T.I/JOOZZ.LTTI/JOOZLLLT.I|0.02
Badger TST|X|......TZZ./......TTZZ/.OO...TSLL/JOO....SSL/JJJ.IIIISL|0.0338
Badger TST 2|X|......TZZ./......TTZZ/.SS...TOOJ/SSL....OOJ/LLL.IIIIJJ|0.0338
Badger TST 3|X|......OOT./......OOTT/.SS...ZZTJ/SSL....ZZJ/LLL.IIIIJJ|0.0338
Badger TST 4|X|......JJJ./......OOJT/.SS...OOTT/SSL....ZZT/LLL.IIIIZZ|0.0338
Badger TST 5|X|......LLL./......LSST/.OO...SSTT/JOO....ZZT/JJJ.IIIIZZ|0.0338
\u7B39\u5BFA\u7A4D\u307F|X|I........./IL....TZZ./IL.OOTTJZZ/ILLOO.TJJJ|0.0457
Bamboo Tube Cannon|X|.........I/...SS....I/JJSSZ...LI/JOOZZ.T.LI/JOOZ.TTTLL|0.02
Bamboo Tube Cannon 2|X|.........I/...OO....I/JJZOO...LI/JZZSS.T.LI/JZSS.TTTLL|0.02
BILLET System|T|LLLOO...../LSSOO...../SSJJJ...../IIIIJ.....|0.02
BILLET System 2|T|SIIII...../SSLLL...../JSLOO...../JJJOO.....|0.02
BILLET System 3|T|OOJJJ...../OOLSJ...../LLLSS...../IIIIS.....|0.02
BILLET System 4|X|JIIII...../JJJSS....T/OOSSL.ZZTT/OOLLL..ZZT|0.02
Bogus TST|X|..ZJOO..../.ZZJOO..../.ZJJSS.T../...SSLTTT./...LLLIIII|0.0625
Bogus TST 2|X|..SSJJ..../.SSLJI..../.LLLJI.Z../...OOIZZT./...OOIZTTT|0.0625
Bogus TST 3|X|..ZJJJ..../.ZZSSJ..../.ZSSLL.T../...OOLTTT./...OOLIIII|0.0625
Bogus TST 4|X|..SSOO..../.SSLOO..../.LLLZJ.T../...ZZJTTT./...ZJJIIII|0.0625
Bogus TST 5|X|..ZJOO..../.ZZJOO..../.ZJJSS.L../...SSLLLT./...IIIITTT|0.0625
Bt\u2026TD Attack|X|.ZS......./ZZSS....../ZLLST....J/OOLTTT...J/OOLIIII.JJ|0.0572
Bt\u2026TD Attack 2|X|.LS......./ILSS....../ILLSZ....J/IOOZZT...J/IOOZTTT.JJ|0.0572
Bt\u2026TD Attack 3|X|.OO......./LOOS....../LZZSS....J/LLZZST...J/IIIITTT.JJ|0.0572
Bt\u2026TD Attack 4|X|.ZZ......./LSZZ....../LSSOO....J/LLSOOT...J/IIIITTT.JJ|0.0572
Buddha Stacking|X|..Z......./IZZ......./IZLLT....J/IOOLTTSS.J/IOOLTSS.JJ|0.0514
Bulldozer|X|.JJJ.ZZ..I/.OOJ..ZZTI/.OOL.SSTTI/.LLLSS..TI|0.07
Bulldozer 2|X|.LLL.ZZ..I/.LOO..ZZTI/.JOO.SSTTI/.JJJSS..TI|0.07
Busan TD|T|.........Z/J..OO...ZZ/JJJOOSS.ZL/IIIISS.LLL|0.0334
Busan TD 2|X|....TTT..Z/J..OOT..ZZ/JJJOOSS.ZL/IIIISS.LLL|0.0334
Butter Stacking|X|S......LLL/SS....TLOO/JS.ZZTTTOO/JJJ.ZZIIII|0.0402
Butter Stacking 2|X|S......OOI/SS....TOOI/JS.ZZTTTLI/JJJ.ZZLLLI|0.0402
Partial bag 1 [candy-stacking]|X|.........Z/JJ.T....ZZ/JOOTTSS.ZL/JOOTSS.LLL|0.0405
Partial bag 1 [candy-stacking] 2|X|.........I/OO.T....JI/OOLTTSS.JI/LLLTSS.JJI|0.0405
Partial bag 1 [candy-stacking] 3|X|.........Z/OO.T....ZZ/OOTTTSS.ZL/IIIISS.LLL|0.0405
Cat TST|X|.........T/I.......TT/I......ZZT/I......JZZ/I.L..SSJOO/LLL.SSJJOO|0.044
Unnamed bag 1 [b1-579b7b7e]|X|.........T/.I......TT/.I.....ZZT/.I.....JZZ/.IL..SSJOO/LLL.SSJJOO|0.02
Center C-Spin|X|ZZ.....JJ./LZZ....JOO/LTTTSS.JOO/LLTSS.IIII|0.0312
Center C-Spin 2|X|LS.....ZZ./LSS....JZZ/LLSTTT.JOO/IIIIT.JJOO|0.0312
Center C-Spin 3|X|JJ.....OO./JZZ....OOL/JTZZSS.LLL/TTTSS.IIII|0.0312
Cereal Stacking|X|..J......./..JJJ...../LLLOO....T/LSSOO.ZZTT/SSIIII.ZZT|0.0575
Cereal Stacking 2|X|..S......./..SSJ...../LOOSJ....T/LOOJJ.ZZTT/LLIIII.ZZT|0.0575
\u30C1\u30FC\u30BA\u7A4D\u307F|T|.....JJ.../.....JLLL./.....JLZZ./....IIIIZZ|0.0643
\u30C1\u30FC\u30BA\u7A4D\u307F 2|X|OO......../OO...ZZ.../T....JZZL./TTSS.JJJL./TSS.IIIILL|0.0643
\u30C1\u30FC\u30BA\u7A4D\u307F 3|X|OO......../OO...LJ.../T....LJJJ./TTSS.LLZZ./TSS.IIIIZZ|0.0643
\u30C1\u30FC\u30BA\u7A4D\u307F 4|X|OO......../OO...ZZ.../T....JZZL./TTSS.JLLL./TSS.JJIIII|0.0643
\u30C1\u30FC\u30BA\u7A4D\u307F(S\u30DB\u30FC\u30EB\u30C9)|X|........OO/........OO/.J..L....T/.JJJL.ZZTT/IIIILL.ZZT|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F(S\u30DB\u30FC\u30EB\u30C9) 2|X|........OO/........OO/.J..L....T/.JLLL.ZZTT/JJIIII.ZZT|0.02
Cheese Stacking 2|X|........L./........L./..OOJ...LL/..OOJ....T/.SSJJ.ZZTT/SSIIII.ZZT|0.0406
\u30C1\u30FC\u30BA\u30B1\u30FC\u30AD\u7A4D\u307F|X|........L./........L./........LL/...OO....T/.SSOO.ZZTT/SSIIII.ZZT|0.0328
Cherry Cross\u2019em|X|OO....ZZ../OOL....ZZJ/LLL.TTTSSJ/IIII.TSSJJ|0.0419
Chikeekeke|X|........I./S..Z....I./SSZZ.T..I./JSZOOTT.IL/JJJOOT.LLL|0.07
ColdMoon Cannon|X|....JJ..../....J...../..ZSJ...../LZZSS....T/LZOOS...TT/LLOOIIII.T|0.0347
\u4E09\u65E5\u6708\u7A4D\u307F|X|......OO../....TLOOS./J..TTLZZSS/JJJ.TLLZZS|0.0454
Curling Stacking|X|....T...../....TT..../....TJ..../L....JOOS./L.ZZJJOOSS/LL.ZZIIIIS|0.0292
\u7802\u6F20\u7A4D\u307F|X|.I......../.I......../.I....T.SS/JIZZ.TTSSL/JJJZZ.TLLL|0.0477
\u7802\u6F20\u7A4D\u307F 2|X|........OO/........OO/S........I/SS......TI/JS...ZZTTI/JJJ...ZZTI|0.0477
Desert stacking|X|.I......../.IOO....../.IOO..T.SS/JIZZ.TTSSL/JJJZZ.TLLL|0.02
Desert stacking 2|X|.S......../.SSJ....../.ZSJ..T.LL/ZZJJ.TTOOL/ZIIII.TOOL|0.02
Desert stacking 3|X|.J......../.JJJ....../.ZOO..T.SS/ZZOO.TTSSL/ZIIII.TLLL|0.02
Diorama TD|X|........SS/.......SSI/L....T.OOI/L.ZZTTJOOI/LL.ZZTJJJI|0.059
Diorama TD v3|X|I........./I........./I........./I..S....../OO.SS....T/OOLJS.ZZTT/LLLJJJ.ZZT|0.031
\u30B8\u30AA\u30E9\u30DETD v3|X|...S....../OO.SS....T/OOLJS.ZZTT/LLLJJJ.ZZT|0.02
Unnamed bag 1 [b1-71c90758]|X|..I......./..I......./..IS....../OOISS....T/OOLJS.ZZTT/LLLJJJ.ZZT|0.02
Diorama TD v4|X|I........./I.Z......./IZZ.....SS/IZL....SSJ/OOL...TTTJ/OOLL...TJJ|0.038
Partial bag 1 [diorama-td-v5]|X|.SS......./SSL......J/LLL.OOTTTJ/IIIIOO.TJJ|0.0276
Donut Stacking|X|.SS.....I./SSL....TI./OOL.ZZTTI./OOLL.ZZTI.|0.04
Dot Cannon|X|........Z./I......ZZ./IT....JZLL/ITTSS.JOOL/ITSS.JJOOL|0.02
Dot Cannon 2|X|ZZ......../IZZ......./IT....J.LL/ITTSS.JOOL/ITSS.JJOOL|0.02
Partial bag 1 [dot-cannon-2]|X|S........./SS......../IS......../IL....T.OO/IL...TTJOO/ILL...TJJJ|0.0297
Partial bag 1 [dot-cannon-2] 2|X|S........./SS......../IS......../IL....T.ZJ/IL...TTZZJ/ILL...TZJJ|0.0297
Partial bag 1 [gamushiro-tpc]|X|.I......../.I......../.I......../SI......../SS....T.../JS.ZZTT.../JJJ.ZZT...|0.02
Partial bag 1 [b1-dfc29a55]|X|S......I../SS....TI../JS.ZZTTI../JJJ.ZZTI..|0.02
Partial bag 1 [b1-7f150974]|X|S........I/SS....TL.I/JS.ZZTTL.I/JJJ.ZZTLLI|0.02
Partial bag 1 [sioyaki-v2-tpc]|X|........I./........I./........I./........IZ/.....T..ZZ/J..OOTT.ZL/JJJOOT.LLL|0.02
Partial bag 1 [b1-3b5d8f0c]|X|S........./SS......../IS......../IL....T..J/IL...TT..J/ILL...T.JJ|0.02
Dot Cannon 3|X|S........./SS......../IS.....JJJ/IL....TTTJ/IL...ZZTOO/ILL...ZZOO|0.0469
Double Sided Cannon|X|I........./I........./I.....OO.Z/I.....OOZZ/J.TTT.SSZL/JJJT.SSLLL|0.0529
Ehime TST|X|........L./........L./........LL/.........T/........TT/.......ZZT/....IIIIZZ|0.0362
Ehime TST 2|X|........L./........L./.S......LL/.SS......T/JJS.....TT/JOO....ZZT/JOO.IIIIZZ|0.0362
Eliminated TST|X|......T.../SLL...TTZ./SSL...TZZ./JSL....ZOO/JJJ.IIIIOO|0.0285
Eliminated TST 2|X|......T.../JJJ...TTZ./LSJ...TZZ./LSS....ZOO/LLS.IIIIOO|0.0285
Eliminated TST 2|X|........T./JJZ...STT./JZZ...SST./JZL....SOO/LLL.IIIIOO|0.0328
Eliminated TST 2 2|X|........T./LLL...STT./LZJ...SST./ZZJ....SOO/ZJJ.IIIIOO|0.0328
enihcaM gniweS|X|.........J/S........J/SS......JJ/IS.......T/IL......TT/IL.OO..ZZT/ILLOO...ZZ|0.0317
Partial bag 1 [ez-attack-for-beginners]|X|JJ......../J........./J.....SS../L....SST../L...ZZTTOO/LL...ZZTOO|0.0307
Failed TST|X|.J.....TLL/.J.....TTL/JJ.....TSL/OO....ZZSS/OO.IIIIZZS|0.0524
Failed TST 2|X|.J.....LLL/.J.....LSS/JJ.....SST/OO....ZZTT/OO.IIIIZZT|0.0524
FAS Stacking|X|I....T..SS/IL...TTSSZ/IL.J.TOOZZ/ILLJJJOOZ.|0.02
FAS Stacking 2|X|I....T..OO/IL...TTZOO/IL.J.TZZSS/ILLJJJZSS.|0.02
Fast TD|X|J........./JJJ......./OOS......I/OOSS....TI/LLLS.ZZTTI/L.....ZZTI|0.045
FinT Cannon 2|T|......ILLL/......ILOO/......IJOO/......IJJJ|0.02
FinT Cannon 3|X|.Z....JJJI/ZZ....OOJI/ZSST..OOLI/SSTTT.LLLI|0.02
FinT Cannon 4|X|.Z....JJLL/ZZ....JOOL/ZSST..JOOL/SSTTT.IIII|0.02
Gamushiro Stacking (X+)|X|S......I../SS....TI../JS.ZZTTIOO/JJJ.ZZTIOO|1.63
Good TST|X|.Z......../ZZ......../ZSS......./SS......../JJLL.....T/JOOL....TT/JOOL.IIIIT|0.0429
Good TST 2|X|.Z......../ZZ......../ZSS......./SS......../LOOJ.....T/LOOJ....TT/LLJJ.IIIIT|0.0429
Gravity TD|X|......IS../......ISS./L....TIJS./L.ZZTTIJOO/LL.ZZTJJOO|0.0399
Hajin Stacking|X|OOS......T/OOSS....TT/LLLS...ZZT/LIIII...ZZ|0.0315
Hardtack Stacking|X|J..TTT..../JJJZT...../OOZZSS..../OOZSS.IIII|0.07
HDTKI|X|ILLL....../ILTTTZZ..J/IOOTSSZZ.J/IOOSS...JJ|0.054
HDTKI 2|T|IIII....../OOTTTZZ..J/OOLTSSZZ.J/LLLSS...JJ|0.054
Hmm Stacking|T|IOO......./IOO......./IJL......./IJL......./JJLL......|0.0457
Hmm Stacking 2|X|JJJ......./OOJ.....SS/OOL....SST/LLL...ZZTT/IIII...ZZT|0.0457
Hmm Stacking 3|X|LLL......./LOO.....SS/JOO....SST/JJJ...ZZTT/IIII...ZZT|0.0457
Honey Cup|T|.SS......./SSL....T../LLL.ZZTTOO/IIII.ZZTOO|1.34
Indomitable Spirit|X|.....OO.../I....OOS../IL....TSS./IL.ZZTTJS./ILL.ZZTJJJ|0.0482
Indomitable Spirit 2|X|.....OO.../S....OOI../SS....TIL./JS.ZZTTIL./JJJ.ZZTILL|0.0482
IT Cannon|X|..JJ....../..J....SS./OOJ.ZZSST./OOL..ZZTT./LLL.IIIIT.|0.0396
IT Cannon 2|X|JJJIIII.../OOJTZZ..../OOTTTZZ...|0.047
IT Cannon 2 2|X|.......S../.......SS./........S./JJZZTTT.L./JOOZZT..L./JOOIIII.LL|0.047
IT Cannon 3|X|...ZZTTTSS/....ZZTSSL/...IIIILLL|0.0501
IT Cannon 3 2|X|.JJ......./.J......../.J.IIIISLL/OO..TZZSSL/OO.TTTZZSL|0.0501
Possibly Mountainous Stacking, sources d|X|LS......../LSS....T../LLS.ZZTTOO/IIII.ZZTOO|0.02
\u5C71\u5CB3\u7A4D\u307F2\u53F7|X|IS......../ISS....T../IJS.ZZTTOO/IJJJ.ZZTOO|4.56
Izu TST|X|........LL/T........L/TT.......L/TZOOS....J/ZZOOSS...J/ZIIIIS..JJ|0.07
Jack-In-The-Box TST|X|.SS......./SS......../JJLL.ZZ..T/JOOL..ZZTT/JOOL.IIIIT|0.0348
Jack-In-The-Box TST 2|X|.SS......./SS......../LOOJ.ZZ..T/LOOJ..ZZTT/LLJJ.IIIIT|0.0348
kcattA TDT Attack|X|.....I..../.....I..../.T...I..../LTT..IZ..J/LT.OOZZSSJ/LL.OOZSSJJ|0.0426
Partial bag 1 [kisaragi-stacking]|X|.S......../.SS......./.IS......./.IL....T../.IL.ZZTTOO/.ILL.ZZTOO|0.02
Lion Stacking|X|.I......../.I......OO/.I......OO/.I..T..SLL/.J.TTZZSSL/.JJJT.ZZSL|0.07
Lonely Planet|X|.........J/...ZZTTT.J/IIIIZZT.JJ|0.0331
Lonely Planet 2|X|.........J/.........J/LLLIIII.JJ/LSSTZZ..OO/SSTTTZZ.OO|0.0331
Lost TST|X|.J......../.J......../JJ.....SST/OO....SSTT/OOL....ZZT/LLL.IIIIZZ|0.0431
Loyal TD|X|.....SS.../....SSJJ../L....TJOO./L.ZZTTJOO./LL.ZZTIIII|0.0418
Partial bag 1 [b1-6ffbe3fa]|X|L....T..../L.ZZTT..../LL.ZZTIIII|0.02
Luck TST|X|........JJ/LLL.....JI/LZ......JI/ZZSST..OOI/ZSSTTT.OOI|0.0632
Luck TST 2|X|........OO/IJJ.....OO/IJ......SS/IJTZZ..SSL/ITTTZZ.LLL|0.0632
Magic TD|X|.....OO.S./L..TJOO.SS/L.TTJJJZZS/LL.TIIIIZZ|0.0451
Malt Syrup Stacking|X|........SS/.......SSI/JJ.L....TI/JOOL.ZZTTI/JOOLL.ZZTI|0.02
Manhole Stacking|X|....IIII../L....SSOOJ/L.ZZSSTOOJ/LL.ZZTTTJJ|0.0383
Partial bag 1 [maple-stacking]|X|IS......../ISS....TL./IJS.ZZTTL./IJJJ.ZZTLL|0.0482
Partial bag 1 [maple-stacking] 2|X|JJ......../JOO....TL./JOO.ZZTTL./IIII.ZZTLL|0.0482
Partial bag 1 [maple-stacking] 3|X|OO......../OOL....SS./LLL.ZZSST./IIII.ZZTTT|0.0482
Partial bag 1 [maple-stacking] 4|X|JJ......../JOO....SS./JOO.ZZSST./IIII.ZZTTT|0.0482
Partial bag 1 [melon-pc]|X|I........./ILS......T/ILSSOOZZTT/ILLSOO.ZZT|0.0312
Mismatch TD (Edge)|X|......OO../....ZZOOI./L....ZZJI./L.TTTSSJI./LL.TSSJJI.|0.0644
Partial bag 1 [mmm-stacking]|X|OO......../OO......../JJ......../J........./J.......TI/L......TTI/L.....ZZTI/LL.....ZZI|0.0257
Partial bag 1 [b1-e162e614]|X|JJ......../J........./J.......TI/L......TTI/L.....ZZTI/LL.....ZZI|0.02
Partial bag 1 [moonless-dawn-cannon]|X|........SS/LOO....SST/LOO...ZZTT/LLIIII.ZZT|0.0396
New C-Spin|X|......ZJJJ/.....ZZSSJ/..TTTZSSOO/...TIIIIOO|0.0482
New C-Spin 2|X|......IIII/.....SSOOJ/..ZZSSTOOJ/...ZZTTTJJ|0.0482
New C-Spin 3|X|......SSOO/L....SSJOO/L.ZZTTTJJJ/LL.ZZTIIII|0.0482
New Moon Stacking|X|.ZZ.....SS/.JZZT..SSL/.JOOTT.LLL/JJOOT.IIII|0.07
New Moon Stacking 2|X|.OO.....ZI/.OOJT..ZZI/.SSJTT.ZLI/SSJJT.LLLI|0.07
OJI Cannon|X|I........./I..SS...../IJSSL....T/IJOOL.ZZTT/JJOOLL.ZZT|0.0446
\u4F2F\u7236\u7832(S\u30DB\u30FC\u30EB\u30C9)|X|I........./I........./IJ..L....T/IJOOL.ZZTT/JJOOLL.ZZT|0.02
Olive Stacking|X|..Z......./.ZZ......J/.ZL..T.SSJ/OOL.TTSSJJ/OOLL.TIIII|0.0498
Operability TD|X|.....Z..../L..TZZ.J../L.TTZSSJOO/LL.TSSJJOO|0.02
Oyster Stacking|X|.ZZ....LS./.JZZT..LSS/.JOOTT.LLS/JJOOT.IIII|0.0403
Oyster Stacking 2|X|.LS....ZZ./.LSST..JZZ/.LLSTT.JOO/IIIIT.JJOO|0.0403
Oyster Stacking 2|X|I..ZZ...../I.SSZZT..J/ISSLOOTT.J/ILLLOOT.JJ|0.047
Pancake Stacking|X|........I./.SS.....I./SSL....TIJ/OOL.ZZTTIJ/OOLL.ZZTJJ|0.0467
Partial bag 1 [patrol-stacking]|X|.ZOOJ...../ZZOOJ....T/ZSSJJ...TT/SSIIII...T|0.0297
PC-Spin (6L shape)|X|..Z......./.ZZSS...../.ZSSL....J/OOLLL.TTTJ/OOIIII.TJJ|0.0246
Riif\u7A4D\u307F v3(S\u30DB\u30FC\u30EB\u30C9)|X|S........./SS....TOO./JS.ZZTTOOL/JJJ.ZZTLLL|0.0372
PC-Spin (Okey Version)|X|.I......../.I......../.I......../SI......../SS....TOO./JS.ZZTTOOL/JJJ.ZZTLLL|0.02
Peninsula Sensation|T|JJ......../JS......../JSS......./OOS......./OOL....ZZ./LLL.IIIIZZ|0.0369
Peninsula Sensation 2|X|JJ......../JS......../JSS......T/OOS.....TT/OOL....ZZT/LLL.IIIIZZ|0.0369
Rabbit Stacking|X|I........./I........./I..S....../ILLSS....T/OOLJS.ZZTT/OOLJJJ.ZZT|0.0498
Ren\u2019s TA Stacking v2 \u03B1 Version|X|OO......../OO......../JJZ......I/JZZT.....I/JZLTTSS..I/LLLTSS...I|0.052
Riif\u2019s\xA0Stacking v2|X|..TTT....Z/OOJT....ZZ/OOJJJSS.ZL/IIIISS.LLL|0.0375
Tandoori Chicken Stacking|X|S........./SS......../IS......../IL....T.../IL.ZZTT.OO/ILL.ZZT.OO|0.0363
Riif\u2019s Stacking v4|X|........SS/.......SSI/.OOL....TI/JOOL.ZZTTI/JJJLL.ZZTI|0.0337
Bakery TD|X|......I.../L....TIJJ./L.ZZTTIJOO/LL.ZZTIJOO|0.032
Partial bag 1 [rough-pc]|X|JIIII...../JJJZ....../OOZZSST.../OOZSSTTT..|0.0272
Partial bag 1 [rough-pc] 2|X|SIIII...../SSOO....../JSOOTZZ.../JJJTTTZZ..|0.0272
RTR Stacking|X|I........./I........./I......JJJ/IZ.....OOJ/ZZSST..OOL/ZSSTTT.LLL|0.0551
Partial bag 1 [s-hold-pc-2]|X|......IJJJ/......IOOJ/..TZZ.IOOL/.TTTZZILLL|0.0334
Saramachii Stacking|X|I........./I........./I.....Z.../I....ZZ.../L..T.ZSS../L.TTJSSOO./LL.TJJJOO.|0.0502
Partial bag 1 [satsuki-stacking]|X|S........./SS......../IS......../IL....T.../IL.ZZTTOO./ILL.ZZTOO.|0.028
Sauce Stacking|X|.J.......I/.JT......I/JJTT....LI/OOTSSZZ.LI/OOSS..ZZLL|0.07
Sauce Stacking 2|X|.S.......I/.SS......I/JJST....LI/JOOTTZZ.LI/JOOT..ZZLL|0.07
Sauce Stacking 3|X|.I.......J/.IT......J/LITT....JJ/LITSSZZ.OO/LLSS..ZZOO|0.07
Sauce Stacking [b1-6cc3912b]|X|.I.......J/.I.....T.J/LI....TTJJ/LI.SSZZTOO/LLSS..ZZOO|0.02
Sauce Stacking [b1-6cc3912b] 2|X|.J.......I/.J.....T.I/JJ....TTLI/OO.SSZZTLI/OOSS..ZZLL|0.02
Shrine Stacking|X|..S......./OOSSZZ..../OOLSTZZ.../LLLTTT....|0.047
Shrine Stacking 2|X|..Z......I/LZZTTT..JI/LZOOTSS.JI/LLOOSS.JJI|0.047
Sioyaki Cannon|X|OO..SS..../OOLSS....J/LLLZZTTT.J/IIIIZZT.JJ|0.0405
Partial bag 1 [sioyaki-cannon-3]|X|I........./IL..T..ZZ./IL.TTOOJZZ/ILL.TOOJJJ|0.0393
Solitary Moon Stacking|X|.....ZOOJ./L..TZZOOJ./L.TTZSSJJ./LL.TSSIIII|0.0492
Solitary Moon Stacking 2|X|.....SSZJ./L..TSSZZJ./L.TTOOZJJ./LL.TOOIIII|0.0492
Stray Cannon|X|I........./ILS.T..J../ILSSTT.JOO/ILLST.JJOO|0.047
SZOdouble|X|I..OO...../ILSOOZJ.../ILSSZZJ.T./ILLSZJJTTT|0.0342
SZOdouble 2|X|I..ZS...../ILZZSSJ.../ILZOOSJ.T./ILLOOJJTTT|0.0342
SZOdouble 3|X|I..ZZ...../ILOOZZJ.../ILOOSSJ.T./ILLSSJJTTT|0.0342
SZOdouble 4|X|I..SS...../ILSSOOJ.../ILZZOOJ.T./ILLZZJJTTT|0.0342
SZOdouble 5|X|S..ZZ...../SSOOZZL.../JSOOLLL.T./JJJIIIITTT|0.0342
SZOdouble 6|X|I..OO...../IZZOOSS.../IJZZSSL.T./IJJJLLLTTT|0.0342
SZOdouble 7|X|I..ZS...../ILZZSSJ.../ILZOOSJTTT/ILLOOJJ.T.|0.0342
SZOdouble 8|X|S..ZZ...../SSOOZZL.../JSOOLLLTTT/JJJIIII.T.|0.0342
Table\u2019s TDA|X|........OO/........OO/S.......ZI/SS.....ZZI/JS.TTT.ZLI/JJJ.T.LLLI|0.0469
Taiho Stacking|T|S........./SS.....LOO/JS.ZZLLLOO/JJJ.ZZIIII|0.0227
Tenbin Stacking|X|.........Z/........ZZ/......OOZI/L.....OOJI/L.TTT.SSJI/LL.T.SSJJI|0.0614
Thousand Cranes Cannon|X|..Z......./IZZ......./IZOO....SS/IJOOTTTSSL/IJJJ.T.LLL|0.0542
Thousand Cranes Cannon 2|X|..Z......./IZZ......./IZSS....OO/ISSLTTTJOO/ILLL.T.JJJ|0.0542
Thousand Cranes Cannon 3|X|..Z......./IZZ......./IZOO....SS/IJOO.T.SSL/IJJJTTTLLL|0.0542
TOP Cannon|X|LLL....SST/LOO...SSTT/JOO....ZZT/JJJ.IIIIZZ|0.0612
TOP Cannon 2|X|JJJ....SST/OOJ...SSTT/OOL....ZZT/LLL.IIIIZZ|0.0612
Top TST PC|X|S........./SSJ......./LSJ....T../LJJ.ZZTTOO/LL...ZZTOO|0.02
Top TST PC 2|X|J........./JJJ......./LLL....T../LSS.ZZTTOO/SS...ZZTOO|0.02
Tourmaline Stacking|X|I........./I........./I...ZZ..../I....ZZLS./J.TTTOOLSS/JJJT.OOLLS|0.07
\u30C8\u30EB\u30DE\u30EA\u30F3\u7A4D\u307F|X|I........./I........./I........./I......LS./J.TTTOOLSS/JJJT.OOLLS|0.02
TP Cannon|X|.......JJJ/.ZZTTT.LSJ/OOZZT..LSS/OOIIII.LLS|0.02
TP Cannon 2|X|.......JJJ/.ZIIII.OOJ/ZZSST..OOL/ZSSTTT.LLL|0.02
TP Cannon 3|X|.......LLL/.ZIIII.LOO/ZZSST..JOO/ZSSTTT.JJJ|0.02
TP Cannon 4|X|.......SLL/.ZZTTT.SSL/OOZZT..JSL/OOIIII.JJJ|0.02
TP Cannon 5|X|.......JJZ/.TTTSS.JZZ/OOTSS..JZL/OOIIII.LLL|0.02
TP Cannon 6|X|.......LLL/.TTTSS.LZJ/OOTSS..ZZJ/OOIIII.ZJJ|0.02
Triple Triple PC|X|.........I/.......OOI/LS..T..OOI/LSSTTJ.ZZI/LLS.TJJJZZ|0.07
True PT Stacking|T|JJSS....../JSS......./JLL......./OOL......./OOL.......|0.07
True PT Stacking 2|X|OOJJ....../OOJ......T/LSJ.....TT/LSS....ZZT/LLS.IIIIZZ|0.07
PT Stacking|X|.LLL.....T/.LSS..ZZTT/JSSOO..ZZT/JJJOO.IIII|0.02
PT Stacking 2|X|.JJJ.....T/.SSJ..ZZTT/SSLOO..ZZT/LLLOO.IIII|0.02
Tsar Cannon|X|S........I/SS.L....TI/JS.L.ZZTTI/JJJLL.ZZTI|1.3
TZT Cannon 2|X|........T./........TT/...OO...TI/SZZOO....I/SSZZL.JJJI/.SLLL...JI|0.0538
TZT Cannon 3|X|TTT......./IT......S./IJJLL...SS/IJOOL..ZZS/IJOOL...ZZ|0.02
TZT Cannon 3 2|X|IJJ......./IJ......S./IJLLL...SS/ITLOO..ZZS/TTTOO...ZZ|0.02
TZT Cannon 3 3|X|TTT......./IT......S./ILOOJ...SS/ILOOJ..ZZS/ILLJJ...ZZ|0.02
TZT Cannon 3 4|X|TTT......./JT......S./JJJOO...SS/LLLOO..ZZS/LIIII...ZZ|0.02
Unnamed TD|X|.......SLL/.......SSL/TZZ....JSL/TTZZ...JOO/TIIII.JJOO|0.0467
Unnamed TST PC|X|I........./I.......SS/IJL....SST/IJL.OOZZTT/JJLLOO.ZZT|0.0505
Water Stacking|X|S........./SS.....J../IS.....J../IL....JJT./IL.OOZZTT./ILLOO.ZZT.|0.02
Yacht TST|X|........L./.......TL./.....STTLL/.....SSTZJ/OO....SZZJ/OO.IIIIZJJ|0.0356
Yamaha Stacking|X|SLL......I/SSL.....TI/JSL..ZZTTI/JJJ...ZZTI|0.031
Yamaha Stacking 2|X|JJJ......I/LSJ.....TI/LSS..ZZTTI/LLS...ZZTI|0.031
Yamaha Stacking 3|X|JJJ......I/OOJ.....TI/OOL..ZZTTI/LLL...ZZTI|0.031
Yamaha Stacking 4|X|LLL......I/LOO.....TI/JOO..ZZTTI/JJJ...ZZTI|0.031
Yapayapa Cannon|X|........SS/JJLL.ZZSST/JOOL..ZZTT/JOOL.IIIIT|0.0242
Yei Stacking|X|.SSZ....../SSZZ.....I/JJZL....TI/JOOL...TTI/JOOLL...TI|0.02
Yei Stacking 2|X|.LLL....../SLOO.....I/SSOO....TI/JSZZ...TTI/JJJZZ...TI|0.02
Yei Stacking 3|X|.JJJ....../OOSJ.....T/OOSS....TT/LLLS...ZZT/LIIII...ZZ|0.02
Yei Stacking 4|X|.SSI....../SSLI.....T/LLLI....TT/OOJI...ZZT/OOJJJ...ZZ|0.02
99PC|X|I........./I......T.Z/I..J..TTZZ/ISSJ.OOTZL/SSJJ.OOLLL|0.0513
Clock PC|X|.......S../OO.....SS./OOL....TSJ/LLLZZ..TTJ/IIIIZZ.TJJ|0.042
Clock PC 2|X|.......T../IS.....TT./ISS....TLL/IJSZZ..OOL/IJJJZZ.OOL|0.042
Clock PC 3|X|.......S../JJ.....SS./JOO....LST/JOOZZ..LTT/IIIIZZ.LLT|0.042
Clock PC 4|X|.......T../JJ.....TT./JOO....TSS/JOOZZ..SSL/IIIIZZ.LLL|0.042
Clock PC 5|X|.......T../LS.....TT./LSS....TOO/LLSZZ..JOO/IIIIZZ.JJJ|0.042
Line PC|X|S...TI..../SS.TTI..LL/JSZZTI.OOL/JJJZZI.OOL|0.02
Line PC 2|X|T...ZI..../TT.ZZI..OO/TSSZLI.JOO/SSLLLI.JJJ|0.02
Line PC [tetris-perfect-clear]|X|S...TI..../SS.TTI.OO./JSZZTI.OOL/JJJZZI.LLL|0.02
Line PC [tetris-perfect-clear] 2|X|T...ZI..../TT.ZZI.JJ./TSSZLI.JOO/SSLLLI.JOO|0.02
Musashi\u2019s Sword|X|ZZ......../TZZ.....OO/TTSS.L.JOO/TSSLLL.JJJ|0.0422
QP Cannon|X|...ZZ....I/.LLTZZ..JI/OOLTTSS.JI/OOLTSS.JJI|0.02
QP Cannon 2|X|...IT....Z/.OOITT..ZZ/JOOITSS.ZL/JJJISS.LLL|0.02
QP Cannon 3|X|...OO....Z/.SSOOT..ZZ/SSJJJTT.ZL/IIIIJT.LLL|0.02
QUAFECT|X|.........T/I.......TT/I....SSZZT/IOO.SSLJZZ/IOO.LLLJJJ|0.02
QUAFECT 2|X|.........T/I.......TT/I....LLLST/IOO.JLZZSS/IOO.JJJZZS|0.02
QUAFECT 3|X|.........T/I.......TT/I....ZJLST/IOO.ZZJLSS/IOO.ZJJLLS|0.02
QUAFECT 4|X|.........T/I.......TT/I....ZJJJT/IOO.ZZSSJL/IOO.ZSSLLL|0.02
QUAFECT 5|X|.........Z/I.......ZZ/I....SSTZJ/IOO.SSLTTJ/IOO.LLLTJJ|0.02
SZ 6-3 Stacking Opener|X|LLLI.Z..../LOOIZZ..../JOOIZSS.T./JJJISS.TTT|0.02
Aashuchan Cannon|X|JJJ....TTT/OOJ.....TL/OO.....LLL|0.02
Aashuchan Cannon 2|X|L...SS..../L..SS...T./LLIIII.TTT|0.02
Aashuchan Cannon 3|X|......ZZ../.......ZZ./LOO.SS.JJJ/LOOSS...TJ/LLIIII.TTT|0.02
BTREN|X|J......LLI/JJJZ....LI/OOZZSS.TLI/OOZSS.TTTI|0.0583
BTREN 2|X|J......TTT/JJJZ....TL/OOZZSS.LLL/OOZSS.IIII|0.0583
Catspin|X|T......Z../TTSS..ZZ../TSS...ZLOO/IIII.LLLOO|0.0226
Unnamed bag 1 [catspin-2]|X|T......Z../TTSS..ZZ.J/TSS...ZL.J/IIII.LLLJJ|0.02
Fractal Opener|X|.SS......./SS......../TTT.ZZ.LLL/JT...ZZLOO/JJJ.IIIIOO|0.02
Gassho TSD PC|X|IJJ......L/IJ...ZSLLL/IJT.ZZSSOO/ITTTZ..SOO|0.0403
Gassho TSD PC 2|X|TTT......L/JT...ZSLLL/JJJ.ZZSSOO/IIIIZ..SOO|0.0403
I Base MKO|T|.....Z..../L...ZZSSOO/L...ZSSJOO/LL.IIIIJJJ|0.0281
I Base MKO (TETPC\xA0Edition)|T|......ZJJJ/.L...ZZSSJ/.L...ZSSOO/.LL.IIIIOO|0.024
Initiate Bridge|T|I........./IJJ......./IJ...ZS.../IJL.ZZSSOO/LLL.Z..SOO|0.0221
Magellan P System|T|.......ZOO/...LLLZZOO/...LSSZJJJ/...SSIIIIJ|0.0294
Magellan P System 2|T|.......JJJ/...OOLLLSJ/...OOLZZSS/...IIIIZZS|0.0294
Magellan P System 3|T|.......SSZ/...OOJSSZZ/...OOJJJZL/...IIIILLL|0.0294
Magellan P System 4|T|.......OOJ/...LSZZOOJ/...LSSZZJJ/...LLSIIII|0.0294
Magellan P System 5|T|.......SLL/...JJZZSSL/...JOOZZSL/...JOOIIII|0.0294
MKO Stacking (X+)|T|S.....Z..I/SS...ZZ..I/JS...ZLOOI/JJJ.LLLOOI|1.49
Partial bag 1 [b1-07da4ffb]|T|I..S....../I..SS...../IOOJS....L/IOOJJJ.LLL|0.02
Partial bag 1 [b1-07da4ffb] 2|T|I..S.....Z/I..SS...ZZ/IOOJS...ZL/IOOJJJ.LLL|0.02
More\u2019s Gassho|X|JJ......LI/J...ZSLLLI/JT.ZZSSOOI/TTTZ..SOOI|0.0222
More\u2019s Gassho 2|X|JJ......SS/J...ZOOSSL/JT.ZZOOLLL/TTTZ..IIII|0.0222
New T-Spin Double \u03B2|T|...I.....Z/JJ.I....ZZ/JOOI..SSZL/JOOI.SSLLL|0.02
New T-Spin Double \u03B2 2|T|...J.....Z/OO.J....ZZ/OOJJ..SSZL/IIII.SSLLL|0.02
Rainbow Parfait|X|...OO....Z/.SSOO.T.ZZ/SSJJJ.TTZL/IIIIJ.TLLL|0.0448
Rainbow Parfait 2|X|...OO....T/.SSOO.L.TT/SSJJJ.LZZT/IIIIJ.LLZZ|0.0448
Shape And Shadow Stacking|T|LS....OOJ./LSS...OOJ./LLS....JJ.|0.02
Shape And Shadow Stacking 2|X|.T......../TTT......I/JJ...ZSLLI/JOO.ZZSSLI/JOO.Z..SLI|0.02
Shape And Shadow Stacking 3|X|.T......../TTT......I/LS...ZOOJI/LSS.ZZOOJI/LLS.Z..JJI|0.02
Blue Dire Mondo|X|IZZ......./IJZZ....../IJJJ....LL/ISST...OOL/SSTTT..OOL|0.02
Blue Dire Mondo 2|X|LLS......./ILSS....../ILZS....OO/IZZT...JOO/IZTTT..JJJ|0.02
Blue Dire Mondo 3|X|JJT......./JTTT....../JZOO....SS/ZZOO...SSL/ZIIII..LLL|0.02
Blue Dire Mondo 4|X|IJJ......./IJOO....../IJOO....SS/ITZZ...SSL/TTTZZ..LLL|0.02
Blue Dire Mondo 5|X|TTT......./ITSS....../ISSL....ZJ/IOOL...ZZJ/IOOLL..ZJJ|0.02
Blue Dire Mondo 6|X|ILS......./ILSS....../ILLS....OO/ITZZ...JOO/TTTZZ..JJJ|0.02
Blue Dire Mondo 7|X|IOO......./IOOL....../ILLL....ZJ/ISST...ZZJ/SSTTT..ZJJ|0.02
Blue Dire Mondo 8|X|IZZ......./ISZZ....../ISSL....OO/ITSL...JOO/TTTLL..JJJ|0.02
Blue Dire Mondo 9|X|IOO......./IOOZ....../IJZZ....SS/IJZT...SSL/JJTTT..LLL|0.02
Ginzan PC|T|.......ZOO/L.....ZZOO/L...SSZJJJ/LL.SSIIIIJ|0.0537
Grace System|T|S....Z..../SSOOZZ..../JSOOZL..../JJJLLL....|0.0235
Grace System 2|T|SIIIIZ..../SSOOZZ..../JSOOZL..../JJJLLL....|0.0235
Grace System 3|T|LLLJJJ..../LZOOSJ..../ZZOOSS..../ZIIIIS....|0.0235
Unnamed bag 1 [grace-system-2]|X|LLLJJJ..../LZOOSJ...T/ZZOOSS..TT/ZIIIIS...T|0.02
Partial bag 1 [b1-b8b01235]|T|S....Z..../SS..ZZ..../JS..ZL..../JJJLLL....|0.02
Guzzu Nineeto p|X|OOIIII..../OOSSZ...../JSSZZT..../JJJZTTT...|0.0362
Guzzu Nineeto p 2|X|IIIISS..../JJJSS...../OOJTZZ..../OOTTTZZ...|0.0362
Guzzu Nineeto p 3|X|OOSTTT..../OOSST...../LLLSZZ..../LIIIIZZ...|0.0362
Guzzu Nineeto p 4|X|IIIISS..../LOOSS...../LOOTZZ..../LLTTTZZ...|0.0362
Intai Cannon|X|.....J..../I....JZZ../IL..JJSZZ./IL...TSSOO/ILL.TTTSOO|0.02
Intai Cannon 2|X|.....J..../I....JOO../IL..JJOOS./IL...TZZSS/ILL.TTTZZS|0.02
J PC|X|I.....SSOO/I....SSTOO/I...ZZTTTL/I....ZZLLL|0.0278
Partial bag 1 [b1-39e02213]|X|.....SSOOI/....SSTOOI/...ZZTTTLI/....ZZLLLI|0.02
Partial bag 1 [b1-39e02213] 2|X|.....SSLLL/....SSTLOO/...ZZTTTOO/....ZZIIII|0.02
Partial bag 1 [b1-39e02213] 3|X|.....IIIIZ/....SSOOZZ/...SSTOOZL/....TTTLLL|0.02
Jigsaw (Held T)|T|I......JJJ/I.......SJ/ILLLOOZZSS/IL..OO.ZZS|0.02
Mr. Good\u2019s Grace System 4|X|JIIII....T/JJJSS...TT/OOSSL..ZZT/OOLLL...ZZ|0.0335
Partial bag 1 [b1-ac01182c]|X|JJJ.....SS/OOJ....SST/OOL...ZZTT/LLL....ZZT|0.02
Partial bag 1 [b1-ac01182c] 2|X|LLL.....SS/LOO....SST/JOO...ZZTT/JJJ....ZZT|0.02
Pastrami|X|TTT....JJJ/LT.....SSJ/LZZ...SSOO/LLZZIIIIOO|0.0276
Pastrami 2|X|LLL....JJJ/LZ.....SSJ/ZZT...SSOO/ZTTTIIIIOO|0.0276
Perfect Clear Opener|T|ZZ....JJLL/.ZZ...JOOL/..SS..JOOL/.SS...IIII|17.5
Perfect Clear Opener 2|X|ZZ.....JJJ/TZZ....OOJ/TTSS...OOL/TSS....LLL|17.5
Perfect Clear Opener 3|T|ZZ....JJLL/TZZ...JOOL/TTSS..JOOL/TSS...IIII|17.5
Perfect Clear Opener 4|X|ZZ....IJJJ/TZZ...IOOJ/TTSS..IOOL/TSS...ILLL|17.5
Perfect Clear Opener 5|X|ZZ....IIII/TZZ...JJLL/TTSS..JOOL/TSS...JOOL|17.5
Perfect Clear Opener 6|X|ZZ....IIII/TZZ...LOOJ/TTSS..LOOJ/TSS...LLJJ|17.5
Sus PC|X|.Z.....SLL/ZZOO...SSL/ZTOO...JSL/TTT....JJJ|0.0399
Sus PC 2|X|.T.....JJJ/TTTZ...LSJ/OOZZ...LSS/OOZIIIILLS|0.0399
Sus PC 3|T|.Z.....JJJ/ZZOO...LSJ/Z.OO...LSS/...IIIILLS|0.0399
\u512A\u52DDST|T|..ZZ....../...ZZ....I/....JJJS.I/OO.LLLJSSI/OO.L....SI|0.02
\u30B8\u30A7\u30C3\u30C8\u7A4D\u307F|X|........SS/.......SSI/.ZJL....TI/ZZJL.OOTTI/ZJJLLOO.TI|0.02
\u30B8\u30E5\u30FC\u30B9\u7A4D\u307F|X|.........L/.......LLL/T....OOJJJ/TTSS.OOZZJ/TSS.IIIIZZ|0.02
\u30B8\u30E5\u30FC\u30B9\u7A4D\u307F 2|X|.........Z/.......LZZ/T....OOLZJ/TTSS.OOLLJ/TSS.IIIIJJ|0.02
Phoenix Cannon|T|...LL...SS/...ZL..SSJ/OOZZL....J/OOZIIII.JJ|0.02
Partial bag 1 [b1-b87e367f]|T|...SS....I/..SS.....I/LLLOO.JJJI/L..OO...JI|0.02
Apple Tree|X|...OO....I/LLLOOSS..I/LTZZSSJJJI/TTTZZ...JI|0.02
First|T|...OO....I/L..OO.J.ZI/L...SSJZZI/LL.SSJJZ.I|0.02
Partial bag 1 [yoshihiro-sd-setups-openings]|T|...ZZ....J/....ZZ.SSJ/...LOOSSJJ/.LLLOOIIII|0.02
Partial bag 1 [b1-a6781c60]|T|I....SS.../I.ZZSS..../IOOZZLJ.../IOOLLLJJJ.|0.02
Unnamed bag 1 [double-triple-cannon-setups-similar-dt-attack]|X|...TTT...I/S...TZZLLI/SS.OOJZZLI/.S.OOJJJLI|0.02
Unnamed bag 1 [double-triple-cannon-setups-similar-dt-attack] 2|X|...JJJ...I/S...ZJLLLI/SS.ZZTLOOI/.S.ZTTTOOI|0.02
Okey's DT Cannon|X|....T...../...TTS..../....TSSJJJ/OO.LLLSZZJ/OO.LIIIIZZ|0.02
\u958B\u5E55TSD(Flat Top)|T|...JJJ..../L..ZZJS.../L...ZZSSOO/LL.IIIISOO|7.41
\u958B\u5E55TSD(Flat Top) 2|T|...SZZ..../L..SSZZ.../L...SJJJOO/LL.IIIIJOO|7.41
Unnamed bag 1 [sz-double-triple-setups-leaving-a-hole-below-s-piece]|T|....ZZ..../....IZZ.../LOOJIS...Z/LOOJISS.ZZ/LLJJI.S.Z.|0.02
Iwamispin|T|ZZ...S..../JZZ..SS.../JJJ...SLOO/IIII.LLLOO|0.02
\u30B0\u30EA\u30C3\u30BF\u30FC\u30D6\u30ED\u30FC\u30C1(O\u30DB\u30FC\u30EB\u30C9)|T|.....S..../L....SS.../LZZ...SJJJ/LLZZ.IIIIJ|0.02
\u30B0\u30EA\u30C3\u30BF\u30FC\u30D6\u30ED\u30FC\u30C1(O\u30DB\u30FC\u30EB\u30C9) 2|T|.....S..../J....SS.../JJJ...SLOO/IIII.LLLOO|0.02
TKI\u7A4D\u307F(ZST Core)|T|.....JJLLL/.....JSL../.....JSS../.....ZZS../......ZZ..|0.02
TKI\u7A4D\u307F(ZST Core) 2|T|JJ......../J........./J........./L...S...../L.ZZSS..../LL.ZZS....|0.02
TKI\u7A4D\u307F(ZST Core) 3|T|.....OOSLL/.....OOSSL/.....JJJSL/.....ZZJ../......ZZ..|0.02
TKI\u7A4D\u307F(ZST Core) 4|T|......IIII/.......SLL/.......SSL/......ZJSL/.....ZZJJJ/.....ZOO../......OO..|0.02
TKI\u7A4D\u307F(ZST Core) 5|T|.........I/......JOOI/......JOOI/.....JJZZI/.....SLLZZ/.....SSL../......SL..|0.02
TKI\u7A4D\u307F(ZST Core) 6|X|JJ......../J........./J.TTT...../L..TS...OO/L.ZZSS..OO/LL.ZZSIIII|0.02
C-Spin (X+)|X|......Z..I/L..SSZZOOI/L.SSTZJOOI/LL.TTTJJJI|0.02
C-Spin 2 (X+)|X|......S..I/L..TTTSSJI/L.ZZTOOSJI/LL.ZZOOJJI|0.02
Lime Stacking|X|......SS../L....SSJ../L.ZZTTTJOO/LL.ZZTJJOO|0.02
Cat cannon|X|......TTT./JJ.LSZZTOO/J..LSSZZOO/J..LLSIIII|0.02
Cat cannon [b1-5e63d460]|X|.....SS.../....SSTTT./JJ.L.ZZTOO/J..L..ZZOO/J..LL.IIII|0.02
Ruby Stacking|X|.......OO./TZZ....OOJ/TTZZ...SSJ/TIIII.SSJJ|0.02
KENTRY CANNON|X|........ZI/JJTTT..ZZI/JOOTSS.ZLI/JOOSS.LLLI|0.02
\u30C9\u30C3\u30C8\u7832(S\u30DB\u30FC\u30EB\u30C9)|X|.........I/JJ.L....TI/JOOL.ZZTTI/JOOLL.ZZTI|0.02
New Dubble|X|.........I/JJLLSTTTZI/JOOLSSTZZI/JOOL.S.Z.I|0.02
New Dubble 2|X|.........I/JJLL.Z.S.I/JOOLZZTSSI/JOOLZTTTSI|0.02
Dubble Opener|X|.Z..J..L.T/ZZSSJOOLTT/ZSSJJOOLLT|0.02
Quick Tower|T|..Z......./.ZZ......./.ZI.S.J.../..I.SSJJJ./..I..SLOO./..I.LLLOO.|0.02
Slot TST|X|.S......../.SS......./.JS......./.J......../JJ.......T/OO......TT/OOL....ZZT/LLL.IIIIZZ|0.02
New TTPC|X|L........./L........./LL......../I........./IOO......./IOO..T..ZJ/ISS..TTZZJ/SS...T.ZJJ|0.02
H Cannon|X|I........./I........./I........./I.....S.../JJLL.ZSS../J..LZZTSOO/J..LZTTTOO|0.02
Unnamed bag 1 [fractal-empty-field-setup]|X|T........./TT......../T........./ZZ.S....../LZZSS...../L...SJJJOO/LL.IIIIJOO|0.02
Eternal return|X|S........./SS......../TS......../TT.......I/TZJ....LLI/ZZJ...OOLI/ZJJ...OOLI|0.02
Eternal return 2|X|S........./SS......../TS......../TT.......I/TLL....ZJI/OOL...ZZJI/OOL...ZJJI|0.02
Eternal return 3|X|T........./TT......../TZ......../ZZ.......I/ZSS....OOI/SSL...JOOI/LLL...JJJI|0.02
Eternal return 4|X|T........./TT......../TZ......../ZZ.......J/ZLL....SSJ/OOL...SSJJ/OOL...IIII|0.02
Unnamed bag 1 [b1-1214800f]|X|I..S....../I.ZSS.JJLL/IZZTS.JOOL/IZTTT.JOOL|0.02
DSTSD Opener|X|T........./TT......../TSS......./SSZ......I/LZZ......I/LZOO..JJJI/LLOO....JI|0.02
Mainspring Tower|X|LOO......I/LOO......I/LL.......I/ZZ.......I/TZZ......J/TT.....SSJ/T.....SSJJ|0.02
Synergy DT|X|..J......./..J......./.JJ.....OO/ZZ......OO/TZZ....SLL/TT.....SSL/TIIII...SL|0.02
Synergy DT [b1-8bbcc6bd]|X|.OO......J/.OO......J/ZZ......JJ/TZZ....SLL/TT.....SSL/TIIII...SL|0.02
Meteor's Path Revised|X|..SS....../.SS......./JJ.Z....../J.ZZ.I..../JTZLLI..../TTOOLI..../.TOOLI....|0.02
Meteor's Path Revised 2|X|..SS....../.SS......./JJ.L....../J.TL.I..../JTTLLI..../ZZTOOI..../.ZZOOI....|0.02
Meteor's Path|X|...SS...../ZZSS....../TZZ...JJLL/TT....JOOL/T.IIIIJOOL|0.02
Meteor's Path 2|X|...SS...../ZZSS....../TZZ...LOOJ/TT....LOOJ/T.IIIILLJJ|0.02
TZT Cannon|X|.....I..../.....I..../.T...I..../TT.ZZI..../ST..ZZ..../SS.JJJ..../.S...J....|0.02
TZT Cannon 2|X|.....I..../.....I..../.T...I..../TT.ZZI..../ST..ZZ..L./SS.JJJOOL./.S...JOOLL|0.02
Unnamed bag 1 [imperial-cross-cross-opening]|X|.....L..../.....L..../..Z..LL.../.ZZ...S.../.ZTTT.SS../OOJT...S../OOJJJ.IIII|0.02
Unnamed bag 1 [b1-10314de3]|X|..S......./ZZSS....../JZZS.TTT../JJJ...TLOO/IIII.LLLOO|0.02
Unnamed bag 1 [b1-2491790a]|X|.........Z/.I....OOZZ/.ILLL.OOZJ/.ILT...SSJ/.ITTT.SSJJ|0.02
Unnamed bag 1 [b1-ead17ff5]|X|S..OO....I/SS.OO.TTTI/JSZZ...TLI/JJJZZ.LLLI|0.02
Unnamed bag 1 [b1-1af78c88]|X|.....S...Z/.....SS.ZZ/T..OOLS.ZJ/TT.OOL...J/TIIIILL.JJ|0.02
Unnamed bag 1 [imperial-cross-setups-opening]|X|.........Z/........ZZ/....SS..ZI/...SSL...I/.T.OOLJJJI/TTTOOLL.JI|0.02
Breakerspin|T|I........./I........./I.Z......./IZZ......./JZ...SSLLL/JJJ.SS.L..|1.35
Breakerspin 2|T|I........./I........./I.Z......./IZZ.....LL/JZ...SSOOL/JJJ.SS.OOL|1.35
SEALspin|X|I........./I........./I.T......Z/ITTJ....ZZ/OOTJ..SSZL/OOJJ.SSLLL|0.02
Partial bag 1 [st-stacking-setups-openings]|T|I........./I........./I....SS.../IZ..SS..../ZZ.LOOJ.../ZLLLOOJJJ.|0.02
Partial bag 1 [b1-80a8828b]|T|...I....../...I.SS.../L..ISS..../LZZIOOJ.../LLZZOOJJJ.|0.02
Partial bag 1 [b1-2ecaebeb]|T|.....OO.../....SOO.../..L.SS..../LLLZZSJ.../IIIIZZJJJ.|0.02
Partial bag 1 [b1-93214986]|T|.OOZZ...../.OOJZZ..../.SSJLLL.../SSJJLIIII.|0.02
Keymo opener|X|I........./I........./I......JJJ/I..Z...LSJ/OOZZT..LSS/OOZTTT.LLS|0.02
Keymo opener 2|X|I........./I........./I......SLL/I..Z...SSL/OOZZT..JSL/OOZTTT.JJJ|0.02
Reflect Laser Path|X|I........./I........./I........./IZ..S.JJLL/ZZ.TSSJOOL/Z.TTTSJOOL|0.02
Reflect Laser Path 2|X|I........./I........./I........./IZ..S.LOOJ/ZZ.TSSLOOJ/Z.TTTSLLJJ|0.02
Inno Cannon|T|S........./SS......../IS......../I......L../IJ.ZZLLLOO/IJJJZZ..OO|0.02
Azyara Spin|X|JJ......../J....SS.../J...SSI.../L....TI.../L.ZZTTIOO./LL.ZZTIOO.|0.02
C-Spin Perfect Clear|X|JJ......../J........./J......S../L..T.ZZSS./L.TTOOZZS./LL.TOOIIII|0.02
Unnamed bag 1 [b1-4baac10b]|X|....S...../....SS..../..JJJS..../L..TJZZ.../L.TTOOZZ../LL.TOOIIII|0.02
Unnamed bag 1 [b1-0e1177b7]|X|JJ.......I/J........I/J.TTT....I/L..TS....I/L.ZZSS..OO/LL.ZZS..OO|0.02
Unnamed bag 1 [b1-9c7a9b1f]|X|..TTT....I/L..TS..OOI/L.ZZSSJOOI/LL.ZZSJJJI|0.02
Unnamed bag 1 [b1-6f751a68]|X|JJ......../J........./J...ZZ..../L....ZZ.OO/L.TTTSS.OO/LL.TSSIIII|0.02
TKI\u7A4D\u307F(ITZ Core)|X|JJ......../J........./J.ZZ....../L..ZZOOS../L.TTTOOSS./LL.TIIIIS.|0.02
TKI\u7A4D\u307F(ITO Core)|X|JJ......../J........./J.....SS../L....SSOO./L.ZZTTTOO./LL.ZZTIIII|0.02
Kanagawa Stacking|X|JJ......../J........./JZ.......I/ZZ.....LLI/ZSST..OOLI/SSTTT.OOLI|0.02
Volcano DT|X|OO......../OO......I./ZZ......I./LZZ.....IJ/LTTTSS..IJ/LLTSS...JJ|0.02
Trapeze|T|ZZ......../SZZ......./SS......../LS......../L....JJJOO/LL.IIIIJOO|0.02
MD-PC|X|JJ......../JOO......./JOO......./LLL......T/LSS...ZZTT/SSIIII.ZZT|0.02
MD-PC 2|X|LS......../LSS......./LLS......./JJJ......T/OOJ...ZZTT/OOIIII.ZZT|0.02
UT Cannon|X|.Z......../ZZSS....../ZSS.....T./JJLL...TT./JOOL....T./JOOL.IIII.|0.02
UT Cannon 2|X|.Z......../ZZSS....../ZSS.....T./LOOJ...TT./LOOJ....T./LLJJ.IIII.|0.02
Waffle Stacking|X|.JJ......./.J....S.../IJ....SS../IL....TS../IL.ZZTTOO./ILL.ZZTOO.|0.02
Cloudy and Later Sunny|X|.TZZ....../TTTZZJJJS./I......JSS/I......OOS/I......OOL/I......LLL|0.02
Quick Tower 2|X|TTT...ZZ../.TLL...ZZ./.OOL...JJJ/.OOL.IIIIJ|0.02
Veggie Cannon|X|..SS....../ISS......T/IZZ.....TT/IJZZ.....T/IJLLL...OO/JJL.....OO|0.02
Veggie Cannon 2|X|..SS....../ISS......T/IJJ.....TT/IJZZ.....T/IJLZZ...OO/LLL.....OO|0.02
Katst|X|..LL....../...L....../JJ.L.....I/J..S....ZI/JT.SSOOZZI/TTT.SOOZ.I|0.02
\u30C0\u30EB\u30B9\u30D5\u30EC\u30A4\u30E0|T|...LL...../....L...../OO.SL...../OO.SS...../J.ZZS...../JJJZZIIII.|0.02
Crimson Balrog|X|...IJJ..../...IJ...../...IJ...../..SIL....T/OOSSL.ZZTT/OO.SLL.ZZT|0.02
Claw Machine|X|....JJ...I/....J....I/....J....I/L...T....I/LZZTT.SSOO/LLZZTSS.OO|0.02
Unnamed bag 1 [hyper-fractal-7-piece-opening]|X|....OO..../....OO..../....ZS...I/...ZZSS.TI/...ZLJSTTI/..LLLJJJTI|0.02
Omnispin|X|.......T../......TTT./I.......S./IJJLL...SS/IJOOL..ZZS/IJOOL...ZZ|0.02
Omnispin 2|X|.......T../......TTT./I.......S./ILOOJ...SS/ILOOJ..ZZS/ILLJJ...ZZ|0.02
FD Spin|T|.......J../.......JJJ/.........I/..S.L....I/OOSSLZZ..I/OO.SLLZZ.I|0.02
Swanboat|X|.......ZZ./IL....JJZZ/IL....J.../ILL...J.../ISST.OO.../SSTTTOO...|0.02
Scaffold Stacking|X|.I......../.I..T.S.../.I.TTTSS../.I...ZZS../OO...JZZ../OO...JJJ..|0.02
Tsar Cannon [tsar-cannon-2]|X|........OO/........OO/S........I/SS.L....TI/JS.L.ZZTTI/JJJLL.ZZTI|0.02
Cope Opener|X|........LL/.........L/ZZ.......L/TZZSS....J/TTSS..OO.J/TIIII.OOJJ|0.02
Leg walker|T|.........L/.......LLL/...ZZ...SS/IIIIZZ.SSJ/OO.......J/OO......JJ|0.02
Dragonbucket|T|.........I/.......OOI/.......OOI/L..J....SI/L..J..ZZSS/LLJJ...ZZS|0.02
Unnamed bag 1 [b1-325c9de6]|T|..I....OO./..I....OO./L.IJ....S./L.IJ..ZZSS/LLJJ...ZZS|0.02
Stable TST|T|..Z......./IZZ......./IZ...LLJJ./IOO.SSLJ../IOOSS.LJ..|0.02
Stable TST 2|X|.........T/........TT/.L....OOST/.L....OOSS/JLL....ZZS/JJJ.IIIIZZ|0.02
Stable TST 3|X|.........T/........TT/.L....SZZT/.L....SSZZ/JLL....SOO/JJJ.IIIIOO|0.02
Stable TST 4|X|.........T/........TT/.J....OOST/.J....OOSS/JJL....ZZS/LLL.IIIIZZ|0.02
Stable TST 5|X|.........T/........TT/.J....SZZT/.J....SSZZ/JJL....SOO/LLL.IIIIOO|0.02
Colinspin|T|.........Z/........ZZ/...OO...ZI/L..OO....I/L...SSJJJI/LL.SS...JI|0.02
Godless-spin|X|.........Z/........ZZ/JJ......ZI/J......LLI/JSST..OOLI/SSTTT.OOLI|0.02
Partial bag 1 [b1-4b520a7b]|T|.........I/.........I/.........I/LLL...Z..I/LSS..ZZ.OO/SS...Z..OO|0.02
Partial bag 1 [b1-4b520a7b] 2|T|.........I/.........I/.........I/JJZ...SS.I/JZZ..SSLOO/JZ...LLLOO|0.02
Partial bag 1 [b1-4b520a7b] 3|X|........OO/........OO/.........I/JJZ...SS.I/JZZT.SSL.I/JZTTTLLL.I|0.02
Partial bag 1 [b1-fdfad6ba]|X|.........I/.........I/.........I/TTT...SS.I/JT...SSLOO/JJJ..LLLOO|0.02
SkTD|X|.........J/.........J/I.......JJ/IT....Z.LL/ITTSSZZOOL/ITSS.Z.OOL|0.02
PC-Spin (8L) (X+)|X|.........I/.........I/S........I/SS....TOOI/JS.ZZTTOOL/JJJ.ZZTLLL|0.02
Meteor's Path v2|X|.........I/.........I/ZZ.......I/TZZ....JJI/TT.SS.LJOO/T.SSLLLJOO|0.02
ISM's cannon|T|S........./SS...I..../LS..JI.Z../L...JIZZOO/LL.JJIZ.OO|0.02
Potatospin|T|S........./SS...ZZ.../LS....ZZ../L....JJJOO/LL.IIIIJOO|0.02
Meteor's Path v3|X|T........./TT.....J.I/T...S..J.I/OOZZSSJJLI/OO.ZZSLLLI|0.02
Meteor's Path v3 2|X|T........./TT.....L.I/T...S..L.I/OOZZSSJLLI/OO.ZZSJJJI|0.02
Last|T|S........./SS.......I/LS..J.Z..I/L...JZZOOI/LL.JJZ.OOI|0.02
ADT Opener|T|I........./IJJ......./IJ...Z..../IJL.ZZSSOO/LLL.ZSS.OO|0.02
Ridge Spin|T|I........./IJJ......./IJ.....Z../IJL.SSZZOO/LLLSS.Z.OO|0.02
ADT Opener 3|T|I........./IJJ......./IJ......../IJL.SSOO../LLLSS.OO..|0.02
ADT Opener 3 2|T|I........./IJJ......./IJ.....ZZ./IJL.SSOOZZ/LLLSS.OO..|0.02
ADT Opener 2|T|I........./IJJ......./IJ......S./IJL.OOZZSS/LLL.OO.ZZS|0.02
Kermfuffle|T|........LL/..ZZ.....L/...ZZ...SL/J.IIIIOOSS/JJJ...OO.S|0.02
Setspin|T|LL......../IL.Z....../ILZZ....../IJZ...SSOO/IJJJ.SS.OO|0.02
Basic MT|T|LL......../ILS......./ILSSJ...../IOOSJ..ZZ./IOOJJ...ZZ|0.02
Basic MT 2|T|IS......../ISS......./IJSLL...../IJOOL..ZZ./JJOOL...ZZ|0.02
Basic MT 3|T|ZZ......../IZZ......./IJJLL...../IJOOL.SS../IJOOLSS...|0.02
Basic MT 4|T|ZZ......../IZZ......./ILOOJ...../ILOOJ.SS../ILLJJSS...|0.02
Basic MT 5|T|ZZ......../JZZ......./JJJOO...../LLLOO.SS../LIIIISS...|0.02
Basic MT 6|T|JJ......../JLL......./JZLOO...../ZZLOO.SS../ZIIIISS...|0.02
LightBlue Dire Mondo|X|IJJ......./IJZZ....../IJSZZ...LL/ITSSOO...L/TTTSOO...L|0.02
LightBlue Dire Mondo 2|X|TTT......./ITSS....../ISSZZ...LL/IOOJZZ...L/IOOJJJ...L|0.02
LightBlue Dire Mondo 3|X|OOS......./OOSS....../JJZST...LL/JZZTTT...L/JZIIII...L|0.02
LightBlue Dire Mondo 4|X|IOO......./IOOZ....../IJZZS...LL/IJZTSS...L/JJTTTS...L|0.02
Spachispin|T|.Z......../ZZ.......I/Z....LLL.I/OO.SSLJJJI/OOSS....JI|0.02
ASMT|T|.Z......../ZZ.......I/Z.....LS.I/OO.JJJLSSI/OO...JLLSI|0.02
Sooyeyspin|T|.Z......../ZZ.......J/Z........J/OO.SSLLLJJ/OOSS.LIIII|0.02
Emilia Cannon|X|.T......../ITT......./IT...SSZZ./IOO.SSLJZZ/IOO.LLLJJJ|0.02
Emilia Cannon 2|X|.T......../ITT......./IT...ZJLS./IOO.ZZJLSS/IOO.ZJJLLS|0.02
OJI Honey Cup|X|.J......../.J.SS...../JJSSL....T/OOLLL.ZZTT/OOIIII.ZZT|0.02
MCD Spin|X|.JJ......./.J....T.../SJ.ZZTTLLL/SS..ZZTLOO/.S..IIIIOO|0.02
TSD Tower|X|.JJ......./.J....T.../.J.ZZ.TTSS/OO..ZZTSSL/OO.IIIILLL|0.02
Barrier-Spin|T|..Z......./IZZ......./IZ....LLL./IOO.SSLJJJ/IOOSS....J|0.02
Whirlpoo|X|..T......./ITTT....../IJJ....SLL/IJOO.ZZSSL/IJOO..ZZSL|0.02
Whirlpoo 2|X|..T......./ITTT....../ILS....OOJ/ILSS.ZZOOJ/ILLS..ZZJJ|0.02
Ham Pie Cannon|T|..Z......./IZZ......./IZ.....LS./IOO.JJJLSS/IOO...JLLS|0.02
Upside Down Table|X|..SS.....I/.SS.....ZI/JJLL...ZZI/JOOL...ZTI/JOOL...TTT|0.02
Upside Down Table 2|X|..SS.....I/.SS.....ZI/LOOJ...ZZI/LOOJ...ZTI/LLJJ...TTT|0.02
Duck Tss|T|..OO....../..OOZZ...I/...SSZZLLI/J.SS....LI/JJJ.....LI|0.02
Center Godspin|X|..LLL...../.ZL......I/ZZS.....JI/ZTSSOO..JI/TTTSOO.JJI|0.02
Unnamed bag 1 [b1-87ee140e]|X|.........J/.........J/........JJ/........LL/.ZOOS....L/ZZOOSS..TL/ZIIIIS.TTT|0.02
JD Cannon|T|........LL/.OO......L/.OO..J..SL/ZZ...JJJSS/.ZZ.IIII.S|0.02
GWTSD|T|...S....../...SS.Z.../....SZZ..J/OOLLLZ...J/OOLIIII.JJ|0.02
Surrealist S|T|...S....../...SS....I/....S.JJJI/ZZ.OOLLLJI/.ZZOOL...I|0.02
Unnamed bag 1 [t-spin-snaking-empty-field-setup]|X|...LL...../I...L...S./IJJ.L..ZSS/IJ..OOZZTS/IJ..OOZTTT|0.02
Note Stacking 2|X|...IT...../..ZITT..../.ZZIT....J/.ZLISSOO.J/LLLSS.OOJJ|0.02
Note Stacking 2 2|X|...ZZ...../..SSZZ..../.SSLT....J/.LLLTTOO.J/IIIIT.OOJJ|0.02
Chopin's Special TT|X|.....SS.../..ZZSSI.../L..ZZTI.../L.OOTTIJ../LLOO.TIJJJ|0.02
Perfect DT|T|...LL...../....L...../...ZLSS..J/OOZZSS...J/OOZIIII.JJ|0.02
Skim Cannon|T|....S.I.../....SSI.../.....SI.../OOJ.ZZILLL/OOJJJZZL..|0.02
Possibly AT CANNON, sources disagree|X|....L...../IS..L...../ISS.LL.T../IJSZZ.TTOO/IJJJZZ.TOO|0.02
Pokemon's STD|T|.....Z..../I...ZZ..../IL..ZJ..S./IL...JOOSS/ILL.JJOO.S|0.02
MIRROR|T|.....Z..../I...ZZ..../IJ..Z...LL/IJJJSS.OOL/I..SS..OOL|0.02
ADT Spin|T|.....OO.../I....OO.../I.ZLLL..../IZZLJJJ.SS/IZ....JSS.|0.02
TZR Opener|T|.....OO.../I....OO.../IJJ..S...Z/IJLLLSS.ZZ/IJL...S.Z.|0.02
TZR Opener 2|T|.....OO.../I....OO.../ILJ..S...Z/ILJJJSS.ZZ/ILL...S.Z.|0.02
Intspin|X|.....JJJ../.Z.....JL./ZZ....OOL./ZSST..OOLL/SSTTT.IIII|0.02
Intspin [b1-811dda55]|X|.....JJJ../.Z.....J.I/ZZ....OO.I/ZSST..OOLI/SSTTT.LLLI|0.02
Minloop 4|T|.........I/.Z..J..LLI/ZZSSJ.OOLI/ZSSJJ.OOLI|0.02
Appl Cannon|T|......OO../I.....OO../IJJ....ZZ./IJLLL.SSZZ/IJL..SS...|0.02
Appl Cannon 2|T|......OO../I.....OO../ILJ....ZZ./ILJJJ.SSZZ/ILL..SS...|0.02
WolfMoon Cannon|X|......JJJI/...Z....JI/..ZZ....LI/OOZSST..LI/OOSSTTT.LL|0.02
Partial bag 1 [b1-bb433285]|T|......LLL./......LOO./......ZOO./.....ZZSS./.....ZSS..|0.02
Motchi Vriw|X|JJSS....../JSS......I/JZ.....L.I/ZZT..OOL.I/ZTTT.OOLLI|0.02
Shipwreck Galleon Stacking|T|.......Z../I.....ZZ../I...OOZ.../IJJJOOSS.L/I..J.SSLLL|0.02
Shipwreck Galleon Stacking 2|X|........OO/........OO/........SS/.......SSL/.......LLL/.T.......I/TT.......I/JTZZ.....I/JJJZZ....I|0.02
Alpine Stacking|T|.........L/.....J.LLL/.....JJJOO/....IIIIOO|0.02
Alpine Stacking 2|T|.........I/.....J.LLI/.....JOOLI/....JJOOLI|0.02
Iwossoleo|X|.......T../......TTTI/.SS.....JI/SSLOO...JI/LLLOO..JJI|0.02
Pi cannon|X|..T......./ITTT....../IZZ....LS./IJZZ.OOLSS/IJJJ.OOLLS|0.02
SeaL|T|.......LL./........LI/JJ.....SLI/JOO..ZZSSI/JOO...ZZSI|0.02
Unnamed bag 1 [stsd-empty-field-setup]|T|JJZ......./JZZ......./JZ.....LS./OO.....LSS/OO.IIIILLS|0.02
Beta DDT|X|.......LLI/JJ....OOLI/J.....OOLI/JSST...ZZI/SSTTT...ZZ|0.02
Beta DDT [b1-197c4750]|X|.......OOI/JJ....SOOI/J.....SSLI/JT...ZZSLI/TTT...ZZLL|0.02
Unnamed bag 1 [mdpc]|T|........S./I.......SS/IJJ.ZZ...S/IJLLLZZ.OO/IJL.....OO|0.02
Unnamed bag 1 [mdpc] 2|T|........S./I.......SS/ILJ.ZZ...S/ILJJJZZ.OO/ILL.....OO|0.02
Nyaspin|T|........L./I.......L./IJJZ....LL/IJZZSS..OO/IJZSS...OO|0.02
\u8E0F\u5207\u7A4D\u307F|T|.Z......../ZZ.......I/Z...SS.LLI/OO.SSJJJLI/OO.....JLI|0.02
LaundrySpin (X+)|T|........S./I.......SS/IJJLLL...S/IJ.L.ZZ.OO/IJ....ZZOO|0.02
F-Spin (X+)|X|........T./...I...TTT/ZZ.I....SS/JZZIOO.SSL/JJJIOO.LLL|0.02
F-Spin 2 (X+)|X|........T./...I...TTT/LS.I....ZJ/LSSIOO.ZZJ/LLSIOO.ZJJ|0.02
Elephant TT|X|........SS/.......SSI/ZZ.L....TI/JZZL.OOTTI/JJJLLOO.TI|0.02
Elephant TT 2|X|........SS/.......SST/JJ.L....TT/JLLL.OOZZT/JIIIIOO.ZZ|0.02
ISM Cannon|X|........OO/........OO/T..SS.ZZLL/TTSS..JZZL/TIIII.JJJL|0.02
\u685F\u6A4BTSM|T|........LL/I........L/IJJ.....SL/IJOO..ZZSS/IJOO...ZZS|0.02
Skiris Stacking|X|.........T/I.......TT/IZZ....LST/IJZZOO.LSS/IJJJOO.LLS|0.02
Misfire|T|I....ZZ.../I.....ZZSS/IJJJ.OOSSL/I..J.OOLLL|0.02
Wrench PC|T|I....SS.../ILJ.SS..../ILJJJZZ.OO/ILL...ZZOO|0.02
Note Stacking|T|.L...Z...J/.L..ZZOO.J/.LL.Z.OOJJ|0.02
Note Stacking 2|X|I....TTT../ILS..ZT..J/ILSSZZOO.J/ILLSZ.OOJJ|0.02
Unnamed bag 1 [mko-stacking-2]|T|..IS.....Z/..ISS...ZZ/OOIJS...ZL/OOIJJJ.LLL|0.02
Acidic MT|T|.......ZOO/......ZZOO/.SSLLLZJJJ/SS.L.IIIIJ|0.02
DC-Spin|X|I.......S./IJJ.LLL.SS/IJOOLT.ZZS/IJOOTTT.ZZ|0.02
DC-Spin 2|X|I.......S./IOO.TTT.SS/IOOLJT.ZZS/ILLLJJJ.ZZ|0.02
SBSD|T|I.......SS/I......SSJ/I...ZZ...J/I....ZZ.JJ|0.02
SBSD 2|T|I.......SS/I..L...SSJ/IOOLZZ...J/IOOLLZZ.JJ|0.02
SZ Cross|X|I........./IJJLLSTTTZ/IJOOLSSTZZ/IJOOL.S.Z.|0.02
SZ Cross 2|X|I........./ILOOJSTTTZ/ILOOJSSTZZ/ILLJJ.S.Z.|0.02
SZ Cross 3|X|J........./JJJOO.Z.S./LLLOOZZTSS/LIIIIZTTTS|0.02
SZ Cross 4|X|I........./ILOOJ.Z.S./ILOOJZZTSS/ILLJJZTTTS|0.02
Plate TD|X|LS.OO...../LSSOO....J/LLSZZ.TTTJ/IIIIZZ.TJJ|0.02
TS6|T|IS..OO..../ISS.OO..../IJSZZ....L/IJJJZZ.LLL|0.02
Minloop 3|X|.........I/T...J..LLI/TTSSJ.OOLI/TSSJJ.OOLI|0.02
SIO loop|X|ZZ......../TZZ...LJJ./TTSSLLLJOO/TSSIIIIJOO|0.02
SIO loop 2|X|IS......../ISS...TOO./IJSZZTTOOL/IJJJZZTLLL|0.02
SIO loop 3|X|IT......../ITTZZLLJJJ/ITSSZZLOOJ/ISS...LOO.|0.02
Fiddlesworth|T|.S.....LLI/.SSJ....LI/OOSJ..ZZLI/OOJJ...ZZI|0.02
Partial bag 1 [b1-df930390]|T|I......SS./I.....SSL./I..ZZ.OOL./I...ZZOOLL|0.02
Partial bag 1 [b1-df930390] 2|T|IJJ....OO./IJ....LOO./IJSS..LZZ./ISS...LLZZ|0.02
Partial bag 1 [b1-df930390] 3|T|LLL....OO./LZ....JOO./ZZSS..JJJ./ZSS...IIII|0.02
Jigsaw PC Loop|T|ILLL....../ILZ......./IZZSSOOJJJ/IZSS.OO..J|0.02
Unnamed bag 1 [b1-2ef2b5e6]|X|IZZ......./ITZZ....../ITTSSOOJJJ/ITSS.OO..J|0.02
\u958B\u5E55\u30D1\u30D5\u30A7\u7A4D\u307F(\u7AEF\u3042\u3051\u578B)|X|IIIIZT..../JJJZZTT.../OOJZLTSS../OOLLLSS...|0.02
\u958B\u5E55\u30D1\u30D5\u30A7\u7A4D\u307F(\u7AEF\u3042\u3051\u578B) 2|X|LLLOOT..../LZJOOTT.../ZZJJJTSS../ZIIIISS...|0.02
Unnamed bag 1 [b1-3e134188]|T|.ZZ......./OOZZ...SLL/OOJJJ..SSL/IIIIJ...SL|0.02
Unnamed bag 1 [b1-3e134188] 2|T|.ZJ......./ZZJS...LLL/ZJJSS..LOO/IIIIS...OO|0.02
Unnamed bag 1 [b1-3e134188] 3|T|.SS......./SSZZ...OOJ/LLLZZ..OOJ/LIIII...JJ|0.02
Unnamed bag 1 [b1-3e134188] 4|T|.LL......./OOLS...JJJ/OOLSS..ZZJ/IIIIS...ZZ|0.02
Chocobar V3 3|X|.SS......./SSZZ...TLL/OOJZZ.TTTL/OOJJJIIIIL|0.02
True Meteor's Path|X|..I.....Z./S.IJJLLZZ./SSIJOOLZT./.SIJOOLTTT|0.02
True Meteor's Path 2|X|..I.....Z./S.ILOOJZZ./SSILOOJZT./.SILLJJTTT|0.02
Periscope|T|..JJ.....I/.ZJ......I/ZZJL.SSOOI/ZLLLSS.OOI|0.02
Unnamed bag 1 [dpc-1]|T|.Z......../ZZ.......I/Z...LLOOJI/OO.SSLOOJI/OOSS.L.JJI|0.02
Unnamed bag 1 [dpc-1] 2|T|.Z......../ZZ.......I/Z...IIIIJI/OO.SSLLLJI/OOSS.L.JJI|0.02
Unnamed bag 1 [dpc-2]|T|..Z......./IZZ......./IZ...LLJJJ/IOO.SSLOOJ/IOOSS.LOO.|0.02
Unnamed bag 1 [dpc-2] 2|T|..Z......./IZZ......./IZ...LLJJZ/IOO.SSLJZZ/IOOSS.LJZ.|0.02
Unnamed bag 1 [dpc-2] 3|T|..Z......./IZZ......./IZ...IIIIL/IOO.SSJLLL/IOOSS.JJJ.|0.02
Unnamed bag 1 [dpc-3]|T|OO..SSZ.../OO.SSZZ..J/OOLLLZ...J/OOLIIII.JJ|0.02
Unnamed bag 1 [dpc-4]|T|L........./L..Z.....I/LLZZSS..JI/OOZSS...JI/OOIIII.JJI|0.02
Unnamed bag 1 [dpc-5]|T|OO...SZZ../OOL..SSZZ./LLL...SJJJ/IIII.IIIIJ|0.02
Unnamed bag 1 [dpc-5] 2|T|OO...SZZ../OOL..SSZZ./OOL...SJJJ/OOLL.IIIIJ|0.02
Unnamed bag 1 [dpc-5] 3|T|ZZ...OOS../JZZ..OOSS./JJJ...SSSL/IIII.SSLLL|0.02
Unnamed bag 1 [dpc-5] 4|T|IS...SZZ../ISS..SSZZ./IJS...SLOO/IJJJ.LLLOO|0.02
Unnamed bag 1 [dpc-6]|T|.........I/.........I/...Z.....I/OOZZ..JJJI/OOZ...SSJL/IIII.SSLLL|0.02
Unnamed bag 1 [dpc-7]|T|....J...../....JJJ.../IIIILS...Z/OOLLLSS.ZZ/OOIIIIS.Z.|0.02
Unnamed bag 1 [dpc-7] 2|T|....J...../....JJJ.../OOLLLS...Z/OOLZZSS.ZZ/IIIIZZS.Z.|0.02
Unnamed bag 1 [dpc-9]|T|...OO...../I..OO...../I...SSZZLL/IJ.SSSSZZL/IJJJSS...L|0.02
Unnamed bag 1 [dpc-10]|T|.........I/J......LLI/JJJSS...LI/OOSSZZ.JLI/OO...ZZJJJ|0.02
Unnamed bag 1 [dpc-10] 2|T|.........L/I......LLL/IJJSS...OO/IJSSZZ.JOO/IJ...ZZJJJ|0.02
Unnamed bag 1 [dpc-11]|T|.J.......I/.J.....LLI/JJSZZ...LI/OOSSZZ.JLI/OO.S...JJJ|0.02
Unnamed bag 1 [dpc-12]|T|...LL.Z..I/S...LZZOOI/SS.JLZJOOI/.S.JJJJJJI|0.02
Unnamed bag 1 [dpc-14]|T|I...SSZ.../IOOSSZZ..J/IOOLJZ...J/ILLLJJJ.JJ|0.02
Unnamed bag 1 [dpc-16]|T|I........L/I......LLL/IJSZZ...OO/IJSSZZ.JOO/JJ.S...JJJ|0.02
Unnamed bag 1 [dpc-17]|X|...S....../I..SS....L/I...SZZLLL/IJ.TTTZZOO/IJJJT...OO|0.02
Unnamed bag 1 [dpc-18]|X|IJJ.....S./IJ...ZOOSS/IJT.ZZOOLS/ITTTZ.LLL.|0.02
Unnamed bag 1 [dpc-19]|X|OO......../OO......../LLLIIII..J/LSSTZZ...J/SSTTTZZ.JJ|0.02
Unnamed bag 1 [dpc-22]|T|.........I/.........I/...SZZ...I/L..SSZZ..I/L...SJJJOO/LL.IIIIJOO|0.02
Unnamed bag 1 [dpc-23]|T|........OO/........OO/I........I/ISZZLLJJ.I/ISSZZLJ..I/I.S..LJ..I|0.02
Unnamed bag 1 [dpc-24]|T|J........./JJJ......I/LS...ZLLLI/LSS.ZZLOOI/LLS.Z..OOI|0.02
Unnamed bag 1 [dpc-25]|T|J........./JJJ......I/LS...ZLOOI/LSS.ZZLOOI/LLS.Z.LL.I|0.02
Unnamed bag 1 [dpc-26]|T|..Z......./.ZZ......I/SZ...SSLLI/SSJ.SSOOLI/.SJJJ.OOLI|0.02
Unnamed bag 1 [dpc-27]|T|........J./..LOO...J./.ZLOO..JJJ/ZZLL...SSJ/ZIIII.SSJJ|0.02
Unnamed bag 1 [dpc-27] 2|T|........L./..SSZ...L./.SSZZ..JLL/LLLZ...JOO/LIIII.JJOO|0.02
Unnamed bag 1 [dpc-28]|X|LL......../IL......../IL......../I...SSZOOJ/IT.SSZZOOJ/TTT..Z..JJ|0.02
Unnamed bag 1 [dpc-29]|X|........OO/........OO/........LL/IIIIZS...L/JJJZZSS.TL/..JZ..STTT|0.02
Unnamed bag 1 [dpc-31]|X|......J..I/......JOOI/L....JJOOI/LZZ...SSTI/LLZZ.SSTTT|0.02
Unnamed bag 1 [dpc-32]|X|.........I/.........I/....ZZ...I/OO...ZZLSI/OOT.JLLLSS/.TTTJJJ..S|0.02
Unnamed bag 1 [dpc-33]|T|.......S.I/.......SSI/.OOL..ZZSI/JOOL...ZZI/JJJLL.IIII|0.02
Unnamed bag 1 [dpc-34]|T|.ZJ..LLL../ZZJ..LOOS./ZJJ...OOSS/IIII.IIIIS|0.02
Unnamed bag 1 [dpc-34] 2|T|.OO..SZZ../JOO..SSZZ./JJJ...SLOO/IIII.LLLOO|0.02
Unnamed bag 1 [dpc-34] 3|T|.ZJ..OOS../ZZJ..OOSS./ZJJ...SSSL/IIII.SSLLL|0.02
Unnamed bag 1 [dpc-37]|T|J........./JJJ......./LS...ZIIII/LSS.ZZOOOO/LLS.Z.OOOO|0.02
Unnamed bag 1 [dpc-38]|T|OO......../OO......../I........./I.ZZJJJSLL/I..ZZLJSSL/I..LLL..SL|0.02
Unnamed bag 1 [dpc-39]|T|OO......../OO......../I........./I.LLJJSSZJ/I..LJSSZZJ/I..LJ..ZJJ|0.02
Unnamed bag 1 [dpc-40]|T|OO......../OO......../I........./I.JJJSZZLL/I..JJSSZZL/I..JJJS..L|0.02
Unnamed bag 1 [dpc-41]|T|I.....SS../IJJZZSS.../IJOOZZSS.L/IJOO.SSLLL|0.02
Unnamed bag 1 [dpc-46]|T|...SZZ.OO./L..SSZZOO./L...SJJJOO/LL.IIIIJOO|0.02
Unnamed bag 1 [dpc-46] 2|T|...OOJ.SS./L..OOJSSS./L...JJZZSS/LL.IIIIZZS|0.02
Unnamed bag 1 [dpc-68]|T|.......OO./..Z....OO./.ZZ..IIIIL/JZ...SSLLL/JJJ.SSIIII|0.02
Unnamed bag 1 [dpc-68] 2|T|.......OO./..Z....OO./.ZZ..OOSLL/JZ...OOSSL/JJJ.IIIISL|0.02
Unnamed bag 1 [dpc-70]|T|......OO../.J....OO../LJJJ...SSZ/LIIII.SSZZ/LL..IIIIZ.|0.02
Unnamed bag 1 [dpc-71]|T|..Z..IIII./.ZZ..OOSLL/JZ...OOSSL/JJJ.IIIISL|0.02
Unnamed bag 1 [dpc-71] 2|T|..Z..OOOO./.ZZ..OOOOL/JZ...SSLLL/JJJ.SSIIII|0.02
Unnamed bag 1 [dpc-71] 3|T|..Z..OOLS./.ZZ..OOLSS/JZ...SSLLS/JJJ.SSIIII|0.02
Unnamed bag 1 [dpc-75]|T|.Z..IIII../ZZ...JJJOO/ZSS.LLLJOO/SS..LIIII.|0.02
Unnamed bag 1 [dpc-75] 2|T|.Z..IIII../ZZ...LLJJJ/ZSS.OOLOOJ/SS..OOLOO.|0.02
Unnamed bag 1 [dpc-75] 3|T|.Z..IIII../ZZ...SSJJJ/ZSS.SSLOOJ/SS..LLLOO.|0.02
Unnamed bag 1 [dpc-78]|T|S........./SS...JZZ../LS...JSZZ./L...JJSSOO/LL.IIIISOO|0.02
Unnamed bag 1 [dpc-79]|T|S........./SS...OOJ../LS...OOJS./LZZ...JJSS/LLZZ.IIIIS|0.02
Unnamed bag 1 [dpc-81]|T|.......J../..L...SJJJ/.ZL...SSOO/ZZLL...SOO/ZIIII.IIII|0.02
Unnamed bag 1 [dpc-84]|T|I........./IJJJ...S../IOOJ...SS./IOOZZ...SL/IIIIZZ.LLL|0.02
Unnamed bag 1 [dpc-84] 2|T|S........./SSOO...S../JSOO...SS./JJJZZ...SL/IIIIZZ.LLL|0.02
Unnamed bag 1 [dpc-86]|T|J........./JJJZ...S../OOZZ...SS./OOZ...SSSL/IIII.SSLLL|0.02
Unnamed bag 1 [dpc-88]|T|.........J/...SZZ...J/L..SSZZ.JJ/L...SJJJOO/LL.IIIIJOO|0.02
Unnamed bag 1 [dpc-92]|T|........J./...SZZ..J./L..SSZZJJ./L...SJJJOO/LL.IIIIJOO|0.02
Unnamed bag 1 [dpc-94]|T|........L./...S..LLL./L..SSOOZZ./L...SOOJZZ/LL.IIIIJJJ|0.02
Unnamed bag 1 [dpc-95]|T|...L....../.LLL...S../JJZOO..SS./JZZOO...SL/JZIIII.LLL|0.02
Unnamed bag 1 [dpc-101]|T|.SS.....LL/SS...IIIIL/OOJ.JJJZZL/OOJJJ.J.ZZ|0.02
Unnamed bag 1 [dpc-102]|T|OO.JJ...../OOLJ...SSZ/LLLJJ.SSZZ/IIIIJJJ.Z.|0.02
Unnamed bag 1 [dpc-104]|T|I...L...../I.LLL...../IJJJ...SSZ/IJJOO.SSZZ/JJJOO...Z.|0.02
Unnamed bag 1 [dpc-9001]|T|..Z......./IZZ......./IZ...LLOOJ/IOO.SSLOOJ/IOOSS.L.JJ|0.02
Unnamed bag 1 [dpc-9002]|X|.........I/JJ..S....I/J...SSLLLI/JT.OOSLZZI/TTTOO...ZZ|0.02
Unnamed bag 1 [dpc-9005]|T|...OO...../...OOLLL../S...ZLIIII/SS.ZZSSJJJ/.S.ZSS...J|0.02
Unnamed bag 1 [dpc-9006]|T|......S.../......SSJJ/IIII...SJJ/LLLZZ.OOJJ/L...ZZOOJJ|0.02
Unnamed bag 1 [dpc-9007]|X|........L./IJJ.....L./IJ...ZOOLL/IJT.ZZOOSS/ITTTZ..SS.|0.02
Unnamed bag 1 [dpc-9008]|X|IIII....../LLL...ZJJJ/LSST.ZZOOJ/SSTTTZ.OO.|0.02
\u6050\u7E2E\u7A4D\u307F(\u5F621)|X|IL......../ILZZ....../ILLZZ..J../ISST...JOO/SSTTT.JJOO|0.02
\u6050\u7E2E\u7A4D\u307F(\u5F621) 2|X|OO......../OOZZ....../LLLZZ..J../LSST...JJJ/SSTTT.IIII|0.02
Unnamed bag 1 [dpc-9010]|T|...L....../.LLL....../SZZ...SSOO/SSZZ.SSJOO/.SIIII.JJJ|0.02
Unnamed bag 1 [dpc-9010] 2|T|...L....../.LLL....../SZZ...IIII/SSZZ.JJJOO/.SIIII.JOO|0.02
Unnamed bag 1 [dpc-9012]|T|OO......../OO......../I........./I.LLJJZJJJ/I..LJZZSSJ/I..LJZSS..|0.02
Unnamed bag 1 [dpc-9013]|T|.........I/.J.......I/.J.......I/JJL..ZZ.SI/OOL...ZZSS/OOLL.IIIIS|0.02
Unnamed bag 1 [dpc-9014]|T|...SS...../..SS....../..JJJ...../.ZOOJ....L/ZZOO...LLL/ZIIII.IIII|0.02
Unnamed bag 1 [dpc-9015]|T|.......S.I/.......SSI/JJ.L..ZZSI/JOOL...ZZI/JOOLL.IIII|0.02
Unnamed bag 1 [dpc-9016]|T|........OO/........OO/.....S..JI/L....SS.JI/LZZ...SJJI/LLZZ.IIIII|0.02
Unnamed bag 1 [dpc-9016] 2|T|........OO/........OO/.....S..OO/L....SS.OO/LZZ...SJJJ/LLZZ.IIIIJ|0.02
Unnamed bag 1 [dpc-9017]|T|.........J/.....IIIIJ/SZZ...SSJJ/SSZZ.SSLOO/.S...LLLOO|0.02
Unnamed bag 1 [dpc-9018]|T|.......L../.....LLLOO/SZZ...SSOO/SSZZ.SSJJJ/.S...IIIIJ|0.02
Unnamed bag 1 [dpc-9019]|T|S........./SSOO.....I/LSOO....JI/LZZ...SSJI/LLZZ.SSJJI|0.02
Unnamed bag 1 [dpc-9020]|T|S........./SS.....ZOO/LS....ZZOO/L...SSZJJJ/LL.SSIIIIJ|0.02
Unnamed bag 1 [dpc-9021]|T|...OOSZZ../L..OOSSZZ./L...SSSJJJ/LL.SSIIIIJ|0.02
Unnamed bag 1 [dpc-9022]|T|.........Z/I...OO..ZZ/IL..OO..ZJ/IL...SSSSJ/ILL.SSSSJJ|0.02
Unnamed bag 1 [dpc-9023]|T|S........./SS......../IS.OO...../IL.OO....J/ILZZ...SSJ/ILLZZ.SSJJ|0.02
Unnamed bag 1 [dpc-9024]|T|........OO/........OO/........JJ/L..ZZ.S.JJ/L...ZZSSJJ/LL.IIIISJJ|0.02
Unnamed bag 1 [dpc-9025]|T|.....S.OOJ/L..ZZSSOOJ/L...ZZSJJJ/LL.IIIIJJJ|0.02
Unnamed bag 1 [dpc-9026]|T|.........Z/....S...ZZ/....SS..ZI/....LS..JI/OOLLL...JI/OOIIII.JJI|0.02
Unnamed bag 1 [dpc-9027]|X|.L......../.L......../.LL......I/OO...SSZJI/OOT.SSZZJI/.TTT..ZJJI|0.02
Unnamed bag 1 [dpc-9028]|X|........OO/..L.....OO/..L......I/.ZLL....JI/ZZT...SSJI/ZTTT.SSJJI|0.02
Unnamed bag 1 [dpc-9029]|X|I........./I.......J./I....S..J./IZ...SSJJ./ZZT...SLOO/ZTTT.LLLOO|0.02
Unnamed bag 1 [dpc-9030]|X|I........./IOO......./IOO......./IZ...SSJJJ/ZZT.SSLLLJ/ZTTT..L...|0.02
Unnamed bag 1 [dpc-9031]|X|LLL......I/LZ...SSOOI/ZZT.SSJOOI/ZTTT..JJJI|0.02
Unnamed bag 1 [dpc-9032]|T|.......S../..Z....SSI/.ZZ..JOOSI/JZ...JOOLI/JJJ.JJLLLI|0.02
Unnamed bag 1 [dpc-9033]|T|I........./IL......../IL..Z...../ILLZZ....J/OOJZ...SSJ/OOJJJ.SSJJ|0.02
Unnamed bag 1 [dpc-9034]|T|.........J/..Z...SS.J/.ZZ..SSLJJ/JZ...LLLOO/JJJ.IIIIOO|0.02
Unnamed bag 1 [dpc-9035]|X|.TTT.....I/OOT...JJJI/OOSS.LZZJI/.SSLLL.ZZI|0.02
Unnamed bag 1 [dpc-9036]|X|.........I/.........I/JJ.......I/J...ZZLLSI/JT.OOZZLSS/TTTOO..L.S|0.02
Unnamed bag 1 [dpc-9037]|X|I........./I........./I....S.J../IZ...SSJJJ/ZZT...SLOO/ZTTT.LLLOO|0.02
Unnamed bag 1 [dpc-9038]|X|I........./I...SZZ.../I...SSZZOO/IT...SLJOO/TTT.LLLJJJ|0.02
Unnamed bag 1 [dpc-9039]|X|LL......../IL......../IL......../I...SSZJJJ/IT.SSZZOOJ/TTT..Z.OO.|0.02
Unnamed bag 1 [dpc-9041]|T|.....S..../.....SS..I/SLL...SOOI/SSLJ.ZZOOI/.SLJJJZZ.I|0.02
Unnamed bag 1 [dpc-9042]|T|.JJ......./.J......../.JLOO...../.ZLOO....J/ZZLL...SSJ/ZIIII.SSJJ|0.02
Unnamed bag 1 [dpc-9045]|T|.....OO.../....ZOO.../.SSZZSS..J/SSLZSS...J/LLLIIII.JJ|0.02
Unnamed bag 1 [dpc-9046]|X|OO......../OO......ZJ/LLL....ZZJ/LT...SSZJJ/TTT.SSIIII|0.02
Unnamed bag 1 [dpc-9048]|T|J........./JJJ......./OO...ZIIII/OOL.ZZSSSS/LLL.ZSSSS.|0.02
Unnamed bag 1 [dpc-9049]|T|..L......./LLL......./JJ...ZIIII/JOO.ZZSSSS/JOO.ZSSSS.|0.02
Unnamed bag 1 [dpc-9050]|T|..L......./LLL......./JJ...IIIIZ/JOO.SSSSZZ/JOOSSSS.Z.|0.02
Unnamed bag 1 [dpc-9051]|T|I........./I...Z...../I..ZZ...../ISSZ...JJJ/SSLOO.JJJJ/LLLOO...J.|0.02
Unnamed bag 1 [b1-c2851890]|X|.........Z/........ZZ/.......SZI/.OOL...SSI/JOOL...TSI/JJJLL.TTTI|0.02
Partial bag 1 [alternative-minimal-tpc]|X|.Z.......I/ZZS.L...JI/ZTSSL...JI/TTTSLL.JJI|0.02
Partial bag 1 [b1-81dbf7de]|X|.........J/.Z.......J/ZZS.....JJ/ZTSS...LOO/TTTS.LLLOO|0.02
Partial bag 1 [b1-b353b4fd]|X|.Z......OO/ZZS..J..OO/ZTSS.J...L/TTTSJJ.LLL|0.02
Partial bag 1 [no-j-sprint-tpc]|X|I.......T./I....J.ZTT/IOO..JZZTL/IOO.JJZLLL|0.02
Partial bag 1 [no-j-sprint-tpc] 2|X|I.......S./I....J.ZSS/IOO..JZZTS/IOO.JJZTTT|0.02
Partial bag 1 [tsd-dpc-tpc]|T|I........./I...SSZOO./IJ.SSZZOOL/IJJJ.Z.LLL|0.02
Partial bag 1 [no-t-tpc]|T|I........./I........./IJL..S..../IJLZZSSOO./JJLLZZSOO.|0.02
Partial bag 1 [no-s-skim-tsd-tpc]|X|I.......L./IJJ...LLLT/IJOO..ZZTT/IJOO...ZZT|0.02
Partial bag 1 [anti-pco-heart-tpc]|X|ILLL....../ILZ.....OO/IZZT...JOO/IZTTT..JJJ|0.02
Partial bag 1 [anti-pco-heart-tpc] 2|X|ITTT....../ILT.....OO/ILZZ...JOO/ILLZZ..JJJ|0.02
Partial bag 1 [anti-pco-heart-tpc] 3|X|IIII....../JJJ.....SS/OOJT...SSL/OOTTT..LLL|0.02
Partial bag 1 [anti-pco-heart-tpc] 4|X|JJSS....../JSS.....LL/JTZZ...OOL/TTTZZ..OOL|0.02
Partial bag 1 [anti-pco-heart-tpc] 5|X|STTT....../SST.....LL/JSZZ...OOL/JJJZZ..OOL|0.02
Partial bag 1 [anmitsu-special-tpc]|X|JJ......../J........./J........./L....SS..T/L...SSZZTT/LL.IIIIZZT|0.02
Partial bag 1 [crepe-tpc]|X|......IS../L....TISS./L.ZZTTIJS./LL.ZZTIJJJ|0.02
Partial bag 1 [crepe-tpc] 2|X|......JJ../L....TJOO./L.ZZTTJOO./LL.ZZTIIII|0.02
Partial bag 1 [crepe-tpc] 3|X|......SS../L....SSOO./L.ZZTTTOO./LL.ZZTIIII|0.02
Partial bag 1 [ml-no-t-tpc]|T|LLL.....SS/LZOO...SSJ/ZZOO.....J/ZIIII...JJ|0.02
Partial bag 1 [pc-spin-okey-version-tpc]|X|L....TJJ../L.ZZTTJOO./LL.ZZTJOO.|0.02
Partial bag 1 [b1-19a95b65]|X|I........./IT...J..../ITTSSJ..../ITSSJJ....|0.02
Partial bag 1 [b1-19a95b65] 2|X|T........./TT...L..../TSSLLL..../SSIIII....|0.02
Partial bag 1 [b1-19a95b65] 3|X|S........./SS...T..../JSZZTT..../JJJZZT....|0.02
Partial bag 1 [b1-19a95b65] 4|X|I........./IL...J..../ILTTTJ..../ILLTJJ....|0.02
Partial bag 1 [b1-9bf3f96d]|X|.........T/........TT/J......ZZT/JJJ.IIIIZZ|0.02
Partial bag 1 [heart-pco-2nd]|X|.........T/JJ......TT/JOO....ZZT/JOO.....ZZ|0.02
Partial bag 1 [heart-pco-2nd] 2|X|.........I/JJ......TI/JOO....TTI/JOO.....TI|0.02
Partial bag 1 [heart-pco-2nd] 3|X|.........I/OO......TI/OOL....TTI/LLL.....TI|0.02
Partial bag 1 [heart-pco-2nd] 4|X|.........I/ZZ......TI/JZZ....TTI/JJJ.....TI|0.02
Partial bag 1 [heart-pco-2nd] 5|X|.........I/LS......TI/LSS....TTI/LLS.....TI|0.02
Partial bag 1 [heart-pco-2nd] 6|X|.........T/OO......TT/OOL....ZZT/LLL.....ZZ|0.02
Partial bag 1 [heart-pco-2nd] 7|X|.........T/LS......TT/LSS....ZZT/LLS.....ZZ|0.02
Partial bag 1 [b1-821988a5]|X|.........I/JJ.......I/JOO...T..I/JOO..TTT.I|0.02
Partial bag 1 [b1-821988a5] 2|X|.........I/OO.......I/OOL...T..I/LLL..TTT.I|0.02
Partial bag 1 [b1-821988a5] 3|X|.........I/ZZ.......I/JZZ...T..I/JJJ..TTT.I|0.02
Partial bag 1 [b1-821988a5] 4|X|.........I/LS.......I/LSS...T..I/LLS..TTT.I|0.02
Partial bag 1 [b1-fdfc8c4d]|X|........OO/.SST...JOO/SSTTT..JJJ|0.02
Partial bag 1 [b1-fdfc8c4d] 2|X|........ZJ/.SST...ZZJ/SSTTT..ZJJ|0.02
Partial bag 1 [b1-fdfc8c4d] 3|X|........OO/.TZZ...JOO/TTTZZ..JJJ|0.02
Partial bag 1 [b1-fdfc8c4d] 4|X|........LL/.TZZ...OOL/TTTZZ..OOL|0.02
Partial bag 1 [b1-fdfc8c4d] 5|X|........SS/.TZZ...SSL/TTTZZ..LLL|0.02
Partial bag 1 [tisz-hat-2nd]|X|......SS../...ZZSST../IIIIZZTTT.|0.02
Partial bag 1 [tisz-hat-2nd] 2|X|......JL../...TTTJL../IIIITJJLL.|0.02
Partial bag 1 [tisz-hat-2nd] 3|X|......TL../...ZZTTL../IIIIZZTLL.|0.02
Partial bag 1 [tjlo-2nd]|X|L.....J.../L..T..JOO./LLTTTJJOO.|0.02
Partial bag 1 [jlsz-2nd]|T|S........./SS......../JSZZ.....L/JJJZZ..LLL|0.02
Partial bag 1 [sneakers-2nd]|T|..J..S..../OOJJJSS.../OOIIIIS...|0.02
Partial bag 1 [sneakers-2nd] 2|T|..L..S..../LLLZZSS.../IIIIZZS...|0.02
Partial bag 1 [sneakers-2nd] 3|T|..L..S..../OOLZZSS.../OOLLZZS...|0.02
Partial bag 1 [tijo-early-s-save-o-qb-2nd]|X|.OO..T...J/.OO..TT..J/IIII.T..JJ|0.02
Partial bag 1 [hat-mound-early-s-qb-2nd]|X|..OO....../..OO..SST./.IIIISSTTT|0.02
Partial bag 1 [hat-mound-early-s-qb-2nd] 2|X|..JL....../..JL..SST./.JJLLSSTTT|0.02
Partial bag 1 [hat-broken-mound-early-z-qb-2nd]|X|.......OO./..T..SSOO./.TTTSSIIII|0.02
Partial bag 1 [hat-broken-mound-early-z-qb-2nd] 2|X|.......JL./..T..SSJL./.TTTSSJJLL|0.02
Partial bag 1 [tisz-hat-2nd-2]|X|.ZZ......./.TZZSS..../TTTSSIIII.|0.02
Partial bag 1 [heart-butter-tower-2nd]|T|........OO/......SSOO/.....SSJJJ/.....IIIIJ|0.02
Partial bag 1 [heart-butter-tower-2nd] 2|T|........LL/......ZOOL/.....ZZOOL/.....ZIIII|0.02
Partial bag 1 [heart-butter-tower-2nd] 3|T|........OO/......ZJOO/.....ZZJJJ/.....ZIIII|0.02
Partial bag 1 [heart-butter-tower-2nd] 4|T|........SS/......ZSSL/.....ZZLLL/.....ZIIII|0.02
Partial bag 1 [shoe-vertical-i-2nd]|T|IS......../ISS......./IJSZZ...../IJJJZZ....|0.02
Partial bag 1 [shoe-vertical-i-2nd] 2|T|OO......../OOL......./LLLZZ...../IIIIZZ....|0.02
Partial bag 1 [shoe-vertical-i-2nd] 3|T|JJ......../JOO......./JOOZZ...../IIIIZZ....|0.02
Partial bag 1 [shoe-vertical-i-2nd] 4|T|LS......../LSS......./LLSZZ...../IIIIZZ....|0.02
Partial bag 1 [shoe-o-2nd]|T|S........./SS......../JSZZ....OO/JJJZZ...OO|0.02
Partial bag 1 [sneakers-split-2nd]|T|......Z..J/OO...ZZSSJ/OO...ZSSJJ|0.02
Partial bag 1 [sneakers-split-2nd] 2|T|......Z..L/OO...ZZLLL/OO...ZIIII|0.02
Partial bag 1 [simple-6th-pc]|X|I.....ZZLL/IJJ....ZZL/IJ....SSTL/IJ...SSTTT|0.02
Partial bag 1 [simple-6th-pc] 2|X|I.....TTTZ/IJJ....TZZ/IJ....SSZL/IJ...SSLLL|0.02
Partial bag 1 [simple-6th-pc] 3|X|J.....ZZLL/JJJ....ZZL/OO....SSTL/OO...SSTTT|0.02
Partial bag 1 [simple-6th-pc] 4|X|J.....TTTZ/JJJ....TZZ/OO....SSZL/OO...SSLLL|0.02
Partial bag 1 [heart-i-7th]|T|.OO......./.OO......./.Z......../ZZSSJIIIIL/ZSS.JJJLLL|0.02
Camel|X|.....T..I./.Z..TT..I./ZZ...TLLIJ/ZSS..OOLIJ/SS...OOLJJ|0.02
Can Opener|T|.SS..LLL../SS...L..../OOJ.ZZIIII/OOJJJZZ...|0.02
Carl|X|........L./ZZ....LLLI/TZZ....OOI/TTSS..JOOI/TSS...JJJI|0.02
Ceiling Fan Spin|X|.T......../.TT....LL./.T......LI/JJ.....SLI/JOO..ZZSSI/JOO...ZZSI|0.02
Chargespin NEO|T|.LLL....../.L.......I/.ZJ......I/ZZJ..SSOOI/ZJJ.SS.OOI|0.02
Chargespin v3|T|........S./........SS/JJIIII...S/J....ZZ.OO/J.....ZZOO|0.02
Chargespin v3 2|T|........S./........SS/LJIIII...S/LJJJ.ZZ.OO/LL....ZZOO|0.02
Chargespin v3 3|T|........S./........SS/JJIIII...S/JLLL.ZZ.OO/JL....ZZOO|0.02
Unnamed bag 1 [b1-ba647072]|X|........S./........SS/L.IIIITTTS/L....ZZTOO/LL....ZZOO|0.02
Eternal 6-3|X|I.T......./ITTTZJ.LS./IOOZZJ.LSS/IOOZJJ.LLS|0.02
Guardian Angel Spin|X|S........./SS.......L/IS.....LLL/I...Z....J/IOOZZT...J/IOOZTTT.JJ|0.02
Pseudo-PC|X|......JJ../T.....JLLL/TTSS..JLOO/TSS.IIIIOO|0.02
Pseudo-PC 2|X|ZZ....OO../TZZ...OOLL/TTSS..JJJL/TSS.IIIIJL|0.02
Pseudo-PC 3|X|IT....OO../ITT...OOZJ/ITSS..LZZJ/ISS.LLLZJJ|0.02
Pseudo-PC 4|X|ZZ....OO../TZZ...OOLJ/TTSS..LLLJ/TSS.IIIIJJ|0.02
Pseudo-PC 5|X|ZZ....LJ../TZZ...LJJJ/TTSS..LLOO/TSS.IIIIOO|0.02
Unnamed bag 1 [b1-4bb094f6]|X|.......ZZ./......OOZZ/T.....OOLL/TTSS..JJJL/TSS.IIIIJL|0.02
Unnamed bag 1 [b1-4bb094f6] 2|X|.......ZJ./......ZZJI/T.....ZJJI/TTSS..LOOI/TSS.LLLOOI|0.02
Unnamed bag 1 [b1-4bb094f6] 3|X|.......ZZ./......OOZZ/T.....OOLJ/TTSS..LLLJ/TSS.IIIIJJ|0.02
SAO|X|.........J/ZZ.......J/IZZ.....JJ/IT......SS/ITT..OOSSL/IT...OOLLL|0.02
SAO 2|X|.........I/ZZ.......I/TZZ.....JI/TT......JI/TSS..OOJJL/SS...OOLLL|0.02
SAO 3|X|.........I/ZZ.......I/TZZ.....LI/TT......LI/TSS..OOJLL/SS...OOJJJ|0.02
SAO 4|X|.........J/ZZ.......J/TZZ.....JJ/TT......OO/TSS..LLLOO/SS...LIIII|0.02
Sarcelle|T|JJ......../J........I/JZ.....LLI/ZZSS..OOLI/ZSS...OOLI|0.02
Sarcelle 2|X|JJ......../JTTT.....I/JZT....LLI/ZZSS..OOLI/ZSS...OOLI|0.02
Sarcelle 3|X|OO......../OOSS.....I/LSS....ZJI/LTTT..ZZJI/LLT...ZJJI|0.02
Unnamed bag 1 [b1-25073b01]|X|.........Z/........ZZ/S...L...ZI/SSLLL....I/JSTTT..OOI/JJJT...OOI|0.02
Borg Cube|X|TTT......J/IT.......J/I....SZZJJ/IOO..SSZZL/IOO...SLLL|0.02
Splash Cannon|T|....Z...OO/LLLZZ...OO/LSSZ...JJJ/SSIIII...J|0.02
TeaL|X|JJ.....T../J.....TTTI/JZ.....LLI/ZZSS..OOLI/ZSS...OOLI|0.02
\u771F\u4E0D\u771F\u9762\u76EESTD|T|...Z....../..ZZ...J../..Z...SJJJ/IIII.LSSOO/...LLL.SOO|0.02
\u30BE\u30EB\u30C5|T|.......S../..J....SS./OOJJJ...SL/OOIIII.LLL|0.02
MIT|T|LLL......./LZ......../ZZ.JJJ..../Z...SJ..../OO..SS..../OO...SIIII|0.02
M\u30A2\u30EB\u30D5\u30A1|T|I...ZZ.S../I....ZZSS./I...LOOJS./I.LLLOOJJJ|0.02
\u30AB\u30C1\u30E5\u30FC\u30B7\u30E3\u7832|T|I........./I..S....../I..SS...../I...S.J.../OO..ZZJJJL/OO...ZZLLL|0.02
\u5869\u713C\u304D\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD\u5176\u306E\u58F1|T|OO......../OOLS...JJJ/LLLSS..ZZJ/IIIIS...ZZ|0.02
\u30A2\u30EB\u30D0\u30C8\u30ED\u30B9\u7A4D\u307F|T|JJ.....Z../J..OO.ZZ../JSSOOLZ.../SS.LLLIIII|0.02
\u30A2\u30D3\u30B9|T|....I...../....I.Z.../....IZZ.../...LIZ..../JLLLSS..OO/JJJSS...OO|0.02
STKI|T|.......J../L..ZZ.SJJJ/L...ZZSSOO/LL.IIIISOO|0.02
\u771F\u306D\u3053\u3060\u307E\u3057|T|........LL/........IL/........IL/...Z....IJ/OOZZSS..IJ/OOZSS...JJ|0.02
Unnamed bag 1 [b1-bc61b802]|T|.....LLL../JJ.SSLOO../J.SSZZOO../JIIIIZZ...|0.02
Unnamed bag 1 [b1-bc61b802] 2|T|.....LLL../JJ.ZZLOO../J.SSZZOO../JSSIIII...|0.02
SUC\u5F0FTSS|T|IJ......../IJJJZ...SS/IOOZZ..SSL/IOOZ...LLL|0.02
\u5909\u5E7B\u81EA\u5728TSM|T|...S....../...SS....I/..ZZS....I/OOJZZ...LI/OOJJJ.LLLI|0.02
T\u571F\u53F0\u308A\u306D\u30D1\u30D5\u30A7|X|IZZ......./ITZZ.J..LL/ITTSSJ.OOL/ITSSJJ.OOL|0.02
\u90AA\u795E\u30A2\u30EB\u30C6\u30A3\u30E1\u30C3\u30C8|X|S........./SS...T..LL/JSZZTT.OOL/JJJZZT.OOL|0.02
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0B,T\u7AEF)|X|.....Z..../T...ZZJJ../TTSSZLJOO./TSSLLLJOO.|0.02
Unnamed bag 1 [sasasa123-136]|X|S.....Z.../SS...ZZ.../JSTTTZLOO./JJJTLLLOO.|0.02
S\u30DB\u30FC\u30EB\u30C9\u30D1\u30D5\u30A72\u53F7|X|......JJLL/......JOOL/..TZZ.JOOL/.TTTZZIIII|0.02
\u30B9\u30C8\u30FC\u30F3\u30D8\u30F3\u30B8|T|ZZ......SS/LZZIIIISSJ/L...OO...J/LL..OO..JJ|0.02
\u58FA\u30D1\u30D5\u30A7|T|..JJJLLL../...SJLZ.../...SSZZ.../....SZ....|0.02
\u3066\u3089\u30D1\u30D5\u30A7|X|.........I/JJTTTSSLLI/JZZTSSOOLI/J.ZZ..OOLI|0.02
\u306D\u3053\u3058\u3083\u3089\u3057|T|...IIII.../....SLL.OO/..ZZSSLJOO/...ZZSLJJJ|0.02
S\u30D1\u30D5\u30A7|T|JJ...SS.../JOO.SS..../JOOZZ....L/IIIIZZ.LLL|0.02
SS\u30D1\u30D5\u30A7|T|L..ZZ...OO/L...ZZ.JOO/LL.IIIIJJJ|0.02
Partial bag 1 [sasasa123-156]|T|.....SS.../....SS..../...ZZ....L/IIIIZZ.LLL|0.02
\u30E9\u30A4\u30C1\u30D1\u30D5\u30A7|T|S........./SS..ZZ..../JS...ZZ.OO/JJJ.IIIIOO|0.02
IT\u30D1\u30D5\u30A7|X|IIII....../LOO...ZJJJ/LOOT.ZZSSJ/LLTTTZSS..|0.02
IT\u30D1\u30D5\u30A7 2|X|JJSS....../JSS...IIII/JTZZ.OOLLL/TTTZZOOL..|0.02
IT\u30D1\u30D5\u30A7 3|X|STTT....../SST...IIII/JSZZ.OOLLL/JJJZZOOL..|0.02
ZeTriS\u30D1\u30D5\u30A7|X|OO....IIII/OO.....JJJ/LLL.SSTZZJ/L..SSTTTZZ|0.02
\u30B7\u30EB\u30AB\u30F4\u30A1\u30C6\u30A3\u30D1\u30D5\u30A7|T|SIIII...../SSOO....../JSOO.ZZ.../JJJ...ZZ..|0.02
\u30DE\u30F3\u30DC\u30A6\u30D1\u30D5\u30A7(4~8\u5217\u76EE\u7A7A\u6D1E)|X|JJSS....LL/JSS....OOL/JTZZ...OOL/TTTZZ.IIII|0.02
\u30DE\u30F3\u30DC\u30A6\u30D1\u30D5\u30A7(4~8\u5217\u76EE\u7A7A\u6D1E) 2|X|STTT....LL/SST....OOL/JSZZ...OOL/JJJZZ.IIII|0.02
\u958B\u793E|T|I........./I..ZZ...LL/IOOJZZ.SSL/IOOJJJSS.L|0.02
\u30DF\u30BA\u30B2\u30A4\u30EB\u7A4D\u307F|X|SLL......T/SSL..OO.TT/JSL..OOZZT/JJJ.IIIIZZ|0.02
\u30DF\u30BA\u30B2\u30A4\u30EB\u7A4D\u307F 2|X|JJJ......T/LSJ..OO.TT/LSS..OOZZT/LLS.IIIIZZ|0.02
\u91D1\u58FA|T|.Z......../ZZ....S.../Z..L..SSOO/J..L...SOO/JJJLL.IIII|0.02
\u8D85\u306D\u3053\u3060\u307E\u3057|T|.....J..../.....J..../....JJ...Z/....SS..ZZ/OO.SS...ZL/OOIIII.LLL|0.02
\u306D\u3053\u3060\u307E\u3057\u6539|T|JJ......../J........./JZ......../ZZ......../Z...SS..../OO.SS....L/OOIIII.LLL|0.02
\u306D\u3053\u3060\u307E\u3057S|T|.Z......../ZZ..J..S../Z...J..SS./OO.JJ...SL/OOIIII.LLL|0.02
\u30D4\u30E9\u30DF\u30C3\u30C9\u59A5\u5354|T|.Z......../ZZ.......I/Z.....JJJI/OO.SSLLLJI/OOSS.L...I|0.02
July\u7A4D\u307F|T|.....S..LL/.....SS..L/......S..L/OOZZ.JIIII/OO.ZZJJJ..|0.02
\u3057\u308D\u3063\u3077STD|T|...S....../...SS....I/....S...LI/ZZ.OOJLLLI/.ZZOOJJJ.I|0.02
Unnamed bag 1 [b1-591cc70b]|X|.....Z..../I...ZZ..../IJJTZ...LL/IJTTOO.SSL/IJ.TOOSS.L|0.02
\u7B39STD|T|......J.../......JJJ./.Z.....SS./ZZLLL.SSOO/Z.L.....OO|0.02
\u6708\u5149\u8239|T|..Z......./.ZZ......I/SZ....L..I/SSJ.LLLOOI/.SJJJ..OOI|0.02
USTD|T|...S....../...SS....I/....S.L..I/ZZ.JLLLOOI/.ZZJJJ.OOI|0.02
Terlance's STD|T|......ZZ../......SZZ./L.....SSOO/L.J....SOO/LLJJJ.IIII|0.02
I'm FIST|T|J........./JJJ......./I........./I.....Z.LL/I..SSZZOOL/I.SS.Z.OOL|0.02
\u30D5\u30A7\u30A2\u51DB\u7832|T|.....OO.../....JOO.../....JS...Z/LLLJJSS.ZZ/L.IIIIS.Z.|0.02
SD\u30BF\u30EF\u30FC|T|I...OO.ZZ./IL..OO..ZZ/IL...SSJJJ/ILL.SS...J|0.02
\u3042\u3093\u3057\u3093SZ\u30B9\u30D4\u30F3|T|.OO....LLI/.OO....JLI/ZZ...SSJLI/.ZZ.SSJJ.I|0.02
Unnamed bag 1 [b1-bdf6d3ea] 2|T|.OO....JJJ/.OO....LSJ/ZZ...LLLSS/.ZZ.IIII.S|0.02
\u5927\u984E\u7A4D\u307F|T|.......LL./........L./........L./........J./I.......J./I......JJ./IOOZZ...SS/IOO.ZZ.SS.|0.02
\u5869\u713C\u304D\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD\u5176\u306E\u5F10|T|....ZZ...I/OO...ZZ..I/OOL.SSJJJI/LLLSS...JI|0.02
\u30DF\u30E9\u30AF\u30EB\u30D6\u30EA\u30C3\u30B8|T|I.Z......./IZZ......./IZ....LL../ISS.JJJLOO/SS....JLOO|0.02
\u30D7\u30EC\u30B7\u30D4\u30B9SP|T|...Z....../..ZZ....S./..Z.....SS/LLJJ.IIIIS/.LJ.....OO/.LJ.....OO|0.02
\u30BF\u30FC\u30F3J|T|..Z......./IZZ......./IZ...JJJLL/IOO.SS.J.L/IOOSS....L|0.02
\u30BF\u30FC\u30F3J\u4E8C\u53F7|T|S........./SS......../IS......../I....L..OO/IJ.LLLZZOO/IJJJ...ZZ.|0.02
\u30B5\u30B9\u30C6\u30CA\u30D6\u30EBSDT|T|.....LL..I/.Z....LS.I/ZZOO.JLSSI/Z.OO.JJJSI|0.02
\u9280\u5C71\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSDv2|T|....S...../....SS..../ZZ...S..../IZZ.JJJLLL/I.....JL../I.....OO../I.....OO..|0.02
Partial bag 1 [sasasa123-298] 2|T|....OO..../....OO..../ZZ...SSJJJ/.ZZ.SS...J|0.02
\u306D\u3053\u3060\u307E\u3057|T|JJ......../J........./JZ......../ZZ..S...../Z...SS..../OO..LS..../OOLLLIIII.|0.02
\u30B9\u30A6\u30A3\u30D5\u30C8DTD|T|.....ZZ.../.....SZZ../..L..SS.../OOL...SJJJ/OOLL.IIIIJ|0.02
hg|X|.........J/.........J/..LS....JJ/..LSS....T/OOLLS.ZZTT/OOIIII.ZZT|0.02
\u72F8\u7A4D\u307F\u4E9C\u7A2E\u4E9C\u7A2E|X|.........I/JJ.......I/J........I/J......ZSI/L....TZZSS/L...TTZOOS/LL...T.OO.|0.02
\u72F8\u7A4D\u307F\u4E9C\u7A2E\u4E9C\u7A2E 2|X|JJ......../J........./J.IIII.ZS./L....TZZSS/L...TTZOOS/LL...T.OO.|0.02
\u72F8\u7A4D\u307F\u4E9C\u7A2E|X|JJ......../J........I/J......OOI/L....SSOOI/L...SSTZZI/LL...TTTZZ|0.02
\u72F8\u7A4D\u307F\u4E9C\u7A2E 2|X|JJ......../J........./J.IIII.OO./L....SSOO./L...SSTZZ./LL...TTTZZ|0.02
\u3044\u3061\u3054\u5FA1\u6BBF\u7A4D\u307F|X|IS.....ZZ./ISS..TTTZZ/IJS...TLOO/IJJJ.LLLOO|0.02
\u3044\u3061\u3054\u5FA1\u6BBF\u7A4D\u307F 2|X|JJ.....LS./JOO..LLLSS/JOO...TZZS/IIII.TTTZZ|0.02
\u3044\u3061\u3054\u5FA1\u6BBF\u7A4D\u307F 3|X|LS.....ZZ./LSS..JJJZZ/LLS...TJOO/IIII.TTTOO|0.02
\u30B9\u30D4\u30A2\u30FC\u30C9\u7A4D\u307F 2|X|T......JJJ/TTSS...OOJ/TSSZZ..OOL/IIIIZZ.LLL|0.02
\u30B9\u30D4\u30A2\u30FC\u30C9\u7A4D\u307F 3|X|T......LLL/TTZZ...LOO/TSSZZ..JOO/SSIIII.JJJ|0.02
\u30B9\u30D4\u30A2\u30FC\u30C9\u7A4D\u307F 4|X|T......JJJ/TTZZ...OOJ/TSSZZ..OOL/SSIIII.LLL|0.02
Partial bag 1 [sasasa123-383]|T|........LL/..J..S...L/OOJJJSSZZL/OOIIIIS.ZZ|0.02
SFD\u30D1\u30D5\u30A7|T|.Z......../ZZ.....J../Z......JJJ/OO.SSIIIIL/OOSS...LLL|0.02
Egret Stacking|X|ZZ......../SZZ......./SS..T...../JS.TT..LOO/JJJ.TLLLOO|0.02
\u30EC\u30E2\u30F3\u30C6\u30A3\u30FC|T|LLL......./LZ......../ZZ......../Z........J/OO.SSIIIIJ/OOSS....JJ|0.02
\u50AC\u7720\u8853SD|T|........S./........SS/..L......S/LLLIIII.ZJ/..OO...ZZJ/..OO...ZJJ|0.02
\u30DF\u30CB\u30DE\u30EA\u30B9\u30C8SP|T|.......L../JJ.....L../JOO....LL./JOOZZ...SS/IIIIZZ.SS.|0.02
\u4E07\u672D\u7832|T|..S......./ZZSS....../JZZS....../JJJ....LOO/IIII.LLLOO|0.02
\u30D5\u30A9\u30F3\u30C0\u30F3\u7A4D\u307F|T|....L...../.SLLL...../.SS......./ZZS......./JZZ.....OO/JJJ.IIIIOO|0.02
\u98A8\u898B\u9D8F|T|...ZZ...../....ZZ...I/JJ..S....I/JLLLSS.OOI/JL...S.OOI|0.02
\u3042\u3044\u3046\u3048STD|T|.I.......J/.I.......J/.I......JJ/.I.S.....Z/LLLSSOO.ZZ/L...SOO.Z.|0.02
\u534A\u984E\u7A4D\u307F|T|L........./L........./LL......J./I.......J./I......JJ./IOOZZ...SS/IOO.ZZ.SS.|0.02
\u793E\u755C\u30C8\u30EC\u30A4\u30F3\u4E9C\u7A2E\u578B\u4E0D\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD v5|X|........SS/.......SSI/..T....ZJI/OOTT.LZZJI/OOTLLLZJJI|0.02
\u793E\u755C\u30C8\u30EC\u30A4\u30F3\u4E9C\u7A2E\u578B\u4E0D\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD v6|X|........SS/.......SSI/..L....ZJI/OOLTTTZZJI/OOLLT.ZJJI|0.02
\u793E\u755C\u30C8\u30EC\u30A4\u30F3\u4E9C\u7A2E\u578B\u4E0D\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD v6 2|X|........ZI/.......ZZI/..T....ZLI/JTTTSSOOLI/JJJSS.OOLL|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v3|X|ZZ......../IZZ....T../IJJ...TT../IJOO.SSTL./IJOOSSLLL.|0.02
\u30DE\u30B8\u30AB\u30EB\u30D6\u30EA\u30C3\u30B8|T|IIII...S../JJ.....SS./JOOZZ...SL/JOO.ZZ.LLL|0.02
\u30A2\u30CA\u30B6\u30FCDT|X|.........Z/........ZZ/.I......ZT/.I......TT/.ISLL....T/JISSL...OO/JJJSL...OO|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v4|X|........ZI/.......ZZI/.OO....ZLI/TOO.....LI/TTSS...JLL/TSS....JJJ|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v5|X|..SS....../.SS.....ZI/JJJ....ZZI/OOJT...ZLI/OOTTT.LLLI|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v5 2|X|..SS....../.SS.....OO/LLL....JOO/LTZZ...JJJ/TTTZZ.IIII|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v5 3|X|..SS....../.SS.....LL/JJZ....OOL/JZZT...OOL/JZTTT.IIII|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v5 4|X|..SS....../.SS.....ZJ/LOO....ZZJ/LOOT...ZJJ/LLTTT.IIII|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v5 5|X|..JJ....../.ZJ.....LL/ZZJ....OOL/ZSST...OOL/SSTTT.IIII|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD|X|I........./I........./I........J/IZ.......J/ZZ......JJ/ZSST...LOO/SSTTTLLLOO|0.02
\u7B39\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v2|X|OO......../OO......../I........./I........./IJ......S./IJLLLTZZSS/JJL.TTTZZS|0.02
\u6A5F\u68B0\u4ED5\u639B\u3051\u306E\u60AA\u9B54|X|.SS......./SST......./JTTT...LLL/JJJ..ZZLOO/IIII..ZZOO|0.02
Partial bag 1 [sasasa123-483]|T|.....ZJJJ./L...ZZSSJ./L...ZSSOO./LL.IIIIOO.|0.02
\u7FE1\u7FE0\u78322\u53F7|X|L........./L..ZJ...../LLZZJ..SST/OOZJJ.SSTT/OOIIII...T|0.02
\u9078\u629E\u53EF\u80FDTSS|X|LLL......./LTZZ.....I/TTSZZ....I/JTSSOO...I/JJJSOO...I|0.02
\u9078\u629E\u53EF\u80FDTSS 2|X|LLL......./LTOO.....I/TTOOS....I/JTZZSS...I/JJJZZS...I|0.02
\u9078\u629E\u53EF\u80FDTSS 3|X|JJZ......./JZZS.....I/JZTSS....I/OOTTSL...I/OOTLLL...I|0.02
\u958B\u5E55\u78BA\u5B9ASTSD|X|IJJ......./IJZZ....../IJSZZLL.../ITSSOOL.../TTTSOOL...|0.02
\u958B\u5E55\u78BA\u5B9ASTSD 2|X|TTT......./ITZZ....../ILSZZOO.../ILSSJOO.../ILLSJJJ...|0.02
\u958B\u5E55\u78BA\u5B9ASTSD 3|X|TTT......./ITSS....../ISSZZLL.../IOOJZZL.../IOOJJJL...|0.02
\u958B\u5E55\u78BA\u5B9ASTSD 4|X|LLS......./ILSS....../ILZSOOJ.../IZZTOOJ.../IZTTTJJ...|0.02
\u958B\u5E55\u78BA\u5B9ASTSD 5|X|IOO......./IOOZ....../IJZZTTT.../IJZSSTL.../JJSSLLL...|0.02
\u958B\u5E55\u78BA\u5B9ASTSD 6|X|TTT......./ITSS....../ISSLJJJ.../IOOLZZJ.../IOOLLZZ...|0.02
\u958B\u5E55\u78BA\u5B9ASTSD 7|X|LLL......./LTTT....../OOTSSZJ.../OOSSZZJ.../IIIIZJJ...|0.02
\u793A\u6E96\u5316\u77F3\u7A4D\u307F|X|.....I..S./JJLL.I.ZSS/JOOL.IZZTS/JOOL.IZTTT|0.02
\u793A\u6E96\u5316\u77F3\u7A4D\u307F 2|X|.....I..S./LOOJ.I.ZSS/LOOJ.IZZTS/LLJJ.IZTTT|0.02
Yuchan Cannon|X|.......S../.......SS./......JJS./L....TJOO./L.ZZTTJOO./LL.ZZTIIII|0.02
\u5869\u713C\u304D\u78324\u53F7|X|.SS...JJJ./SSL....TJ./LLL.ZZTTOO/IIII.ZZTOO|0.02
\u304B\u304FTKI|X|.....SS.../....SSI.../L....TI.../L.ZZTTI.OO/LL.ZZTI.OO|0.02
\u6012\u308A\u306ESDT|T|..L......./LLL......./I.....ZZ../I......ZZ./I..SSJJJOO/I.SS...JOO|0.02
\u96F7\u3089\u3044\u7832|T|J........./JJJ......./I........./I........./I..SSOOLLL/I.SS.OOL..|0.02
\u5929\u5730\u7832|X|........SS/.......SSZ/........ZZ/........ZI/OO.T....JI/OOLTT...JI/LLLT...JJI|0.02
\u30B5\u30F3\u30E9\u30A4\u30C8DT|X|..I......./S.I.....T./SSI....ZTT/JSI...ZZTL/JJJ...ZLLL|0.02
\u30C7\u30B8\u30BF\u30EB3\u7832|X|I..JJJS..Z/I...TJSSZZ/I..TTOOSZL/I...TOOLLL|0.02
\u30E0\u30FC\u30F3\u30E9\u30A4\u30C8DT|X|I.......T./I..S...ZTT/IOOSS.ZZTL/IOO.S.ZLLL|0.02
Partial bag 1 [sasasa123-588]|T|I........./I...Z..S../I..ZZOOSS./I..Z.OO.S.|0.02
\u30B5\u30F3\u30B7\u30E3\u30C9\u30A6DT|X|........L./.....JLLL./....TJJJS./...TTTZZSS/...IIIIZZS|0.02
\u30B5\u30F3\u30B7\u30E3\u30C9\u30A6DT 2|X|........L./.....JLLL./....ZJJJT./...ZZSSTTT/...ZSSIIII|0.02
\u30B5\u30F3\u30B7\u30E3\u30C9\u30A6DT 3|X|........L./.....ZLLL./....ZZSST./...JZSSTTT/...JJJIIII|0.02
\u30B5\u30F3\u30B7\u30E3\u30C9\u30A6DT 4|X|........Z./.....SSZZ./....SSLZT./...JLLLTTT/...JJJIIII|0.02
\u30B5\u30F3\u30B7\u30E3\u30C9\u30A6DT 5|X|........L./.....SLLL./....TSSZZ./...TTTSJZZ/...IIIIJJJ|0.02
Spade|X|LLL......./LOOS....../IOOSS...../IJJZS...../IJZZT...../IJZTTT....|0.02
Spade 2|X|OOJ......./OOJS....../IJJSS...../ILLLS...../ILTZZ...../ITTTZZ....|0.02
Spade 3|X|TTT......./ITZZ....../IOOZZ...../IOOJL...../ISSJL...../SSJJLL....|0.02
Spade 4|X|ILS......./ILSS....../ILLSZ...../IOOZZ...../JOOZT...../JJJTTT....|0.02
Spade 5|X|TTT......./STZZ....../SSJZZ...../LSJOO...../LJJOO...../LLIIII....|0.02
Spade 6|X|TTT......./JTZZ....../JJJZZ...../LLLOO...../LSSOO...../SSIIII....|0.02
Aoiro\u7832|X|..ZZIIIIOO/T..ZZ...OO/TT..SS.JJJ/T..SS....J|0.02
iX\u7832|X|........L./T.....LLLI/TTZZ...OOI/TSSZZ.JOOI/SS....JJJI|0.02
\u30B8\u30A7\u30CD\u30EC\u30FC\u30C8\u30C0\u30EB\u30B9\u30C9\u30E9\u30A4\u30D6(JL\u571F\u53F0)|T|OO....S..I/OO....SS.I/J.ZZ...SLI/JJJZZ.LLLI|0.02
\u30B8\u30A7\u30CD\u30EC\u30FC\u30C8\u30C0\u30EB\u30B9\u30C9\u30E9\u30A4\u30D6(I\u571F\u53F0)|T|.....LS.../...LLLSSOO/J.ZZ...SOO/JJJZZ.IIII|0.02
\u958B\u5E55\u30B7\u30F3\u30B0\u30EB\u30C0\u30D6\u30EB|T|..SS....../JSS......./JJJ.LLIIII/ZZ...LOO../.ZZ..LOO..|0.02
\u958B\u5E55\u8D85\u672A\u6765\u6539|X|.T......../TT......../IT.....J../IL....SJJJ/IL..ZZSSOO/ILL..ZZSOO|0.02
\u78BA\u5B9AISO|X|T........./TT.......I/T..J..SLLI/OO.JZZSSLI/OOJJ.ZZSLI|0.02
5\xD75|X|.........I/.........I/.....Z...I/...TZZ...I/OOTTZ....J/OOLTSS...J/LLLSS...JJ|0.02
SMT\u7832|T|.........I/.......LLI/....OO..LI/....OO..LI/ZZ...SSJJJ/.ZZ.SS...J|0.02
\u5869\u713C\u304D\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD\u5176\u306E\u53C2|X|OO...IIII./OO...SSJJJ/LLL.SSTZZJ/L....TTTZZ|0.02
\u958B\u5E55TT\u7A4D\u307F|X|...LLOO..I/T...LOOS.I/TT.JLZZSSI/T..JJJZZSI|0.02
\u30A2\u30F3\u30AB\u30FC\u30B9\u30BF\u30FC\u30C8|X|..OO.....I/.JOO.TLS.I/.JZZTTLSSI/JJ.ZZTLLSI|0.02
\u7F70k\u2026DT\u7832\u3067\u3088\u304F\u306D?|X|.......ZZ./.......SZZ/...TLL.SSJ/..TTTLOOSJ/IIII.LOOJJ|0.02
SQ\u30D1\u30D5\u30A7|X|.........J/T......Z.J/TTSS..ZZJJ/TSS...ZLOO/IIII.LLLOO|0.02
\u30DE\u30B8\u30AB\u30EB\u30B9\u30C6\u30A2|X|T........./TT......../T........./JJ.IIIISLL/JOO..ZZSSL/JOO...ZZSL|0.02
13\u5DE1\u30D1\u30D5\u30A7|X|..S..I..../.ZSS.IJJLL/ZZTS.IJOOL/ZTTT.IJOOL|0.02
Sn\u7832|X|.........Z/..OOJ...ZZ/..OOJ..LZT/.SSJJ..LTT/SSIIII.LLT|0.02
Sn\u7832 2|X|.........T/..JJJ...TT/..SSJ..OOT/.SSZZ..OOL/IIIIZZ.LLL|0.02
Sn\u7832 3|X|.........T/..JJJ...TT/..ZZJ..OOT/.SSZZ..OOL/SSIIII.LLL|0.02
LJfuture|X|....TTT.../.LSZZT..../.LSSZZ..OO/.LLS...JOO/IIII...JJJ|0.02
LJfuture 2|X|....TTT.../.JJZZT..../.JOOZZ..SS/.JOO...SSL/IIII...LLL|0.02
\u30C1\u30AD\u30F3\u30D5\u30A3\u30EC\u30AA|X|JJ......../J........./JZ.....OOI/ZZ.....OOI/ZSST....LI/SSTTT.LLLI|0.02
\u30BD\u30ED\u30D0|T|I......ZZ./IOO.S...ZZ/IOOLSS.JJJ/ILLL.S...J|0.02
SST\u30B8\u30E3\u30F3\u30AF\u30B7\u30E7\u30F3|T|........S./........SS/JJLLZZ...S/J..L.ZZ.OO/J..LIIIIOO|0.02
Unnamed bag 1 [sasasa123-655]|T|.........I/.L.......I/.L.......I/.LL..JJJ.I/ZZ...SSJOO/.ZZ.SS..OO|0.02
\u591C\u98DF\u7A4D\u307F|X|......JJJI/......SSJI/.....SSTLI/OO..ZZTTLI/OO...ZZTLL|0.02
\u3082\u30E2\u3082\uFF1F\u7832|X|....J...../....J...I./...JJ..LI./....ZLLLI./OO.ZZSSTI./OO.ZSSTTT.|0.02
\u3082\u30E2\u3082\uFF1F\u7832 2|X|....J...../....J...I./...JJ..ZI./....SSZZI./OO.SSLZTI./OO.LLLTTT.|0.02
\u82B1\u706B\u7A4D\u307F|X|.........I/.SS......I/SSL......I/OOLZZ...TI/OOLLZZ.TTT|0.02
\u30EA\u30E9\u30A4\u30A2\u30D6\u30EBTST|X|.IIII...../.Z......../ZZ.....JJJ/ZLL.....SJ/OOL....TSS/OOL...TTTS|0.02
TRT\u7832|X|........S./I.......SS/IL....TZZS/IL.OOTTJZZ/ILLOO.TJJJ|0.02
\u65B0\u6708\u7A4D\u307F|X|ZZ......../JZZ..T..L./JJJ.TTOOL./IIII.TOOLL|0.02
\u72AC|X|....I..OO./....I..OO./.JJJILLL../...JIL..../...TTT..../..SSTZZ.../.SS...ZZ..|0.02
\u307F\u308A\u3087\u3093\u7832|X|I........./I........./I..T.....Z/I.TTJ...ZZ/OO.TJ.SSZL/OO.JJSSLLL|0.02
\u4E2D\u958B\u3051\u30E1\u30AB\u30CB\u30AB\u30EBTSD|T|.........I/ZZ...SS..I/JZZ.SSLOOI/JJJ.LLLOOI|0.02
\u4E2D\u958B\u3051\u30E1\u30AB\u30CB\u30AB\u30EBTSD 2|X|ITZZ...JJJ/ITTZZ..OOJ/ITSS...OOL/ISS....LLL|0.02
\u4E2D\u958B\u3051\u30E1\u30AB\u30CB\u30AB\u30EBTSD 3|X|ITZZ...LLL/ITTZZ..LOO/ITSS...JOO/ISS....JJJ|0.02
\u4E2D\u958B\u3051\u30E1\u30AB\u30CB\u30AB\u30EBTSD 4|X|.......T../......TT.I/LS...ZJT.I/LSS.ZZJOOI/LLS.ZJJOOI|0.02
\u4E2D\u958B\u3051\u30E1\u30AB\u30CB\u30AB\u30EBTSD 5|X|.......T../......TT.I/ZZ...SST.I/JZZ.SSLOOI/JJJ.LLLOOI|0.02
SHio\u713C\u304D\u7832 2|X|I........./IL..T..SS./IL.TTJSSOO/ILL.TJJJOO|0.02
\u5869\u713C\u304D\u78323\u53F7|X|S........./SS......../IS......../IL..T..ZZ./IL.TTOOJZZ/ILL.TOOJJJ|0.02
\u30E1\u30FC\u30D7\u30EB\u7A4D\u307F|X|OO......../OO......../IS......../ISS....TL./IJS.ZZTTL./IJJJ.ZZTLL|0.02
SZDT|X|....T...../...TTT...I/S...LLLOOI/SS.JLZZOOI/.S.JJJZZ.I|0.02
SZDT 2|X|....T...../...TTT...I/S...LLJJZI/SS.OOLJZZI/.S.OOLJZ.I|0.02
SZDT 3|X|....T...../...TTT...I/S...ZJLOOI/SS.ZZJLOOI/.S.ZJJLL.I|0.02
SZDT 4|X|....T...../...TTT...I/S...ZZJJJI/SS.OOZZLJI/.S.OOLLL.I|0.02
SZDT 5|X|....T...../...TTT...L/S...ZOOLLL/SS.ZZOOJJJ/.S.ZIIII.J|0.02
2(JT)|X|S........./SS......../IS......../IL....TZZ./IL.OOTTJZZ/ILLOO.TJJJ|0.02
\u8AE6\u89B3\u7A4D\u307F|X|..OO....../.SOO....../.SS......./ZZS......./IZZ....T../I.....TT../IJ.....TL./IJJJ..LLL.|0.02
\u30C9\u30C3\u30C8\u7832v2|X|S........./SS......Z./IS.....ZZ./IL....TZOO/IL...TTJOO/ILL...TJJJ|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v4|X|........OO/........OO/LJJJ...SST/LZZJ..SSTT/LLZZ.IIIIT|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v1|X|.........I/.........I/........LI/....ZZLLLI/.....ZZOOJ/....SSTOOJ/...SSTTTJJ|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v1 2|X|.........I/.........I/........ZI/....JJJZZI/.....SJZLL/....TSSOOL/...TTTSOOL|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v1 3|X|.........J/.........J/........JJ/....IIIIOO/.....SZZOO/....TSSZZL/...TTTSLLL|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v1 4|X|.........I/.........I/........ZI/....TTTZZI/.....TJZLL/....SSJOOL/...SSJJOOL|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v1 5|X|.........J/.........J/........JJ/....ZZIIII/.....ZZLLL/....SSTLOO/...SSTTTOO|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD\u6539|X|.IOO....../.IOO....../LIT...SSZJ/LITT.SSZZJ/LLT....ZJJ|0.02
\u5F13\u5F35\u6708\u7A4D\u307F|T|.....JOO../L....JOOS./L...JJZZSS/LL.IIIIZZS|0.02
\u30BD\u30FC\u30B9\u7A4D\u307F|T|.I.......J/.I.......J/LI......JJ/LI...ZZ.OO/LL....ZZOO|0.02
\u30BD\u30FC\u30B9\u7A4D\u307F 2|T|.I.......J/.I.......J/LI......JJ/LI.SSZZ.OO/LLSS..ZZOO|0.02
\u68A8\u7832|X|.........J/.........J/ZZ......JJ/LZZ.....OO/LTTTSS..OO/LLTSS.IIII|0.02
\u30AF\u30A4\u30C3\u30AF\u30AF\u30EA\u30E0\u30BE\u30F3|X|........OO/........OO/..Z.JJJ..I/.ZZSLLJ..I/.ZTSSL...I/.TTTSL...I|0.02
\u30AF\u30A4\u30C3\u30AF\u30AF\u30EA\u30E0\u30BE\u30F3 2|X|........OO/........OO/..Z.LLL..I/.ZZSLJJ..I/.ZTSSJ...I/.TTTSJ...I|0.02
\u30AF\u30A4\u30C3\u30AF\u30AF\u30EA\u30E0\u30BE\u30F3 3|X|........OO/........OO/..Z.JJJ..I/.ZZTTTJ..I/.ZSSTL...I/.SSLLL...I|0.02
Unnamed bag 1 [b1-31ee5371]|X|.........I/.........I/..Z.JJJ..I/.ZZSLLJ..I/.ZTSSL..OO/.TTTSL..OO|0.02
Unnamed bag 1 [b1-31ee5371] 2|X|.........I/.........I/..Z.LLL..I/.ZZSLJJ..I/.ZTSSJ..OO/.TTTSJ..OO|0.02
Unnamed bag 1 [b1-31ee5371] 3|X|.........I/.........I/..Z.JJJ..I/.ZZTTTJ..I/.ZSSTL..OO/.SSLLL..OO|0.02
TPC|X|S........T/SSLLL.ZZTT/JSLOO..ZZT/JJJOO.IIII|0.02
\u521D\u7D1A\u8005\u5411\u7C21\u5358\u653B\u6483|X|JJ.......I/J........I/J.....SS.I/L....SST.I/L...ZZTTOO/LL...ZZTOO|0.02
\u521D\u7D1A\u8005\u5411\u7C21\u5358\u653B\u6483 2|X|JJ......../J........./J.IIIISS../L....SST../L...ZZTTOO/LL...ZZTOO|0.02
\u958B\u5E55TST \u03B1|X|ZZ......../JZZ......I/JJJSS....I/OOSSL..T.I/OOLLL.TTTI|0.02
TDST\u30C6\u30EC\u30B9|X|.Z......../ZZ.....LLI/ZOO.....LI/JOO..SSTLI/JJJ.SSTTTI|0.02
TDST\u30C6\u30EC\u30B9 2|X|.Z......../ZZ.....JJJ/ZLL.....TJ/OOL..SSTTT/OOL.SSIIII|0.02
TDST\u30C6\u30EC\u30B9 3|X|.Z......../ZZ.....TTT/ZOO.....TL/JOO..SSLLL/JJJ.SSIIII|0.02
TDST\u30C6\u30EC\u30B9 4|X|.L......../IL.....JJJ/ILL.....SJ/IOO..TZZSS/IOO.TTTZZS|0.02
T\u30C0\u30AC\u30FC(S\u7ACB\u3066)|X|.....JJ.../.....J..../.ZOOSJ.TTT/ZZOOSS..TL/ZIIIIS.LLL|0.02
Partial bag 1 [b1-4d693fb3]|T|I...SS..../IOOSSZ..../IOOLZZ..../ILLLZ.....|0.02
\u86C7\u8DB3\u7832|T|.OO.....LL/.OOJ.IIIIL/.SSJ...ZZL/SSJJ....ZZ|0.02
\u30EA\u30B0\u30CB\u30F3T|T|.S......../.SS.....LL/JJS......L/JOO....ZZL/JOO.IIIIZZ|0.02
refuse_WELL\uFF3FCannon|X|.SS......./SSZ......./LZZ..TTT../LZOO..TJJJ/LLOO.IIIIJ|0.02
TK\u7832|X|I.TTT...../I..TSLLJJ./I.ZZSSLJOO/I..ZZSLJOO|0.02
\u5948\u826F\u306E\u57C3|T|.........I/...ZJ..LLI/OOZZJ.SSLI/OOZJJSS.LI|0.02
\u30C1\u30EB\u30A2TD|T|LJJJ....../LZZJ....../LLZZ.IIII.|0.02
\u91DC\u8339\u3067\u7832|T|I........Z/IJJ.....ZZ/IJOO..SSZL/IJOO.SSLLL|0.02
\u6731\u96C0TST|X|JJ......../J........./J.....SSTI/L....SSTTI/L...OOZZTI/LL..OO.ZZI|0.02
\u3042\u307E\u304A\u3046\u7832|X|S........./SS......../TS......../TT......../T........./I........./I....ZJJLL/I...ZZJOOL/I...Z.JOOL|0.02
TLN\u7A4D\u307F|X|......IIII/LLL....JJJ/LSSOO.TZZJ/SS.OOTTTZZ|0.02
\u533F\u540D\u7832|T|I...ZZ..../IJJSSZZ.../IJSSLOO.../IJLLLOO...|0.02
\u533F\u540D\u7832 2|T|J...LS..../JJJZLSS.../OOZZLLS.../OOZIIII...|0.02
\u533F\u540D\u7832 3|T|I...SS..../IZZSSLL.../IJZZOOL.../IJJJOOL...|0.02
\u533F\u540D\u7832 4|T|L...SS..../LZZSSOO.../LLZZJOO.../IIIIJJJ...|0.02
\u533F\u540D\u7832 5|X|I...ZZ..../ILLLJZZ.../ILSSJOO.T./ISSJJOOTTT|0.02
\u533F\u540D\u7832 6|X|I...SS..../IOOSSZJ.../IOOLZZJ.T./ILLLZJJTTT|0.02
THET|X|I........./I........./IJ......../IJ......SS/JJL....SST/OOL...ZZTT/OOLL...ZZT|0.02
THET 2|X|L........./L........./LL......../JJ......SS/JOO....SST/JOO...ZZTT/IIII...ZZT|0.02
\u6A3DKING|X|I.ZZ....T./I..ZZLSTTT/I.JJJLSSOO/I...JLLSOO|0.02
guysaid|X|LLLI.....T/LOOI..ZZTT/JOOI.SSZZT/JJJISS....|0.02
\u30BD\u30D0\u30FC\u30B8\u30E5TD|T|JJLL....../JOOL..SS../JOOL.SSZZ./IIII....ZZ|0.02
\u6CE1\u6CAB\u7832|X|.....S..../..ZZ.SSI../L..ZZTSI../L.JJJTTIOO/LL..JT.IOO|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539|X|.OO......./.OOLL...../.JJJL....T/.SSJL.ZZTT/SSIIII.ZZT|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539 2|X|.OO......./.OOLJ...../.LLLJ....T/.SSJJ.ZZTT/SSIIII.ZZT|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539 3|X|.LJ......./.LJJJ...../.LLOO....T/.SSOO.ZZTT/SSIIII.ZZT|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539 4|X|.JJ......./.JLLL...../.JLOO....T/.SSOO.ZZTT/SSIIII.ZZT|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539 5|X|.OO......./.OOSS...../.JSSL....T/.JJJL.ZZTT/IIIILL.ZZT|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539 6|X|.OO......./.OOSS...../.JSSL....T/.JLLL.ZZTT/JJIIII.ZZT|0.02
10\u5206\u306E1\u5F15\u3044\u305F\u3089\u4F55\u3082\u3067\u304D\u306A\u3044\u7832|X|S........./SS......J./IS......J./IL....TJJ./IL.ZZTTOO./ILL.ZZTOO.|0.02
\u30D5\u30A1\u30FC\u30B9\u30C8DT(L\u30DB\u30FC\u30EB\u30C9)|T|.Z.SS..J../ZZSS...JOO/ZIIII.JJOO|0.02
\u5F62\u5F71\u7A4D\u307F|T|.........I/JJ...ZSLLI/JOO.ZZSSLI/JOO.Z..SLI|0.02
\u30AF\u30EA\u30E0\u30BE\u30F3\u30BD\u30A6\u30EB|T|........S./I....Z..SS/I...ZZ...S/IOOJZ....L/IOOJJJ.LLL|0.02
WL\u7832|T|.....J..LL/I....J...L/I...JJ...L/IOOZZ...SS/IOO.ZZ.SS.|0.02
\u5BCC\u5DBDLK\u7832|T|...JJ..L../I..J...L../I..J...LL./IOOZZ...SS/IOO.ZZ.SS.|0.02
PC-Cross(JL\u571F\u53F0)|X|.S......OO/ISS.....OO/ILS.....ZJ/IL...T.ZZJ/ILL.TTTZJJ|0.02
\u7D76\u5BFE\u2605DT\u30CC\u30EB\u30CC\u30EB|T|........J./.....S..J./.....SSJJ./OO.LLLSZZ./OO.LIIIIZZ|0.02
Lost TST (J-Hold)|X|.......SST/OO....SSTT/OOL....ZZT/LLL.IIIIZZ|0.02
\u5BFA\u7A4D\u307F|X|I......SS./IL..T.SSZJ/IL.TTOOZZJ/ILL.TOOZJJ|0.02
\u5BFA\u7A4D\u307F 2|X|I......OO./IL..T.ZOOJ/IL.TTZZSSJ/ILL.TZSSJJ|0.02
\u3057\u308D\u3063\u3077\u7832|X|...ZZ....I/OO..ZZJJJI/OOL..SSTJI/LLL.SSTTTI|0.02
\u3057\u308D\u3063\u3077\u7832 2|X|...ZZ....I/JJ..ZZTTTI/JOO..SSTLI/JOO.SSLLLI|0.02
\u4E94\u6708\u96E8\u7832|X|JJ......../J.......OO/J.......OO/L......SST/L.ZZ..SSTT/LL.ZZIIIIT|0.02
Number Two|X|..I....OO./.ZI....OO./ZZI....SLL/ZTI..J.SSL/TTT..JJJSL|0.02
\u738B\u87F2|T|....SS...I/...SSZZ..I/.JJJOOZZLI/...JOOLLLI|0.02
SuZy\u30E1\u30AB\u30CB\u30AB\u30EBTSD|X|LLS......./ILSS...JJJ/ILZS..TTTJ/IZZ....TOO/IZ......OO|0.02
SuZy\u30E1\u30AB\u30CB\u30AB\u30EBTSD 2|X|IOO......./IOOL...TTT/ILLL..ZZTJ/ISS....ZZJ/SS......JJ|0.02
SuZy\u30E1\u30AB\u30CB\u30AB\u30EBTSD 3|X|IJJ......./IJOO...TLL/IJOO..TTTL/ISS....ZZL/SS......ZZ|0.02
O\u571F\u53F0BT\u7832|X|.........I/........JI/.....LLLJI/.Z...LSJJI/ZZT...SSOO/ZTTT...SOO|0.02
\u3084\u306B\u3084\u306B\u30C0\u30A4\u30E4\u30E2\u30F3\u30C9|X|.....S..../JJ...SSZZ./J.....SLZZ/JT...LLLOO/TTT.IIIIOO|0.02
\u305F\u3093\u307D\u307D\u7A4D\u307F|X|.Z......../ZZSS.TLOOJ/ZSS.TTLOOJ/IIII.TLLJJ|0.02
\u6E80\u6708\u7A4D\u307F|X|S........./SS......../IS......../IL....TJJ./IL...TTJOO/ILL...TJOO|0.02
CFOS\u7832|X|.....T..../....TTIJJJ/.....TILSJ/.ZZ.OOILSS/..ZZOOILLS|0.02
\u7B39\u5F0F\u958B\u5E55STSD|X|JJ.....I../J......I../J......IS./L......ISS/L..OO.TZZS/LL.OOTTTZZ|0.02
\u7B39\u5F0F\u958B\u5E55STSD\u6539|X|........JI/.OO.....JI/LOO....JJI/LZZ...SSTI/LLZZ.SSTTT|0.02
\u7B39\u5F0F\u958B\u5E55STSD\u6539 2|X|........JI/.SS.....JI/SSL....JJI/OOL...TZZI/OOLL.TTTZZ|0.02
\u7B39\u5F0F\u958B\u5E55STSD\u6539 3|X|........OO/.SS.....OO/SSL....JJJ/LLL...TZZJ/IIII.TTTZZ|0.02
\u7B39\u5F0F\u958B\u5E55STSD\u6539 4|X|..I.....LL/..I......L/.ZI......L/ZZI......J/ZSST.OO..J/SSTTTOO.JJ|0.02
\u30AF\u30A4\u30C3\u30AFQ|X|.S.....I.J/.SS....I.J/.LS....IJJ/.LZZ..TIOO/.LLZZTTTOO|0.02
\u72F8\u7A4D\u307F|X|JJ.......I/J........I/J.......ZI/L....SSZZI/L...SSTZOO/LL...TTTOO|0.02
\u7CF8\u7832|X|LS....JJJ./LSS....TJ./LLS.ZZTTOO/IIII.ZZTOO|0.02
Riif\u7A4D\u307F v3|X|S........./SS......../IS......../IL....TJJ./IL.ZZTTJOO/ILL.ZZTJOO|0.02
TKI\u7A4D\u307F(IST Core)|X|JJ......../J........./J...ZZ..../L....ZZOO./L.TTTSSOO./LL.TSSIIII|0.02
\u958B\u5E55\u5909\u5247STSD|T|..LL....../...L.....I/JJ.LZS...I/J..ZZSSOOI/J..Z..SOOI|0.02
TKI\u7A4D\u307F(ZOT Core)|X|..TTT....I/L..TOO..JI/L.ZZOOSSJI/LL.ZZSSJJI|0.02
\u9280\u5C71\u5F0Fmickey\u3055\u3093\u958B\u5E55\u30C6\u30F3\u30D7\u30EC(\u5F621)|X|.........L/.Z.....LLL/ZZ...T.OOJ/ZSS.TTTOOJ/SS..IIIIJJ|0.02
\u9280\u5C71\u5F0FCC\u5F0FDD\u7832|X|........T./I......TTT/I..LS...ZJ/IOOLSS.ZZJ/IOOLLS.ZJJ|0.02
\u9280\u5C71\u5F0FDDT\u7832|X|.......T.I/.ZJLS.TTTI/ZZJLSS.OOI/ZJJLLS.OOI|0.02
\u9280\u5C71\u5F0FDDT\u7832 2|X|.......T.I/.SSZZ.TTTI/SSLJZZ.OOI/LLLJJJ.OOI|0.02
\u9280\u5C71\u5F0FDDT\u7832 3|X|.......T.I/.LLLS.TTTI/JLZZSS.OOI/JJJZZS.OOI|0.02
\u9280\u5C71\u5F0FDDT\u7832 4|X|.......T.I/.ZJJJ.TTTI/ZZSSJL.OOI/ZSSLLL.OOI|0.02
\u9280\u5C71\u5F0F\u30E1\u30AB\u30CB\u30AB\u30EBTSD|X|OO.....SS./OO....SSI./LLL...ZJI./LT...ZZJI./TTT..ZJJI.|0.02
\u9280\u5C71\u5F0F\u5E73\u7A4D\u307F\u6539\xB2|X|LLL......I/LOOT...S.I/JOOTTZZSSI/JJJT..ZZSI|0.02
\u771FPT\u7A4D\u307F\u30FB\u88CF|X|.SSJJ...../SSZJ....../LZZJ.....T/LZOO....TT/LLOO.IIIIT|0.02
\u30A2\u30EB\u30D0\u30C8\u30ED\u30B9DEF|T|....J...../....J...../...JJ...../S...ZZIIII/SS.OOZZLLL/.S.OO..L..|0.02
\u30B9\u30BF\u30FC\u30C1\u7A4D\u307F|X|.........I/L....T.OOI/LZZ.TTJOOI/LLZZ.TJJJI|0.02
\u5411\u304B\u3044\u98A8|X|........SS/LLL....SST/LOO...ZZTT/JOO....ZZT/JJJ...IIII|0.02
Unnamed bag 1 [b1-e8274199]|T|....SS...I/LOOSS...ZI/LOOJJJ.ZZI/LL...J.Z.I|0.02
\u97FF|T|.....J..../.....JJJ../SZZ...IIII/SSZZ.OOLLL/.S...OOL..|0.02
\u30DE\u30AA\u30EA\u306E\u9577|X|........L./.OO...LLL./JOO....SS./JJJ.ZZSST./IIII.ZZTTT|0.02
\u6492\u83F1TST\u30FB\u5782\u76F4|X|.........Z/........ZZ/.......TZI/JJ.....TTI/JOO..SSTLI/JOO.SSLLLI|0.02
\u6492\u83F1TST\u30FB\u5782\u76F4 2|X|.........T/........TT/.......OOT/ZZ.....OOL/JZZ..SSLLL/JJJ.SSIIII|0.02
\u6492\u83F1TST\u30FB\u5E73\u884C|X|.........Z/........ZZ/.......TZI/.OO....TTI/JOO..SSTLI/JJJ.SSLLLI|0.02
\u6492\u83F1TST\u30FB\u5E73\u884C 2|X|.........T/........TT/.......OOT/.ZJ....OOL/ZZJ..SSLLL/ZJJ.SSIIII|0.02
\u6492\u83F1TST\u30FB\u5E73\u884C 3|X|.........Z/........ZZ/.......LZT/.OO....LTT/JOO..SSLLT/JJJ.SSIIII|0.02
\u6492\u83F1TST\u30FB\u5E73\u884C 4|X|.........Z/........ZZ/.......TZJ/.LL....TTJ/OOL..SSTJJ/OOL.SSIIII|0.02
\u30CD\u30D1\u30FC\u30EBTST|X|.J.......T/.J.....STT/JJ...ZZSST/OO....ZZSL/OO.IIIILLL|0.02
\u30CD\u30D1\u30FC\u30EBTST 2|X|.J.......T/.J.....LTT/JJ...LLLST/OO....ZZSS/OO.IIIIZZS|0.02
universalTD|X|......I.../......I.../L....TI..J/L.ZZTTISSJ/LL.ZZTSSJJ|0.02
NoT\u30D1\u30D5\u30A7|X|ZZ......../IZZ......./I........./IJ.....LLL/IJ..SSTLOO/JJ.SSTTTOO|0.02
\u8133\u7B4B\u7832|X|...J....../.SSJ....../SSJJL....T/OOLLL.ZZTT/OOIIII.ZZT|0.02
\u8133\u7B4B\u7832(L\u30DB\u30FC\u30EB\u30C9)|X|.SS......./SSJ......T/OOJJJ.ZZTT/OOIIII.ZZT|0.02
\u6714\u671B\u6708\u7A4D\u307F|X|..JJJ...../L..TJZZ.../L.TTOOZZ../LL.TOOIIII|0.02
\u6709\u660E\u6708\u7A4D\u307F|X|.Z......../ZZ......../ZSS......I/SSL..T...I/OOL.TT...I/OOLL.T...I|0.02
\u5C0F\u671B\u6708\u7A4D\u307F|X|S........./SS.....J../LS...T.JOO/LZZ.TTJJOO/LLZZ.TIIII|0.02
\u3082\u3084\u3057\u7A4D\u307F|X|..SS....../.SS......./.OO......./JOO....T../JJJ.ZZTT../IIII.ZZT..|0.02
\u6D17\u6FEF\u30B9\u30DA\u30B7\u30E3\u30EB|X|IS......../ISS.L....T/IJS.L.ZZTT/IJJJLL.ZZT|0.02
\u971C\u67F1TD|X|.......OO./L....T.OOJ/L.ZZTT.SSJ/LL.ZZTSSJJ|0.02
\u9271\u5C71\u7A4D\u307F3\u53F7|X|.I....OO../.I....OO../.I....TLS./JI.ZZTTLSS/JJJ.ZZTLLS|0.02
\u5A7FTD|T|..S......Z/..SS....ZZ/OOJS....ZL/OOJJJ..LLL|0.02
\u5929\u79E4\u7A4D\u307Fv2|T|.........Z/........ZZ/.SS.....ZI/SSL.....JI/OOL.....JI/OOLL...JJI|0.02
\u53CC\u5263\u7A4D\u307F|X|........SS/.......SSI/L....T.OOI/L...TTJOOI/LL...TJJJI|0.02
\u4E0A\u5F26\u7A4D\u307F|X|.........I/.........I/..L....SSI/OOLZZ.SSTI/OOLLZZ.TTT|0.02
srabdard stabjin|X|.......S../L....T.SSJ/L.ZZTTOOSJ/LL.ZZTOOJJ|0.02
\u6C99\u7F85\u3063\u3068\u7A4D\u307F|X|L........./L.S......I/LLSS....TI/OOJS.ZZTTI/OOJJJ.ZZTI|0.02
\u30CE\u30FC\u30D6\u30EBTD|X|.........T/.....J..TT/L....JOOST/L.ZZJJOOSS/LL.ZZIIIIS|0.02
\u30AB\u30FC\u30EA\u30F3\u30B0\u7A4D\u307F(T\u30DB\u30FC\u30EB\u30C9)|T|.....J..../L....JOOS./L.ZZJJOOSS/LL.ZZIIIIS|0.02
Unnamed bag 1 [sasasa123-1040]|X|.Z......../ZZ......../ZOO......./JOO..T.SS./JJJ.TTSSL./IIII.TLLL.|0.02
Unnamed bag 1 [sasasa123-1040] 2|X|.Z......../ZZ......../ZSS......./SSL..T.OO./LLL.TTJOO./IIII.TJJJ.|0.02
\u89D2\u716E\u30FC\u3051\u30FC\u3042\u3044\u6539|X|L........./L........I/LL......TI/OOJ..ZZTTI/OOJJJ.ZZTI|0.02
\u6717\u6708\u7A4D\u307F|X|JJ......../J........./J....Z..../L..TZZ..../L.TTZSS.../LL.TSSIIII|0.02
\u30B8\u30AA\u30E9\u30DETD(S\u30DB\u30FC\u30EB\u30C9)|X|.........I/L....T.OOI/L.ZZTTJOOI/LL.ZZTJJJI|0.02
\u30B8\u30AA\u30E9\u30DETD(S\u30DB\u30FC\u30EB\u30C9) 2|X|.........J/L....T.SSJ/L.ZZTTSSJJ/LL.ZZTIIII|0.02
\u5927\u7A74\u7A4D\u307F|X|........OO/........OO/......T.SS/J..ZZTTSSL/JJJ.ZZTLLL|0.02
VIPPER\uFF3FCANNON|X|JJ......../J......SST/JLL...SSTT/OOL....ZZT/OOL.IIIIZZ|0.02
\u30C0\u30FC\u30C4\u7832|X|S........./SS......../JS.....T../JJJZZ.TTOO/IIIIZZ.TOO|0.02
\u771F\u30AF\u30A4\u30C3\u30AF\u30AF\u30EA\u30E0\u30BE\u30F3|X|TTT...LL../.TZJ...LOO/.ZZJ...LOO/.ZJJ..IIII|0.02
\u771F\u30AF\u30A4\u30C3\u30AF\u30AF\u30EA\u30E0\u30BE\u30F3 2|X|TTT...ZZ../.TOO...ZZL/.JOO...LLL/.JJJ..IIII|0.02
\u30B9\u30D5\u30A3\u30F3\u30AF\u30B9TST|X|I......LL./I.....OOL./IJ....OOL./IJ..SSTZZ./JJ.SSTTTZZ|0.02
\u30B9\u30D5\u30A3\u30F3\u30AF\u30B9TST 2|X|I......OO./I.....SOO./IJ....SSL./IJ..TZZSL./JJ.TTTZZLL|0.02
TST\u30D5\u30EC\u30FC\u30D0\u30FC|X|.........I/.........I/.........I/ZZ.......I/TZZ......J/TTSSOOLLLJ/TSS.OOL.JJ|0.02
\u30DF\u30B9\u30DE\u30C3\u30C1TD \u4E2D\u7248|X|.......OO./.....ZZOOI/.L....ZZJI/.L.TTTSSJI/.LL.TSSJJI|0.02
CFWC\u7832|X|I........L/IS.....LLL/ISS.....OO/ITS.ZZ.JOO/TTT..ZZJJJ|0.02
CFAT\u7832|X|I........./IOO....LLL/IOO....LZJ/ISST...ZZJ/SSTTT..ZJJ|0.02
CFAT\u7832 2|X|I........./IOO....JJZ/IOO....JZZ/ISST...JZL/SSTTT..LLL|0.02
CFAT\u7832 3|X|I........./IOO....JJJ/IOO....LSJ/ITZZ...LSS/TTTZZ..LLS|0.02
CFAT\u7832 4|X|I........./IOO....SLL/IOO....SSL/ITZZ...JSL/TTTZZ..JJJ|0.02
\u5E06\u8239TD|X|....OOI.../....OOI.../L....TI..J/L.ZZTTISSJ/LL.ZZTSSJJ|0.02
\u5C45\u5F85\u6708\u7A4D\u307F|X|.......S../.......SSI/L..T..ZZSI/L.TTOOJZZI/LL.TOOJJJI|0.02
\u30CA\u30BA\u7832\uFF11\u53F7|X|.......S../I..T...SS./ILTTT..JS./ILZZ...JOO/ILLZZ.JJOO|0.02
\u4F0F\u7DDA\u56DE\u53CE\u30B9\u30DA\u30B7\u30E3\u30EB|X|........LL/.S....JJZL/.SS...JZZL/.TS...JZOO/TTT.IIIIOO|0.02
\u4F0F\u7DDA\u56DE\u53CE\u30B9\u30DA\u30B7\u30E3\u30EB 2|X|........ZJ/.S....LZZJ/.SS...LZJJ/.TS...LLOO/TTT.IIIIOO|0.02
Sonic DTD|X|I....T..../IL.STTTZZ./IL.SSOOJZZ/ILL.SOOJJJ|0.02
Sonic DTD 2|X|I....S..../IL.OOSSZZ./IL.OOTSJZZ/ILL.TTTJJJ|0.02
Sonic DTD 3|X|I....J..../IL.OOJJJS./IL.OOTZZSS/ILL.TTTZZS|0.02
\u4E0D\u771F\u9762\u76EESTD v3|T|.........Z/........ZZ/........ZJ/..S......J/OOSSLLL.JJ/OO.SL.IIII|0.02
Spade v2|X|JJOO....../JIOO....../JIZZ....../LITZZ...../LITTSS..../LLTSS.....|0.02
Spade v2 2|X|LLOO....../ILOO....../ILZZ....../IJTZZ...../IJTTSS..../JJTSS.....|0.02
Spade v2 3|X|ILOO....../ILOO....../ILLT....../IZJTT...../ZZJTSS..../ZJJSS.....|0.02
Spade v2 4|X|ZZLL....../IZZL....../IOOL....../IOOJT...../ISSJTT..../SSJJT.....|0.02
Spade v2 5|X|IJJZ....../IJZZ....../IJZT....../ILLTT...../OOLTSS..../OOLSS.....|0.02
Spade v2 6|X|IIII....../JJZL....../JZZL....../JZTLL...../OOTTSS..../OOTSS.....|0.02
\u30C0\u30B9\u30C8\u30AD\u30E3\u30CE\u30F3|T|..Z......./IZZ......./IZ....J.../IOO.SSJLLL/IOOSSJJL..|0.02
\u547C\u968A\u306E\u5CA9|T|.Z...I..../ZZ...I..../Z....I..../OO.SSILJJJ/OOSSLLL..J|0.02
\u4E19\u7832|T|I....S.J../I....SSJJJ/IZZ...SLOO/I.ZZ.LLLOO|0.02
\u30AB\u30E1\u30EC\u30AA\u30F3\u30AD\u30E3\u30CE\u30F3|X|OO......../OO......../JJ......../J........./J.ZZ....../L..ZZ....T/L.IIIISSTT/LL...SS..T|0.02
Unnamed bag 1 [b1-89eaccfd]|X|OO......../OO......../JJ......../J........./J...ZZ..../L....ZZ..T/L.IIIISSTT/LL...SS..T|0.02
\u30EB\u30FC\u30C8DT|X|.....Z..T./LLL.ZZ.TTT/LSS.ZJJJOO/SS.IIIIJOO|0.02
\u30A2\u30BC\u30EB\u7119\u714E|T|S........./SS......ZI/.S.....ZZI/OOJ....ZLI/OOJJJ.LLLI|0.02
\u6C34\u3057\u3076\u304D\u7832|X|.T......../ITT......./IT...ZZJJJ/IOO.SSZZLJ/IOOSS.LLL.|0.02
IQ3\u30AD\u30E3\u30CE\u30F3|X|.....S...J/.....SS..J/TZZ...SLJJ/TTZZ.LLLOO/T...IIIIOO|0.02
\u5F62DT\u7832|T|JJ.S....../J..SS...../J...SL..../OO.LLLZZ../OO.IIIIZZ.|0.02
\u306B\u3042\u30FC\u3069|T|.........L/I......LLL/I..ZZ...OO/I.SSZZ.JOO/ISS....JJJ|0.02
skylee|X|........S./........SS/ITTT...ZZS/ILT....JZZ/IL.....JOO/ILL...JJOO|0.02
\u30ED\u30A6%DT|X|....SS..../...SST..../....ZTT.LL/OO.ZZTJJJL/OO.ZIIIIJL|0.02
\u30ED\u30A6%DT 2|X|....SS..../...SST..../....ZTT.LJ/OO.ZZTLLLJ/OO.ZIIIIJJ|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD|T|I........./IZZ...SSLL/IJZZ.SSOOL/IJJJ...OOL|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 2|X|I........./IJJZZTTTSS/IJOOZZTSSL/IJOO...LLL|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 3|X|I........./ILSZZTTTOO/ILSSZZTJOO/ILLS...JJJ|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 4|X|I........./IOOTTTSSZJ/IOOLTSSZZJ/ILLL...ZJJ|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 5|X|L........./LZZTTTSSOO/LLZZTSSJOO/IIII...JJJ|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 6|X|I........./ILOO...JJJ/ILOOSSTZZJ/ILLSSTTTZZ|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 7|X|I........./IJJZ...LLL/IJZZSSTLOO/IJZSSTTTOO|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 8|X|I........./IJJJ...SLL/IOOJTZZSSL/IOOTTTZZSL|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 9|X|I........./ILLL...OOJ/ILSSTZZOOJ/ISSTTTZZJJ|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 10|X|J........./JJJT...SLL/OOTTTZZSSL/OOIIIIZZSL|0.02
777\u5F0F\u975E\u78BA\u5B9A\u30E1\u30AB\u30CB\u30AB\u30EBTSD 11|X|J........./JJJZ...TLL/OOZZSSTTTL/OOZSSIIIIL|0.02
RE S&T\u7832 (\u8D85\u30EB\u30FC\u30D7DT)|X|........OO/S......TOO/SS....TTTL/JSZZ...LLL/JJJZZ.IIII|0.02
RE S&T\u7832 (\u8D85\u30EB\u30FC\u30D7DT) 2|X|........OO/I......TOO/IL....TTTJ/ILZZ...SSJ/ILLZZ.SSJJ|0.02
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0A,T\u7AEF)|X|.....Z..../T...ZZ.OO./TTSSZLJOO./TSSLLLJJJ.|0.02
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0B,T\u4E2D)|X|S........./SS...T.LL./JSZZTTOOL./JJJZZTOOL.|0.02
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0A,T\u4E2D)|X|S........./SS...TOO../JSZZTTOOL./JJJZZTLLL.|0.02
STZ\u30D1\u30D5\u30A7 \u4E2D\u51F9|X|JJ.......Z/JOO.....ZZ/JOOTTTSSZL/IIIITSSLLL|0.02
STZ\u30D1\u30D5\u30A7 \u7AEF\u51F9|X|OOS......./OOSS.....J/LLLSZZTTTJ/LIIIIZZTJJ|0.02
STZ\u30D1\u30D5\u30A7 \u7AEF\u51F9 2|X|LLL......./LZOO.....J/ZZOOTTTSSJ/ZIIIITSSJJ|0.02
STZ\u30D1\u30D5\u30A7 \u7AEF\u51F9 3|X|LLL......./LTTTZZIIII/OOTSSZZJJJ/OOSS.....J|0.02
\u30DE\u30F3\u30DC\u30A6\u30D1\u30D5\u30A7(3~7\u5217\u76EE\u7A7A\u6D1E)|X|LLL....JJJ/LZ....OOSJ/ZZT...OOSS/ZTTT.IIIIS|0.02
\u30DE\u30F3\u30DC\u30A6\u30D1\u30D5\u30A7(3~7\u5217\u76EE\u7A7A\u6D1E) 2|X|TTT....JJJ/LT....OOSJ/LZZ...OOSS/LLZZ.IIIIS|0.02
\u308A\u306D\u30D1\u30D5\u30A7(O\u30DB\u30FC\u30EB\u30C9)|X|S...TI..../SS.TTI..../JSZZTI...L/JJJZZI.LLL|0.02
\u308A\u306D\u30D1\u30D5\u30A7(O\u30DB\u30FC\u30EB\u30C9) 2|X|T...ZJ..../TT.ZZJ..../TSSZJJ...L/SSIIII.LLL|0.02
\u5D16\u7A4D\u307F|X|T.I......./TTI......./TZI......./ZZIJ....LL/ZSSJ...OOL/SSJJ...OOL|0.02
\u5D16\u7A4D\u307F 2|X|I.Z......./IZZ......./IZT......./ITTJ....SS/OOTJ...SSL/OOJJ...LLL|0.02
Partial bag 1 [sasasa123-1139]|T|ILLL....../ILZ......./IZZSS...../IZSS......|0.02
Partial bag 1 [sasasa123-1139] 2|T|IIII....../JJZ......./JZZSS...../JZSS......|0.02
Partial bag 1 [sasasa123-1139] 3|T|IIII....../LOO......./LOOSS...../LLSS......|0.02
Partial bag 1 [sasasa123-1139] 4|T|IIII....../JJJ......./OOJSS...../OOSS......|0.02
\u30E6\u30CB\u30AB\u30FC\u30EB\u7A4D\u307F|X|....S...../....SSOOJ./L....SOOJ./L.ZZTTTJJ./LL.ZZTIIII|0.02
\u30E6\u30CB\u30AB\u30FC\u30EB\u7A4D\u307F 2|X|....S...../....SSJOO./L....SJOO./L.TTTJJZZ./LL.TIIIIZZ|0.02
\u30A2\u30C8\u30E9\u30B9\u7A4D\u307F2\u53F7|X|..SS....../.SSZ..T..J/OOZZ.LTT.J/OOZLLLT.JJ|0.02
\u30A2\u30C8\u30E9\u30B9\u7A4D\u307F2\u53F7 2|X|..OO....../.ZOO..T..J/ZZSS.LTT.J/ZSSLLLT.JJ|0.02
\u6C7A\u5FC3\u7A4D\u307F|X|......SS../L....SSOOJ/L...TZZOOJ/LL.TTTZZJJ|0.02
\u30E2\u30D0\u30A4\u30EBTD|T|.I......../.I......../.I.....SLL/JI.OOZZSSL/JJJOO.ZZSL|0.02
\u305F\u3053\u713C\u304D\u78321\u53F7|X|......T.../JJ.ZZTTLS./JOO.ZZTLSS/JOOIIIILLS|0.02
\u30DC\u30C3\u30AF\u30B9\u5E2DTD|X|.........Z/........ZZ/.SS.....ZI/SSL.....JI/OOL.TTT.JI/OOLL.T.JJI|0.02
\u30E8\u30FC\u30B0\u30EB\u30C8\u30D7\u30EA\u30F3\u7A4D\u307F|X|I........./IL..TJJJ../IL.TTZZJOO/ILL.T.ZZOO|0.02
\u89D2\u716E\u30FC\u3051\u30FC\u3042\u3044|X|LS......../LSS......./LLS.....T./OOJ..ZZTT./OOJJJ.ZZT.|0.02
\u9310TD|T|........T./..OO.LLTTT/ZZOOSSLJJJ/.ZZSS.L..J|0.02
\u6CE2\u52D5\u7A4D\u307F|X|OO......../OO......../JJ......../J........./J........./L......SST/L.ZZ..SSTT/LL.ZZIIIIT|0.02
\u4E94\u6708\u96E8\u7832(O\u30DB\u30FC\u30EB\u30C9)|X|JJ......../J........./J........./L......SST/L.ZZ..SSTT/LL.ZZIIIIT|0.02
\u6CE2\u52D5\u7A4D\u307Fv2|T|OO......../OO......../JJ......../J........./J........./L.......S./L.....ZZSS/LL.IIIIZZS|0.02
\u30E2\u30AB\u30B7\u30ED\u30C3\u30D7\u7A4D\u307F|X|...JJ...../...J....SS/...J...SSI/...L....TI/.OOL.ZZTTI/.OOLL.ZZTI|0.02
\u30E8\u30FC\u30B0\u30EB\u30C8\u7A4D\u307F|X|J........./JJJ......./OOS......./OOSS....T./LLLS.ZZTT./LIIII.ZZT.|0.02
\u30E8\u30FC\u30B0\u30EB\u30C8\u7A4D\u307F 2|X|S........./SSJ......./ISJ......./IJJL....T./IOOL.ZZTT./IOOLL.ZZT.|0.02
( \uFF9F\u0414\uFF9F)\u7A4D\u307F|X|....SS..../I..SS...../I..OO...../IJLOO....T/IJLZZ...TT/JJLLZZ...T|0.02
sp-spin|X|........OO/ZZ......OO/JZZ....SLL/JJJ...TSSL/IIII.TTTSL|0.02
\u30A2\u30A6\u30C8\u30EC\u30F3\u30B8|X|I........./I........./I........./I........./S........./SS....TOO./JS.ZZTTOOL/JJJ.ZZTLLL|0.02
\u6681\u7A4D\u307F|X|........S./I.......SS/IL....TJJS/IL.ZZTTJOO/ILL.ZZTJOO|0.02
\u30F4\u30A3\u30EB\u30CC\u30FC\u30AC|T|S........./SS......../IS......../IL...ZZ.../IL...JZZOO/ILL..JJJOO|0.02
\u829DTD|T|S..IIII..Z/SS....OOZZ/JS....OOZL/JJJ....LLL|0.02
\u4ECF\u7A4D\u307F(I\u30DB\u30FC\u30EB\u30C9)|X|.......S../.......SS./L....TJJS./L.ZZTTJOO./LL.ZZTJOO.|0.02
\u7FE1\u7FE0\u78323\u53F7|X|I........./IZZ......./IJZZL..SST/IJOOL.SSTT/JJOOLL...T|0.02
Foehn wind|X|OO..TZZ.../OO.TTTZZ../IJJJ....../ILSJ....../ILSS....../ILLS......|0.02
Unnamed bag 1 [b1-93667ae6]|X|.OO.TZZ.../.OOTTTZZ../IJJJ....../ILSJ....../ILSS....../ILLS......|0.02
\u91D1\u69CC\u7A4D\u307F|T|...I....../...I..S.../...I..SSL./OOJI.ZZSL./OOJJJ.ZZLL|0.02
Partial bag 1 [sasasa123-1175]|X|.OOS....../.OOSS....T/.LLLS.ZZTT/.LIIII.ZZT|0.02
\u30B5\u30CF\u30EA\u30F3TD|X|......OO../.SS...OO../SSL....T.J/LLL.ZZTT.J/IIII.ZZTJJ|0.02
10\u5206\u306E1\u5F15\u3044\u3066\u3082\u59A5\u5354\u3067\u304D\u308B\u78322\u53F7|X|.S......../.SS......./ZZS......./JZZ..T.LL./JJJ.TTOOL./IIII.TOOL.|0.02
10\u5206\u306E1\u5F15\u3044\u3066\u3082\u59A5\u5354\u3067\u304D\u308B\u78322\u53F7 2|X|.S......../.SS......./OOS......./OOL..T.ZJ./LLL.TTZZJ./IIII.TZJJ.|0.02
\u30D1\u30EA\u30D1\u30EA\u30B8\u30E5\u30FC\u30B7\u30FC\u30B9\u30CA\u30C3\u30AF\u7A4D\u307F|X|.OOJ..S.../TOOJ..SSL./TTJJ.ZZSL./TIIII.ZZLL|0.02
\u5B89\u5FC3TT|X|SLL......./SSL.....T./JSL....TT./JJJ.OOZZT./IIIIOO.ZZ.|0.02
\u8A33\u3042\u308A\u524A\u308A\u7BC0TD|T|I.SS..J.../ISSL..JJJ./IOOL...ZZ./IOOLL...ZZ|0.02
\u7A40\u7269TD|X|ZZ.......J/IZZ......J/IL..T...JJ/IL.TT.SSOO/ILL.TSS.OO|0.02
\u5FB3\u7528\u524A\u308A\u7BC0TD|X|..SS....../.SS......./JJT....LLL/JTTT.ZZLOO/JIIII.ZZOO|0.02
\u5FB3\u7528\u524A\u308A\u7BC0TD 2|X|..JJ....../.ZJ......./ZZJ....LOO/ZSST.LLLOO/SSTTT.IIII|0.02
\u5FB3\u7528\u524A\u308A\u7BC0TD 3|X|..SS....../.SS......./JJZ....LOO/JZZT.LLLOO/JZTTT.IIII|0.02
\u5FB3\u7528\u524A\u308A\u7BC0TD 4|X|..SS....../.SS......./TTT....LOO/JTZZ.LLLOO/JJJZZ.IIII|0.02
\u9AD8\u7D1A\u524A\u308A\u7BC0TD|X|.Z......../ZZ.....LOO/ZSST.LLLOO/SSTTT.IIII|0.02
\u706B\u6C34\u7832|X|....OO..../....OO...J/L....T.SSJ/L.ZZTTSSJJ/LL.ZZTIIII|0.02
\u904B\u30B2\u30FC\u7832|X|I..OO...J./I.ZOOT..J./IZZSSTTJJL/IZSS.T.LLL|0.02
\u904B\u30B2\u30FC\u7832 2|X|I..SS...L./I.SSZT..L./IOOZZTTJLL/IOOZ.T.JJJ|0.02
\u97DC\u6666TD|X|L........./L........I/LL..ZZJJJI/OO.SSZZTJI/OOSS..TTTI|0.02
\u3042\u3093\u307F\u3064SP|X|OO......../OO......../JJ......../J........./J........./L....SS..T/L...SSZZTT/LL.IIIIZZT|0.02
\u3042\u3093\u307F\u3064SP 2|X|OO......../OO......../JJ......../J........./J........./L....ZZ..T/L...SSZZTT/LL.SSIIIIT|0.02
\u4E2D\u7A7A\u3051TKI(\u5DE6\u51F8)|X|IS......OO/ISS....TOO/IJS.ZZTTTL/IJJJ.ZZLLL|0.02
\u4E2D\u7A7A\u3051TKI(\u5DE6\u51F8) 2|X|JJ......LL/JOO....SSL/JOO.ZZSSTL/IIII.ZZTTT|0.02
\u4E2D\u7A7A\u3051TKI(\u5DE6\u51F8) 3|X|OO......SS/OOL....SSJ/LLL.ZZTTTJ/IIII.ZZTJJ|0.02
TT\u64EC\u304D|X|........I./....TTT.I./L....TS.IJ/L.OOZZSSIJ/LLOO.ZZSJJ|0.02
\u307F\u305F\u3089\u3057\u305F|X|.........J/.........J/....I.ZZJJ/L...I..ZZT/L.OOI.SSTT/LLOOISS..T|0.02
\u6D88\u706B\u6813\u7832|X|....JJJ.../....OOJ.../....OOI.../L....TI.../L.ZZTTI.SS/LL.ZZTISS.|0.02
\u6D88\u9632\u8247\u7A4D\u307F|X|......I.../....OOI.../....OOI.../L....TI.S./L.ZZTTJ.SS/LL.ZZTJJJS|0.02
S\u304C\u65E9\u3044\u3068\u5B09\u3057\u3044\u7832|X|....OO..../....OO..S./L....TJ.SS/L.ZZTTJJJS/LL.ZZTIIII|0.02
Unnamed bag 1 [b1-8e258717]|T|I........./I........./I........./I........./LS.....JJJ/LSSOO..ZZJ/LLSOO...ZZ|0.02
Unnamed bag 1 [b1-8e258717] 2|T|I........./I........./I........./I........./ZZ.....SLL/JZZOO..SSL/JJJOO...SL|0.02
\u30D1\u30C3\u30AD\u30F3\u30B0TD|X|.....S..../.....SS.../....OOS.../....OO..../L....T..../L.ZZTT..../LL.ZZTIIII|0.02
\u304A\u3084\u3059\u307FTST|X|.......LLI/.S......LI/.SSJ....LI/OOSJ..TZZI/OOJJ.TTTZZ|0.02
\u304A\u3084\u3059\u307FTST 2|X|.......TTT/.J......TZ/.JOO....ZZ/JJOO..SSZL/IIII.SSLLL|0.02
\u304A\u306F\u3088\u3046TST|X|........T./........TT/.J......TZ/.JOO....ZZ/JJOO..SSZL/IIII.SSLLL|0.02
Firm TST|X|..S......./I.SS....LL/IJJS.....L/IJOO..TZZL/IJOO.TTTZZ|0.02
\u793E\u755C\u58C1TST|X|........OO/........OO/SLL......T/SSL.....TT/JSL....ZZT/JJJ.IIIIZZ|0.02
\u793E\u755C\u58C1TST 2|X|........OO/........OO/JJJ......T/LSJ.....TT/LSS....ZZT/LLS.IIIIZZ|0.02
Tidy TSD|X|.........I/.......S.I/.......SSI/L....JJJSI/LZZ...TJOO/LLZZ.TTTOO|0.02
Joy TD|X|.I......../.I......../.I...OO.../SI...OO.../SS....TL../JS.ZZTTL../JJJ.ZZTLL.|0.02
\u30B9\u30ED\u30FCDTD\u30E1\u30AB\u30CB\u30AB\u30EB|X|........T./OOS....TTT/OOSS....ZJ/LLLS...ZZJ/LIIII..ZJJ|0.02
Cater|X|.........Z/........ZZ/........ZI/T...J..LLI/TTSSJ.OOLI/TSSJJ.OOLI|0.02
\u30DA\u30B9\u30C8\u30EA\u30FC|X|.T.....I../TTT.SLLI.J/OOZZSSLI.J/OO.ZZSLIJJ|0.02
\u990AK\u7832|X|...SS...../..SS....../...T....../...TT...../...TLL..../.....L.JJJ/OO...L.ZZJ/OO..IIIIZZ|0.02
\u30DE\u30B9\u30AF\u30E1\u30ED\u30F3\u30D1\u30D5\u30A7|T|........J./L.......J./L......JJ./LL......S./OO....ZZSS/OO.IIIIZZS|0.02
\u30AF\u30A4\u30C3\u30AF\u30BF\u30EF\u30FC\u30D1\u30D5\u30A7|T|I........./I.....J.../I.....JJJZ/I.......ZZ/OO....SSZL/OO...SSLLL|0.02
34TSD|T|SZZ.....LL/SSZZ...OOL/JS.....OOL/JJJ...IIII|0.02
\u62CD\u624B\u7832|X|I........./I........./I........./I.....SS../L..T.SSZJ./L.TTOOZZJ./LL.TOOZJJ.|0.02
\u3069\u3089\u713C\u304D\u7A4D\u307F|X|..SS....../.SS......./.OO......./JOO....TL./JJJ.ZZTTL./IIII.ZZTLL|0.02
NEW TKI|X|JJ......../J........./J.ZZ....../L..ZZ...../L.TTTSS.../LL.TSSIIII|0.02
\u30D0\u30B0TST|X|.........T/.......JTT/.......JST/.LL...JJSS/OOL....ZZS/OOL.IIIIZZ|0.02
\u30D0\u30B0TST 2|X|.........T/.......STT/.......SST/.LL...ZZSJ/OOL....ZZJ/OOL.IIIIJJ|0.02
\u30D0\u30B0TST 3|X|.........L/.......LLL/.......SST/.OO...SSTT/JOO....ZZT/JJJ.IIIIZZ|0.02
TPC (Z-Hold)|X|S........T/SSLLL...TT/JSLOO....T/JJJOO.IIII|0.02
TPC (Z-Hold) 2|X|J........T/JJJSS...TT/OOSSL....T/OOLLL.IIII|0.02
TT\u3044\u308F\u3057|X|JJ......../JLL......./JZL......./ZZL....T../ZSS...TTOO/SSIIII.TOO|0.02
\u30D4\u30FC\u30CA\u30C3\u30C4\u7A4D\u307F|X|LLLS....../LZZSS....T/OOZZS...TT/OOIIII...T|0.02
\u30AC\u30FC\u30CD\u30C3\u30C8\u7A4D\u307F|X|........OO/........OO/L......JJJ/L.IIIISSTJ/LL...SSTTT|0.02
\u6885\u96E8\u7832|X|LLL......./LOO......./JOO....SST/JJJZZ.SSTT/IIIIZZ...T|0.02
\u6885\u96E8\u7832 2|X|JJJ......./OOJ......./OOL....SST/LLLZZ.SSTT/IIIIZZ...T|0.02
\u6885\u96E8\u7832 3|X|IOO......./IOO......./IJL....SST/IJLZZ.SSTT/JJLLZZ...T|0.02
\u7AF9\u7B52\u7832777ver.|X|..SS....../.SS......./.I......../.I......../LI.....OOJ/LI.T.ZZOOJ/LLTTT.ZZJJ|0.02
\u30C8\u30EB\u30CD\u30FC\u30C9TST2\u53F7|X|I........./I........./IS......../ISS..T..ZJ/OOS.LTTZZJ/OOLLLT.ZJJ|0.02
\u958B\u5E55\u8D85\u901A\u6C17\u7832|X|ZZ...OO.../LZZT.OOJ../L..TTSSJJJ/LL.TSSIIII|0.02
\u4E0D\u5B89\u5B9ATD|X|S........./SS......../ISOO....../ILOO..T.../ILZZ.TTJJJ/ILLZZ.T..J|0.02
Unnamed bag 1 [sasasa123-1247]|X|L........I/L........I/LL.....SSI/OO..ZZSSTI/OO...ZZTTT|0.02
\u30CA\u30BA\u7832\uFF12\u53F7|X|I..T...OO./ILTTT..OOJ/ILZZ...SSJ/ILLZZ.SSJJ|0.02
\u30AB\u30AA\u30B9\u30D6\u30EA\u30C3\u30B8|T|........J./........J./.......JJ./........S./........SS/L........S/LIIIIZZ.OO/LL....ZZOO|0.02
L\u304CZ\u3088\u308A\u65E9\u3044\u3068\u7206\u6B7B\u7832|X|.........I/.........I/.........I/JJ......SI/JL..T...SS/JL.TTOOZZS/.LL.TOO.ZZ|0.02
X-OverPC|X|.......OO./S......OOZ/SSL.....ZZ/TSL.....ZJ/TTLL.....J/TIIII...JJ|0.02
\u524A\u308A\u7BC0TSD|X|LL......../IL......../ILZ....OOJ/IZZSS.TOOJ/IZSS.TTTJJ|0.02
Partial bag 1 [sasasa123-1271]|T|I........./I........./I........./I.L......./OOLZZ...SS/OOLLZZ.SS.|0.02
\u30D5\u30EA\u30FC\u30BATD(J\u30DB\u30FC\u30EB\u30C9)|X|........S./L....OO.SS/L.TTTOOZZS/LL.TIIIIZZ|0.02
\u30D7\u30EC\u30FC\u30C8TD\u4E9C\u7A2E|X|.ZLLL...../ZZLOO....J/ZSSOO.TTTJ/SSIIII.TJJ|0.02
\u30D7\u30EC\u30FC\u30C8TD\u4E9C\u7A2E 2|X|.SSOO...../SSLOO....J/LLLZZ.TTTJ/IIIIZZ.TJJ|0.02
\u30B7\u30F3\u30D7\u30EBTD|X|......J.../....ZZJJJ./L....ZZOO./L.TTTSSOO./LL.TSSIIII|0.02
Partial bag 1 [sasasa123-1277]|T|.........Z/........ZZ/........ZJ/.........J/OOLLLSS.JJ/OOL.SSIIII|0.02
\u4E0D\u5E78\u904BSTT|T|I....OO..Z/I....OO.ZZ/IJ....SSZL/IJJJ.SSLLL|0.02
\u4E0D\u5E78\u904BSTT 2|T|I....SS..Z/I...SS..ZZ/IJ..OO..ZL/IJJJOO.LLL|0.02
\u30B9\u30AF\u30E9\u30C3\u30D7\u30D5\u30A9\u30FC\u30B9|T|I........./I........./I.......J./I.......J./LOO....JJ./LOOZZ...SS/LL..ZZ.SS.|0.02
\u30D5\u30EA\u30FC\u30BATD|X|JJ......../J........./J.......S./L....OO.SS/L.TTTOOZZS/LL.TIIIIZZ|0.02
Aberrant SD|T|.OO......./SOO......./SS.....J../LS.IIIIJJJ/L.....ZZ../LL.....ZZ.|0.02
T\u30C0\u30AC\u30FC(S\u5BDD\u304B\u305B)|X|.....JJ.../..Z..J..../.ZZSSJ.TTT/.ZSSOO..TL/IIIIOO.LLL|0.02
Lemon Stacking (Edge)|X|......SSI./L....SSJI./L.ZZTTTJI./LL.ZZTJJI.|0.02
Lemon Stacking (Edge) 2|X|......JJJ./L....SSTJ./L.ZZSSTTT./LL.ZZIIII.|0.02
Lemon Stacking (Middle)|X|.......SSI/.L....SSJI/.L.ZZTTTJI/.LL.ZZTJJI|0.02
Lemon Stacking (Middle) 2|X|.......JJJ/.L....SSTJ/.L.ZZSSTTT/.LL.ZZIIII|0.02
DIC\u7A4D\u307F|X|....SS..../...SSJL.../OOTTTJLZZ./OO.TJJLLZZ|0.02
Rhymers' Soccer|X|.LL...ZZ../OOL....ZZJ/OOL.TTTSSJ/IIII.TSSJJ|0.02
\u6050\u7E2E\u7A4D\u307F(\u5F622)|X|..ZZ....OO/LLLZZ..JOO/LSST...JJJ/SSTTT.IIII|0.02
\u6050\u7E2E\u7A4D\u307F(\u5F622) 2|X|..ZZ....SS/JJJZZ..SSL/OOJT...LLL/OOTTT.IIII|0.02
\u6050\u7E2E\u7A4D\u307F(\u5F623)|X|..ZZ...JJ./LLLZZ..JOO/LSST...JOO/SSTTT.IIII|0.02
\u6050\u7E2E\u7A4D\u307F(\u5F623) 2|X|..ZZ...LS./JJJZZ..LSS/OOJT...LLS/OOTTT.IIII|0.02
\u6050\u7E2E\u7A4D\u307F2\u53F7|X|J........./JJJ...OOS./LLL...OOSS/LT.....ZZS/TTT.IIIIZZ|0.02
\u6050\u7E2E\u7A4D\u307F2\u53F7 2|X|J........./JJJ...SZZ./LLL...SSZZ/LT.....SOO/TTT.IIIIOO|0.02
\u6C34\u7121\u6708\u7A4D\u307F|X|........S./........SS/......TOOS/J..ZZTTOOL/JJJ.ZZTLLL|0.02
Tetris At The Speed Of Light|X|IIIISSZ.../OOJSSZZ.T./OOJJJZ.TTT|0.02
\u81EA\u7531\u7832|T|....S...../....SS.OOJ/ZZ...SLOOJ/.ZZ.LLL.JJ|0.02
\u306D\u304E\u7832|X|OO......../OO....T.../LS.J.TT.../LSSJJJTZZ./LLS.IIIIZZ|0.02
\u306D\u304E\u7832 2|X|LL......../IL....T.../IL.S.TT.../IOOSSJTZZ./IOO.SJJJZZ|0.02
\u89D2\u7832|X|.I......../.I......../.I......../.I.T...J../ZZTTTSSJOO/.ZZ.SSJJOO|0.02
Shining Knight Stacking|X|....ZZ..../LOOJTZZ.../LOOJTTSS../LLJJTSS...|0.02
\u7BA1\u7832|X|....T..Z../...TTTZZ.J/....LLZSSJ/...OOLSSJJ/...OOLIIII|0.02
\u7BA1\u7832 2|X|....T..Z../...TTTZZ.I/....SSZOOI/...SSLJOOI/...LLLJJJI|0.02
\u7BA1\u7832 3|X|....T..Z../...TTTZZ.L/....SSZLLL/...SSJJJOO/...IIIIJOO|0.02
\u7BA1\u7832 4|X|....T..Z../...TTTZZ.I/....OOZSSI/...JOOSSLI/...JJJLLLI|0.02
\u30C8\u30DE\u30C8|T|........OO/........OO/ZZ......SS/JZZ....SSL/JJJIIIILLL|0.02
\u96E8\u5BBF\u308A\u7A4D\u307F|X|I......S../I......SS./IJL....TS./IJL.ZZTTOO/JJLL.ZZTOO|0.02
UD-Spin|X|......S.../......SSOO/...T...SOO/...TT.LJJJ/...T..LZZJ/.IIII.LLZZ|0.02
UD-Spin 2|X|......S.../......SSOO/...T...SOO/...TT.ZZLL/...T..JZZL/.IIII.JJJL|0.02
ulBT|X|.......OO./.......OO./........S./........SS/.LLT.....S/.ZLTT....J/ZZLT.....J/ZIIII...JJ|0.02
\u7460\u7483\u7A4D\u307F|X|.JJZ....../IJZZ.....T/IJZL....TT/IOOL...SST/IOOLL.SS..|0.02
\u9234TD|X|....JJJ.../....ZZJ.../L....ZZOO./L.TTTSSOO./LL.TSSIIII|0.02
Unnamed bag 1 [b1-db2b2421]|X|....JJJ.../....ZZJ.../L....ZZ.OO/L.TTTSS.OO/LL.TSSIIII|0.02
\u7BA1\u78322\u53F7|X|.......T../......TTTJ/.LL....SSJ/OOL...SSJJ/OOL...IIII|0.02
\u7BA1\u78322\u53F7 2|X|.......T../......TTTI/.SS....OOI/SSL...JOOI/LLL...JJJI|0.02
\u7BA1\u78322\u53F7 3|X|.......T../......TTTI/.OO....SSI/JOO...SSLI/JJJ...LLLI|0.02
\u30C1\u30FC\u30BA\u7A4D\u307F\u6539(L\u30DB\u30FC\u30EB\u30C9)|X|..J......./..JJJ...../...OO....T/.SSOO.ZZTT/SSIIII.ZZT|0.02
\u6D1E\u7A9F\u7A4D\u307F|X|.........Z/........ZZ/........ZT/........TT/IIII....ST/OO....J.SS/OO....JJJS|0.02
\u30EC\u30F3\u30AC\u7A4D\u307F|X|SLL...OO.T/SSL...OOTT/JSL....ZZT/JJJ.IIIIZZ|0.02
\u30EC\u30F3\u30AC\u7A4D\u307F 2|X|JJJ...OO.T/LSJ...OOTT/LSS....ZZT/LLS.IIIIZZ|0.02
Tidy TSD 2|X|I........./I........./I........Z/I.......ZZ/LOO.....ZJ/LOOT...SSJ/LLTTT.SSJJ|0.02
Option-2|X|.........Z/.......JZZ/..L....JZT/OOL...JJTT/OOLL.IIIIT|0.02
\u307F\u7A4D\u307F\u7A4D\u7832|T|.S.....LLL/.SS....LZJ/OOS....ZZJ/OOIIII.ZJJ|0.02
\u30A8\u30B9\u30AB\u30EC\u30FC\u30C8DTD|X|.........J/.........J/........JJ/T.OO...SLL/TTOO.ZZSSL/TIIII.ZZSL|0.02
\u80BA\u5FAA\u74B0\u7A4D\u307F|X|I........./I...L...../I.LLLOO..J/IT.ZZOOSSJ/TTT.ZZSSJJ|0.02
\u80BA\u5FAA\u74B0\u7A4D\u307F 2|X|LLL......./L........./I........./I........./I....OO..J/IT.ZZOOSSJ/TTT.ZZSSJJ|0.02
\u65B0\u30B9\u30D4\u30A2\u30FC\u30C9|X|..T....SLL/OOTT...SSL/OOTZZ..JSL/IIIIZZ.JJJ|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F|X|.T......../TTTSSIIIIZ/OOSSLJJJZZ/OOLLL..JZ.|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 2|X|.T......../TTTZJ..LS./OOZZJLLLSS/OOZJJIIIIS|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 3|X|.Z......../ZZOOJ..LS./ZTOOJLLLSS/TTTJJIIIIS|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 4|X|.Z......../ZZSST..JJ./ZSSTTTLJOO/IIIILLLJOO|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 5|X|.Z......../ZZTTT..OO./ZSSTJJJOOL/SSIIIIJLLL|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 6|X|.Z......../ZZTLL..SS./ZTTTLJSSOO/IIIILJJJOO|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 7|X|.J......../LJJJT..SS./LZZTTTSSOO/LLZZIIIIOO|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 8|X|.Z......../ZZLLLJIIII/ZTLOOJJJSS/TTTOO..SS.|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 9|X|.T......../TTTLIIIIOO/JLLLSSZZOO/JJJSS..ZZ.|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 10|X|.Z......../ZZIIIILJJJ/ZSSTLLLOOJ/SSTTT..OO.|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 11|X|.J......../LJJJIIIIOO/LTTTSSZZOO/LLTSS..ZZ.|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 12|X|.Z......../ZZSIIIIJJJ/ZTSSLLLOOJ/TTTSL..OO.|0.02
\u30B3\u30FC\u30E9\u7A4D\u307F 13|X|.Z......../ZZSSJJJLOO/ZSSTTTJLOO/IIIIT..LL.|0.02
\u8DF3\u3073\u7BB1\u7A4D\u307F(\u4EEE)|X|...S....../...SS...../...IS...../JJ.IL....T/JOOIL.ZZTT/JOOILL.ZZT|0.02
\u8DF3\u3073\u7BB1\u7A4D\u307F(J\u30DB\u30FC\u30EB\u30C9)(\u4EEE)|X|...S....../...SS...../...IS...../...IL....T/.OOIL.ZZTT/.OOILL.ZZT|0.02
\u30D1\u30D7\u30EA\u30AB\u7A4D\u307F|X|S........./SS......../IS.....Z../IL....ZZOO/IL...TZJOO/ILL.TTTJJJ|0.02
\u976DTD|X|JJ......../J.....OO../JSS...OO../SSL....T../LLL.ZZTT../IIII.ZZT..|0.02
\u95A3\u7A4D\u307F(J\u30DB\u30FC\u30EB\u30C9)|X|..S......./..SS....../...SL....T/OOLLL.ZZTT/OOIIII.ZZT|0.02
\u5B89\u5B9A\u578B\u958B\u5E55\u30A4\u30F3\u30DA\u30EA\u30A2\u30EB\u30AF\u30ED\u30B9|X|....S...../....SS..../JJZOOS.TTT/JZZOO...TL/JZIIII.LLL|0.02
\u307F\u308A\u3093TD|X|I........./I........./I..T....../I.TTJL..S./OO.TJLZZSS/OO.JJLLZZS|0.02
\u30C1\u30FC\u30BA\u30D0\u30FC\u30AC\u30FC\u7A4D\u307F|X|.J......../.JJJ....../.L......../.L......../.LLOO....T/.SSOO.ZZTT/SSIIII.ZZT|0.02
\u30C1\u30FC\u30BA\u30D5\u30A9\u30F3\u30C7\u30E5\u7A4D\u307F|X|...J....../...J....../..JJ....../LLLOO....T/LSSOO.ZZTT/SSIIII.ZZT|0.02
Milky ways v1|X|.SS.ZZTTT./SSL..ZZTJ./OOL.IIIIJ./OOLL...JJ.|0.02
Milky ways v2|X|..SS.ZZTTT/.SSL..ZZTJ/.OOL.IIIIJ/.OOLL...JJ|0.02
Milky ways v2 2|X|..OO.TTTSS/.LOO..TSSJ/.LZZ.IIIIJ/.LLZZ...JJ|0.02
Unnamed bag 1 [b1-16476952]|T|......Z.../.....ZZ..I/OOJJJZ...I/OOSSJSS.LI/.SS.SSLLLI|0.02
\u30B7\u30ED\u30C3\u30D7\u7A4D\u307F|T|........OO/........OO/........LL/.........L/.........L|0.02
\u96D1\u8349\u7A4D\u307F|X|JJ..Z...../JOOZZSS.../JOOZSSLTTT/IIIILLL.T.|0.02
\u96D1\u8349\u7A4D\u307F 2|X|LS..Z...../LSSZZOO.../LLSZJOOTTT/IIIIJJJ.T.|0.02
\u96D1\u8349\u7A4D\u307F 3|X|IS..Z...../ISSZZLL.../IJSZOOLTTT/IJJJOOL.T.|0.02
\u96D1\u8349\u7A4D\u307F 4|X|OO..S...../OOZZSSJ.../LLLZZSJTTT/LIIIIJJ.T.|0.02
\u7559\u3002|T|ZZ.....JJ./LZZ....JOO/L....SSJOO/LL..SSIIII|0.02
\u3055\u3064\u307E\u3044\u3082MT|T|.........I/....JJJ..I/L....ZJ..I/L.OOZZSS.I/LLOOZSS...|0.02
Partial bag 1 [sasasa123-1394]|T|......S.../......SS../IIII...SLL/...ZZ.OO.L/....ZZOO.L|0.02
\u7B39\u5F0FDD\u30D1\u30D5\u30A7|T|I........./IJJ...ZZLL/IJOO.SSZZL/IJOOSS...L|0.02
\u7B39\u5F0FDD\u30D1\u30D5\u30A7 2|T|I........./IJJZZ...LL/IJOOZZ.SSL/IJOO..SS.L|0.02
\u72C2\u7832|T|JJ......../J........./JSS.ZZ..../SSL..ZZ.OO/LLL.IIIIOO|0.02
\u30ED\u30FC\u30BA\u30C6\u30A3\u30FC|T|LLL......./LZ......../ZZ......../Z...SS...J/OO.SSIIIIJ/OO......JJ|0.02
\u30DF\u30F3\u30C8\u30C6\u30A3\u30FC|T|LLL......./LZ......../ZZ......../Z......JJJ/OO.IIIISSJ/OO....SS..|0.02
Unnamed bag 1 [b1-210ef7d3]|T|I........./I...LJJJ../I.SSLZZJOO/ISS.LLZZOO|0.02
TS\u30D1\u30D5\u30A7\u30DE\u30B7\u30F3\u30AC\u30F3|T|..IIII..../..ZZLL..S./OOJZZL..SS/OOJJJL...S|0.02
\u6D41\u308C\u6A4B|X|T.....I.../TTZZLLIJJJ/TSSZZLIOOJ/SS...LIOO.|0.02
\u6D41\u308C\u6A4B 2|X|I.....S.../ITZZLLSSOO/ITTZZLJSOO/IT...LJJJ.|0.02
\u6D41\u308C\u6A4B 3|X|I.....T.../IJJSSTTLOO/IJSSZZTLOO/IJ...ZZLL.|0.02
\u9F2C\u7A4D\u307F|X|JJ.......I/J........I/J......SSI/L....ZSSTI/L...ZZOOTT/LL..Z.OOT.|0.02
\u9F2C\u7A4D\u307F 2|X|JJ......../J........./J.IIII.OO./L....ZTOO./L...ZZTTSS/LL..Z.TSS.|0.02
\u3057\u308D\u307F\u3064\u7832(L\u30DB\u30FC\u30EB\u30C9)|X|S........./SS......../JS.....T../JJJ.ZZTTOO/IIII.ZZTOO|0.02
\u7345\u5B50DT|X|....TZZ.../...TTTZZL./.....JJJL./OO...SSJLL/OO..SSIIII|0.02
\u30CF\u30D5\u30CB\u30A6\u30E0\u7A4D\u307F|X|I........./I...ZS..../IJLZZSS.../IJLZOOST../JJLLOOTTT.|0.02
\u30CF\u30D5\u30CB\u30A6\u30E0\u7A4D\u307F 2|X|I........./I...OO..../IJJJOOZ.../ISSJLZZT../SSLLLZTTT.|0.02
\u30CF\u30D5\u30CB\u30A6\u30E0\u7A4D\u307F 3|X|I........./I...OO..../IJLSOOZ.../IJLSSZZT../JJLLSZTTT.|0.02
\u30CF\u30D5\u30CB\u30A6\u30E0\u7A4D\u307F 4|X|I........./I...ZZ..../IJLOOZZ.../IJLOOSST../JJLLSSTTT.|0.02
\u30CF\u30D5\u30CB\u30A6\u30E0\u7A4D\u307F 5|X|I........./I...SS..../IJLSSOO.../IJLZZOOT../JJLLZZTTT.|0.02
\u9234\u3044\u3089\u306A\u3044|X|.....SS.../....SS..../....LLL.ZJ/....LT.ZZJ/IIIITTTZJJ|0.02
\u2605\u30BF\u30D4\u30AA\u30AB\u30D1\u30F3\u2605|X|.........I/.OOS.....I/.OOSSJJ.LI/.TZZSJ..LI/TTTZZJ..LL|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD|X|IJJZ....../IJZZ....../IJZ.....LL/ISST...OOL/SSTTT..OOL|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD 2|X|ILOO....../ILOO....../ILL.....ZJ/ISST...ZZJ/SSTTT..ZJJ|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD 3|X|IIII....../STTT....../SST.....LL/JSZZ...OOL/JJJZZ..OOL|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD 4|X|IJJJ....../IOOJ....../IOO.....SS/ITZZ...SSL/TTTZZ..LLL|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD 5|X|ILLL....../ILSS....../ISS.....OO/ITZZ...JOO/TTTZZ..JJJ|0.02
\u30B0\u30C3's\u6A5F\u68B0\u7684TSD 6|X|IIII....../JJSS....../JSS.....LL/JTZZ...OOL/TTTZZ..OOL|0.02
\u30DE\u30B8\u30E7\u30EA\u30C6\u30A3\u30EC\u30A4\u30C9|T|.........J/.........J/I.......JJ/I......SLL/IOO..ZZSSL/IOO...ZZSL|0.02
66%|T|I........./IZZ.LS..../IJZZLSS.OO/IJJJLLS.OO|0.02
\u958B\u5E55\u8D85\u901A\u6C17\u7832v2|X|.....T..ZI/..JJTTTZZI/OOJ..SSZLI/OOJ.SSLLLI|0.02
\u51B7\u3048\u305F\u30DD\u30C6\u30C8\u7A4D\u307F|X|.SLL..J.../TSSL..JJJ./TTSL.OOZZ./TIIIIOO.ZZ|0.02
\u51B7\u3048\u305F\u30DD\u30C6\u30C8\u7A4D\u307F 2|X|.SST..J.../SSTT..JJJ./LLLT.OOZZ./LIIIIOO.ZZ|0.02
\u30B1\u30BA\u30EA\u30B9\u7A4D\u307F v2|X|.........Z/I.......ZZ/I.....JLZT/IOO.SSJLTT/IOOSSJJLLT|0.02
\u5FEB\u901FDT|T|........Z./I......ZZ./I....SSZOO/I...SSLJOO/I...LLLJJJ|0.02
\u30B9\u30C6\u30FC\u30D6\u30EB\u30EC\u30B9\u30C8\u30A2 v.PC|X|L........./L........./LL......../OOJ.....S./OOJJJTZZSS/IIIITTTZZS|0.02
\u30B9\u30C6\u30FC\u30D6\u30EB\u30EC\u30B9\u30C8\u30A2 v.PC 2|X|I........./I........./IJ......../IJJJTTTSSZ/OOLLLTSSZZ/OOL.....Z.|0.02
\u90AA\u5FC3\u30EA\u30D9\u30EC\u30A4\u30C8|X|S........I/SS...T...I/JSZZTT.OOI/JJJZZT.OOI|0.02
\u4F59\u7832|X|LL......../IL......../IL..T...../IJ.TTZZ.OO/IJJJT.ZZOO|0.02
DT\u98A8\u30D1\u30D5\u30A7|T|.....ZIS../....ZZISS./OO..ZLIJS./OO.LLLIJJJ|0.02
(\u03BF\u03C9\u03BF)\u30D1\u30D5\u30A7|T|.........I/..SS..ZZ.I/.SSLOOJZZI/.LLLOOJJJI|0.02
come back aloe!|X|OO......../OO......../ZZ.......I/TZZ.J..LLI/TTSSJ...LI/TSSJJ...LI|0.02
63\u7A4D\u307F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v1|X|I........./I........./I........./IZ......../ZZ......../ZT......../TTT.....SS/OOJ....SSL/OOJJJ..LLL|0.02
Unnamed bag 1 [b1-2eadfdbe]|X|.Z......../ZZ......../Z........./I........./I........./I........./IT......../TTT.....SS/OOJ....SSL/OOJJJ..LLL|0.02
Unnamed bag 1 [b1-46cfa315]|X|..I......./.ZI......./ZZI......./ZTI......./TTT.....SS/OOJ....SSL/OOJJJ..LLL|0.02
63\u7A4D\u307F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v2|X|.T......../TTT......./SLL......./SSL......./ISL......./IZZ......./IJZZOO..../IJJJOO....|0.02
63\u7A4D\u307F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v2 2|X|.T......../TTT......./JJJ......./ZZJ......./IZZ......./ILS......./ILSSOO..../ILLSOO....|0.02
\u30AE\u30E3\u30F3\u30D6\u30EBTD v1|T|.........I/L....SSOOI/L.ZZSSJOOI/LL.ZZ.JJJI|0.02
\u30AE\u30E3\u30F3\u30D6\u30EBTD v2|T|I........./IL....SSOO/IL.ZZSSJOO/ILL.ZZ.JJJ|0.02
PCC-Spin|X|L....SSOOJ/LZZ.SSTOOJ/LLZZ.TTTJJ|0.02
O\u3057\u304B\u52DD\u305F\u3093\u30D1\u30D5\u30A7|T|LLL.....SS/LZJ....SS./ZZJOO...../ZJJOOIIII.|0.02
\u7A00\u6709PC|X|..SS.....I/TSS...JJJI/TTZZ.LLLJI/T..ZZL...I|0.02
Partial bag 1 [sasasa123-1456]|X|..T......L/OOTTSS.LLL/OOTSS.IIII|0.02
Unnamed bag 1 [b1-0a9e98a5]|T|JJ......../J........./J...ZZ..../L....ZZ.../L.IIIISSOO/LL...SS.OO|0.02
Unnamed bag 1 [b1-0a9e98a5] 2|T|JJ......../J........./J...ZZ...L/L....ZZLLL/L.IIIISSOO/LL...SS.OO|0.02
\u30E2\u30F3\u30C6\u30AB\u30EB\u30ED\u7832|T|JJ......../J........./J.ZZ....../L..ZZ...../L.IIIISSOO/LL...SS.OO|0.02
\u6C34\u7121\u6708\u7A4D\u307F(I\u56FA\u5B9A)|X|.I......S./.I......SS/.I....TOOS/JI.ZZTTOOL/JJJ.ZZTLLL|0.02
\u30DE\u30AB\u30ED\u30F3\u7832|X|LLL....J../LT....SJJJ/TTT.ZZSSOO/IIII.ZZSOO|0.02
\u30DE\u30AB\u30ED\u30F3\u7832 2|X|LLL..S..../LT...SS.OO/TTT.ZZSJOO/IIII.ZZJJJ|0.02
DT\u30E1\u30AB\u30CB\u30AB\u30EB|T|........SS/.......SSI/ZZ.....LLI/JZZ...OOLI/JJJ...OOLI|0.02
\u4F0F\u305B\u3046\u3055\u304E\u7A4D\u307F|X|....T...../...TTT..L./....ZJJJL./OO.ZZSSJLL/OO.ZSSIIII|0.02
\u70B9\u7832\uFF01|X|.I.....Z../.I....ZZ../.I..T.ZLS./JI.TTOOLSS/JJJ.TOOLLS|0.02
Partial bag 1 [sasasa123-1471]|X|S........./SS......../IS......../IL....T.../IL.ZZTT.../ILL.ZZT...|0.02
\u30D6\u30EC\u30FC\u30AB\u30FCDT|T|...Z.....J/.LZZ...SSJ/.LZOO.SSJJ/.LLOO.IIII|0.02
Unnamed bag 1 [sasasa123-1474]|X|.OO......./JOO..TTTSS/JJJ.ZZTSSL/IIII.ZZLLL|0.02
Unnamed bag 1 [sasasa123-1474] 2|X|.SS......./SSL..TTTOO/LLL.ZZTJOO/IIII.ZZJJJ|0.02
Unnamed bag 1 [sasasa123-1474] 3|X|.ZJ......./ZZJ..SSLLL/ZJJ.SSTLOO/IIII.TTTOO|0.02
Unnamed bag 1 [sasasa123-1474] 4|X|.LL......./OOL..SSJJJ/OOL.SSTZZJ/IIII.TTTZZ|0.02
Unnamed bag 1 [sasasa123-1474] 5|X|.OO......./LOO..IIIIJ/LZZ.TTTSSJ/LLZZ.TSSJJ|0.02
Unnamed bag 1 [sasasa123-1474] 6|X|.SS......./SSL..IIIIJ/OOL.ZZTTTJ/OOLL.ZZTJJ|0.02
\u30C1\u30AD\u30F3\u30B5\u30E9\u30C0TST|X|......JJT./......JTT./OO..ZZJST./OOL..ZZSS./LLL.IIIIS.|0.02
\u30C1\u30AD\u30F3\u30B5\u30E9\u30C0TST 2|X|......LLL./......LSS./JJ..ZZSST./JOO..ZZTT./JOO.IIIIT.|0.02
\u30C1\u30AD\u30F3\u30B5\u30E9\u30C0TST 3|X|......JJJ./......OOJ./LS..ZZOOT./LSS..ZZTT./LLS.IIIIT.|0.02
\u30C1\u30AD\u30F3\u30B5\u30E9\u30C0TST 4|X|......TLL./......TTL./JJ..ZZTSL./JOO..ZZSS./JOO.IIIIS.|0.02
\u30B9\u30B3\u30C3\u30C8TD|X|.....OO.../.....OO.../.....SS.../....SS..../L....T..../L.ZZTT..../LL.ZZTIIII|0.02
\u7D68\u6BEF\u30D6\u30EA\u30C3\u30B8|T|...JJJ..../...OOJ..../...OO....Z/IIIISS.LZZ/...SSLLLZ.|0.02
X\u7832|X|.........I/.........I/...TTT...I/....TS.OOI/J..ZZSSOOL/JJJ.ZZSLLL|0.02
\u30DF\u30B0\u30B7\u30B9DT|X|......Z.../.....ZZ.../.....ZT.../I....TTT../ILS....J../ILSS...JOO/ILLS..JJOO|0.02
Unnamed bag 1 [b1-de514bea]|X|......T.../I....TTT../ILS....J../ILSS...JOO/ILLS..JJOO|0.02
\u8A5B\u589E\u99D1\u881FDT\u7832\u4E9C\u7A2E|X|..LL....../...LOO..../...LOO..../...JJJ...T/.....JSSTT/.....SSZZT/........ZZ|0.02
\u6392\u6C34\u6E9D|X|.......TTT/........TI/JJJ....LLI/OOJSSZZ.LI/OOSS..ZZLI|0.02
\u9752\u68EE\u7A4D\u307F|X|I........./I........./I......Z../ITTT..ZZ../OOTSS.ZL../OOSS.LLL..|0.02
DTTD\u7832|X|........I./........I./.....Z..I./....ZZ..I./JJSSZ...LL/JSSTTT.OOL/J...T..OOL|0.02
\u30A2\u30F3\u30D6\u30EC\u30E9DT|X|I........./I........./I....SSTLL/IOO.SSTTTL/JOO....ZZL/JJJ.....ZZ|0.02
\u30A2\u30F3\u30D6\u30EC\u30E9DT 2|X|I........./I........./I....SSTTT/ILL.SSZZTJ/OOL....ZZJ/OOL.....JJ|0.02
\u30F4\u30A1\u30EB\u30C4\u30A1STD|T|I...OO..../IL..OO..ZJ/IL...SSZZJ/ILL.SS.ZJJ|0.02
\u3081\u3063\u3061\u3083\u58C1DT|T|L........./L..SS....J/LLSSOO...J/IIIIOO..JJ|0.02
\u304A\u597D\u307F\u713C\u304D\u7832|X|...T....../.ZJTTOO.SS/ZZJT.OOSSL/ZJJIIIILLL|0.02
ypaaaaaDDT|X|.SSZ....../SSZZ....../OOZ......./OOTTT....J/LLLT.....J/LIIII...JJ|0.02
\u30D9\u30EB\u30EA\u30F3SDT|T|.....OO.../.....OO.../.....S..../.Z...SS.../ZZ....S.../ZJJJ.IIIIL/...J...LLL|0.02
\u30C4\u30A1\u30FC\u30EA\u30AD\u30E3\u30CE\u30F3|T|........S./........SS/OOIIII.ZZS/OOL....JZZ/LLL....JJJ|0.02
\u30C6\u30AF\u30EDDD|X|.....S.JJJ/.....SSZZJ/T.....SLZZ/TT...LLLOO/T...IIIIOO|0.02
jtSTD|T|....LLL.../I...LS..../I....SS.../IZZ.OOSJJJ/I.ZZOO...J|0.02
\u3066\u304D\u3068U\u7A4D\u307F|X|.........I/.........I/OO.......I/OO.......I/LLLSS...ZJ/LTSS...ZZJ/TTT....ZJJ|0.02
\u5F3E\u4E38TST|X|......SSI./.....SSTI./....ZZTTI./.....ZZTI.|0.02
\u4E38\u3071\u304Fr SD|T|.OO......./SOO......./SS......../LS......ZJ/L......ZZJ/LL.IIIIZJJ|0.02
\u30EA\u30D0\u30FCTT|X|JJ......../JS....ZZLL/JSS....ZZL/OOS.IIIITL/OO.....TTT|0.02
\u30EA\u30D0\u30FCTT 2|X|JJ......../JS....TTTZ/JSS....TZZ/OOS.IIIIZL/OO.....LLL|0.02
\u4E2D\u958B\u3051TT|X|.JJ......./.J......../.J.....SSI/.L....SSTI/.L.OOZZTTI/.LLOO.ZZTI|0.02
TTTT\u7832|X|.........J/.........J/........JJ/.......SSI/.L....SSTI/.L.OOZZTTI/.LLOO.ZZTI|0.02
63\u7A4D\u307F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v4|X|S........./SS......../IS......../IOO......./IOO......./IZ......../ZZJ......./ZTJJJL..../TTTLLL....|0.02
63\u7A4D\u307F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v4 2|X|S........./SS......../JS......../JJJ......./TTT......./LT......../LZZ......./LLZZOO..../IIIIOO....|0.02
63\u7A4D\u307F\u30E1\u30AB\u30CB\u30AB\u30EBTSD v4 3|X|S........./SS......../JS......../JJJ......./LLL......./LZ......../ZZT......./ZTTTOO..../IIIIOO....|0.02
\u30CA\u30A4\u30C8\u30E1\u30A2STD|T|.SS......I/SS....L.ZI/OOJ.LLLZZI/OOJJJ..Z.I|0.02
\u30CA\u30A4\u30C8\u30E1\u30A2STD 2|T|I..L...ZZ./ILLL..OOZZ/IJJJ..OOSS/I..J...SS.|0.02
AnchorDT|X|.Z......../ZZ......../Z.....LLS./OO....JLSS/OO....JLTS/IIII.JJTTT|0.02
IC-DTP|X|......L.../....LLLT../....ZZTTTJ/.....ZZSSJ/....OOSSJJ/....OOIIII|0.02
IC-DTP 2|X|......T.../....STTT../....SSIJJZ/.....SIJZZ/....OOIJZL/....OOILLL|0.02
IC-DTP 3|X|......T.../....STTT../....SSILLL/.....SILZJ/....OOIZZJ/....OOIZJJ|0.02
IC-DTP 4|X|......L.../....LLLS../....TTTSSI/.....TZZSI/....OOJZZI/....OOJJJI|0.02
IC-DTP 5|X|......T.../....STTT../....SSLLLI/.....SLZJI/....OOZZJI/....OOZJJI|0.02
IC-DTP 6|X|......T.../....STTT../....SSJJZI/.....SJZZI/....OOJZLI/....OOLLLI|0.02
IC-DTP 7|X|......I.../....OOIJ../....OOIJJJ/.....ZITTT/....ZZSSTL/....ZSSLLL|0.02
IC-DTP 8|X|......T.../....STTT../....SSIIII/.....SLJJJ/....OOLZZJ/....OOLLZZ|0.02
IC-DTP 9|X|......I.../....OOIJ../....OOIJJJ/.....ZISLL/....ZZTSSL/....ZTTTSL|0.02
IC-DTP 10|X|......S.../....OOSS../....OOJSLL/.....TJJJL/....TTTZZL/....IIIIZZ|0.02
IC-DTP 11|X|......T.../....STTT../....SSIIII/.....SZZLL/....OOJZZL/....OOJJJL|0.02
IC-DTP 12|X|......T.../....STTT../....SSLJJJ/.....SLZZJ/....OOLLZZ/....OOIIII|0.02
IC-DTP 13|X|......T.../....JTTT../....JJJSLL/.....ZZSSL/....OOZZSL/....OOIIII|0.02
IC-DTP 14|X|......T.../....STTT../....SSZZLL/.....SJZZL/....OOJJJL/....OOIIII|0.02
DTT(TT)\u7A4D\u307F|X|.........T/..ZZ....TT/L..ZZ.OOST/L.JJJ.OOSS/LL..JIIIIS|0.02
\u30E9\u30D4\u30B9\u30E9\u30BA\u30EADT|X|.........I/........ZI/.......ZZI/....JJ.ZTI/....J..TTT/....J...SS/....OO.SSL/....OO.LLL|0.02
NG\u7832|X|.........I/.........I/.......SSI/......SSTI/.ZJJ....TT/ZZJOO...TL/Z.JOO..LLL|0.02
\u4F59\u5F26\u7A4D\u307F|T|I......SS./I.....SSZJ/I...LOOZZJ/I.LLLOOZJJ|0.02
\u4F59\u5F26\u7A4D\u307F 2|T|I......OO./I.....ZOOJ/I...LZZSSJ/I.LLLZSSJJ|0.02
\u4F59\u5F26\u7A4D\u307F 3|X|T......JJ./TT....ZJOO/TSS.LZZJOO/SSLLLZIIII|0.02
mirage TD|X|........S./........SS/......TTTS/LLL..ZZTOO/LIIII.ZZOO|0.02
\u771F\u7D05\u4E00\u9583|T|.....S..../..Z..SS..I/.ZZ...S..I/JZ....LOOI/JJJ.LLLOOI|0.02
DTT(TT)\u7A4D\u307F(Z\u30DB\u30FC\u30EB\u30C9)|X|.........T/........TT/L.....OOST/L.JJJ.OOSS/LL..JIIIIS|0.02
BL\u7832EXTver2|T|.......L../..Z....L.I/.ZZ....LLI/JZ...SSOOI/JJJ.SS.OOI|0.02
\u661F\u5929\u697C|X|I......S../I......SS./I..T..ZJS./I.LTTZZJOO/LLLT.ZJJOO|0.02
\u30B7\u30E3\u30C9\u30A6TD|X|I........./I.TTTSS.../I..TSSZJ../I.LOOZZJ../LLLOOZJJ..|0.02
\u7A4D\u8F09TSS|T|OO......../OO.....I../S...ZLLIJJ/SS.ZZ.LIJ./.S.Z..LIJ.|0.02
BT\u30D5\u30A7\u30A4\u30F3\u30C8|T|.......OOI/.....J.OOI/.SSZZJJJLI/SS..ZZLLLI|0.02
BT\u30D5\u30A7\u30A4\u30F3\u30C8 2|X|I......JJJ/IT...S.OOJ/ITTZZSSOOL/IT..ZZSLLL|0.02
\u7802\u4E18\u7832|X|.........I/.........I/.......Z.I/LOOJS.ZZ.I/LOOJSSZTTT/LLJJ.S..T.|0.02
\u7802\u4E18\u7832 2|X|....I...../....I...../....I.S.../JJLLI.SS.Z/JOOLTTTSZZ/JOOL.T..Z.|0.02
\u30A8\u30AD\u30BB\u30F3\u30C8\u30EA\u30C3\u30AFTD|X|..SS....../.SS......./JJ......../J........./J.ZZ....../L..ZZT..../L.OOTT..../LLOO.TIIII|0.02
\u4EC4\u7A4D\u307F(L\u56FA\u5B9A)|X|......L.../......L.../......LL../J......T../JJJ.ZZTTOO/IIII.ZZTOO|0.02
Unnamed bag 1 [b1-071cb08e]|T|...L...OO./JJZL...OO./JZZLL...SS/JZIIII.SS.|0.02
Shiny X-spin|X|J........./JJJSSTZZLL/OOSSTTTZZL/OO.IIII..L|0.02
Absorber ZS|X|TLLIIIISSZ/TTLOOJSSZZ/T.LOOJJJZ.|0.02
AntiRotationDulseFlame|X|.T......../TTT....OO./ZZ.....OO./JZZ....SS./JJJ...SSL./IIII..LLL.|0.02
Yamanote Stacking|X|....SS..../...SS...../...JJ...../...JL....T/...JL.ZZTT/IIIILL.ZZT|0.02
\u30A4\u30F3\u30B9\u30BF\u30F3\u30C8TSD\u30DB\u30FC\u30EB|X|ZZ......../LZZTTTSSOO/L...TSSJOO/LL.IIIIJJJ|0.02
\u30A4\u30F3\u30B9\u30BF\u30F3\u30C8TSD\u30DB\u30FC\u30EB 2|X|ZZ......../LZZIIIIOOJ/L...SSTOOJ/LL.SSTTTJJ|0.02
NM\u2212ATSD 30|X|........T./OO......TT/OO......TI/JJZ....SSI/JZZ...SSLI/JZ....LLLI|0.02
NM\u2212ATSD 30 2|X|........T./OO......TT/OO......TI/LLL....ZJI/LSS...ZZJI/SS....ZJJI|0.02
NM\u2212ATSD 30 3|X|........S./LL......SS/IL......TS/ILZ....TTJ/IZZ...OOTJ/IZ....OOJJ|0.02
\u79CB\u9E97DT|X|S.......T./SSIIII..TT/JSZZ....TL/JJJZZ..LLL|0.02
\u3084\u3059\u3089\u304E\u7A4D\u307F|X|.........I/.........I/TTT......I/LT.....JJI/LZZ..SSJOO/LLZZSS.JOO|0.02
division DT|X|OOT......./OOTT....ZJ/LST....ZZJ/LSS....ZJJ/LLS...IIII|0.02
division DT 2|X|OOT......./OOTT....SS/ZZT....SSL/JZZ....LLL/JJJ...IIII|0.02
division DT 3|X|TZZ......./TTZZ....SS/TOO....SSL/JOO....LLL/JJJ...IIII|0.02
division DT 4|X|SZZ......./SSZZ....LL/TSJ....OOL/TTJ....OOL/TJJ...IIII|0.02
division DT 5|X|SZZ......./SSZZ....OO/LST....JOO/LTT....JJJ/LLT...IIII|0.02
division DT 6|X|TZZ......./TTZZ....OO/TSS....JOO/SSL....JJJ/LLL...IIII|0.02
3\u9023\u653B\u6483\u7A4D\u307F|X|........LL/........IL/....S...IL/...ZSS..IJ/OOZZTS..IJ/OOZTTT..JJ|0.02
3\u9023\u653B\u6483\u7A4D\u307F 2|X|........JJ/........JI/....S...JI/...ZSS..LI/OOZZTS..LI/OOZTTT..LL|0.02
\u30AD\u30C4\u30CD\u30B6\u30EB\u7A4D\u307F|X|ZZ......../SZZ......./SS..T...OO/JS.TT...OO/JJJ.T.IIII|0.02
MittSPIN|X|LLL......./LOO.TTT.../JOO..TS.../JJJ.ZZSS../IIII.ZZS..|0.02
MittSPIN 2|X|IOO......./IOO.TTT.../IJL..TS.../IJL.ZZSS../JJLL.ZZS..|0.02
\u661F\u7A7ATST|X|.........I/SLL....OOI/SSL....OOI/JSL.T..ZZI/JJJTTT..ZZ|0.02
\u7A7A\u4E2DDT|X|......Z.../.....ZZ.../...S.ZT.../.J.SSTTOO./.JJJSLTOO./...LLLIIII|0.02
\u98A8\u90AA\u71B1\u7832|X|I........./IOO......./IOO....T../ISS.ZZTT../SSLJ.ZZT../LLLJJJ....|0.02
\u7D2B\u96FB\u7832|X|.ZZ....SLL/.TZZ...SSL/.TT....JSL/.TIIII.JJJ|0.02
EndQord|X|....TOO..I/...TTOOZJI/..SSTLZZJI/.SSLLLZJJI|0.02
EndQord 2|X|....TJJ..Z/...TTJOOZZ/..SSTJOOZL/.SSIIIILLL|0.02
\u3044\u308D\u306FSP|X|JJ......LL/J...SSZOOL/JT.SSZZOOL/TTT..ZIIII|0.02
\u4E09\u8272\u7A4D\u307F|T|S........L/SS...ZZLLL/JS....ZZOO/JJJ.IIIIOO|0.02
\u4E18TST|X|OO......../OO......Z./I......ZZ./I....JLZT./I..SSJLTT./I.SSJJLLT.|0.02
\u4E18TST\u305A\u3089\u3057|X|.OO......./.OO......Z/.I......ZZ/.I....JLZT/.I..SSJLTT/.I.SSJJLLT|0.02
\u6E96\u30AF\u30C3\u30B7\u30E7\u30F3\u7832|X|....JJJ.../.LL...JSST/OOL...SSTT/OOL..IIIIT|0.02
\u5730\u4E0A\u30C6\u30B9\u30C8|X|......J.../I....SJJJ./I....SSOO./I..TZZSOOL/I.TTTZZLLL|0.02
\u5730\u4E0A\u30C6\u30B9\u30C8 2|X|......T.../I....TTTZ./I....JLZZ./I..SSJLZOO/I.SSJJLLOO|0.02
\u5730\u4E0A\u30C6\u30B9\u30C8 3|X|......Z.../I....ZZOO./I....ZJOO./I..SSTJJJL/I.SSTTTLLL|0.02
4\u30C7\u30A3\u30BA\u30CB\u30FC\u30C1\u30B1\u30C3\u30C8|X|J........./JJJ......./I....S..../I....SSOO./I..TZZSOOL/I.TTTZZLLL|0.02
\u7F6E\u304D\u30DF\u30B9TT|X|I........./IJJ......./IJ......../IJ.....SLL/OO..TZZSSL/OO.TTTZZSL|0.02
\u4E09\u539F\u8272\u7A4D\u307F|X|OO......../OO......../ZZLL.....T/JZZL....TT/JJJL.IIIIT|0.02
\u8239\u65C5TST|X|......T.Z./I....TTZZ./I....JTZL./I..SSJOOL./I.SSJJOOLL|0.02
Deep Tidal Darkness|X|..T......./.TT.....LL/ZZT....OOL/JZZ.SS.OOL/JJJSS.IIII|0.02
Deep Tidal Darkness 2|X|..Z......./.ZZ.....LL/TZJ....OOL/TTJ.SS.OOL/TJJSS.IIII|0.02
Deep Tidal Darkness 3|X|..T......./.TT.....ZJ/OOT....ZZJ/OOL.SS.ZJJ/LLLSS.IIII|0.02
Deep Tidal Darkness 4|X|..Z......./.ZZ.....OO/LZT....JOO/LTT.SS.JJJ/LLTSS.IIII|0.02
Deep Tidal Darkness 5|X|..T......./.TT.....ZI/JJT....ZZI/JOO.SS.ZLI/JOOSS.LLLI|0.02
\u30AF\u30C3\u30B7\u30E7\u30F3SD|T|.J......../LJJJ....S./LZZ.....SS/LLZZ.IIIIS|0.02
2D4T|X|.........Z/........ZZ/........ZI/.........I/..SS..JJJI/.SS.....JI/.T.....LOO/TTT..LLLOO|0.02
\u795E\u5728\u6708\u7A4D\u307F|X|I........./I........./I........./I.TTT...../L..TS....J/L.ZZSSOO.J/LL.ZZSOOJJ|0.02
\u795E\u7121\u6708\u7A4D\u307F|X|..JJJ.OO../L..TJ.OOS./L.TTT.ZZSS/LL.IIIIZZS|0.02
\u9EC4\u660F\u6708\u7A4D\u307F|X|S........./SS......../IS.ZZ...../IL..ZZ...J/IL.OOTTT.J/ILLOO.T.JJ|0.02
Sloth TSS|T|.LLL....../.LZ......I/.ZZ......I/JZ...SSOOI/JJJ.SS.OOI|0.02
\u7AEA\u7A74\u5F0FTD|X|.........I/.........I/..ZS.....I/.ZZSS..T.I/.ZLJS.TTOO/LLLJJJ.TOO|0.02
Unnamed bag 1 [b1-3b78460e]|X|I........./I.ZS....../IZZSS..T../IZLJS.TTOO/LLLJJJ.TOO|0.02
\u973D\u6708\u7A4D\u307F|X|I..TTTJ.../IL..TSJJJ./IL.ZZSSOO./ILL.ZZSOO.|0.02
\u62BC\u3057\u3064\u3076\u3059\u3053\u3068\u3082\u51FA\u6765\u308B\u7A4D\u307F|X|T........./TT.....ZOO/TSS...ZZOO/SSL...ZJJJ/LLL..IIIIJ|0.02
(;\xB4\u0434\uFF40)\u7A4D\u307F|X|.I......OO/.I......OO/.I..T..SLL/JI.TTZZSSL/JJJ.T.ZZSL|0.02
\u30AF\u30ED\u30FC\u30B8\u30E3\u30FC\u7A4D\u307F|X|I......ZL./I.SS..ZZL./ISS...ZJLL/IT.....JOO/TTT...JJOO|0.02
GK\u7832|T|LLL......./LOO......./JOO...ZZ../JJJ....ZZ.|0.02
GK\u7832 2|X|LLL....S.I/LOO.TTTSSI/JOO..TZZSI/JJJ....ZZI|0.02
\u7A7A\u4E2D\u6A4BTD|X|S........./SS......../IS.ZZ...../IL..ZZJJ../IL.TTTJOO./ILL.T.JOO.|0.02
\u7B2C1\u8C61\u9650TT|X|OO......../OO......../IJJ......./IJ......../IJ......../IZ......S./ZZ..LLLTSS/Z...L.TTTS|0.02
\u30E9\u30AF\u30C0TT|X|I........./I.......OO/I......TOO/IZ....TTTJ/ZZ..LLLSSJ/Z...L.SSJJ|0.02
\u30D5\u30EA\u30FC\u30BATD(S\u30DB\u30FC\u30EB\u30C9)|X|JJ......../J........./J........./L....OO.../L.TTTOOZZ./LL.TIIIIZZ|0.02
\u306D\u3063\u3053\u7832|X|.........I/.........I/ZZ....OOJI/TZZ...OOJI/TTSS...JJL/TSS....LLL|0.02
\u306D\u3063\u3053\u7832 2|X|.........I/.........I/ZZ....JJJI/TZZ...LLJI/TTSS...LOO/TSS....LOO|0.02
\u306D\u3063\u3053\u7832 3|X|.........I/.........I/ZZ....OOLI/TZZ...OOLI/TTSS...JLL/TSS....JJJ|0.02
Unnamed bag 1 [b1-a363202e]|X|.........I/.........I/ZZ......LI/TZZ.....LI/TTSS.OOJLL/TSS..OOJJJ|0.02
Unnamed bag 1 [b1-a363202e] 2|X|.........I/.........I/ZZ......JI/TZZ.....JI/TTSS.OOJJL/TSS..OOLLL|0.02
Unnamed bag 1 [b1-a363202e] 3|X|.........J/.........J/ZZ......JJ/TZZ.....OO/TTSS.LLLOO/TSS..LIIII|0.02
\u8DB3\u6E6F\u7832|X|T........./TT.......I/TSS......I/SS....L..I/OOJ...LZZI/OOJJJ.LLZZ|0.02
\u3051\u3093\u3048\u3044\u3068\u7832|T|.J....LL../.J.....L../JJ..SZZL../OO..SSZZ../OO...SIIII|0.02
\u65E5\u30FB\u9670|T|OO......LL/OO.......L/I........L/I.......ZJ/I.SS...ZZJ/ISS....ZJJ|0.02
\u5E78\u6751\u7A4D\u307F|T|I........./I........./I........./I.JJZ...SS/OOJZZ..SSL/OOJZ...LLL|0.02
TOP\u7A4D\u307F|X|........SS/LJJJ...SST/LZZJ....TT/LLZZ.IIIIT|0.02
\u8349\u5206\u3051\u7A4D\u307F|X|...L...S.I/...L..ZSSI/OOJLLZZTSI/OOJJJZTTTI|0.02
\u3093\u7832|X|JJ......../JI......../JI.....T../LI....TT../LI.SSZZTOO/LLSS..ZZOO|0.02
\u30DE\u30A4\u30C8\u30CD\u30EA\u30A6\u30E0\u7A4D\u307F|T|......I.../....LLIZZ./.SSOOLIJZZ/SS.OOLIJJJ|0.02
\u3059\u306E\u3053|X|.........I/STTTLLJJJI/SSTOOLZZJI/.S.OOL.ZZI|0.02
\u3059\u306E\u3053 2|X|.........I/STTTZJLLLI/SSTZZJLOOI/.S.ZJJ.OOI|0.02
\u3059\u306E\u3053 3|X|.........I/SZZJJJLLLI/SSZZTJLOOI/.S.TTT.OOI|0.02
\u3059\u306E\u3053 4|X|.........Z/SIIIIJOOZZ/SSTTTJOOZL/.S.TJJ.LLL|0.02
\u3059\u306E\u3053 5|X|.........I/.Z.OOJ.SSI/ZZTOOJSSLI/ZTTTJJLLLI|0.02
\u3059\u306E\u3053 6|X|.........I/.Z.SLL.OOI/ZZTSSLJOOI/ZTTTSLJJJI|0.02
\u3059\u306E\u3053 7|X|.........J/.Z.LLL.SSJ/ZZTLOOSSJJ/ZTTTOOIIII|0.02
\u3059\u306E\u3053 8|X|.........I/.Z.JJJ.LLI/ZZSSTJOOLI/ZSSTTTOOLI|0.02
\u3059\u306E\u3053 9|X|.........I/.Z.TTT.OOI/ZZSSTLJOOI/ZSSLLLJJJI|0.02
\u6708\u30FB\u9670|X|.SS......./SS.......I/JJ.......I/J.......LI/JTZZ..OOLI/TTTZZ.OOLL|0.02
\u706B\u30FB\u9670|X|.SS......./SS.......T/JJLL....TT/JOOL...ZZT/JOOLIIIIZZ|0.02
\u706B\u30FB\u9670 2|X|.SS......./SS.......T/LOOJ....TT/LOOJ...ZZT/LLJJIIIIZZ|0.02
\u30A2\u30A4\u30B9\u30E2\u30CA\u30AB\u7A4D\u307F2\u53F7|T|.Z......../ZZ......../Z........I/L...S....I/L.OOSSJJJI/LLOO.S..JI|0.02
I\u30DF\u30CE\u30A9\uFF01J\u30DF\u30CE\u30A9!!|X|.........Z/.SS.....ZZ/SSL.JJJ.ZT/OOL...J.TT/OOLL.IIIIT|0.02
\u30C7\u30B8\u30E3\u30F4\u2606\u30B9\u30BF\u30C3\u30AD\u30F3\u30B0|T|L........./L........./LL......../OO......S./OO.JJJZZSS/IIII.J.ZZS|0.02
\u3055\u3064\u307E\u3044\u3082|X|S........./SS.TZZLL../JSTTTZZLOO/JJJIIIILOO|0.02
\u307F\u305F\u3089\u3057\u7832|X|.........I/.........I/.......Z.I/JJLL..ZZSI/JOOL..ZTSS/JOOL..TTTS|0.02
\u30EA\u30D9DT|T|......I.../S...LLI.../SS.OOLI.../.S.OOLI...|0.02
\u30EA\u30D9DT 2|X|....T...../...TTTI.../S...ZJILOO/SS.ZZJILOO/.S.ZJJILL.|0.02
\u30EA\u30D9DT 3|X|....T...../...TTTJ.../S...ZZJJJL/SS.OOZZLLL/.S.OOIIII.|0.02
\u4E07\u3005\u6B73|X|J........./JJJ......./I........./I........./I.......L./I.....LLL./OO..SSTZZ./OO.SSTTTZZ|0.02
\u5927\u559D\u91C7|X|..L......./LLL......./I........./I........./I........./I....S.ZZ./OO..TSSJZZ/OO.TTTSJJJ|0.02
\u7121\u6557\u7832|X|.......JJJ/LS..ZZTTTJ/LSS..ZZTOO/LLS.IIIIOO|0.02
\u7121\u6557\u7832 2|X|.......JJJ/OO..IIIISJ/OOL..TZZSS/LLL.TTTZZS|0.02
\u7206\u7761\u7832|X|S........./SS......Z./JS...TLZZ./JJJ.TTLZOO/IIII.TLLOO|0.02
\u5730\u5747\u3057Z-Spin|X|.......SSI/..L...SSJI/OOLZZTTTJI/OOLLZZTJJI|0.02
\u305F\u3044\u305F\u3044\u5F0F\u78BA\u5B9ADTD|X|T.......OO/TT......OO/T........I/ZZ.......I/JZZ.SS..LI/JJJSS.LLLI|0.02
\u8F2A\u5EFB\u8EE2\u751F\u7832|X|JJ......../J........./JZ......SS/ZZ.....SSI/Z.....TTTI/OO.....TLI/OO....LLLI|0.02
\u6D6E\u5CF6\u7A4D\u307F|T|JJ......../J........./J........./I........./I.Z..S..LL/IZZ..SSOOL/IZ....SOOL|0.02
\u30B3\u30F3\u30BB\u30F3\u30C8\u7A4D\u307F|X|.....T..../I....TT.../IS..ZTJJJ./ISSZZOO.JL/I.SZ.OOLLL|0.02
Zero gravity|X|OO......../OO.ZZ...S./JJ..ZZ..SS/JLLLIIIITS/JL.....TTT|0.02
\u7518\u98DFTSQ|X|.....LLOO./TZZ...LOOJ/TTZZ..LSSJ/TIIII.SSJJ|0.02
\u305F\u3044\u305F\u3044\u5F0F\u78BA\u5B9ADDDD|X|........SS/..Z....SSI/.ZZ......I/LZT......I/LTT.OO.J.I/LLT.OO.JJJ|0.02
Unnamed bag 1 [sasasa123-1868]|X|S........./SS......../IS.....ZZ./I....TTTZZ/IJ....TLOO/IJJJ.LLLOO|0.02
Rufin dolphin|X|.......JJZ/.......JZZ/.S.....JZT/ISS.....TT/ILS......T/IL......OO/ILL.....OO|0.02
T2D|X|OO......../OO.......I/JJJ......I/LSJ......I/LSS...TZZI/LLS..TTTZZ|0.02
\u958B\u5E55\u30A4\u30AF\u30EA\u30D7\u30B9|X|.........I/.........I/.........I/.Z.......I/ZZ.......J/ZOO......J/TOO.....JJ/TTSS.....L/TSS....LLL|0.02
\u958B\u5E55\u524A\u308ASTSD|X|I........./IOO......./IOO..Z..../ISS.ZZT.../SSLJZTT.../LLLJJJT...|0.02
\u958B\u5E55\u524A\u308ASTSD 2|X|S........./SSJ......./ISJ..T..../IJJ.ZTT.../IOOZZTL.../IOOZLLL...|0.02
\u914D\u7BA1\u5DE5DDD|X|.........T/........TT/.........T/......SS.I/JJLL.SS..I/JOOLZZ...I/JOOL.ZZ..I|0.02
\u30D0\u30EB\u30B3\u30CB\u30FC\u7A4D\u307F|T|...ZZ...../....ZZLLLJ/....OOLSSJ/....OOSSJJ|0.02
\u30D0\u30EB\u30B3\u30CB\u30FC\u7A4D\u307F 2|X|IIII....../...ZZ...../....ZZSSLL/..T.JSSOOL/.TTTJJJOOL|0.02
\u30D0\u30EB\u30B3\u30CB\u30FC\u7A4D\u307F 3|X|IIII....../...ZZ...../....ZZJJSS/..T.OOJSSL/.TTTOOJLLL|0.02
\u30B3\u30ED\u30CD2L|X|.........I/OOJJJZZLLI/OOSSJTZZLI/.SS.TTT.LI|0.02
\u30B3\u30ED\u30CD2L 2|X|.........I/.ZZ.TTT.JI/OOZZLTSSJI/OOLLLSSJJI|0.02
\u5929\u6A4B\u7ACB|T|...OO...../...OO....I/LSZZ.....I/LSSZZ.JJJI/LLS.....JI|0.02
\u308A\u3093\u3054\u7A4D\u307F|X|S..Z....../SSZZ.T...L/JSZOOTTLLL/JJJOOTIIII|0.02
\u308A\u3093\u3054\u7A4D\u307F 2|X|I..Z....../ILZZ.T...J/ILZOOTTSSJ/ILLOOTSSJJ|0.02
\u308A\u3093\u3054\u7A4D\u307F 3|X|I..S....../IJJSSTZZLL/IJOOSTTZZL/IJOO.T...L|0.02
\u308A\u3093\u3054\u7A4D\u307F 4|X|I..L....../ILLLZJJSST/IOOZZJSSTT/IOOZ.J...T|0.02
\u306F\u3084\u3076\u3055\u7832|T|...S....../...SS....I/....S..LLI/ZZ.OOJJJLI/.ZZOO..JLI|0.02
TransFar spin|X|.........I/.........I/.........I/.SS......I/SS......OO/TTT.....OO/LT......ZJ/L......ZZJ/LL.....ZJJ|0.02
\u5929\u5F13\u7A4D\u307F|X|J........./JJJ......./I........Z/I.....OOZZ/I..SSTOOZL/I.SSTTTLLL|0.02
\u5929\u5F13\u7A4D\u307F 2|X|J........./JJJ......./I........L/I.....SLLL/I..TZZSSOO/I.TTTZZSOO|0.02
\u958B\u5E55\u30A4\u30F3\u30DA\u30EA\u4E9C\u7A2E|X|.........J/.........J/IT......JJ/ITT.....LL/ITSS...OOL/ISS....OOL|0.02
\u6469\u5929\u697C|X|S........./SS......../ISZ......./IZZ......./IZ.....T../ILL...TTJ./OOL....TJ./OOL....JJ.|0.02
\u6469\u5929\u697C 2|X|I........./IS......../ISS......./IZS......./ZZ.....T../ZLL...TTJ./OOL....TJ./OOL....JJ.|0.02
pareidolia TST|X|L........./L........./LL.....S.I/T......SSI/TTOOJ.ZZSI/T.OOJJJZZI|0.02
\u30A4\u30F3\u30B9\u30BF\u30F3\u30C8\u30E9\u30D6|X|........S./........SS/.......LLS/.T......LI/TT......LI/JT..ZZ.OOI/JJJ..ZZOOI|0.02
Render TSD|X|.......TTT/.Z......TI/ZZ.J...LLI/ZSSJ..OOLI/SSJJ..OOLI|0.02
\u540D\u7121\u3057(JO\u571F\u53F0\u306ETSS\u2192TST)|T|.Z......../ZZ.......I/Z.......JI/OO.SSLLLJI/OOSS.L.JJI|0.02
\u7A7A\u4E2D\u98DB\u884C|X|.........T/........TT/.........T/L........I/L........I/LL.......I/JJZ...S..I/JZZ...SSOO/JZ.....SOO|0.02
\u6D6E\u5CF6\u7A4D\u307F\u6539|X|...L....../.LLL....../.Z......../ZZ....JJJI/Z......SJI/OO....TSSI/OO...TTTSI|0.02
Unnamed bag 1 [b1-5f534206]|X|JJ......../J...ZSIIII/JT.ZZSSLLL/TTTZ..SL..|0.02
Unnamed bag 1 [b1-de61e727]|X|....SS..../L..SSJJJ../L...TZZJOO/LL.TTTZZOO|0.02
\u6D77\u98DF\u6D1E\u7A4D\u307F|X|.S......../.SS......./.ZS......./ZZ.......I/ZLL...JJJI/OOL....TJI/OOL...TTTI|0.02
\u6D77\u98DF\u6D1E\u7A4D\u307F 2|X|.S......../.SS......./.ZS......./ZZ.......I/ZOO...TTTI/JOO....TLI/JJJ...LLLI|0.02
True Future \u6539|X|.Z.....LLI/ZZ......LI/Z.......LI/JJ......SI/JOO....TSS/JOO...TTTS|0.02
True Future \u6539 2|X|.Z.....JJJ/ZZ......SJ/Z.......SS/OO......TS/OOL....TTT/LLL...IIII|0.02
Rough Studio Stacking|X|.........I/.........I/.........I/........SI/JJ...LLLSS/JOO..LTZZS/JOO..TTTZZ|0.02
Rough Studio Stacking 2|X|.........I/.........I/.........I/........SI/OO...TTTSS/OOL..JTZZS/LLL..JJJZZ|0.02
Rough Studio Stacking 3|X|.........I/.........I/.........I/........TI/ZZ...LSTTT/JZZ..LSSOO/JJJ..LLSOO|0.02
Rough Studio Stacking 4|X|.........I/.........I/.........I/........SI/ZZ...LOOSS/JZZ..LOOTS/JJJ..LLTTT|0.02
Rough Studio Stacking 5|X|.........I/.........I/.........I/........SI/OO...JJZSS/OOL..JZZTS/LLL..JZTTT|0.02
\u304F\u3058\u3089MT\u30D1\u30D5\u30A7|T|........SS/.......SSI/.J....LLLI/.J..ZZLOOI/JJ...ZZOOI|0.02
Spin : I|X|.........Z/I.......ZZ/I...JJ.LZT/I.SSJOOLTT/ISS.JOOLLT|0.02
Spin : I 2|X|.........T/I.......TT/I...ZZ.OOT/I.SSJZZOOL/ISS.JJJLLL|0.02
Spin : I 3|X|.........Z/I.......ZZ/I...OO.TZJ/I.SSOOLTTJ/ISS.LLLTJJ|0.02
Spin : I 4|X|.........T/I.......TT/I...OO.ZZT/I.SSOOLJZZ/ISS.LLLJJJ|0.02
\u6C34\u30FB\u9670|X|S........./SS.....TTT/IS......T./I.....LJJJ/IOO...LZZJ/IOO...LLZZ|0.02
\u6C34\u30FB\u9670 2|X|S........./SS.....TTT/IS......T./I.....ZZLL/IOO...JZZL/IOO...JJJL|0.02
SparkShade|X|..Z......./.ZZ......I/.ZL.....JI/OOLTTTSSJI/OOLLTSSJJI|0.02
\u946DTD|X|I........./I........./I....ZJ.../I.S.ZZJ..T/OOSSZJJLTT/OO.S.LLL.T|0.02
\u30EA\u30FC\u30C0\u30FC\u7A4D\u307F|X|ZZ......../IZZ....JJJ/IL...OO.SJ/IL...OOTSS/ILL...TTTS|0.02
\u30EA\u30FC\u30C0\u30FC\u7A4D\u307F 2|X|ZZ......../IZZ....TTT/IL...OO.TJ/IL...OOSSJ/ILL...SSJJ|0.02
\u30EA\u30FC\u30C0\u30FC\u7A4D\u307F 3|X|ZZ......../SZZ....LLI/SS...OO.LI/JS...OOTLI/JJJ...TTTI|0.02
\u6771\u96F2\u7A4D\u307F|X|S........./SS......../IS......../IL..T...ZJ/IL.TTOOZZJ/ILL.TOOZJJ|0.02
\u30B3\u30F3\u30D5\u30E5\u30FC\u30B8\u30E7\u30F3|X|LLL......./L........I/JJ.......I/J.....T..I/JSSOOTTZZI/SS.OO.T.ZZ|0.02
\u30E6\u30CB\u304F\u308D|X|.Z....J.../ZZ..SSJLLL/ZT.SSJJLOO/TTT.IIIIOO|0.02
T\u6B8B\u3057\u7A4D\u307F|X|.....I...L/JJSSZITLLL/JSSZZITTOO/J..Z.IT.OO|0.02
Unnamed bag 1 [ginzan3da-19]|T|....OO..../...SOOZ.../L..SSZZ..J/L...SZ...J/LL.IIII.JJ|0.02
Unnamed bag 1 [ginzan3da-19] 2|T|....SS..../...SSOO.../L..ZZOO..J/L...ZZ...J/LL.IIII.JJ|0.02
Unnamed bag 1 [ginzan3da-19] 3|T|....ZS..../...ZZSS.../L..ZOOS..J/L...OO...J/LL.IIII.JJ|0.02
Unnamed bag 1 [ginzan3da-30]|X|.ZS...J..I/ZZSS.TJJJI/ZOOSTTLLLI/.OO..TL..I|0.02
Unnamed bag 1 [ginzan3da-32]|X|.......J../.Z.....JJJ/ZZ...T.LLL/ZSS.TTTLOO/SS..IIIIOO|0.02
\u5927\u898F\u6A21\u96C6\u7A4D\u56DE\u8DEFSTT|X|.T......../TT......../LT..ZJJJOO/L..ZZSSJOO/LL.ZSSIIII|0.02
\u306D\u3053\u3060\u307E\u3057 [b1-cdc074ea]|T|JJ......../J........./JZ......../ZZ......../Z...S....L/OO..SS.LLL/OO...SIIII|0.02
\u3068\u3093bSP|X|IIII....../...T....../L.TTT.Z..J/L..OOZZSSJ/LL.OOZSSJJ|0.02
Partial bag 1 [b1-588c893f]|X|......IJJJ/.....TIOOJ/..ZZTTIOOL/...ZZTILLL|0.02
Unnamed bag 1 [b1-18843ae0]|T|......I.../....ZJILS./OO.ZZJILSS/OO.ZJJILLS|0.02
24(42)REN|X|JJ......../JI.......T/JI....ZZTT/LI....SZZT/LI....SSOO/LL.....SOO|0.02
\u958B\u5E55\u30E8\u30B0\u30BD\u30C8\u30FC\u30B9|X|.OO......./IOO......Z/IJJSS...ZZ/IJSSL..TZ./IJLLL.TTT.|0.02
ISod spin|X|.T......../TTT......./I.....S..Z/I.....SSZZ/IJ...OOSZL/IJJJ.OOLLL|0.02
\u8D85\u87BA\u65CB\u96F6\u53F7|X|LL......J./IL......J./IL...SSJJT/IOO.SSZZTT/IOO....ZZT|0.02
\u30B3\u30FC\u30E9\u30EB\u7A4D\u307F|T|.........I/.........I/.Z......LI/ZZ......LI/ZSS..OOJLL/SS...OOJJJ|0.02
\u30EC\u30C3\u30AF\u30A6\u30B6\u7A4D\u307F|T|...JJ...../...J...ZZ./.SSJ....ZZ/SSIIII.LOO/.....LLLOO|0.02
\u8D85\u8D85\u672A\u6765|T|.JJ..Z..../.J..ZZ..../.J..Z...../IIIISS.LOO/...SSLLLOO|0.02
\u30C0\u30EB\u30B9\u30D5\u30EC\u30A4\u30E0\u30D1\u30D5\u30A7|X|........T./.......TT./........T./........SS/JJ.....SSZ/JOO.....ZZ/JOO.....ZL/IIII...LLL|0.02
\u8D85\u8D85\u87BA\u65CB|X|...OO.JJJ./...OO...J./.Z.SIIIILL/ZZTSS....L/ZTTTS....L|0.02
Harddrop\u306B\u3042\u308A\u305D\u3046STD|T|.........I/...LL....I/....LS...I/OO.JLSSZZI/OO.JJJS.ZZ|0.02
1\u5DE1\u76EE\u4E16\u754C\u6700\u901F|X|....OO..../....OO..../...ZZ...../...JZZ..../...JJJ..../....SS..../...SSL..../...LLL..../....T...../...TTT..../...IIII...|0.02
Unnamed bag 1 [aotaku1039tetris-44]|X|I........./IJJ.L...../IJOOLZZTTT/IJOOLLZZT.|0.02
Unnamed bag 1 [aotaku1039tetris-44] 2|X|I........./IJJ.L...../IJOOLTTTSS/IJOOLLTSS.|0.02
Partial bag 1 [aotaku1039tetris-157]|T|JJJ......./OOJT.....L/OOTTT..LLL|0.02
Partial bag 1 [aotaku1039tetris-196]|X|I........./ILOO.....T/ILOO..ZZTT/ILL....ZZT|0.02
Partial bag 1 [aotaku1039tetris-229]|X|SZZ....TTT/SSZZLOOJT./.SLLLOOJJJ|0.02
Partial bag 1 [b1-3e6ecc54]|X|SZZ....JJJ/SSZZLOO.TJ/.SLLLOOTTT|0.02
Partial bag 1 [b1-4cf11f8c]|X|OO....ZTTT/OO...ZZ.T./LL..SZ..JJ/.L..SS..J./.L...S..J.|0.02
Partial bag 1 [b1-4cf11f8c] 2|X|LLS....JJJ/.LSS.....J/.L.SZ....T/OO.ZZ...TT/OO.Z.....T|0.02
Unnamed bag 1 [b1-ffa353a3]|X|JJ......../J........./JSS......./SSL....T../LLL.ZZTTOO/IIII.ZZTOO|0.02
Unnamed bag 1 [aotaku1039tetris-246]|X|.JJ......./LJ......../LJ.....SSI/LL....SSTI/OO...ZZTTI/OO....ZZTI|0.02
Partial bag 1 [tetrismaps-20]|T|JJ..ZS..../J..ZZSSOO./J..Z..SOO.|0.02
JD\u7832|X|...L....../.LLL.....I/JJZ....S.I/JZZT.OOSSI/JZTTTOO.SI|0.02
JD\u7832 2|X|L........./L........./LL.......I/JJZ....S.I/JZZT.OOSSI/JZTTTOO.SI|0.02
GBDFC|X|.....T..../I....TT.../I..SSTZZLL/I.SSOOJZZL/I...OOJJJL|0.02
Partial bag 1 [tetrismaps-29]|T|...JJZ..../..LJZZSS../LLLJZSS...|0.02
Partial bag 1 [tetrismaps-31]|T|ZZ......../LZZ......J/L...OO...J/LL..OO..JJ|0.02
Partial bag 1 [b1-3d249827]|T|LLL......I/LZ.......I/ZZSS.....I/ZSS......I|0.02
Partial bag 1 [b1-b647dcb5]|T|LLL......./LZZ......./OOZZ....../OOIIII....|0.02
Partial bag 1 [b1-62eb28d0]|T|IS......../ISS......./IJS.....OO/IJJJ....OO|0.02
Partial bag 1 [b1-62eb28d0] 2|T|ZZ......../JZZ......./JJJ.....OO/IIII....OO|0.02
Partial bag 1 [b1-62eb28d0] 3|T|........ZJ/.......ZZJ/OO.....ZJJ/OO....IIII|0.02
Partial bag 1 [b1-1dd1309c]|T|S........I/SS.......I/JS.....OOI/JJJ....OOI|0.02
Partial bag 1 [b1-a5982aeb]|T|OOS......./OOSS....../LLLS....../LIIII.....|0.02
Partial bag 1 [b1-a5982aeb] 2|T|LLL......./LZOO....../ZZOO....../ZIIII.....|0.02
Partial bag 1 [b1-f184b3b0]|T|IIII....../JJZZ....../JOOZZ...../JOO.......|0.02
Partial bag 1 [b1-f184b3b0] 2|T|IIII....../LSZZ....../LSSZZ...../LLS.......|0.02
Partial bag 1 [b1-f184b3b0] 3|T|......JJJI/......SSJI/.....SSOOI/.......OOI|0.02
Partial bag 1 [b1-f184b3b0] 4|T|......IIII/......SSOO/.....SSJOO/.......JJJ|0.02
Partial bag 1 [b1-feb09adf]|T|SZZ......./SSZZ....../JS......OO/JJJ.....OO|0.02
Partial bag 1 [b1-c0a71b5d]|T|IIII....../JJZ......./JZZ.....OO/JZ......OO|0.02
Partial bag 1 [b1-c0a71b5d] 2|T|ILLL....../ILZ......./IZZ.....OO/IZ......OO|0.02
Partial bag 1 [b1-18af69db]|T|J........./JJJZ....../OOZZSS..../OOZSS.....|0.02
Partial bag 1 [b1-99f1f88f]|T|SZZ......./SSZZ....../JSIIII..../JJJ.......|0.02
Partial bag 1 [b1-9095f005]|T|LLL......I/LZ.......I/ZZ.....OOI/Z......OOI|0.02
Partial bag 1 [b1-1ae2bd46]|X|ZZ......../TZZ......./TTSS...OO./TSS....OO.|0.02
Partial bag 1 [b1-71b572c8]|T|SZZ......./SSZZ....../JS.....OO./JJJ....OO.|0.02
Partial bag 1 [b1-8be3d399]|X|IZZ......./ITZZ....../ITTSS...../ITSS......|0.02
Partial bag 1 [b1-1f030728]|X|ZZ.......I/TZZ......I/TTSS.....I/TSS......I|0.02
Partial bag 1 [b1-03b0d58e]|T|OO......../OOSSZ...../JSSZZ...../JJJZ......|0.02
Partial bag 1 [b1-376764df]|T|ISZZ....../ISSZZ...../IJS......./IJJJ......|0.02
Partial bag 1 [b1-27bb1f8c]|T|SZZ......I/SSZZ.....I/JS.......I/JJJ......I|0.02
Partial bag 1 [b1-8aae875e]|T|LLLS....../LZZSS...../OOZZS...../OO........|0.02
Partial bag 1 [b1-7f991de2]|X|I........./IT......../ITTSS...OO/ITSS....OO|0.02
Partial bag 1 [b1-2d8a8c4f]|X|.........I/T........I/TTSS...OOI/TSS....OOI|0.02
Partial bag 1 [b1-909da29b]|X|ZZ......../TZZ......./TTSS....OO/TSS.....OO|0.02
Partial bag 1 [b1-fc23336f]|T|OO......../OO......../JIIII...SS/JJJ....SS.|0.02
Partial bag 1 [b1-8e6cd2a1]|T|JJZ......./JZZSS...OO/JZSS....OO|0.02
Partial bag 1 [b1-8d6abe86]|T|LOO......./LOOSS...../LLSS....../IIII......|0.02
Partial bag 1 [b1-7f74de5e]|T|OO......../OO......../JIIIIZZ.../JJJ...ZZ..|0.02
Partial bag 1 [b1-019f8d4f]|T|LLL......I/LZZ......I/OOZZ.....I/OO.......I|0.02
Partial bag 1 [b1-666dbb37]|T|JIIII...../JJJZ....../OOZZ....../OOZ.......|0.02
Partial bag 1 [tetrismaps-42]|T|.IIII...../...Z....../OOZZSS..../OOZSS.....|0.02
\u3064\u7832|T|....I...../....I...SS/J...I..SSL/JJJ.I..LLL|0.02
\u3064\u304F\u306D\u7832|T|.....OO.../....IOO.../....IL...J/....IL...J/....ILL.JJ|0.02
\u30C0\u30EB\u30ED\u30FC\u30B9|X|......IIII/.....Z..SS/L...ZZ.SSJ/L..TZOO..J/LLTTTOO.JJ|0.02
\u3078\u307C\u30DE\u30A4\u30B9\u30D4\u30F3|T|......L..J/......L..J/....OOLLJJ/....OOIIII|0.02
Unnamed bag 1 [b1-ce67ba0f]|T|I........./I...S...../I...SS..../IZ...SL..J/ZZ..OOL..J/Z...OOLLJJ|0.02
\u307BwyISO\u30B9\u30DA\u30B7\u30E3\u30EB|T|.JJJ....../...J....S./...L....SS/.LLL.IIIIS|0.02
\u30A2\u30B8\u30E3\u30F3\u30D0\u7832|X|........I./.....ZZ.I./LLL...ZZIJ/LSST..OOIJ/SSTTT.OOJJ|0.02
Partial bag 1 [b1-58d966b2]|T|.....L..../OOJLLL..../OOJJJIIII.|0.02
Partial bag 1 [b1-2a1968e9]|T|...Z....../OOZZSS..../OOZSSIIII.|0.02
Partial bag 1 [b1-04c59638]|X|.Z......../ZZ..OO..../ZSSTOO..../SSTTTIIII.|0.02
Partial bag 1 [tetrismaps-108]|T|JJLL.Z..../JOOLZZ..../JOOLZIIII.|0.02
\u958B\u5E55MK\u03B1|X|....Z...../...ZZ..S.I/L..ZOO.SSI/L..JOO.TSI/LL.JJJTTTI|0.02
\u3082\u3063\u3061\u7832|X|...S....J./...SS...J./T...SOOJJL/TT.ZZOOLLL/T...ZZIIII|0.02
\u30B9\u30C6\u30FC\u30D6\u30EBSDS|T|....JJ...I/S..ZJ....I/SSZZJL.OOI/.SZLLL.OOI|0.02
Partial bag 1 [tetrismaps-135]|T|J........./JJJ.OO.SS./IIIIOOSS..|0.02
\u30DD\u30EA\u30B4\u30F3\u78322|T|.Z......../ZZ......../Z........./JJ......../J........L/J..IIIILLL|0.02
\u30B9\u30A4\u30AB\u30D0\u30FC\u7832|T|L........./L...SS.JJJ/LL.SSIIIIJ|0.02
\u6A4B\u4E95\u7832|T|.Z...I..../ZZ...IJJLL/ZSS..IJOOL/SS...IJOOL|0.02
Partial bag 1 [tetrismaps-200]|T|L..ZZ.S.../L...ZZSS../LL.IIIIS..|0.02
Partial bag 1 [b1-e966b3a9]|T|I........./I........./IOOJ.....L/IOOJJJ.LLL|0.02
Partial bag 1 [tetrismaps-257]|T|........J./OO..L.SSJ./OOLLLSSJJ.|0.02
Partial bag 1 [tetrismaps-257] 4|X|S.....OOI./SS...TOOI./JSZZTTTLI./JJJZZLLLI.|0.02
Partial bag 1 [tetrismaps-257] 5|X|S.....LLL./SS...TLOO./JSZZTTTOO./JJJZZIIII.|0.02
Partial bag 1 [tetrismaps-257] 6|X|IS.....OO./ISS...TOO./IJSZZTTTL./IJJJZZLLL.|0.02
Partial bag 1 [tetrismaps-257] 7|X|OO.....SS./OOL...SSJ./LLLZZTTTJ./IIIIZZTJJ.|0.02
Partial bag 1 [tetrismaps-257] 8|X|JJ.....LL./JOO...SSL./JOOZZSSTL./IIIIZZTTT.|0.02
\u968E\u6BB5\u7832|X|...SS...../..SS....../JJLL.IIIIT/JOOL..ZZTT/JOOL...ZZT|0.02
\u958B\u5E55\u8D85\u672A\u6765|X|.........T/LLL.....TT/LZ..J.OOST/ZZ..J.OOSS/Z..JJIIIIS|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v2|X|JJZ......./JZZ......I/JZ...SSLLI/TTT.SSOOLI/.T....OOLI|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBTSD v2 2|X|.......OOJ/I......OOJ/ILSZZ...JJ/ILSSZZ.TTT/ILLS....T.|0.02
\u30A4\u30F3\u30DA\u30EB\u30C0\u30A6\u30F3|X|.........I/.....SS.ZI/..L.SSJZZI/OOL...JZTI/OOLL.JJTTT|0.02
Riif\u7A4D\u307F v5|X|.Z......../ZZ.I....../ZLLIT....J/OOLITTSS.J/OOLITSS.JJ|0.02
\u90AA\u795E\u30D1\u30FC\u30D5\u30A7\u30AF\u30C8|X|ZZ.......I/TZZ.J..LLI/TTSSJ.OOLI/TSSJJ.OOLI|0.02
lim\u2192\u221E\u7832|T|........L./........L./........LL/........OO/.IIII...OO|0.02
\u30D6\u30EB\u30FC\u30B5\u30D5\u30A1\u30A4\u30A2|X|...IIII.../S...JJJOO./SS.TZZJOOL/.STTTZZLLL|0.02
\u30D6\u30EB\u30FC\u30B5\u30D5\u30A1\u30A4\u30A2 2|X|...IIII.../S...LLLZZ./SS.TLOOJZZ/.STTTOOJJJ|0.02
Unnamed bag 1 [b1-baa04bf4]|X|...LL.ZZ../S...LOOZZ./SS.TLOOJJJ/.STTTIIIIJ|0.02
Unnamed bag 1 [b1-dad4718d]|X|...ZZ...OO/S...ZZL.OO/SS.TLLLJJJ/.STTTIIIIJ|0.02
\u30D2\u30E5\u30FC\u30EC\u30C3\u30C8\u30D1\u30C3\u30AB\u30FC\u30C9|X|...OO...../...OO...../...LL....I/S...L...TI/SS.JLZZTTI/.S.JJJZZTI|0.02
Partial bag 1 [b1-6fa5bd0f]|X|.........T/......SSTT/.....SSZZT/....IIIIZZ|0.02
Partial bag 1 [b1-6fa5bd0f] 2|X|.........T/......ZZTT/.....SSZZT/....SSIIII|0.02
Partial bag 1 [b1-4160ded6]|T|......I.../....SSI.../...SSLIJ../...LLLIJJJ|0.02
Partial bag 1 [b1-5357708f]|T|..J.LS..../..J.LSS.OO/.JJ.LLS.OO|0.02
\u5982\u6708\u7A4D\u307F|X|........Z./.......ZZ./.......ZI./..T....JI./OOTTSS.JI./OOTSS.JJI.|0.02
\u30CD\u30AB\u30DE\u7832|X|T..ZZ...../TT..ZZI.../T...SSI.../OO.SSLIJ../OO.LLLIJJJ|0.02
\u6700\u5F37\u7832|X|......SS.I/LLL..SSZJI/LT..OOZZJI/TTT.OOZJJI|0.02
\u6700\u5F37\u7832 2|X|......OO.I/LLL..ZOOJI/LT..ZZSSJI/TTT.ZSSJJI|0.02
\u6700\u5F37\u7832 3|X|......ZZ.I/TTT..SSZZI/JT..SSLOOI/JJJ.LLLOOI|0.02
\u30C4\u30A4\u30F3\u30BF\u30EF\u30FC|X|..S.I...../.ZSSI.JJLL/ZZTSI.JOOL/ZTTTI.JOOL|0.02
Partial bag 1 [tetrismaps-478]|X|.........I/..L..T.ZJI/OOL.TTZZJI/OOLL.TZJJI|0.02
PCC-Spin [tetrismaps-509]|X|....IIII../L....SSOOJ/LZZ.SSTOOJ/LLZZ.TTTJJ|0.02
Carp Stacking|X|......IIII/.T...ZJ.../.TT.ZZJJJ./.TSSZLOO../.SSLLLOO..|0.02
Unnamed bag 1 [b1-8ee930e4]|X|.SS......./SS......../TZZ...JJLL/TTZZ..JOOL/TIIII.JOOL|0.02
Partial bag 1 [b1-8174ce37]|T|.........I/...Z.....I/OOZZSS...I/OOZSS....I|0.02
Partial bag 1 [b1-427d798e]|X|..LOOJ...T/LLLOOJZZTT/IIIIJJ.ZZT|0.02
Lawn Mower|T|I....ZZ.../I.....ZZLL/I.SSJJJOOL/ISS...JOOL|0.02
Dual Table Opener|X|.........I/.........I/.........I/..S.....ZI/OOSS...ZZT/OOLS..JZTT/LLL...JJJT|0.02
Partial bag 1 [reliable-tsd-4]|T|S........./SS...Z..../LS..ZZ..../L...ZJJJ../LL.IIIIJ..|0.02
Partial bag 1 [reliable-tsd-4] 2|T|S........./SS...Z..../LS..ZZ..../L...ZJJJOO/LL.IIIIJOO|0.02
Partial bag 1 [b1-ad76396b]|T|.....Z..../L...ZZ..../L...ZJJJ../LL.IIIIJ..|0.02
Halbird|X|S........./SS.......L/IS.....LLL/IJJ......T/IJOO..ZZTT/IJOO...ZZT|0.02
Unnamed bag 1 [b1-d22c2f75]|X|.T......../TT......../JT.......I/JJJZ...SSI/OOZZ..SSLI/OOZ...LLLI|0.02
Unnamed bag 1 [b1-1ac158ff]|X|........OO/I.....T.OO/ILS...TTZJ/ILSS..TZZJ/ILLS...ZJJ|0.02
Unnamed bag 1 [b1-1ac158ff] 2|X|........OO/I.....J.OO/ILS...JJJT/ILSS..ZZTT/ILLS...ZZT|0.02
Unnamed bag 1 [butterfly]|X|I...Z...../I..ZZ..S../I..ZOO.SS./IT.JOO..SL/TTTJJJ.LLL|0.02
Unnamed bag 1 [cockroach]|X|....I...../LLL.ISZZ../L...ISSZZ./J...ITSOO./JJJ.TTTOO.|0.02
Unnamed bag 1 [cockroach] 2|X|....I...../LLL.IOOS../L...IOOSS./J...ITZZS./JJJ.TTTZZ.|0.02
Unnamed bag 1 [db-cannon]|X|.........I/.........I/...ZT....I/..ZZTT...I/..ZJT...LL/.SSJOO...L/SSJJOO...L|0.02
Unnamed bag 1 [gemini]|X|....I...../.T..I...../.TT.I...S./.T..I...SS/.JJZL....S/.JZZL...OO/.JZ.LL..OO|0.02
Unnamed bag 1 [scorpion]|T|........S./........SS/.........S/....ZZ.LLL/J....ZZLOO/JJJ.IIIIOO|0.02
Unnamed bag 1 [tlt]|X|.........Z/...LLL..ZZ/T..LSS..ZJ/TT.SSOO..J/TIIIIOO.JJ|0.02
Unnamed bag 1 [tl2]|X|....LS...Z/....LSS.ZZ/T...LLS.ZJ/TT...OO..J/TIIIIOO.JJ|0.02
Partial bag 1 [b1-7c0ab912af61620f]|T|I.....LL../ISZZ...LOO/ISSZZ.JLOO/I.S...JJJ.|0.02
Partial bag 1 [b1-d97551fb2b5a869b]|T|......S.../I.....SS../ILLL...SOO/ILJJJ.ZZOO/I...J..ZZ.|0.02
Partial bag 1 [b1-02f7a6f6]|T|..OO....../..OO.....I/SZZ...JJJI/SSZZ.LLLJI/.S...L...I|0.02
Partial bag 1 [b1-642f413e0e513bbf]|T|.....OO.../.....OO..I/SZZ...JJJI/SSZZ.LLLJI/.S...L...I|0.02
Partial bag 1 [b1-7f6974a2]|T|...J....../...JJJ..../S...IIIIOO/SS.LLLZZOO/.S.L...ZZ.|0.02
Partial bag 1 [b1-e93f0cc4]|T|.J......../.JJJ....../SZZ...IIII/SSZZ.OOLLL/.S...OOL..|0.02
Partial bag 1 [b1-1e46a9e6]|T|..L......./..L......./..LL....../SZZ...IIII/SSZZ.OOJJJ/.S...OO..J|0.02
Partial bag 1 [b1-53a8a8aa]|T|.J......../.JJJ....../SZZ...IIII/SSZZ.LLLOO/.S...L..OO|0.02
Partial bag 1 [b1-502b3568]|T|.....J..../.....JJJ../SZZ...IIII/SSZZ.LLLOO/.S...L..OO|0.02
Partial bag 1 [b1-45f3b2f4]|T|......J.../......J.../.....JJ.../SZZ...IIII/SSZZ.LLLOO/.S...L..OO|0.02
Partial bag 1 [b1-df3d0a98]|T|.....L..../...LLL..../S...IIIIOO/SS.JJJZZOO/.S...J.ZZ.|0.02
Partial bag 1 [b1-a7b140fe]|T|...L....../...L....../...LL...../S...IIIIOO/SS.JJJZZOO/.S...J.ZZ.|0.02
Partial bag 1 [b1-828e8af5]|T|..L......./..L......./..LL....../SZZ...IIII/SSZZ.JJJOO/.S.....JOO|0.02
Partial bag 1 [b1-82102b715fd39317]|T|.......L../.....LLL../SZZ...IIII/SSZZ.JJJOO/.S.....JOO|0.02
Partial bag 1 [b1-e0b8e6dc]|T|.....L..../.....L..../.....LL.../SZZ...IIII/SSZZ.JJJOO/.S.....JOO|0.02
Partial bag 1 [b1-a2cb6e81]|T|J...SS..../JJJSS...LL/ZZIIII.OOL/.ZZ....OOL|0.02
Partial bag 1 [b1-428139d1]|T|..L.SS..../LLLSS...OO/ZZIIII.JOO/.ZZ....JJJ|0.02
Partial bag 1 [b1-586852b2]|T|J...SS..OO/JJJSS...OO/ZZIIII.LLL/.ZZ....L..|0.02
Partial bag 1 [b1-110dfd6a]|T|....SS...I/OOJSS...ZI/OOJLLL.ZZI/.JJL...Z.I|0.02
Partial bag 1 [b1-3b6e0017]|T|I....SS.../IOOJSS...Z/IOOJLLL.ZZ/I.JJL...Z.|0.02
Partial bag 1 [b1-ce4800d5f936a867]|T|I....SS.../IJJJSS...Z/IOOJLLL.ZZ/IOO.L...Z.|0.02
Partial bag 1 [b1-c92f9830]|T|...I.SS.../OOJISS...Z/OOJILLL.ZZ/.JJIL...Z.|0.02
Partial bag 1 [b1-e2891630]|T|...I.SS.../JJJISS...Z/OOJILLL.ZZ/OO.IL...Z.|0.02
Partial bag 1 [b1-13761399]|T|....SS...I/LLLSS...ZI/LOOJJJ.ZZI/.OO..J.Z.I|0.02
Partial bag 1 [b1-9ca8fe7d]|T|...I.SS.../LOOISS...Z/LOOIJJJ.ZZ/LL.I..J.Z.|0.02
Partial bag 1 [b1-c7f8d07d]|T|...I.SS.../LLLISS...Z/LOOIJJJ.ZZ/.OOI..J.Z.|0.02
Unnamed bag 1 [b1-0a61f734]|X|........S./I.......SS/IJJ...TTTS/IJ...ZZTOO/IJ....ZZOO|0.02
ASKII Cannon|X|........S./JJ......SS/J........S/J.......TI/L......TTI/L.OO..ZZTI/LLOO...ZZI|0.02
Azure|X|.T......J./.TT.....JI/.T.....JJI/.Z......LI/ZZSS..OOLI/ZSS...OOLL|0.02
Partial bag 1 [bamboo-tsm]|T|........JJ/........JI/.ZZ....SJI/OOZZL..SSI/OOLLL...SI|0.02
Partial bag 1 [bamboo-tsm] 2|T|........JI/........JI/.SS....JJI/SSLOO..ZZI/LLLOO...ZZ|0.02
Partial bag 1 [bamboo-tsm] 3|T|........OO/........OO/.ZJ....SLL/ZZJJJ..SSL/ZIIII...SL|0.02
Partial bag 1 [bamboo-tsm] 4|T|........LL/........ZL/.SS....ZZL/SSJJJ..ZOO/IIIIJ...OO|0.02
Bongcloud|X|JJJ......I/OOJ.Z.S..I/OOLZZTSS.I/LLLZTTTS.I|0.02
Bongcloud 2|X|LLL......I/LOO.Z.S..I/JOOZZTSS.I/JJJZTTTS.I|0.02
Chainsaw|X|........T./.S.....TT./.SS.....T./OOS..LLLZJ/OO...L.ZZJ/IIII...ZJJ|0.02
Unnamed bag 1 [cheese-mouse]|T|.....J..../.....J..../LLL.JJ..../LZ..OO..../ZZ..OOSS../ZIIIISS...|0.02
Unnamed bag 1 [b1-a0e04481]|X|LLL...T.../LZ..STTT.J/ZZ..SSOO.J/ZIIIISOOJJ|0.02
Unnamed bag 1 [b1-5acfa839]|X|LLL.T...../LZ..TT.SS./ZZ..TJSSOO/ZIIIIJJJOO|0.02
Corail|X|ZZ......../IZZ.....LL/IJJ....SSL/IJOO..SSTL/IJOO...TTT|0.02
Corail 2|X|ZZ......../IZZ.....SS/IOO....SSJ/IOOL..TTTJ/ILLL...TJJ|0.02
Unnamed bag 1 [b1-a0457ef3]|X|..S......./ZZSS....../IZZS....LL/IJJ......L/IJOO....TL/IJOO...TTT|0.02
Deagle|X|ZZ.......J/IZZ......J/IT....SSJJ/ITT..SSLOO/IT...LLLOO|0.02
Deagle 2|X|IT.......J/ITT......J/IT....ZZJJ/ISS..OOZZL/SS...OOLLL|0.02
Deagle 3|X|ZZ.......I/TZZ......I/TT....OOLI/TSS..JOOLI/SS...JJJLL|0.02
Denture Stacking|X|.........I/ZZ...S..TI/JZZOOSSTTI/JJJOO.S.TI|0.02
Double Iso Cannon|X|LLL......./L........./JJ......../J........T/J.....ZZTT/OO...SSZZT/OO..SSIIII|0.02
Elephant Stacking|X|........JJ/LLL.....JI/LZ....SSJI/ZZT..SSOOI/ZTTT...OOI|0.02
Elephant Stacking 2|X|........JJ/TTT.....JI/LT....SSJI/LZZ..SSOOI/LLZZ...OOI|0.02
Elephant Stacking 3|X|........OO/LLL.....OO/LT....SSZJ/TTT..SSZZJ/IIII...ZJJ|0.02
Falling Tower|X|.JJJ....../.SSJ.....I/SS....TTTI/OOZZ...TLI/OO.ZZ.LLLI|0.02
Firefighter Stacking|X|........J./........J./ZZ.....JJI/TZZ....LLI/TTSS..OOLI/TSS...OOLI|0.02
Firefighter Stacking 2|X|........L./........L./ZZ.....JLL/TZZ....JOO/TTSS..JJOO/TSS...IIII|0.02
Partial bag 1 [fish-opener]|X|.....SS.../....SSOO.T/..ZZ.JOOTT/...ZZJJJ.T|0.02
Friendship|T|.J......../.J....S..I/JJ....SS.I/OOZZ...SLI/OO.ZZ.LLLI|0.02
Furry Cannon|X|.IIII...SS/LOOJ...SST/LOOJ..ZZTT/LLJJ...ZZT|0.02
Furry Cannon 2|X|.IIII...SS/JJLL...SST/JOOL..ZZTT/JOOL...ZZT|0.02
Furry Cannon 3|X|.LLJJ...SS/OOLJ...SST/OOLJ..ZZTT/IIII...ZZT|0.02
Furry Cannon 4|X|.JJSS...TI/LJSS...TTI/LJOO..ZZTI/LLOO...ZZI|0.02
Furry Cannon 5|X|.SSJJ...TI/SSLJ...TTI/OOLJ..ZZTI/OOLL...ZZI|0.02
Furry Spin|X|.........T/.IIII...TT/JJLL....ST/JOOL..ZZSS/JOOL...ZZS|0.02
Furry Spin 2|X|.........T/.IIII...TT/LOOJ....ST/LOOJ..ZZSS/LLJJ...ZZS|0.02
Furry Spin 3|X|.........T/.LLJJ...TT/OOLJ....ST/OOLJ..ZZSS/IIII...ZZS|0.02
Glass Shard Cannon|X|SZZ......./SSZZ..JJJ./LS.....TJ./L.....TTOO/LL.IIIITOO|0.02
Partial bag 1 [hamburger]|T|...LL...../....LS..../ZZ.JLSS.../.ZZJJJS...|0.02
Partial bag 1 [b1-b227bf3a]|X|...S....../...SS...../....SL...J/ZZ.LLLTTTJ/.ZZIIIITJJ|0.02
Partial bag 1 [b1-846f01bb]|T|...SLL..../...SSL..../....SL..../ZZ.OOJ..../.ZZOOJJJ..|0.02
HNR Cannon|X|........OO/.S......OO/.SS......I/ZZSL....TI/JZZL...TTI/JJJLL...TI|0.02
HNR Cannon 2|X|........OO/.S......OO/.SS......T/JJSL....TT/JLLL...ZZT/JIIII...ZZ|0.02
HNR Cannon 3|X|........OO/.J......OO/.JS......T/JJSS....TT/LLLS...ZZT/LIIII...ZZ|0.02
HNR Cannon 4|X|........OO/.I......OO/.IS......T/LISS....TT/LIJS...ZZT/LLJJJ...ZZ|0.02
HNR Cannon v2|X|S........./SS.......J/IS.....T.J/IL....TTJJ/IL...ZZTOO/ILL...ZZOO|0.02
Horse Opener|X|.....T.LLL/....TTTL../JJJIIIIOO./..JZ..SOO./..ZZ..SS../..Z....S..|0.02
JIT PC|X|.T.......Z/TTT.....ZZ/JJ....SSZL/JOO..SSLLL/JOO...IIII|0.02
Kampo Stacking|X|T........./TT....JJLL/TZ....JOOL/ZZSS..JOOL/ZSS...IIII|0.02
Kemono Cannon|X|........SS/I......SST/IJJLL...TT/IJOOL..ZZT/IJOOL...ZZ|0.02
Kemono Cannon 2|X|........SS/I......SST/ILOOJ...TT/ILOOJ..ZZT/ILLJJ...ZZ|0.02
Kemono Cannon 3|X|........SS/J......SST/JJJOO...TT/LLLOO..ZZT/LIIII...ZZ|0.02
Kemono Cannon 4|X|........TI/S......TTI/SSLLL...TI/JSLOO..ZZI/JJJOO...ZZ|0.02
Kemono Cannon 5|X|........TI/J......TTI/JJJSS...TI/OOSSL..ZZI/OOLLL...ZZ|0.02
Partial bag 1 [levitation]|T|..Z......./.ZZ....OOI/.Z...SSOOI/LLL.SSJJJI/L.......JI|0.02
Partial bag 1 [b1-85ee56a6]|T|......S.../OO....SS.I/OOZZ...S.I/LLLZZ.JJJI/L.......JI|0.02
Partial bag 1 [b1-9481eec8]|X|.......OOI/..TTTSSOOI/LLLTSSJJJI/L.......JI|0.02
Mao-lstrom|X|J........./JJJ......./I......Z../I.....ZZLL/I..SSTZOOL/I.SSTTTOOL|0.02
Unnamed bag 1 [neo-ddt-system]|X|OO......../OO......../S........I/SS....JJJI/LS.....ZJI/L.....ZZTI/LL....ZTTT|0.02
Unnamed bag 1 [b1-76b090c5]|X|OO......../OO......../S......T../SS....TTTI/LS.....ZJI/L.....ZZJI/LL....ZJJI|0.02
Unnamed bag 1 [b1-9f63dbe3]|X|OO......../OO.....JI./S......JI./SS....JJI./LS.....ZI./L.....ZZT./LL....ZTTT|0.02
Unnamed bag 1 [b1-d15809ea]|X|OO......../OO......../S........I/SS....JJZI/LS....JZZI/L.....JZTI/LL.....TTT|0.02
Unnamed bag 1 [b1-223a0e73]|X|OO......../OO......../S......ZI./SS....ZZI./LS....ZTIJ/L.....TTIJ/LL.....TJJ|0.02
Unnamed bag 1 [b1-08638618]|X|OO......../OO......../S......T../SS....TTTI/LS....JJJI/L.....ZZJI/LL.....ZZI|0.02
Unnamed bag 1 [b1-07a166f4]|X|.OO......./.OO......./.S......T./ISS....TTT/ILS....JJJ/IL.....ZZJ/ILL.....ZZ|0.02
Rigel|X|......J.../......JJJ./.T......S./TTTOO...SS/LLLOO..ZZS/LIIII...ZZ|0.02
Unnamed bag 1 [shape-openers]|X|..T......./.TTT....../.OOJ....L./.OOJJJLLL./..ZZIIII../...ZZSS.../....SS....|0.02
Unnamed bag 1 [shape-openers] 2|X|..T......./.TTT....../.OOJ....L./.OOJJJLLL./..IIIISS../...ZZSS.../....ZZ....|0.02
Sirius Spin|X|........JJ/.....TTTJI/OO....TSJI/OOL..ZZSSI/LLL...ZZSI|0.02
Sirius Spin 2|X|........SS/.....ZZSSI/OO....ZZJI/OOL..TTTJI/LLL...TJJI|0.02
Solstice|X|ZZ......OO/IZZ.....OO/ILS......J/ILSS..TTTJ/ILLS...TJJ|0.02
Sus Opener|X|...S....../..ZSS...../.ZZ.S...../.ZTTT....I/..JTL....I/..J.L..OOI/.JJ.LL.OOI|0.02
Suzanne|X|....ZZ..../LLL..ZZ.../LTTT.J..../OOT..J..../OO..JJIIII|0.02
Suzanne 2|X|....ZZ..../TTT..ZZ.../LTSS.JOO../LSS..JOO../LL..JJIIII|0.02
T-Flip Spin|X|.......OO./I......OOT/ILLLJ...TT/ILSSJ..ZZT/ISSJJ...ZZ|0.02
T-Flip Spin 2|X|.......OO./I......OOT/IJJSS...TT/IJSSL..ZZT/IJLLL...ZZ|0.02
Unnamed bag 1 [table-flip]|X|.....S..../.....SS.../......SOOI/TTT..ZZOOI/JT....ZZLI/JJJ...LLLI|0.02
Unnamed bag 1 [b1-e752e43f]|X|.......LLI/JJZZ..SSLI/JOOZZSSTLI/JOO...TTTI|0.02
Unnamed bag 1 [b1-e752e43f] 2|X|.......SSI/OOZZ..SSJI/OOLZZTTTJI/LLL...TJJI|0.02
Unnamed bag 1 [b1-e752e43f] 3|T|.......SLL/JJZZ...SSL/JOOZZ...SL/JOO...IIII|0.02
Unnamed bag 1 [b1-e752e43f] 4|X|.......OOJ/LSTTTZZOOJ/LSST..ZZJJ/LLS...IIII|0.02
Unnamed bag 1 [table-flip-v2]|X|OO......../OO......../TTT..LLLS./JT...LZZSS/JJJIIIIZZS|0.02
Unnamed bag 1 [table-flip-v2] 2|X|OO......../OO......../LLLJJJIIII/LSS..JTZZ./SS...TTTZZ|0.02
Unnamed bag 1 [b1-75bb4174]|X|.........J/......S..J/......SSJJ/LLL..ZZSOO/LT....ZZOO/TTT...IIII|0.02
Unnamed bag 1 [b1-8764f35e]|X|.OO......./.OO....SLL/TTT..ZZSSL/JT....ZZSL/JJJ...IIII|0.02
Talisman|X|........S./.Z..OO..SS/ZZJ.OO...S/ZTJJJIIIIL/TTT....LLL|0.02
\u958B\u5E55RUF|T|...SS...../..SSOO..../....OO..../JJ.LLLIIII/J..L.ZZ.../J.....ZZ..|0.02
\u30C4\u30A4\u30F3\u30E9\u30D6|X|......LL../....IOOLJ./....IOOLJ./....IZZJJ./...SITZZ../...SSTT.../....ST....|0.02
\u6D6E\u5CF6\u7832|X|OOJJJ.IIII/OOZZJ..SST/LLLZZ.SSTT/L........T|0.02
\u30D5\u30A3\u30B9\u30D5\u30A3\u30C7\u30A3\u3061\u3083\u3093|T|LLL......./L........./I......Z../I.....ZZ../I.SSOOZJJJ/ISS.OO...J|0.02
FBDF|X|........OO/........OO/........LL/J.ZZ.....L/JJJZZSS.TL/IIIISS.TTT|0.02
\u958B\u5E55\u5343\u9CE5\u683C\u5B50\u30D1\u30D5\u30A7|T|.......S../JJZOO..SS./JZZOO...SL/JZIIII.LLL|0.02
\u30A4\u30AF\u30EA\u30D7\u30B9\u30BB\u30C3\u30C8|X|I........./I........./I........./I..S....../TZZSSJJ.LL/TTZZSJOO.L/T....JOO.L|0.02
Unnamed bag 1 [b1-5ae1c252]|X|...S....../TZZSSJJ.LL/TTZZSJOO.L/TIIIIJOO.L|0.02
\u30B9\u30FC\u30D1\u30FC\u30D5\u30A1\u30A4\u30F3|X|.......TLL/......TTTL/.......OOL/.......OOZ/........ZZ/........ZJ/..SS.....J/.SSIIII.JJ|0.02
Unnamed bag 1 [maketetris-89]|X|...OO...../...OO.LS../T...ZJLSS./TT.ZZJLLS./T..ZJJIIII|0.02
R&N TST\u30BF\u30EF\u30FC|X|......LL../..T....L../..TTSS.LZJ/OOTSS..ZZJ/OOIIII.ZJJ|0.02
cerulean\u5F0F\u958B\u5E55\u30A4\u30F3\u30DA\u30EB\u30C0\u30A6\u30F3|X|........OO/...L....OO/...LZZ...I/...LLZZ.JI/..SST...JI/.SSTTT.JJI|0.02
cerulean\u5F0F\u958B\u5E55\u30A4\u30F3\u30DA\u30EB\u30C0\u30A6\u30F3 2|X|........OO/...J....OO/...JJJ...Z/...IIII.ZZ/..SST...ZL/.SSTTT.LLL|0.02
NCTI\u7832|X|..IIII..../..T......./LTTT...SS./LZZ..JSSOO/LLZZ.JJJOO|0.02
\u30AD\u30B7\u30EA\u30C8\u30FC\u30EB\u7A4D\u307F|T|.....LL.../.J....L.../.J.SS.L..Z/JJSS..OOZZ/.IIII.OOZ.|0.02
\u6C37\u65A7|X|I.....OOT./IZZ...OOTT/IJZZ..SSTL/IJJJ.SSLLL|0.02
\u30CF\u30A4\u30C9\u5F0F\u6247\u98A8\u6A5F|X|........OO/........OO/S........I/SS...LLL.I/JSZZ.LT..I/JJJZZTTT.I|0.02
\u30DF\u30B5\u30A4\u30EB\u767A\u5C04\uFF01|X|I........./I........./I........./I...OO..../L.TSOOZ..J/LTTSSZZ..J/LLT.SZ..JJ|0.02
\u30E1\u30AB\u30CB\u30AB\u30EBFin|T|I........./I....LL.../I.....L.../I..ZJ.L.../OOZZJ.SS../OOZJJSS...|0.02
\u8D85\u9AD8\u5EA6\u6700\u77ED\u30E1\u30AB\u30CB\u30AB\u30EBTSM|T|.IIIISSLOO/....SS.LOO/.....ZZLL./......ZZ../.......JJJ/.........J|0.02
IN\u30DA\u30EASP|X|.........T/........TT/.L.....SST/.L....SSZJ/.LL..OOZZJ/IIII.OOZJJ|0.02
IN\u30DA\u30EASP 2|X|.........T/........TT/.L.....OOT/.L....ZOOJ/.LL..ZZSSJ/IIII.ZSSJJ|0.02
\u751F\u5B58\u7AF6\u4E89|X|I......JJJ/I.ZOO...SJ/IZZOOL.TSS/IZ.LLLTTTS|0.02
\u751F\u5B58\u7AF6\u4E89 2|X|I......TTT/I.ZOO...TJ/IZZOOL.SSJ/IZ.LLLSSJJ|0.02
\u30D1\u30FC\u30D5\u30A3\u30CB\u30C3\u30C8TSM|T|I.Z......./IZZ...JJLL/IZSS..JOOL/ISS...JOOL|0.02
\u958B\u5E55\u30C8\u30EC\u30CF\u30ED\u30FC\u30B9|X|..L......./LLL......./I........./I........./I.....Z.../I...JZZ.../OO..JZSST./OO.JJSSTTT|0.02
FF\u7832|X|OO......../OO......../I....LL.../I.....LZZ./I..SSTLJZZ/I.SSTTTJJJ|0.02
\u30C6\u30A4\u30C8\u30EC\u30CF\u30ED\u30FC\u30B9|X|I........./I........./I..JJJ..../I....J.SLL/OO..TZZSSL/OO.TTTZZSL|0.02
NTSD\u03B3|X|........SS/.J.....SST/.J....ZZTT/JJLOO..ZZT/LLLOO.IIII|0.02
\u732B\u3057\u307E\u30D0\u30B1\u30FC\u30B7\u30E7\u30F3|X|S........./SS......../IS..J...Z./I...JJJZZ./I...LOOZT./I.LLLOOTTT|0.02
\u30B8\u30AAMC|X|T........./TT......../T........./I.JJJ...../I...JS..LL/I..ZZSSOOL/I...ZZSOOL|0.02
\u30AB\u30EB\u30C1\u30E3\u30FC\u30AD\u30E3\u30CE\u30F3|T|.LLL.ZOOS./JL..ZZOOSS/JJJ.ZIIIIS|0.02
\u6020\u30E1\u30EBTSS|T|..Z....OOI/.ZZ....OOI/JZ...SS.LI/JJJ.SSLLLI|0.02
\u30DA\u30CA\u30EB\u30C6\u30A3\u30AF\u30ED\u30B9|X|.........T/S.....I.TT/SS....IOOT/JSZZ..IOOL/JJJZZ.ILLL|0.02
GG_WELL_Canon|X|........Z./OO....IZZ./OOT...IZSS/JTTT..ISSL/JJJ...ILLL|0.02
\u5C71\u8475\u30EC\u30F3\u30BA|X|T........./TTSS....../TSS.....LL/ZZ...IIIIL/JZZ.OO...L/JJJ.OO....|0.02
\u7C73\u30D1\u30F3\u30D5\u30A9\u30FC\u30AB\u30B9|X|........T./.......TTT/........ZI/...SSOOZZI/J.SS.OOZLI/JJJ...LLLI|0.02
\u30B9\u30DA\u30B7\u30E3\u30EB\u7832|X|.........Z/........ZZ/........ZT/.......JTT/L......JST/L.OO..JJSS/LLOO.IIIIS|0.02
\u3042\u304A\u3044\u308D\u7F70\u91D1\u30A2\u30A4\u3061\u3083\u3093|X|I...SS..../IL.SSZ.OOJ/IL..ZZTOOJ/ILL.ZTTTJJ|0.02
\u30D5\u30ED\u30FC\u30C8\u30D6\u30EA\u30C3\u30B8|T|JJ......../J........L/JZ.IIIILLL/ZZ....OO../Z.....OO..|0.02
\u30D5\u30ED\u30FC\u30C8\u30D6\u30EA\u30C3\u30B8 2|T|JJ......../J........L/JZ.IIIILLL/ZZSS..OO../ZSS...OO..|0.02
\u708A\u304D\u8FBC\u307F\u7832|T|LLL......./L........./I.......S./I...J...SS/I.ZZJJJOOS/I..ZZ..OO.|0.02
Could_WELL_Canon|T|I........./I........./I..S....../IZZSS....L/OOZZSJ.LLL/OO...JJJ..|0.02
SF\u7832|X|....TTT.../.....TOO../L....JOOS./LZZ..JJJSS/LLZZ.IIIIS|0.02
\u7551\u5730\u7832|X|........J./ILLL....J./ILZZ...JJT/IOOZZ.SSTT/IOO..SS..T|0.02
\u30AF\u30DA\u30EB\u30C9DT|T|...I....../...I....../...I....../.Z.I....OO/ZZSS....OO/ZSSJJJ.LLL/.....J.L..|0.02
\u96EA\u6708\u7832|X|........S./........SS/.........S/........OO/........OO/J......TTT/JJJZZ...TL/IIIIZZ.LLL|0.02
\u7A74\u958B\u3051\u7832|T|.Z......../ZZ......../Z........./JJ.IIIISLL/J.OO...SSL/J.OO....SL|0.02
\u98A8\u7A74\u7832|X|...S....ZI/JJJSS..ZZI/OOJTS..ZLI/OOTTT.LLLI|0.02
\u98A8\u7A74\u7832 2|X|...S....LL/JJZSS..OOL/JZZTS..OOL/JZTTT.IIII|0.02
\u98A8\u7A74\u7832 3|X|...S....ZJ/LOOSS..ZZJ/LOOTS..ZJJ/LLTTT.IIII|0.02
\u98A8\u7A74\u7832 4|X|...T....ZJ/LSTTT..ZZJ/LSSOO..ZJJ/LLSOO.IIII|0.02
\u98A8\u7A74\u7832 5|X|...T....SS/ZZTTT..SSL/JZZOO..LLL/JJJOO.IIII|0.02
\u72ED\u9593\u7832|X|.........I/.........I/LLL...JJJI/LZ.....TJI/ZZSS..TTOO/ZSS....TOO|0.02
\u30C4\u30A1\u30A4\u30C8\u30EC\u30A4\u30CF\u30ED\u30FC\u30B9|X|I......LS./IJJ..LLLSS/IJOO..TZZS/IJOO.TTTZZ|0.02
\u30C4\u30A1\u30A4\u30C8\u30EC\u30A4\u30CF\u30ED\u30FC\u30B9 2|X|I......ZZ./ILS..JJJZZ/ILSS..TJOO/ILLS.TTTOO|0.02
\u30EC\u30A4\u30F3\u30DC\u30FC\u30B9\u30D4\u30F3|X|T........./TT......LL/TZJ....OOL/ZZJ..SSOOL/ZJJ.SSIIII|0.02
\u30EC\u30A4\u30F3\u30DC\u30FC\u30B9\u30D4\u30F3 2|X|T........./TT......ZI/TOO....ZZI/JOO..SSZLI/JJJ.SSLLLI|0.02
\u30EC\u30A4\u30F3\u30DC\u30FC\u30B9\u30D4\u30F3 3|X|T........./TT......ZJ/TLL....ZZJ/OOL..SSZJJ/OOL.SSIIII|0.02
\u5BCC\u8CB4\u5728\u5929|X|.T....ZZ../TTT...IZZ./JJ....ILS./JOO...ILSS/JOO...ILLS|0.02`,`Crowbar v2 \xB7 2|T|.........I/........ZI/.OOJJ..ZZI/.OOJL..ZXI/XXXJL...XX/XXXXLL.SSX/XXXXX.SSXX|1|Crowbar v2
Re,MTD 2 \xB7 1|T|.........J/.........J/LL..IIIIJJ/XL....ZOOX/XLSS.ZZOOX/XSS..ZXXXX/XXXX.XXXXX|3|Re,MTD 2
Re,MTD 2 \xB7 3|T|.........I/.........I/S........I/SS...LJJJI/XS...LZZJX/XOO..LLZZX/XOO...XXXX/XXXX.XXXXX|1|Re,MTD 2
Old Freezer \xB7 2|T|........L./IS......L./ISS....JLL/IXS.Z..JJJ/IXXZZ...XX/XXXZOO.XXX/XXXXOO.XXX|2|Old Freezer
Suspension Bridge TSM 2 \xB7 3|T|JJLLZZ..../JOOLXZZ.../JOOLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM 2
Suspension Bridge TSM 2 \xB7 4|T|ZZLL....OO/JZZLX...OO/JJJLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM 2
Suspension Bridge TSM \xB7 1|T|IIII....../JJLLZZ..../JOOLXZZ.../JOOLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM
Suspension Bridge TSM \xB7 2|T|.........I/.........I/JJLLZZ...I/JOOLXZZ..I/JOOLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM
Suspension Bridge TSM 2 \xB7 5|T|.........Z/........ZZ/I.......ZJ/IOO......J/IOOLX...JJ/ILLLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM 2
Suspension Bridge TSM 2 \xB7 6|T|I...JJJ.../IOO.ZZJ.../IOOLXZZ.../ILLLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM 2
Suspension Bridge TSM 2 \xB7 7|T|IJJJ....../IOOJZZ..../IOOLXZZ.../ILLLXS...X/XXXXXSS.XX/XXXXXXS.XX|2|Suspension Bridge TSM 2
Suspension Bridge TSM v2 \xB7 1|T|........X./........X./.....XXXXX/.SSZZXXXXX/SS..ZZXXXX|1|Suspension Bridge TSM v2
Suspension Bridge TSM v3 \xB7 1|T|.......XXX/.....XXXXX/.SSXXXXXXX/SS...XXXXX|1|Suspension Bridge TSM v3
Suspension Bridge TSM v3 2 \xB7 1|T|.......XXX/.....XXXXX/.SSXXXXXXX/SS...XXXXX|1|Suspension Bridge TSM v3 2
You\u2019s Mechanical TSD \xB7 1|T|X........./X....LLXXX/X.XXXXLXXX/XXX.XXL.XX|1|You\u2019s Mechanical TSD
You\u2019s Mechanical TSD 2 \xB7 1|T|XXLLOOIIII/XXXLOOXXXX/XXXLXXXXXX|3|You\u2019s Mechanical TSD 2
You\u2019s Mechanical TSD 2 \xB7 3|T|JJ.......I/JOO...SLLI/JOO...SSLI/XXZZ...SLI/XXXZZ.XXXX/XXX.XXXXXX|2|You\u2019s Mechanical TSD 2
Ichinoseki Variable 2 \xB7 1|X|XLLLSSTXXX/XLXSSTTXXX/XXXXXXTXXX|2|Ichinoseki Variable 2
Ichinoseki Variable 2 \xB7 3|T|I......Z../I.....ZZOO/I.....ZJOO/I......JJJ/XLLLSS.XXX/XLXSS..XXX/XXXXXX.XXX|3|Ichinoseki Variable 2
Ichinoseki Variable 2 \xB7 4|T|.........I/JJ.......I/JOO...ZZ.I/JOO....ZZI/XLLLSS.XXX/XLXSS..XXX/XXXXXX.XXX|3|Ichinoseki Variable 2
Ichinoseki Variable 2 \xB7 5|T|......OO.I/JJ....OO.I/J.....ZZ.I/J......ZZI/XLLLSS.XXX/XLXSS..XXX/XXXXXX.XXX|3|Ichinoseki Variable 2
Ichinoseki Variable 2 \xB7 5 \xB7 1|T|........I./......XXIX/XXLL..XXIX/XOOL..XXIX/XOOL...XXX|1|Ichinoseki Variable 2 \xB7 5
Tendon PC \xB7 1|T|...SS...../JJSS.....Z/JXOO.LLIZZ/JXOO..LIZX/XXXX.XLIXX/XXXXX.XIXX|3|Tendon PC
Tendon PC \xB7 2|T|..J......./I.J.....LL/IJJZ.....L/IXZZ...OOL/IXZ...SOOX/XXXX.XSSXX/XXXXX.XSXX|2|Tendon PC
Tendon PC \xB7 3|T|IOO.....LL/IOOZ....JL/IXZZ....JL/IXZ...SJJX/XXXX.XSSXX/XXXXX.XSXX|2|Tendon PC
MS PC Alpha \xB7 1|T|IIII....../XXX...XX../XXX..XXXOO/XX...XXXOO|1|MS PC Alpha
Sailboat 2 (X+) \xB7 1|T|..I.Z...LL/OOIZZ....L/OOIZ...SSL/JJIXX.SS.X/JXXXXXX..X/JXXXXXXX.X|1|Sailboat 2 (X+)
Sailboat 2 (X+) \xB7 6|T|.L......../.L...Z..S./.LL.ZZ..SS/IOO.ZJ...S/IOOXXJJJ.X/IXXXXXX..X/IXXXXXXX.X|3|Sailboat 2 (X+)
Sailboat 2 (X+) \xB7 7|T|..LL.Z..S./...LZZ..SS/IOOLZJ...S/IOOXXJJJ.X/IXXXXXX..X/IXXXXXXX.X|3|Sailboat 2 (X+)
Sailboat 2 (X+) \xB7 8|T|J...Z...LL/JJJZZ....L/IOOZ...SSL/IOOXX.SS.X/IXXXXXX..X/IXXXXXXX.X|1|Sailboat 2 (X+)
Sailboat 2 (X+) \xB7 9|T|..J......./..J.Z...LL/.JJZZ....L/IOOZ...SSL/IOOXX.SS.X/IXXXXXX..X/IXXXXXXX.X|1|Sailboat 2 (X+)
Sailboat 2 (X+) \xB7 10|T|...LLI..../...ZLIJJ../OOZZLIJ.../OOZXXIJS.X/.XXXXXXSSX/.XXXXXXXSX|2|Sailboat 2 (X+)
Sailboat 2 (X+) \xB7 11|T|.....Z..S./.LOOZZ..SS/ILOOZJ...S/ILLXXJJJ.X/IXXXXXX..X/IXXXXXXX.X|3|Sailboat 2 (X+)
8282 Stacking \xB7 2|T|OOLL.....I/OOXL.....I/XXXL..JJJI/XZZ...SSJI/XXZZ.SSXXX/XXXX..XXXX|2|8282 Stacking
Chair SDT \xB7 1|T|.........I/.....ZZLLI/.....SZZLI/.....SSXLI/OOJ...SXXX/OOJXXXXXXX/XJJX.XXXXX|1|Chair SDT
Chair SDT \xB7 2|T|.....ZZ..J/IL...SZZ.J/IL...SSXJJ/ILL...SXXX/IOOXXXXXXX/XOOX.XXXXX|1|Chair SDT
Chair SDT \xB7 3|T|.........I/.....ZZLLI/.....SZZLI/JJ...SSXLI/J.....SXXX/JOOXXXXXXX/XOOX.XXXXX|1|Chair SDT
Chair SDT \xB7 4|T|........Z./L.....IZZ./L....JIZOO/LL...JIXOO/S...JJIXXX/SS.XXXXXXX/XS.X.XXXXX|2|Chair SDT
Chair SDT \xB7 5|T|.......OO./S.....IOO./SS...JIZZ./LS...JIXZZ/L...JJIXXX/LL.XXXXXXX/X..X.XXXXX|2|Chair SDT
Chair SDT \xB7 6|T|.......OO./L.....IOO./L....JIZZ./LL...JIXZZ/S...JJIXXX/SS.XXXXXXX/XS.X.XXXXX|2|Chair SDT
Chair SDT \xB7 7|T|........Z./S.....IZZ./SS...JIZOO/LS...JIXOO/L...JJIXXX/LL.XXXXXXX/X..X.XXXXX|2|Chair SDT
Chin Anago Stacking \xB7 1|T|....SS..../...SS...../IJJXX....L/IJXXZ..LLL/IJXZZ..OOX/IXXZ...OOX/XXXXX.XXXX|2|Chin Anago Stacking
Chin Anago Stacking \xB7 2|T|...L....../...L....../...LL...S./IJJXX...SS/IJXXZ....S/IJXZZ..OOX/IXXZ...OOX/XXXXX.XXXX|2|Chin Anago Stacking
Chin Anago Stacking \xB7 3|T|........S./........SS/.........S/IJJXX....L/IJXXZ..LLL/IJXZZ..OOX/IXXZ...OOX/XXXXX.XXXX|2|Chin Anago Stacking
Chin Anago Stacking \xB7 4|T|.......SLL/IJJXX..SSL/IJXXZ...SL/IJXZZ..OOX/IXXZ...OOX/XXXXX.XXXX|1|Chin Anago Stacking
\u30C7\u30FC\u30E2\u30F3SP \xB7 1|T|LLL......./LZJ......./ZZJJJ...../ZXOO.....X/XXOO.IIIIX/XXXX..SSXX/XXXX.SSXXX|3|\u30C7\u30FC\u30E2\u30F3SP
\u30C7\u30FC\u30E2\u30F3SP \xB7 2|T|IL......../IL......../ILLZ....JJ/IXZZ..S.JX/XXZ...SSJX/XXXX.OOSXX/XXXX.OOXXX|2|\u30C7\u30FC\u30E2\u30F3SP
\u30C7\u30FC\u30E2\u30F3SP \xB7 3|T|..JJJ...../..ZZJ...../LLLZZ...../LXOO.....X/XXOO.IIIIX/XXXX..SSXX/XXXX.SSXXX|3|\u30C7\u30FC\u30E2\u30F3SP
Dolphin 2 \xB7 2|T|L.....OO.I/L.....OO.I/LLZZ...XXI/XJJZZ.XXXI/XJ....XXXX/XJ.X.XXXXX|2|Dolphin 2
Dolphin 2 \xB7 3|T|.......SS./OO....SSLL/OOZZ...XXL/XJJZZ.XXXL/XJ....XXXX/XJ.X.XXXXX|2|Dolphin 2
Dolphin 2 \xB7 4|T|........LI/S.....LLLI/SSZZ...XXI/XSJZZ.XXXI/X.J...XXXX/XJJX.XXXXX|2|Dolphin 2
Dolphin 2 \xB7 5|T|....JJ..../....JOO.LL/....JOOXXL/XS...ZXXXL/XSS.ZZXXXX/X.SXZXXXXX|2|Dolphin 2
Dolphin 2 \xB7 12|T|.....SSOOI/....SSZOOI/LL...ZZXXI/XLJ..ZXXXI/XLJ...XXXX/XJJX.XXXXX|1|Dolphin 2
Dolphin 2 \xB7 13|T|.......OOI/..S...ZOOI/LLSS.ZZXXI/XLJS.ZXXXI/XLJ...XXXX/XJJX.XXXXX|2|Dolphin 2
Dolphin 2 \xB7 14|T|..ZZ...OOI/..SZZ..OOI/LLSS...XXI/XLJS..XXXI/XLJ...XXXX/XJJX.XXXXX|1|Dolphin 2
Dolphin 2 \xB7 1 \xB7 1|T|.........J/X.....X..J/X.....XXJJ/X.....XXXX/X....XXXXX/X....XXXXX/XXX...XXXX/XXXX.XXXXX|2|Dolphin 2 \xB7 1
Dolphin 2 \xB7 15|T|......S.../JJ....SS.I/JL....ZS.I/JL...ZZXXI/XLL..ZXXXI/XOO...XXXX/XOOX.XXXXX|2|Dolphin 2
\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2 \xB7 1|T|.......S.I/...Z...SSI/..ZZ...JSI/OOZ....JXI/OOX.LLJJXX/XXX..LXXXX/XXX..LXXXX|2|\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2
\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2 \xB7 2|T|.........I/.SSZ.....I/SSZZ...J.I/OOZ....JXI/OOX.LLJJXX/XXX..LXXXX/XXX..LXXXX|2|\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2
\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2 \xB7 3|T|.........I/.ZOO.....I/ZZOO...J.I/ZSS....JXI/SSX.LLJJXX/XXX..LXXXX/XXX..LXXXX|2|\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2
\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2 \xB7 4|T|...Z...IS./..ZZ..JISS/OOZ...JIXS/OOXL.JJIXX/XXXL..XXXX/XXXLL.XXXX|2|\u6C34\u98F2\u307F\u9CE5\u7A4D\u307F 2
FD Cannon \xB7 2|T|I........./IJJ......./IJLL....../IJXL....../XXXL..S.../XZZ...SSOO/XXZZ.XXSOO/XXXX.XXXXX|2|FD Cannon
FDPC \xB7 3|T|OO......../OOX..J.LLI/XXX..JJJLI/XZZ...SSLI/XXZZ.SSXXI/XXXX.XXXXX|2|FDPC
FDPC \xB7 4|T|OOLL....../OOXL.....I/XXXL..JJJI/XZZ...SSJI/XXZZ.SSXXI/XXXX.XXXXX|2|FDPC
FDPC \xB7 5|T|OOLL...I../OOXL...I../XXXL..JIS./XZZ...JISS/XXZZ.JJXXS/XXXX.XXXXX|2|FDPC
JA Cannon 2 \xB7 1|T|XJJ......I/XJ...ZZLLI/XJX.SSZZLI/XXXSS.XXLI/XXXXXX.XXX|2|JA Cannon 2
JA Cannon 2 \xB7 3|T|OO......../OO......../XJJ......I/XJ...ZZLLI/XJX.SSZZLI/XXXSS.XXLI/XXXXXX.XXX|2|JA Cannon 2
Key Or PC 2 \xB7 5|T|.........I/......ZZ.I/OOL...SZZI/OOL...SSXI/XJLL...SXX/XJJJX.XXXX/XXXX..XXXX|2|Key Or PC 2
Key Or PC 2 \xB7 6|T|.........I/......ZZ.I/OOJ...SZZI/OOJ...SSXI/XJJL...SXX/XLLLX.XXXX/XXXX..XXXX|2|Key Or PC 2
Key Or PC 2 \xB7 7|T|.........I/......ZZ.I/JJJ...SZZI/LLJ...SSXI/XLOO...SXX/XLOOX.XXXX/XXXX..XXXX|2|Key Or PC 2
Curveball \xB7 1|T|.....OO..I/J....OOS.I/JJJ...XSSI/XLLL.XXXSI/XL...XXXXX/XX..XXXXX.|2|Curveball
Curveball \xB7 2|T|.....OO..I/JJJ..OOS.I/ZZJ...XSSI/XZZL.XXXSI/XLLL.XXXXX/XX..XXXXX.|2|Curveball
Curveball \xB7 3|T|.....OO..I/LLL..OOS.I/LZZ...XSSI/XJZZ.XXXSI/XJJJ.XXXXX/XX..XXXXX.|2|Curveball
Curveball \xB7 4|T|I........./I...LLOO../I....LOO../I.SS.LXZZ./XSS..XXXZZ/XJJJ.XXXXX/XX.JXXXXX.|2|Curveball
Curveball \xB7 5|T|.L......../.L...IOO../JLL..IOO../JJJ..IXZZ./XS...IXXZZ/XSS.XXXXXX/XXS.XXXXX.|2|Curveball
Maospin \xB7 2|T|OO......../OO.......I/XJJJ...LLI/XXXJ....LI/XZZ...SSLI/XXZZ.SSXXX/XXXX..XXXX|2|Maospin
mons 3 \xB7 9|T|..L......./..L......I/OOLLZ...JI/OOXZZ...JI/XXXZ...JJI/XXXXX.SSXX/XXXXXSS.XX|2|mons 3
mons 3 \xB7 10|T|I........./IJJSS...../IJSSZ...../IJXZZ....L/XXXZ...LLL/XXXXX.OOXX/XXXXX.OOXX|2|mons 3
mons 3 \xB7 11|T|IOO......./IOO......./ILLLZ...../ILXZZ..JJJ/XXXZ...SSJ/XXXXX.SSXX/XXXXX...XX|2|mons 3
mons 3 \xB7 12|T|...I...LL./OO.I....LJ/OOXI.SS.LJ/XXXISS..JJ/XXXXXZZ.XX/XXXXX.ZZXX|2|mons 3
Old Key 2 \xB7 4|T|S.OO....J./SSOOZ...J./XSXZZ..JJL/XXXZ...LLL/XXXXX.IIII/XXXXX..XXX|2|Old Key 2
Old Key 2 \xB7 5|T|.........I/S.OO.....I/SSOOZ....I/XSXZZ....I/XXXZ...JJJ/XXXXX.LLLJ/XXXXX.LXXX|2|Old Key 2
Old Key 2 \xB7 6|T|S.OO....../SSOOZ...JI/XSXZZ...JI/XXXZ...JJI/XXXXX.LLLI/XXXXX.LXXX|2|Old Key 2
Old Key 2 \xB7 7|T|S.OO....L./SSOOZ...L./XSXZZ..JLL/XXXZ...JJJ/XXXXX.IIII/XXXXX..XXX|2|Old Key 2
Old Key 2 \xB7 8|T|.I......../.IOO....../.IOOZ...SS/XIXZZ..SS./XXXZ...JJJ/XXXXX.LLLJ/XXXXX.LXXX|2|Old Key 2
Old Key 2 \xB7 9|T|.I......../.IOO....../.IOOZ..JJ./XIXZZ..JS./XXXZ...JSS/XXXXX.LLLS/XXXXX.LXXX|2|Old Key 2
Pinwheel 2 \xB7 2|T|I........./IJJOO.ZLLL/IJXOOZZLXX/IJXXSZ...X/XXXXSS...X/XXXXXS..XX|1|Pinwheel 2
Pinwheel 2 \xB7 5|T|I........./IJJOO..LLL/IJXOO..LXX/IJXXS...ZX/XXXXSS.ZZX/XXXXXS.ZXX|2|Pinwheel 2
Pinwheel 2 \xB7 6|T|........OO/I.......OO/IJJ....LLL/IJX....LXX/IJXXS...ZX/XXXXSS.ZZX/XXXXXS.ZXX|2|Pinwheel 2
Pinwheel 2 \xB7 7|T|I...LL..../IJJOOL..../IJXOOL..XX/IJXXS...ZX/XXXXSS.ZZX/XXXXXS.ZXX|2|Pinwheel 2
SAZI SD 2 \xB7 8|T|......SS../I....SSLOO/IJJ...XLOO/IJZZ.XXLLX/IJ.ZZXXXXX/XXX.XXXXXX|2|SAZI SD 2
SAZI SD 2 \xB7 9|T|.......LS./I....LLLSS/IJJ...XOOS/IJZZ.XXOOX/IJ.ZZXXXXX/XXX.XXXXXX|2|SAZI SD 2
SAZI SD 2 \xB7 10|T|.....OO.../I....OOLLL/IJJ...XLSS/IJZZ.XXSSX/IJ.ZZXXXXX/XXX.XXXXXX|2|SAZI SD 2
SAZI SD 2 \xB7 11|T|.....OO.../I....OOLLL/IZZ...XLSS/IJZZ.XXSSX/IJJJ.XXXXX/XXX.XXXXXX|2|SAZI SD 2
SDDT Cannon \xB7 1|T|...ZJJ..../OOZZJ...../OOZXJ.IIII/LLLXX..SSX/LXXXX.SSXX/.XXXXX.XXX|3|SDDT Cannon
SDDT Cannon \xB7 2|T|....S...../....SS..../.....S..../....JJ..../....J....Z/IOOXJ.LLZZ/IOOXX..LZX/IXXXX..LXX/IXXXXX.XXX|2|SDDT Cannon
SDDT Cannon \xB7 3|T|.....J..../.....J..../...SJJ..../...SS....Z/IOOXS.LLZZ/IOOXX..LZX/IXXXX..LXX/IXXXXX.XXX|2|SDDT Cannon
SDDT Cannon \xB7 4|T|.....JJ.../...S.J..../...SSJ.ZZ./IOOXSL..ZZ/IOOXXL...X/IXXXXLL.XX/IXXXXX.XXX|2|SDDT Cannon
SingleYou \xB7 1|T|.........I/JJ.....OOI/J......OOI/JLLL....XI/XLZZ....XX/XXXZZ....X/XXXXXXX.XX/XXX...XXXX|1|SingleYou
SingleYou 2 \xB7 8|T|.........I/.J.....OOI/.J....SOOI/JJ.L..SSXI/XLLL...SXX/XXXZZ.XXXX/XXX.ZZXXXX|2|SingleYou 2
SingleYou 2 \xB7 9|T|........JI/........JI/LLL...SJJI/LOO...SSXI/XOO....SXX/XXXZZ.XXXX/XXX.ZZXXXX|1|SingleYou 2
SingleYou 2 \xB7 11|T|I........./I.....ZZLL/I.....SZZL/IJ....SSXL/XJJJ...SXX/XXXOO.XXXX/XXXOO.XXXX|2|SingleYou 2
SingleYou 2 \xB7 15|T|.........I/JJ.....OOI/JL....SOOI/JL....SSXI/XLL....SXX/XXXZZ.XXXX/XXX.ZZXXXX|1|SingleYou 2
SingleYou 2 \xB7 16|T|.........I/JJ.....OOI/J.....SOOI/JLLL..SSXI/XLZZ...SXX/XXXZZ.XXXX/XXX...XXXX|2|SingleYou 2
SingleYou 2 \xB7 17|T|.........I/.ZL......I/ZZL...S..I/ZJLL..SSXI/XJJJ...SXX/XXXOO.XXXX/XXXOO.XXXX|2|SingleYou 2
SingleYou 2 \xB7 18|T|.........I/.ZJ......I/ZZJ...S..I/ZJJL..SSXI/XLLL...SXX/XXXOO.XXXX/XXXOO.XXXX|2|SingleYou 2
SingleYou 2 \xB7 19|T|I........./I.......LL/I.Z..OOJJL/IZZ..OOJXL/XZ...SSJXX/XXX.SSXXXX/XXX...XXXX|2|SingleYou 2
SingleYou 2 \xB7 20|T|.........I/......ZZ.I/LLL...SZZI/LJ....SSXI/XJJJ...SXX/XXXOO.XXXX/XXXOO.XXXX|2|SingleYou 2
SingleYou 2 \xB7 21|T|.........I/......ZZ.I/J.....SZZI/JJJL..SSXI/XLLL...SXX/XXXOO.XXXX/XXXOO.XXXX|2|SingleYou 2
SingleYou 2 \xB7 22|T|.........I/.......OOI/LLL...SOOI/LJ....SSXI/XJJJ...SXX/XXXZZ.XXXX/XXX.ZZXXXX|2|SingleYou 2
SingleYou 2 \xB7 23|T|OO.......I/OO.......I/LLL...S..I/LJ....SSXI/XJJJ...SXX/XXXZZ.XXXX/XXX.ZZXXXX|2|SingleYou 2
SingleYou 2 \xB7 24|T|......IIII/......ZZLL/......SZZL/.J....SSXL/XJJJ...SXX/XXXOO.XXXX/XXXOO.XXXX|2|SingleYou 2
SingleYou 2 \xB7 25|T|.........I/JJ.....OOI/JL....SOOI/JL....SSXI/XLL....SXX/XXXZZ.XXXX/XXX.ZZXXXX|1|SingleYou 2
SingleYou 2 \xB7 16 \xB7 1|T|I........./I........Z/IJ....OOZZ/IJJJ..OOZX/XXSS...XXX/XSS...XXXX/XXXX..XXXX/XXXX...XXX/XXXXX.XXXX/XXX...XXXX|2|SingleYou 2 \xB7 16
SingleYou 2 \xB7 22 \xB7 3|T|I.....SLL./I.Z...SSL./IZZ..OOSLX/IZ...OOXXX/XXX...XXXX/XX....XXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 22
SingleYou 2 \xB7 9 \xB7 1|T|........S./I.......SS/ILJ......S/ILJJJZZ.XX/ILL...ZZXX/XXX.OOXXXX/XXX.OOXXXX/XXX.XXXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 9
SingleYou 2 \xB7 8 \xB7 1|T|........S./..Z.....SS/IZZ....OOS/IZ.....OOX/IX.LLJJXXX/IX..LJXXXX/XX.XLJXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 8
SingleYou 2 \xB7 8 \xB7 2|T|..Z......./IZZ..OO.SS/IZ...OOSSX/IX.LLJJXXX/IX..LJXXXX/XX.XLJXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 8
SingleYou 2 \xB7 8 \xB7 3|T|........OO/..Z.....OO/IZZ.....SS/IZ.....SSX/IX.LLJJXXX/IX..LJXXXX/XX.XLJXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 8
SingleYou 2 \xB7 22 \xB7 6|T|.....S..../.....SS.../......S.LL/......I.JL/...Z..I.JL/OOZZ..IJJX/OOZ...IXXX/XXX...XXXX/XX....XXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 7|T|.....S..../.....SS.../......S..J/......IL.J/...Z..ILJJ/OOZZ..ILLX/OOZ...IXXX/XXX...XXXX/XX....XXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 8|T|........SS/I......SSZ/I......LZZ/IOO..LLLZX/IOO..JJXXX/XXX..JXXXX/XX...JXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 9|T|........OO/I......ZOO/IL....ZZSS/IL....ZSSX/ILL..JJXXX/XXX..JXXXX/XX...JXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 22
SingleYou 2 \xB7 11 \xB7 1|T|I........./I........./I.....S.../I.....SSOO/XJJJ...SOO/XLLJZ.XXXX/X.LZZ.XXXX/XXLZ..XXXX/XXXXX.XXXX|2|SingleYou 2 \xB7 11
SingleYou 2 \xB7 11 \xB7 3|T|.........I/..J..L...I/..J..LZZ.I/XJJ..LLZZI/XOO...XXXX/XOOSS.XXXX/XXSS..XXXX/XXXXX.XXXX|3|SingleYou 2 \xB7 11
SingleYou 2 \xB7 11 \xB7 4|T|.Z.....I../ZZ....JI../Z.....JIOO/XL...JJIOO/XL....XXXX/XLLSS.XXXX/XXSS..XXXX/XXXXX.XXXX|3|SingleYou 2 \xB7 11
SingleYou 2 \xB7 25 \xB7 1|T|L.SS....../LSS....OO./LLI.JJJOOX/XXI..ZJXXX/XXI.ZZXXXX/XXI.ZXXXXX/XXX..XXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 25
SingleYou 2 \xB7 25 \xB7 2|T|...L....../.LLL....../OO......SS/OOI.JJJSSX/XXI..ZJXXX/XXI.ZZXXXX/XXI.ZXXXXX/XXX..XXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 25
SingleYou 2 \xB7 25 \xB7 3|T|...L....../.LLL....../.SS....OO./SSI.JJJOOX/XXI..ZJXXX/XXI.ZZXXXX/XXI.ZXXXXX/XXX..XXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 25
SingleYou 2 \xB7 16 \xB7 2|T|........I./........I./OO..LL.ZI./OO...LZZIX/XXSS.LZXXX/XSS..JXXXX/XXXX.JXXXX/XXX.JJXXXX|3|SingleYou 2 \xB7 16
SingleYou 2 \xB7 16 \xB7 3|T|I........./I........Z/IS....OOZZ/ISS...OOZX/XXSL...XXX/XLLLJ.XXXX/XXXXJ.XXXX/XXXJJ.XXXX|2|SingleYou 2 \xB7 16
SingleYou 2 \xB7 22 \xB7 11|T|........S./........SS/.ZJ..LLOOS/ZZJ..ILOOX/ZJJ..ILXXX/XXX..IXXXX/XX...IXXXX/XXX.XXXXXX|2|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 12|T|........OO/........OO/.ZJ..LL.SS/ZZJ..ILSSX/ZJJ..ILXXX/XXX..IXXXX/XX...IXXXX/XXX.XXXXXX|2|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 13|T|.....IIII./......JJSS/OOLLL.JSSX/OOL...JXXX/XXXZZ.XXXX/XX..ZZXXXX/XXX.XXXXXX|2|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 14|T|.....S..../.....SS.OO/......S.OO/JIIII.LLLX/JJJ...LXXX/XXXZZ.XXXX/XX..ZZXXXX/XXX.XXXXXX|2|SingleYou 2 \xB7 22
SingleYou 2 \xB7 8 \xB7 4|T|OO......../OOZ......./IZZ.....SS/IZ.....SSX/IX.LLJJXXX/IX..LJXXXX/XX.XLJXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 8
SingleYou 2 \xB7 23 \xB7 1|T|.OO......./.OO......./XXJJJISLLX/XXZZJISSLX/XXXZZIXSLX/XX...IXXXX/XXX.XXXXXX|3|SingleYou 2 \xB7 23
SingleYou 2 \xB7 20 \xB7 1|T|......LLI./.ZJ..OOLI./ZZJ..OOLIX/ZJJ...XXIX/XXXSS.XXXX/XXSS..XXXX/XXXXX.XXXX|3|SingleYou 2 \xB7 20
SingleYou 2 \xB7 22 \xB7 15|T|.........I/.........I/.......LLI/JJZ...OOLI/JZZ...OOLX/JZ...SSXXX/XXX.SSXXXX/XX....XXXX/XXX.XXXXXX|2|SingleYou 2 \xB7 22
SingleYou 2 \xB7 22 \xB7 16|T|........SS/I......SSZ/IL....OOZZ/IL....OOZX/ILL..JJXXX/XXX..JXXXX/XX...JXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 22
SingleYou 2 \xB7 11 \xB7 5|T|I........./I........./I.....S.../I.....SSOO/XLLL...SOO/XLJJZ.XXXX/X.JZZ.XXXX/XXJZ..XXXX/XXXXX.XXXX|2|SingleYou 2 \xB7 11
SingleYou 2 \xB7 9 \xB7 3|T|........S./I.......SS/IJJ......S/IJLLLZZ.XX/IJL...ZZXX/XXX.OOXXXX/XXX.OOXXXX/XXX.XXXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 9
SingleYou 2 \xB7 9 \xB7 4|T|........L./........L./I......JLL/I.....SJJJ/IOO...SSXX/IOO....SXX/XXXZZ.XXXX/XXX.ZZXXXX/XXX.XXXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 9
SingleYou 2 \xB7 9 \xB7 5|T|........J./........J./I......JJL/I.....SLLL/IOO...SSXX/IOO....SXX/XXXZZ.XXXX/XXX.ZZXXXX/XXX.XXXXXX/XXX.XXXXXX|1|SingleYou 2 \xB7 9
SingleYou 2 \xB7 21 \xB7 2|T|......JZZ./.LL...JSZZ/OOL..JJSSX/OOL...XXSX/XIIII.XXXX/XXXX..XXXX/XXXXX.XXXX|3|SingleYou 2 \xB7 21
SingleYou 2 \xB7 21 \xB7 3|T|IS......../ISS...OOJJ/ILS...OOJX/IL...ZXXJX/XLL.ZZXXXX/XXXXZ.XXXX/XXXXX.XXXX|2|SingleYou 2 \xB7 21
SingleYou 2 \xB7 21 \xB7 4|T|.........I/.........I/.........I/.........I/....L.OOJJ/..LLL.OOJX/...SSZXXJX/X.SSZZXXXX/XXXXZ.XXXX/XXXXX.XXXX|2|SingleYou 2 \xB7 21
SingleYou 2 \xB7 21 \xB7 5|T|........L./........L./.ZJ..OOSLL/ZZJ..OOSSX/ZJJ...XXSX/XIIII.XXXX/XXXX..XXXX/XXXXX.XXXX|3|SingleYou 2 \xB7 21
SingleYou 2 \xB7 21 \xB7 6|T|.........I/.........I/.........I/.........I/.OO....LJJ/SOOZ.LLLJX/SSZZ..XXJX/XSZ...XXXX/XXXX.XXXXX/XXXX.XXXXX/XXXXX.XXXX|2|SingleYou 2 \xB7 21
Stickspin 2 (X+) \xB7 4|T|LOO......I/LOO......I/LL.......I/ZZ......XI/XZZ....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 5|T|JJJ......I/OOJ......I/OOLLL....I/ZZL.....XI/XZZ....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 6|T|LLL......I/LZJ......I/ZZJJJ....I/ZOO.....XI/XOO....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 7|T|........JI/OO......JI/OOLLL..JJI/ZZL.....XI/XZZ....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 8|T|..JJJ....I/..ZZJ....I/LLLZZ....I/LOO.....XI/XOO....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 9|T|........JI/..ZZ....JI/LLLZZ..JJI/LOO.....XI/XOO....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 10|T|.........I/L.ZZ...OOI/L.JZZ..OOI/LLJ.....XI/XJJ....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 11|T|JJLL.....I/JOOL.....I/JOOL.....I/ZZ......XI/XZZ....XXX/XXX..SSXXX/XXX.SSXXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 12|T|.......S.I/.......SSI/OOJ....ZSI/OOJ...ZZXI/XJJL..ZXXX/XXXL...XXX/XXXLL.XXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 4 \xB7 1|T|XXX......X/XXX......X/XX.......X/XX..J...XX/XXXXJJJXXX|1|Stickspin 2 (X+) \xB7 4
Stickspin 2 (X+) \xB7 15|T|.........I/.......OOI/S......OOI/SSJJJ...XI/XSLLJZ.XXX/XXXLZZ.XXX/XXXLZ.XXXX|2|Stickspin 2 (X+)
Stickspin 2 (X+) \xB7 9 \xB7 1|T|I........./I........J/IS.......J/ISS...LLJJ/OOS....LXX/OOXX...LXX/XXXXX..XXX/XXXZZ...XX/XXXXZZ.XXX|1|Stickspin 2 (X+) \xB7 9
Stickspin 2 (X+) \xB7 12 \xB7 1|T|.........I/.........I/.......LLI/JJZ.....LI/JZZ....XLX/JZ...OOXXX/XXX.SOOXXX/XXX.SSXXXX/XXXX.SXXXX|2|Stickspin 2 (X+) \xB7 12
Stickspin 2 (X+) \xB7 15 \xB7 1|T|I.......OO/I..J..ZZOO/IL.J...ZZX/ILJJSS.XXX/XLLSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 5|T|J..I....../JJJI..ZZ../LLLI...ZZX/LOOISS.XXX/XOOSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 6|T|........L./...I....L./...I..ZZLL/OOJI...ZZX/OOJISS.XXX/XJJSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 7|T|.........I/.........I/......OOJI/..L...OOJI/..L....JJX/ZZLLSS.XXX/XZZSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 8|T|.........I/.........I/......LLLI/...J..LOOI/...J...OOX/ZZJJSS.XXX/XZZSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 9|T|..OO..S..Z/..OO..SSZZ/..LJ...SZX/LLLJJJ.XXX/XIIII..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 10|T|...I....OO/L..I..ZZOO/L.JI...ZZX/LLJISS.XXX/XJJSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 14|T|...I....../...I..OOJ./..LI..OOJ./..LI...JJX/ZZLLSS.XXX/XZZSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 15|T|..I......./..I...LLL./..IJ..LOO./..IJ...OOX/ZZJJSS.XXX/XZZSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 17|T|.ZZ...S.../OOZZ..SS../OOLJ...S.X/LLLJJJ.XXX/XIIII..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 20|T|.........I/.........I/.........I/..LL..ZZ.I/OOJL...ZZX/OOJLSS.XXX/XJJSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 21|T|I..L....../ILLL..ZZ../IJJJ...ZZX/IOOJSS.XXX/XOOSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 15 \xB7 22|T|IJ......../IJJJ..ZZ../ILOO...ZZX/ILOOSS.XXX/XLLSS..XXX/XXXXXX.XXX/XXXXX.XXXX|3|Stickspin 2 (X+) \xB7 15
Stickspin 2 (X+) \xB7 17 \xB7 2|T|.........I/.......LLI/JJZ...OOLI/JZZ...OOLI/JZ...SSXXX/XXX.SSXXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|2|Stickspin 2 (X+) \xB7 17
Toothpaste Cone 3 \xB7 6|T|.Z......../ZZ......../Z......LL./XS...JJJL./XSS....JLI/XXS..OOXXI/XX...OOXXI/XXX.XXXXXI|2|Toothpaste Cone 3
Toothpaste Cone 3 \xB7 11|T|OO......../OOL......./LLL......./XS....ZZ../XSS...JZZI/XXS...JXXI/XX...JJXXI/XXX.XXXXXI|2|Toothpaste Cone 3
Toothpaste Cone 3 \xB7 12|T|.LL......./OOL......./OOL......./XS....ZZ../XSS...JZZI/XXS...JXXI/XX...JJXXI/XXX.XXXXXI|2|Toothpaste Cone 3
Toothpaste Cone \xB7 1|T|..Z......./.ZZ......./SZ......../SS......../XS....I.../X...LLIJJJ/XX.OOLIXXJ/XX.OOLIXX./XXX.XXXXX.|2|Toothpaste Cone
Toothpaste Cone \xB7 2|T|LL.....S../XLJ....SS./XLJJJ...SI/XXOOZZ.XXI/XXOO.ZZXXI/XXX.XXXXXI|2|Toothpaste Cone
Toothpaste Cone \xB7 3|T|S........./SS.....LL./XS.....ZL./X...OOZZLI/XX.JOOZXXI/XX.JJJ.XXI/XXX.XXXXXI|2|Toothpaste Cone
True Hanpen \xB7 1|T|...L....../..IL.....Z/OOILL...ZZ/OOIX....ZX/JJIXXS...X/JXXXXSS.XX/JXXXX.SXXX|2|True Hanpen
True Hanpen \xB7 2|T|..JL....../..JL.....Z/.JJLL...ZZ/IOOX....ZX/IOOXXS...X/IXXXXSS.XX/IXXXX.SXXX|2|True Hanpen
UNC.SD \xB7 1|T|JIIIILLLXX/JJJXXLXXXX|2|UNC.SD
UNC.SD \xB7 2|T|.......LLL/I......LOO/IJJSS...OO/IJSSZZ.XXX/IJ.XXZZXXX|2|UNC.SD
UNC.SD \xB7 4|T|...I....../JJJI...ZZ./OOJIS...ZZ/OOLISS.XXX/LLLXXS.XXX|2|UNC.SD
UNC.SD \xB7 5|T|.........I/........JI/...OOS..JI/L..OOSSJJI/L...ZZSXXX/LL.XXZZXXX|2|UNC.SD
UNC.SD \xB7 7|T|JJJ......./ZZJ......./IZZ...S.../ILOO..SS../ILOO...SXX/ILLXX.XXXX|2|UNC.SD
UNC.SD \xB7 8|T|......ZZ.J/I.....SZZJ/ILOO..SSJJ/ILOO...SXX/ILLXX.XXXX|2|UNC.SD
UNC.SD \xB7 9|T|JJ......../JI......../JI.....ZZ./LIOOS...ZZ/LIOOSS.XXX/LL.XXS.XXX|2|UNC.SD
Hachispin 2 (X+) \xB7 1|T|..I.....LL/OOIZZ....L/OOIXZZSS.L/JJIXXSS..X/JXXXXXXX.X/JXXXX...XX|3|Hachispin 2 (X+)
Hachispin 2 (X+) \xB7 2|T|J.......LL/JJJZZ....L/IOOXZZSS.L/IOOXXSS..X/IXXXXXXX.X/IXXXX...XX|3|Hachispin 2 (X+)
Hachispin 2 (X+) \xB7 3|T|..J......./..J.....LL/.JJZZ....L/IOOXZZSS.L/IOOXXSS..X/IXXXXXXX.X/IXXXX...XX|3|Hachispin 2 (X+)
Hachispin 2 (X+) \xB7 4|T|JJJ.....LL/..JZZ....L/IOOXZZSS.L/IOOXXSS..X/IXXXXXXX.X/IXXXX...XX|3|Hachispin 2 (X+)
Hachispin (X+) \xB7 1|T|..I......./.JI.....LL/.JIZZ....L/JJIXZZSS.L/OOXXXSS..X/OOXXXXXX.X/.XXXX...XX|3|Hachispin (X+)
Hachispin (X+) \xB7 2|T|........JJ/........JI/........JI/..LZZ....I/LLLXZZSS.I/OOXXXSS..X/OOXXXXXX.X/.XXXX...XX|3|Hachispin (X+)
Hachispin (X+) \xB7 3|T|.OO.....LL/.OOZZ....L/IJJXZZSS.L/IJXXXSS..X/IJXXXXXX.X/IXXXX...XX|3|Hachispin (X+)
Mr. T-Spin\u2019s STD 3 \xB7 5|T|.J......../.J......../JJ......../X......OO./X.LLIXSOOZ/X..LIXSSZZ/X.XLIXXSZX/XX.XIXXXXX|3|Mr. T-Spin\u2019s STD 3
Mr. T-Spin\u2019s STD 3 \xB7 4 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1|T|.J......../.J......../JJ......../X......XX./X.XXXXXXXX/X..XXXXXXX/X.XXXXXXXX/XX.XXXXXXX|3|Mr. T-Spin\u2019s STD 3 \xB7 4 \xB7 1 \xB7 1 \xB7 1 \xB7 1
Mr. T-Spin\u2019s STD 3 \xB7 2 \xB7 1 \xB7 1 \xB7 1|T|.J......../.J......../JJ......../X......XX./X.LLIXXXXX/X..LIXXXXX/X.XLIXXXXX/XX.XIXXXXX|3|Mr. T-Spin\u2019s STD 3 \xB7 2 \xB7 1 \xB7 1
Mr. T-Spin\u2019s STD 3 \xB7 6|T|OO......../OO......J./X.......J./X.LLIXSJJZ/X..LIXSSZZ/X.XLIXXSZX/XX.XIXXXXX|3|Mr. T-Spin\u2019s STD 3
Mr. T-Spin\u2019s STD 3 \xB7 7|T|.J......../.J......../JJ......../X......SS./X.LLIXSSOO/X..LIXZZOO/X.XLIXXZZX/XX.XIXXXXX|3|Mr. T-Spin\u2019s STD 3
Ms. T-Spin\u2019s STD \xB7 1|T|I..JJZ..S./I..JZZ..SS/I..JZ...LS/IOOXX.LLLX/XOOXX..XXX/XXXXX.XXXX|3|Ms. T-Spin\u2019s STD
Ms. T-Spin\u2019s STD \xB7 2|T|I....Z..S./IJ..ZZ..SS/IJJJZ...LS/IOOXX.LLLX/XOOXX..XXX/XXXXX.XXXX|3|Ms. T-Spin\u2019s STD
Speedboat 2 (X+) \xB7 3|T|........LL/...J.....L/IOOJJJSS.L/IOOXXSS..X/IXXXXXXX.X/IXXXXX..XX|3|Speedboat 2 (X+)
Speedboat 2 (X+) \xB7 1 \xB7 2 \xB7 1|T|....XX..LL/...XXX...L/IOOXXXSS.L/IOOXXSS..X/IXXXXXXX.X/IXXXXX..XX|3|Speedboat 2 (X+) \xB7 1 \xB7 2
Speedboat 2 (X+) \xB7 2 \xB7 1|T|...X....../..XX....LL/..XX.....L/IOOXXXSS.L/IOOXXSS..X/IXXXXXXX.X/IXXXXX..XX|3|Speedboat 2 (X+) \xB7 2
Speedboat 2 (X+) \xB7 8|X|..SSZ...../.SSZZ....L/IOOZTTTLLL/IOOXXTJJJX/IXXXXXXXJX/IXXXXX..XX|3|Speedboat 2 (X+)
Speedboat 2 (X+) \xB7 9|X|..ZOO...../.ZZOO....L/IZSSTTTLLL/ISSXXTJJJX/IXXXXXXXJX/IXXXXX..XX|3|Speedboat 2 (X+)
2(LT) 2 \xB7 5|T|....I.S.../JJ..I.SS../J...IZZSOO/JLLLIXZZOO/XL.XXXXXX.|1|2(LT) 2
2(LT) 2 \xB7 6|T|L..IIIIZOO/L...SSZZOO/LL.SSXZJJJ/X..XXXXXXJ|2|2(LT) 2
2(LT) 2 \xB7 7|T|S........./SS......../IS......../I.....LL../I.ZZJJJLOO/I..ZZXJLOO/X..XXXXXX.|2|2(LT) 2
2(LT) 2 \xB7 2 \xB7 6|T|.....JJJ../.....LLJ.X/SZZ...LOOX/SSZZ.XLOOX/XS.XXXXXXX|2|2(LT) 2 \xB7 2
Amino TSD 3 \xB7 1|T|...ZZ....I/S...ZZLOOI/SS.XLLLOOI/XS.XXXXXXI|2|Amino TSD 3
Amino TSD \xB7 1 \xB7 1|T|I........./I........./IJ..Z...../IJXZZ...SS/JJXZ...SSL/XXXXX.XLLL|2|Amino TSD \xB7 1
Amino TSD 3 \xB7 5|T|....S...../..ZZSS...I/...ZZSLOOI/JJJXLLLOOI/X.JXXXXXXI|1|Amino TSD 3
Amino TSD 3 \xB7 6|T|....L...../..LLLS...I/...ZZSSOOI/JJJXZZSOOI/X.JXXXXXXI|1|Amino TSD 3
Amino TSD 3 \xB7 7|T|...Z....../..ZZ....../..ZS.L...I/...SSL.OOI/JJJXSLLOOI/X.JXXXXXXI|1|Amino TSD 3
Amino TSD 3 \xB7 8|T|L........./L........./LL...ZJ..I/S...ZZJOOI/SS.XZJJOOI/XS.XXXXXXI|2|Amino TSD 3
Amino TSD \xB7 1 \xB7 2|T|I........./I..SS...../IJSSZ...../IJXZZ...LL/JJXZ...OOL/XXXXX.XOOL|2|Amino TSD \xB7 1
Amino TSD 3 \xB7 9|T|.....L..../...LLLZZ.I/S...OOJZZI/SS.XOOJJJI/XS.XXXXXXI|2|Amino TSD 3
Amino TSD 3 \xB7 10|T|.........I/.........I/...ZZ..OOI/S...ZZLOOI/SS.XLLLJJJ/XS.XXXXXXJ|2|Amino TSD 3
Amino TSD 3 \xB7 11|T|.......SLL/..I....SSL/OOIZZ...SL/OOIXZZ.JJJ/X.IXXXXXXJ|2|Amino TSD 3
Amino TSD 3 \xB7 14|X|..JJSSLLLI/..JSSTLOOI/ZZJXTTTOOI/XZZXXXXXXI|2|Amino TSD 3
Amino TSD 3 \xB7 15|X|J...SSLLLI/JJJSSTLOOI/ZZ.XTTTOOI/XZZXXXXXXI|2|Amino TSD 3
Amino TSD 3 \xB7 16|T|L........./L........./LL.....ZJI/S...OOZZJI/SS.XOOZJJI/XS.XXXXXXI|2|Amino TSD 3
Great DDT 3 \xB7 1|T|....SS..../.OOSS....I/JOOLL.ZZ.I/JJJXL..ZZI/XXXXL.XXXI|2|Great DDT 3
Great DDT 3 \xB7 2|T|L........./L........./LLSS.....I/JSS...ZOOI/JJJX.ZZOOI/XXXX.ZXXXI|2|Great DDT 3
Great DDT 3 \xB7 3|T|....SS..../JJ.SS....I/JOOLL.ZZ.I/JOOXL..ZZI/XXXXL.XXXI|2|Great DDT 3
Great DDT 3 \xB7 6|T|.I......../.I......../.I......LL/.I.......L/OOJJJZZ.SL/OO.XJ.ZZSS/XXXX..XXXS|1|Great DDT 3
Great DDT 3 \xB7 7|T|..OO....LL/..OO.....L/JIIIIZZ.SL/JJJX..ZZSS/XXXX..XXXS|1|Great DDT 3
Mechanical TSD v3 2 \xB7 2|T|......J.../...ZZ.JJJI/S...ZZLOOI/SS.XXXLOOI/XS.XXXLLXI|2|Mechanical TSD v3 2
Mechanical TSD v3 2 \xB7 3|T|...ZZ....I/S...ZZLOOI/SS.XXXLOOI/XS.XXXLLXI|2|Mechanical TSD v3 2
Mechanical TSD v3 2 \xB7 4|T|...ZZLL..I/S...ZZLOOI/SS.XXXLOOI/XS.XXX..XI|2|Mechanical TSD v3 2
Mechanical TSD v3 2 \xB7 5|T|....SS...I/OOJSS...ZI/OOJXXX.ZZI/XJJXXX.ZXI|2|Mechanical TSD v3 2
Mechanical TSD v3 2 \xB7 6|T|..JJSS...I/OOJSS...ZI/OOJXXX.ZZI/X..XXX.ZXI|2|Mechanical TSD v3 2
Mechanical TSD v3 2 \xB7 7|T|...JJZ..../..IJZZ..../OOIJZ...LL/OOIXXX.SSL/X.IXXXSSXL|2|Mechanical TSD v3 2
Mortar TSD \xB7 1|T|X..OO...../XX.OO....X/XXZZ...XXX/XXXZZ.XXXX|2|Mortar TSD
Reliable TSD 2 \xB7 2|T|.........X/....XZZ.XX/IIIIXXZZXX|1|Reliable TSD 2
Reliable TSD 2 \xB7 3|T|.........X/....X.OOXX/IIIIXXOOXX|1|Reliable TSD 2
Reliable TSD 2 \xB7 1 \xB7 3 \xB7 1 \xB7 1 \xB7 1|T|........XX/...X....XX/XXXXZZ...X/XXXXXZZ.XX/XX.XXX..XX|2|Reliable TSD 2 \xB7 1 \xB7 3 \xB7 1 \xB7 1
Reliable TSD 2 \xB7 21|T|.....Z..OO/J..IZZ..OO/JJJIZS...X/LLLIXSS.XX/L..IXXS.XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 23|T|........OO/JJSS....OO/JSSLZZ...X/JLLLXZZ.XX/IIIIXX..XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 24|T|.........J/.........J/L..OO...JJ/LZZOOS...X/LLZZXSS.XX/IIIIXXS.XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 25|T|.....Z..OO/I..LZZ..OO/ILLLZS...X/IJJJXSS.XX/I..JXXS.XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 26|T|........OO/IIII....OO/JJSSZZ...X/JSSLXZZ.XX/JLLLXX..XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 27|T|I........J/I........J/IS......JJ/ISSLLL...X/OOSLXZZ.XX/OO..XXZZXX|2|Reliable TSD 2
Reliable TSD 2 \xB7 28|T|OO......../OO......../IJ...SS.../IJJJSS...X/ILLLXZZ.XX/IL..XXZZXX|2|Reliable TSD 2
Reliable TSD 2 \xB7 29|T|.........J/.........J/I.....ZZJJ/ILLL...ZZX/ILSSX.OOXX/ISS.XXOOXX|2|Reliable TSD 2
Reliable TSD 2 \xB7 30|T|.........J/.........J/I...OO..JJ/ILLLOO...X/ILSSXZZ.XX/ISS.XXZZXX|2|Reliable TSD 2
Reliable TSD 2 \xB7 31|T|........OO/ISLL....OO/ISSLZZ...X/IJSLXZZ.XX/IJJJXX..XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 32|T|.........J/.........J/........JJ/........OO/...I....OO/SLLIZZ...X/SSLIXZZ.XX/.SLIXX..XX|2|Reliable TSD 2
Reliable TSD 2 \xB7 33|T|........OO/LLLJ....OO/LSSJZZ...X/SSJJXZZ.XX/IIIIXX..XX|2|Reliable TSD 2
Trustworthy DT 2 \xB7 1|T|..Z......./.ZZ......I/.Z.......I/OO.JJJSLLI/OO..XJSSLI/XX.XXXXSLX|3|Trustworthy DT 2
Trustworthy DT 2 \xB7 4|T|..Z......./.ZZ......J/.Z.......J/OO.IIIILJJ/OO..XLLLSS/XX.XXXXSSX|3|Trustworthy DT 2
Trustworthy DT 2 \xB7 6|T|.....S..../I....SS.../I...ZLS..J/IOOZZL...J/IOOZXLL.JJ/XX.XXXX..X|2|Trustworthy DT 2
Trustworthy DT 2 \xB7 7|T|.OO......./.OO......J/.Z.......J/ZZ.IIIILJJ/Z...XLLLSS/XX.XXXXSSX|2|Trustworthy DT 2
Trustworthy DT 2 \xB7 13|T|..Z......./.ZZ...I.../.Z....I.../OO.JJJILLL/OO..XJILSS/XX.XXXXSSX|3|Trustworthy DT 2
Trustworthy DT 2 \xB7 14|T|LLL......./L.......SS/OO.IIIISSZ/OO..XJJJZZ/XX.XXXXJZX|3|Trustworthy DT 2
Trustworthy DT 2 \xB7 15|T|.SS....L../SS.....L../OO.IIIILLZ/OO..XJJJZZ/XX.XXXXJZX|3|Trustworthy DT 2
Trustworthy DT 2 \xB7 4 \xB7 1|T|........I./........I./........I./........I./.......ZZ./JJXLS...ZZ/JXXLSS.OOX/JX.LLS.OOX|2|Trustworthy DT 2 \xB7 4
Trustworthy DT 2 \xB7 4 \xB7 2|T|.........I/....Z....I/...ZZ....I/JJXZ...LLI/JXXSS.OOLX/JXSS..OOLX|2|Trustworthy DT 2 \xB7 4
Trustworthy DT 2 \xB7 7 \xB7 1|T|..Z......./.ZZ......./IZ...JJJOO/IXX.SLLJOO/IXX.SSL..X/IX...SL..X/XXX.XXXXXX|2|Trustworthy DT 2 \xB7 7
Trustworthy DT 2 \xB7 7 \xB7 2|T|..Z......./.ZZ......./IZ...LLLOO/IXX.SLJJOO/IXX.SSJ..X/IX...SJ..X/XXX.XXXXXX|2|Trustworthy DT 2 \xB7 7
Trustworthy DT 2 \xB7 6 \xB7 1|T|......Z.../JJ..IZZ.../J...IZS.../J.LLIXSSOO/X..LIXXSOO/X..LXXX..X/XX.XXXX..X|2|Trustworthy DT 2 \xB7 6
Trustworthy DT 2 \xB7 8 \xB7 1|T|..LL.Z...I/...LZZ...I/JJ.LZSSOOI/J..XSSXOOI/JX.XXXXXXX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|Trustworthy DT 2 \xB7 8
Trustworthy DT 2 \xB7 8 \xB7 2|T|..LL...S.I/...L...SSI/JJ.LOOZZSI/J..XOOXZZI/JX.XXXXXXX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|Trustworthy DT 2 \xB7 8
Trustworthy DT 2 \xB7 8 \xB7 3|T|..LL....../...LIIIIS./JJ.LOOZZSS/J..XOOXZZS/JX.XXXXXXX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|Trustworthy DT 2 \xB7 8
Fast DT 2 \xB7 1|T|I..S....LL/I..SSJJJXL/I...SOOJXL/IX.XXOOXXX|2|Fast DT 2
Fast DT 2 \xB7 2|T|..ZZ.....I/...ZZ....I/JJ.OOLLLXI/J..OOLSSXI/JX.XXSSXXX|3|Fast DT 2
Fast DT 2 \xB7 3|T|..S......./..SS.....I/...S.....I/JJ.LLLOOXI/J..LZZOOXI/JX.XXZZXXX|3|Fast DT 2
Fast DT 2 \xB7 5|T|..ZZ.....I/...ZZ.S..I/JJ.OOLSSXI/J..OOL.SXI/JX.XXLLXXX|2|Fast DT 2
Fast DT 2 \xB7 6|T|........ZI/....LOOZZI/JJ..LOOZXI/J...LLSSXI/JX.XXSSXXX|2|Fast DT 2
Fast DT 2 \xB7 7|T|.........I/.........I/.........I/.........I/.....SS.LL/JJ..SSOOXL/J...ZZOOXL/JX.XXZZXXX|2|Fast DT 2
Fast DT 2 \xB7 8|T|...ZZ...../I..SZZ..LL/I..SSJJJXL/I...SOOJXL/IX.XXOOXXX|2|Fast DT 2
Fast DT 2 \xB7 11|T|JJJ......./LLJ......./IL...ZS.../IL..ZZSSX./I...ZOOSX./IX.XXOOXXX|1|Fast DT 2
TKI-3 2 \xB7 5 \xB7 1|T|........SS/.......SSI/.........I/JJJOOXX.LI/ZZJOOX..LI/XZZXXXX.LL|3|TKI-3 2 \xB7 5
TKI-3 2 \xB7 5 \xB7 2|T|........SS/.......SSJ/.........J/IIIILXX.JJ/ZZLLLX..OO/XZZXXXX.OO|3|TKI-3 2 \xB7 5
TKI-3 2 \xB7 5 \xB7 3|T|.......S../.......SSI/........SI/JJJOOXX.LI/ZZJOOX..LI/XZZXXXX.LL|3|TKI-3 2 \xB7 5
TKI-3 2 \xB7 5 \xB7 7|T|.....L..../....IL..../.ZS.ILL.../ZZSSIXX..J/ZOOSIX...J/XOOXXXX.JJ|2|TKI-3 2 \xB7 5
TKI-3 2 \xB7 5 \xB7 8|T|.....L..../....IL..../.SS.ILL.../SSOOIXX..J/ZZOOIX...J/XZZXXXX.JJ|2|TKI-3 2 \xB7 5
TKI-3 2 \xB7 6|X|.....Z..../....ZZ..I./....Z...I./OOJJJTLLIJ/OOSSJTTLIJ/XSSXXTXLJJ|3|TKI-3 2
TKI-3 2 \xB7 7|X|.....Z..../....ZZ...I/....Z....I/SLLOOTJJJI/SSLOOTTJJI/XSLXXTXJJJ|3|TKI-3 2
TKI-3 2 \xB7 8|X|........Z./.......ZZ./.......ZI./........I./SLLOOJJTIJ/SSLOOJTTIJ/XSLXXJXTJJ|3|TKI-3 2
TKI-3 2 \xB7 9|X|....SS..I./...SS...I./JJJOOTLLIJ/ZZJOOTTLIJ/XZZXXTXLJJ|3|TKI-3 2
TKI-3 2 \xB7 10|X|.....J..../.....JJJ../L......Z../LIIIITZZOO/LLSSTTZJOO/XSSXXTXJJJ|3|TKI-3 2
TKI-3 2 \xB7 11|X|.......S../.......SSJ/........SJ/IIIILJJTJJ/ZZLLLJTTOO/XZZXXJXTOO|3|TKI-3 2
TKI-3 2 \xB7 12|X|.....JJJ../J......J.I/JJJSSTLLLI/ZZSSTTLOOI/XZZXXTXOOI|3|TKI-3 2
TKI-3 2 \xB7 5 \xB7 7 \xB7 1|T|I........./I....S..../IOO..SS.../IOOJJXS.../LLLJXX...Z/LXXJXXX.ZZ/XXXXXXX.ZX|2|TKI-3 2 \xB7 5 \xB7 7
TKI-3 2 \xB7 5 \xB7 1 \xB7 1|T|.........L/I.ZZ...LLL/IOOZZ...XX/IOOSSJ.XXX/I.SS.JJJ.X|2|TKI-3 2 \xB7 5 \xB7 1
TKI-3 2 \xB7 5 \xB7 3 \xB7 1|T|...S....L./I..SS...L./I...SOOXLL/IJ.ZZOOXXX/IJJJZZ..XX|2|TKI-3 2 \xB7 5 \xB7 3
TKI-3 2 \xB7 5 \xB7 3 \xB7 2|T|....Z....J/I..ZZ....J/IOOZ...XJJ/IOOSS.LXXX/I.SSLLL.XX|2|TKI-3 2 \xB7 5 \xB7 3
Dragon Special 2 \xB7 4|T|S........./SS......LL/ISZ......L/IZZXOOJJ.L/IZXXOOJ..X/IXX..XJ..X|2|Dragon Special 2
Dragon Special 2 \xB7 5|T|I........./IS......LL/ISS......L/IZSXOOJJ.L/ZZXXOOJ..X/ZXX..XJ..X|2|Dragon Special 2
Dragon Special 2 \xB7 1 \xB7 1 \xB7 1|T|..X......./..XX....XX/X.ZX.....X/XZZXXXXX.X/XZXXXXX..X/XXX..XX..X|2|Dragon Special 2 \xB7 1 \xB7 1
Dragon Special 2 \xB7 3 \xB7 1|T|..I......./..I.....LL/..IZZ....L/OOIXZZXX.L/OOXXXXX..X/.XXXXXX..X|2|Dragon Special 2 \xB7 3
Dragon Special 2 \xB7 6|X|.S......../.SS......./ITS....JOO/ITTX.Z.JOO/ITXXZZJJLX/IXX.ZXLLLX|1|Dragon Special 2
Flamingo DT 2 \xB7 1|T|...Z....../L.ZZ....../L.Z......./LLX.IIIIOO/XXX..SSJOO/XXX.SSXJJJ|3|Flamingo DT 2
Flamingo DT 2 \xB7 2|T|...Z....../.JZZ....../.JZ......./JJX.IIIILL/XXX..SSOOL/XXX.SSXOOL|3|Flamingo DT 2
Flamingo DT 2 \xB7 3|T|......S.../......SS../......IS../OO....I.../OOXJJJI.LL/XXXZZJI..L/XXX.ZZX..L|2|Flamingo DT 2
Flamingo DT 2 \xB7 4|T|...S....../...SS...../OO.IS.Z.../OOXILZZ..J/XXXILZ...J/XXXILLX.JJ|2|Flamingo DT 2
Flamingo DT 2 \xB7 5|T|...J....../.SSJJJ...I/SSXOO...ZI/XXXOOL.ZZI/XXXLLLXZ.I|2|Flamingo DT 2
Flamingo DT 2 \xB7 6|T|...S....../...SS....Z/OO.IS...ZZ/OOXIL...ZJ/XXXIL....J/XXXILLX.JJ|1|Flamingo DT 2
Flamingo DT 2 \xB7 7|T|......S.../......SS../......IS../OO....I.../OOXJJZI.LL/XXXJZZI..L/XXXJZ.X..L|2|Flamingo DT 2
Flamingo DT 2 \xB7 8|T|...LL...../...ZL...../.JZZL...../.JZ......I/JJX......I/XXX..SSOOI/XXX.SSXOOI|2|Flamingo DT 2
Flamingo DT 2 \xB7 9|T|...Z....../..ZZ....../..Z......./.JLLL...../.JL......I/JJX......I/XXX..SSOOI/XXX.SSXOOI|2|Flamingo DT 2
Flamingo DT 2 \xB7 10|T|.JLLL...../.JLZZ....I/JJX.ZZ...I/XXX..SSOOI/XXX.SSXOOI|2|Flamingo DT 2
Flamingo DT 2 \xB7 11|T|.ZZ......./.JZZ....../.J......../JJX.IIIILL/XXX..SSOOL/XXX.SSXOOL|3|Flamingo DT 2
Flamingo DT 2 \xB7 12|T|...L....../.LLL....../OO......../OOX.IIIIZJ/XXX..SSZZJ/XXX.SSXZJJ|3|Flamingo DT 2
Mochi\u2019s Anger 2 \xB7 1|T|........LL/.........L/.ZIIIIJJ.L/ZZXXOOJ..X/ZXXXOOJX.X|2|Mochi\u2019s Anger 2
Mochi\u2019s Anger 2 \xB7 2|T|S........./SS......LL/ISZ......L/IZZ...JJ.L/IZXXOOJ..X/IXXXOOJX.X|2|Mochi\u2019s Anger 2
Mochi\u2019s Anger 2 \xB7 3|T|I........./IS......LL/ISS......L/IZS...JJ.L/ZZXXOOJ..X/ZXXXOOJX.X|2|Mochi\u2019s Anger 2
Mochi\u2019s Anger 2 \xB7 4|T|........LL/I.ZOO....L/IZZOO.SS.L/IZXXJSS..X/IXXXJJJX.X|2|Mochi\u2019s Anger 2
Mochi\u2019s Anger 2 \xB7 5|T|...JJ...../I.ZJ....OO/IZZJ.LLSOO/IZXX..LSSX/IXXX..LXSX|2|Mochi\u2019s Anger 2
Mochi\u2019s Anger 2 \xB7 6|T|.S.JJ..I../.SSJ...I.Z/OOSJ.LLIZZ/OOXX..LIZX/.XXX..LX.X|2|Mochi\u2019s Anger 2
Mochi\u2019s Anger 2 \xB7 7|T|.........I/.S.JJ....I/.SSJ.....I/OOSJ.ZZLLI/OOXX..ZZLX/.XXX...XLX|2|Mochi\u2019s Anger 2
My Fountain TSD \xB7 1|T|I........./I........./I........./I.....JJ../S....ZJ.../SSOOZZJ.LL/XSOOZXX..L/X.XX..X.XL|2|My Fountain TSD
My Fountain TSD \xB7 2|T|......S.../......SS../JJ.....S../J.....LI../J.ZZLLLIOO/X..ZZXXIOO/X.XX..XIX.|2|My Fountain TSD
Pah! DD 2 \xB7 3|T|........OO/........OO/.......LLI/........LI/.......SLI/.Z.....SSI/ZZJXX...SX/ZXJJJX.XXX|2|Pah! DD 2
Pah! DD 2 \xB7 4|T|........OO/....IIIIOO/.......LLL/.Z.....LSS/ZZJXX..SSX/ZXJJJX.XXX|2|Pah! DD 2
Pah! DD 2 \xB7 5|T|........S./........SS/.....IIIIS/.......LOO/.Z.....LOO/ZZJXX..LLX/ZXJJJX.XXX|2|Pah! DD 2
Pah! DD 2 \xB7 6|T|.........I/.........I/...SS..LLI/OOSS...ZLI/OOJXX.ZZLX/.XJJJXZXXX|2|Pah! DD 2
Pah! DD 2 \xB7 7|T|.L...JJJS./IL.....JSS/ILL....OOS/IZZXX..OOX/IXZZ.X.XXX|1|Pah! DD 2
Pah! DD 2 \xB7 8|T|..Z......./.ZZ......./.Z...JJJS./IL.....JSS/IL.....OOS/ILLXX..OOX/IX...X.XXX|1|Pah! DD 2
Pelican 3 (X+) \xB7 4|T|..ZZ....L./...ZZ...L./JJ.IIIISLL/J..OOXXSSX/JX.OOXXXSX|3|Pelican 3 (X+)
Albatross Special (X+) \xB7 8 \xB7 2|T|XXX......X/XXX.....ZX/XXXX.XXZZX/XXXXXXXZXX|1|Albatross Special (X+) \xB7 8
Albatross Special (X+) \xB7 7 \xB7 2|T|....X.XX../....XXX.../IIIIZXX.XX/XXXZZXX..X/XXXZXXX.XX|3|Albatross Special (X+) \xB7 7
Albatross Special (X+) \xB7 7 \xB7 3|T|I........./I...X.XX../I...XXX.../I...ZXX.XX/XXXZZXX..X/XXXZXXX.XX|2|Albatross Special (X+) \xB7 7
Albatross Special (X+) \xB7 2 \xB7 1|X|...J...XXX/TTTJJJXXXX/XTOO.XXXXX/X.OOXXXXXX|1|Albatross Special (X+) \xB7 2
Albatross Special (X+) \xB7 2 \xB7 2|T|....OO.XXX/.L..OOXXXX/XL...XXXXX/XLL.XXXXXX|2|Albatross Special (X+) \xB7 2
Albatross Special (X+) \xB7 2 \xB7 3|X|....OO.XXX/.L.TOOXXXX/XL.TTXXXXX/XLLTXXXXXX|1|Albatross Special (X+) \xB7 2
Albatross Special (X+) \xB7 2 \xB7 1 \xB7 1|T|...XLLLXXX/XXXXLXXXXX/X.XXXXXXXX|1|Albatross Special (X+) \xB7 2 \xB7 1
Albatross Special (X+) \xB7 2 \xB7 3 \xB7 1|T|..JJXX.XXX/.XJXXXXXXX/XXJXXXXXXX|1|Albatross Special (X+) \xB7 2 \xB7 3
3D Cannon 2 \xB7 3|T|...OO...../...OOZ..../....ZZSLLI/XJJ.ZXSSLI/XJ..XXXSLI/XJ...XXXXI/XXX.XXXXXX/XX..XXXXXX|2|3D Cannon 2
3D Cannon \xB7 1 \xB7 1|T|...LLSZZ../....LSSZZI/XJJ.LXSOOI/XJ..XXXOOI/XJ...XXXXI/XXX.XXXXXX/XX..XXXXXX|2|3D Cannon \xB7 1
3D Cannon 2 \xB7 4|T|...LLOOS../....LOOSSI/XJJ.LXZZSI/XJ..XXXZZI/XJ...XXXXI/XXX.XXXXXX/XX..XXXXXX|2|3D Cannon 2
Airin TSD Variant \xB7 1|T|I.L......Z/I.L.....ZZ/IJLL....ZX/IJJJ...OOX/XXSS...OOX/XSS...XXXX/XXXX.XXXXX/XXXXXX.XXX|2|Airin TSD Variant
Back Gassho 2 \xB7 1|T|.....JJJOO/.....SSJOO/....SSXXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho 2
Back Gassho 2 \xB7 1 \xB7 1|T|.....Z..../I...ZZ..../IL..ZXXXXX/IL...XXXXX/ILL.XXXXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho 2 \xB7 1
Back Gassho \xB7 3|T|......OOJ./.....SOOJ./.Z...SSJJL/ZZ....SLLL/ZIIII.XXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho
Back Gassho \xB7 4|T|.......JJJ/.....S.OOJ/.Z...SSOOL/ZZ....SLLL/ZIIII.XXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho
Back Gassho \xB7 6|T|......IJJJ/......IOOJ/.Z....IOOL/ZZSS..ILLL/ZSS...XXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho
Back Gassho \xB7 7|T|......ILLL/......ILOO/.Z....IJOO/ZZSS..IJJJ/ZSS...XXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho
Back Gassho \xB7 8|T|L....JJJOO/LIIIISSJOO/LL..SSXXXX/XX..XXXXXX|1|Back Gassho
Back Gassho \xB7 10|T|......IIII/......JJLL/.Z....JOOL/ZZSS..JOOL/ZSS...XXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho
Back Gassho \xB7 1 \xB7 1|T|X.....XXXX/X.X...XXXX/XXX.OOXXXX/XX..OOXXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho \xB7 1
Back Gassho \xB7 2 \xB7 1|T|X.....XXXX/X.X...XXXX/XXX.OOXXXX/XX..OOXXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho \xB7 2
Back Gassho \xB7 11|T|......JJJ./.....SLLJ./.Z...SSLOO/ZZ....SLOO/ZIIII.XXXX/XXXX...XXX/XXXXX.XXXX/XX..XXXXXX|2|Back Gassho
Back Gassho \xB7 12|T|JJOOLL..../JSOOZLIIII/JSSZZLXXXX/XXSZXXXXXX|2|Back Gassho
Castella Stacking \xB7 1|T|..L......./LLL......I/XSZZ....JI/XSSZZ...JI/XXSX...JJI/XXXXX.OOXX/XXXXX.OOXX/XXXXX.XXXX|2|Castella Stacking
Castella Stacking \xB7 2|T|.SS......./SSZ......I/XZZ.....JI/XZLLL...JI/XXLX...JJI/XXXXX.OOXX/XXXXX.OOXX/XXXXX.XXXX|2|Castella Stacking
Center DT Cannon \xB7 1|T|.......OO./.....LLOO./I.....LZZ./IJJSS.LXZZ/IJSS..XXXX/IJXX...XXX/XXXXX.XXXX/XXXXX.XXXX|2|Center DT Cannon
Center DT Cannon \xB7 2|T|........Z./.....LLZZ./I.....LZOO/IJJSS.LXOO/IJSS..XXXX/IJXX...XXX/XXXXX.XXXX/XXXXX.XXXX|2|Center DT Cannon
Center DT Cannon 2 \xB7 1|T|......IIII/.....LLJJJ/......LZZJ/...SS.LXZZ/OOSS..XXXX/OOXX...XXX/XXXXX.XXXX/XXXXX.XXXX|2|Center DT Cannon 2
CT Scan Stacking 3 \xB7 2|T|..LLOO..../...LOO.SSI/JJ.LXXSSXI/J..XXXXXXI/J...ZXXXXI/XX.ZZXXXXX/XX.ZXXXXXX|2|CT Scan Stacking 3
DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1|T|..XX....../...XXX...I/XX.XXXXXXI/X..XXXXXXI/X...XXXXXI/XX.XXXXXXX/XX.XXXXXXX|3|DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1
DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 2|T|.........Z/..XX....ZZ/...X..SSZI/XX.XXSSOOI/X..XXXXOOI/X...XXXXXI/XX.XXXXXXX/XX.XXXXXXX|3|DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1
DT Cannon 3 (X+) \xB7 6|T|..LLS..Z../...LSSZZ.I/JJ.LXSZOOI/J..XXXXOOI/J...XXXXXI/XX.XXXXXXX/XX.XXXXXXX|2|DT Cannon 3 (X+)
DT Cannon 3 (X+) \xB7 7|T|..LLS.OO../...LSSOO.I/JJ.LXSZZ.I/J..XXXXZZI/J...XXXXXI/XX.XXXXXXX/XX.XXXXXXX|2|DT Cannon 3 (X+)
DT Cannon 3 (X+) \xB7 8|T|.....S..../..LL.SS.../...LZZS..I/JJ.LXZZOOI/J..XXXXOOI/J...XXXXXI/XX.XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+)
DT Cannon 3 (X+) \xB7 9|T|..LL....SS/...LZZ.SSI/JJ.LXZZOOI/J..XXXXOOI/J...XXXXXI/XX.XXXXXXX/XX.XXXXXXX|2|DT Cannon 3 (X+)
DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1|T|.....SSX../..XXSSXXXX/...XXXXXXX/XX.XXXXXXX/X..XXXXXXX/X...XXXXXX/XX.XXXXXXX/XX.XXXXXXX|3|DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1
DT Cannon 3 (X+) \xB7 9 \xB7 1|T|....IIIIOO/.....SSZOO/..XXSSZZXX/...XXXZXXX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 9
DT Cannon 3 (X+) \xB7 6 \xB7 1|T|....IIIISS/.....OOSSZ/..XXXOOXZZ/...XXXXXZX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 6
DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 2 \xB7 2|T|.......SSX/ZZXXOOSSXX/.ZZXOOXXXX|1|DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 2
DT Cannon 3 (X+) \xB7 7 \xB7 1|T|....S.OOLL/....SSOOIL/..XXXSXXIL/...XXXXXIX/XX.XXXXXIX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 7
DT Cannon 3 (X+) \xB7 6 \xB7 2|T|...IIII.../..OOSLL.../..OOSSL..Z/..XXXSLXZZ/...XXXXXZX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 6
DT Cannon 3 (X+) \xB7 6 \xB7 3|T|.......LL./........LI/..ZZ...SLI/...ZZOOSSI/..XXXOOXSI/...XXXXX.X/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 6
DT Cannon 3 (X+) \xB7 8 \xB7 3|T|.....SS.OO/....SS..OO/..JJJX...Z/..XXJXX.ZZ/...XXXX.ZX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 8
DT Cannon 3 (X+) \xB7 8 \xB7 4|T|...IIIIZOO/....JJZZOO/....JXZLLL/..XXJXXLSS/...XXXXSSX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 8
DT Cannon 3 (X+) \xB7 8 \xB7 5|T|.....SS.OO/I...SS..OO/ILJJJX...Z/ILXXJXX.ZZ/ILLXXXX.ZX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 8
DT Cannon 3 (X+) \xB7 9 \xB7 2|T|...IIIIZ../..OOJJZZ../..OOJSZLLL/..XXJSSLXX/...XXXSXXX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 9
DT Cannon 3 (X+) \xB7 9 \xB7 6|T|....SJJJOO/....SSIJOO/...ZZSILLL/..XXZZILXX/...XXXIXXX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 9
DT Cannon 3 (X+) \xB7 6 \xB7 4|T|...LLI..../..OOLIJJSS/..OOLIJSSZ/..XXXIJXZZ/...XXXXXZX/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 6
DT Cannon 3 (X+) \xB7 8 \xB7 6|T|....OOI.LL/....OOI..L/....JJI.SL/....JXI.SS/..XXJXX..S/...XXXX..X/XX.XXXXXXX/X..XXXXXXX/XX.XXXXXXX|3|DT Cannon 3 (X+) \xB7 8
DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 2 \xB7 2 \xB7 1|T|LLLIIIIXXX/LXXXXXXXXX|2|DT Cannon 2 (X+) \xB7 1 \xB7 1 \xB7 1 \xB7 2 \xB7 2
DT Cannon 3 (X+) \xB7 6 \xB7 2 \xB7 1|T|...XXXX.../..XXXXX.../..XXXXX..X/J.XXXXXXXX/JJJXXXXXXX|1|DT Cannon 3 (X+) \xB7 6 \xB7 2
Ginzan\u2019s Imperial Cross Opener 2 \xB7 1|T|X..XX.S.../X...XXSSXX/XX.XXXXSXX|2|Ginzan\u2019s Imperial Cross Opener 2
Ginzan\u2019s Imperial Cross Opener \xB7 1 \xB7 1|T|ZZ......../SZZ......./SS......../XS.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener \xB7 1
Ginzan\u2019s Imperial Cross Opener 5 \xB7 1 \xB7 1 \xB7 1 \xB7 1|T|........XX/ZZ.....XXX/XZZ....XXX/XX....XXXX/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 5 \xB7 1 \xB7 1 \xB7 1
Ginzan\u2019s Imperial Cross Opener 5 \xB7 2|T|ZZ....JJSS/XZZ...JSSL/XX....JLLL/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 5
Ginzan\u2019s Imperial Cross Opener 5 \xB7 2 \xB7 1|T|XX....XXXX/XXX...XXXX/XXIIIIXXXX/XXX.XXXXXX|1|Ginzan\u2019s Imperial Cross Opener 5 \xB7 2
Ginzan\u2019s Imperial Cross Opener 5 \xB7 2 \xB7 2|T|XXIIIIXXXX/XXX...XXXX/XX....XXXX/XXX.XXXXXX|1|Ginzan\u2019s Imperial Cross Opener 5 \xB7 2
Ginzan\u2019s Imperial Cross Opener 2 \xB7 1 \xB7 2 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1|T|.......XX./.......XXX/........XX/XXXIIII.XX/XXXXXX...X/XXXXXXX.XX|2|Ginzan\u2019s Imperial Cross Opener 2 \xB7 1 \xB7 2 \xB7 1 \xB7 1 \xB7 1 \xB7 1 \xB7 1
Ginzan\u2019s Imperial Cross Opener 5 \xB7 3|T|.Z......../ZZ.......I/ZOO..JJSSI/XOO..JSSLI/XX...JLLLI/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 5
Ginzan\u2019s Imperial Cross Opener 5 \xB7 4|T|.Z......../ZZ....JJJI/ZOO...LSJI/XOO...LSSI/XX....LLSI/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 5
Ginzan\u2019s Imperial Cross Opener 5 \xB7 5|T|.Z......../ZZ...LL..I/ZOO...LS.I/XOO..JLSSI/XX...JJJSI/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 5
Ginzan\u2019s Imperial Cross Opener 5 \xB7 6|T|OO....JJZI/OOSS..JZZI/XSS...JZLI/XX....LLLI/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 5
Ginzan\u2019s Imperial Cross Opener 6 \xB7 4|T|.Z......../ZZ....IIII/ZOO...JJSS/XOO...JSSL/XX....JLLL/XX.XXXXXXX/X...XXXXXX/XX.XXXXXXX|2|Ginzan\u2019s Imperial Cross Opener 6
Jizou TSD \xB7 1|T|OO....S.../OO....SS../XJJ...IS../XJ....IXLL/XJ.ZZ.IXXL/XX..ZZIXXL/XX.XXXXXXX/XXXX.XXXXX|2|Jizou TSD
Partial bag 1 [speerde-stacking] 2 \xB7 3|T|I........./I.......OO/ILLL...JOO/ILSS...JJJ/XSS...ZXXX/XXXX.ZZXXX/XXXXXZ.XXX/XXXXXX.XXX|2|Partial bag 1 [speerde-stacking] 2
Partial bag 1 [speerde-stacking] 2 \xB7 4|T|I........./I.......SS/IJJJ...SSL/IOOJ...LLL/XOO...ZXXX/XXXX.ZZXXX/XXXXXZ.XXX/XXXXXX.XXX|2|Partial bag 1 [speerde-stacking] 2
Partial bag 1 [speerde-stacking] 2 \xB7 5|T|IJJ......./IJS......./IJSS.....L/IOOS...LLL/XOO...ZXXX/XXXX.ZZXXX/XXXXXZ.XXX/XXXXXX.XXX|2|Partial bag 1 [speerde-stacking] 2
Partial bag 1 [speerde-stacking] 2 \xB7 6|T|.........I/LOO.....JI/LOO.....JI/LLSS...JJI/XSS...ZXXX/XXXX.ZZXXX/XXXXXZ.XXX/XXXXXX.XXX|2|Partial bag 1 [speerde-stacking] 2
Partial bag 1 [speerde-stacking] 2 \xB7 7|T|L........./L........I/LL......JI/OO......JI/OOSS...JJI/XSS...ZXXX/XXXX.ZZXXX/XXXXXZ.XXX/XXXXXX.XXX|2|Partial bag 1 [speerde-stacking] 2
Toro DTD \xB7 1|T|XXXX.IJJJX/XXX..IXXJX/XXXX.IXXXX/XXXXXIXXXX|1|Toro DTD
Toro DTD \xB7 2|T|.L.......I/.L.......I/JLLOO....I/JJJOO..S.I/XXXX...SSX/XXXZZ.XXSX/XXXXZZXXXX/XXXXX.XXXX|1|Toro DTD
Toro DTD 2 \xB7 1|T|.J.......I/.J.......I/JJLOO....I/LLLOO..S.I/XXXX...SSX/XXXZZ.XXSX/XXXXZZXXXX/XXXXX.XXXX|2|Toro DTD 2
Anytime PC \xB7 2|T|.......L../.......L.I/.......LLI/JJ.....OOI/J....SSOOI/J.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Anytime PC \xB7 3|T|.........I/......LLLI/JJ....LOOI/J....SSOOI/J.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Anytime PC \xB7 4|T|OO......../OO......../JJ...IIIIL/J....SSLLL/J.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Anytime PC \xB7 5|T|LL......../IL......../IL...JJJOO/I....SSJOO/I.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Anytime PC \xB7 6|T|.......OO./.......OO./JJ...IIIIL/J....SSLLL/J.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Anytime PC \xB7 7|T|........I./........I./......OOI./JJ....OOIL/J....SSLLL/J.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Anytime PC \xB7 8|T|OO......../OO......../LL......../IL......../IL...JJJ../I....SSJ../I.ZZSSXXXX/X..ZZXXXXX/X.XXXXXXXX/XXXX.XXXXX|3|Anytime PC
Bogus TST \xB7 1|T|.....SS.../....SSZ.../...OOZZ.../...OOZ..../JJXXXX.LLI/JXXXXX..LI/JXXXXX.XLI/...XXXXXXI/...XXXXXXX|3|Bogus TST
Bogus TST \xB7 2|T|....ZZ..../...OOZZ.../...OOSS.../....SS..../JJXXXX.LLI/JXXXXX..LI/JXXXXX.XLI/...XXXXXXI/...XXXXXXX|3|Bogus TST
Bt\u2026TD Attack \xB7 1|T|IJJ......./IJOO....../IJOO....S./IXX.....SS/XXXXZZ...S/XXXXXZZ.LX/XXXXXXLLLX/XXXXXXX.XX|1|Bt\u2026TD Attack
Bt\u2026TD Attack 2 \xB7 2|T|I........./IOO....LL./IOOS....L./IXXSSJJ.LZ/XXXXSJ..ZZ/XXXXXJ..ZX/XXXXXX...X/XXXXXXX.XX|2|Bt\u2026TD Attack 2
Bt\u2026TD Attack \xB7 2|T|JJSS....../JSSOO...LL/JXXOO....L/XXXXIIII.L/XXXXXZZ..X/XXXXXXZZ.X/XXXXXXX.XX|3|Bt\u2026TD Attack
Buddha Stacking \xB7 1|T|I.......OO/I.Z.....OO/IZZ.....LL/IZXJ.....L/XXXJJJSS.L/XXXXXSS..X/XXXXXXXX.X/XXXXXXX.XX|3|Buddha Stacking
Buddha Stacking \xB7 2|T|I........./I.Z......./IZZ.OO..LL/IZXJOO...L/XXXJJJSS.L/XXXXXSS..X/XXXXXXXX.X/XXXXXXX.XX|3|Buddha Stacking
Buddha Stacking \xB7 3|T|I.......OO/I.......OO/I...ZJ..LL/I.XZZJ...L/XXXZJJSS.L/XXXXXSS..X/XXXXXXXX.X/XXXXXXX.XX|3|Buddha Stacking
Buddha Stacking \xB7 4|T|I........./I........./I........./IZZ......./OOZZ....LL/OOXJ.....L/XXXJJJSS.L/XXXXXSS..X/XXXXXXXX.X/XXXXXXX.XX|3|Buddha Stacking
Bulldozer 2 \xB7 1|T|...SS...../..SSZ...LL/.OOZZ...JL/.OOZ....JL/IXXX.XXJJX/IXXX..XXXX/IXXX.XXXXX/IXXXXX..XX|3|Bulldozer 2
Bulldozer 2 \xB7 2|T|...OO...../..ZOO...LL/.ZZSS...JL/.ZSS....JL/IXXX.XXJJX/IXXX..XXXX/IXXX.XXXXX/IXXXXX..XX|3|Bulldozer 2
Bulldozer \xB7 1|T|...SS...../..SSZ...LL/.OOZZ...JL/.OOZ....JL/IXXX.XXJJX/IXXX..XXXX/IXXX.XXXXX/IXXXXX..XX|3|Bulldozer
Cereal Stacking \xB7 5|T|....OO..../I...OO..../IJJ.SS..L./IJXSS...L./IJXXX.ZZLL/XXXXX..ZZX/XXXXX.XXXX/XXXXXX.XXX|3|Cereal Stacking
Cereal Stacking \xB7 6|T|....S...../I...SS..../IJJOOS..L./IJXOO...L./IJXXX.ZZLL/XXXXX..ZZX/XXXXX.XXXX/XXXXXX.XXX|3|Cereal Stacking
Cereal Stacking \xB7 7|T|.........I/J........I/JJJ.SS..LI/OOXSS...LI/OOXXX.ZZLL/XXXXX..ZZX/XXXXX.XXXX/XXXXXX.XXX|3|Cereal Stacking
Cereal Stacking 2 \xB7 1|T|....S...../I...SS..../IJJOOS..L./IJXOO...L./IJXXX.ZZLL/XXXXX..ZZX/XXXXX.XXXX/XXXXXX.XXX|3|Cereal Stacking 2
\u30C1\u30FC\u30BA\u7A4D\u307F 2 \xB7 2|T|L........./L........./LL..ZZ..../XX...ZZOOI/XXSS.XXOOI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 2
\u30C1\u30FC\u30BA\u7A4D\u307F 2 \xB7 4|T|L...OO..../L...OO..../LL..ZZ..J./XX...ZZ.JI/XXSS.XXJJI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 2
\u30C1\u30FC\u30BA\u7A4D\u307F 2 \xB7 1 \xB7 1|T|X........./X......J../XX..XX.JJJ/XX...XXXXX/XXXX.XXXXX/XXX..XXXXX/XXXX.XXXXX/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 2 \xB7 1
\u30C1\u30FC\u30BA\u7A4D\u307F 3 \xB7 1|T|L........J/L........J/LL..ZZ..JJ/XX...ZZOOI/XXSS.XXOOI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 3
\u30C1\u30FC\u30BA\u7A4D\u307F 3 \xB7 2|T|L........./L...JJJ.../LL..ZZJ.../XX...ZZOOI/XXSS.XXOOI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 3
\u30C1\u30FC\u30BA\u7A4D\u307F 3 \xB7 3|T|L........./L.....J.../LL..ZZJJJ./XX...ZZOOI/XXSS.XXOOI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 3
\u30C1\u30FC\u30BA\u7A4D\u307F 3 \xB7 4|T|OO......../OO..ZZLLJJ/XX...ZZLJI/XXSS.XXLJI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 3
\u30C1\u30FC\u30BA\u7A4D\u307F 3 \xB7 5|T|L...OO..../L...OO..../LL..ZZ..J./XX...ZZ.JI/XXSS.XXJJI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 3
\u30C1\u30FC\u30BA\u7A4D\u307F 3 \xB7 6|T|L........./L.....ZZ../LL..JJJZZ./XX....JOOI/XXSS.XXOOI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 3
\u30C1\u30FC\u30BA\u7A4D\u307F 2 \xB7 8|T|.J......../.J......L./JJ..ZZLLL./XX...ZZOOI/XXSS.XXOOI/XSS..XXXXI/XXXX.XXXXI/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 2
\u30C1\u30FC\u30BA\u7A4D\u307F 2 \xB7 9|T|.J......../.J.....I../JJ..ZZ.IOO/XX...ZZIOO/XXSS.XXILL/XSS..XXXXL/XXXX.XXXXL/XXX.XXXXXX|3|\u30C1\u30FC\u30BA\u7A4D\u307F 2
Chikeekeke \xB7 5|T|.......JJJ/.......OOJ/S..Z...OOI/SSZZ....XI/XSZXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Chikeekeke \xB7 6|T|OO......../OO......SS/JJJ....SSI/ZZJ.....XI/XZZXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Chikeekeke \xB7 8|T|JJ......../JS.....OO./JSS....OOI/ZZS.....XI/XZZXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Chikeekeke \xB7 12|T|JJZ....OO./JZZ....OOI/JZSS....XI/XSSXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Chikeekeke \xB7 13|T|..JJJ...SS/..ZZJ..SSI/.OOZZ...XI/XOOXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Chikeekeke \xB7 14|T|JJJ......./OOJ.....SS/OO.....SSI/ZZ......XI/XZZXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Chikeekeke \xB7 18|T|........J./.OO.....J./SOOZ...JJI/SSZZ....XI/XSZXLLL.XI/XXXXLX..XI/XXXXXXX.XX/XXXXXX.XXX|3|Chikeekeke
Diorama TD \xB7 1|T|........S./........SS/.........S/........OO/JJ..L.I.OO/J...L.I.XX/J.ZZLLIXXX/X..ZZXIXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 2|T|LL......../IL....S.OO/IL....SSOO/I......SXX/I.ZZJJJXXX/X..ZZXJXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 4|T|LL.....S../IL.....SS./IL....OOS./I.....OOXX/I.ZZJJJXXX/X..ZZXJXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 5|T|LL......../IL......OO/IL..JJ..OO/I...JS..XX/I.ZZJSSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 7|T|OO......../OO..I...../JJ..I..LLL/J...IS.LXX/J.ZZISSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 8|T|........OO/....I...OO/JJ..I..LLL/J...IS.LXX/J.ZZISSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 9|T|OO......LL/OO..I....L/JJ..I....L/J...IS..XX/J.ZZISSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 11|T|OO......L./OO..I...L./JJ..I...LL/J...IS..XX/J.ZZISSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 13|T|....LL..../....IL..OO/JJ..IL..OO/J...IS..XX/J.ZZISSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 16|T|....LLL.../....LSS.../JJ..SSI.../J...OOI.XX/J.ZZOOIXXX/X..ZZXIXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 17|T|LL......../IL...OO.../IL...OOSS./I.....SSXX/I.ZZJJJXXX/X..ZZXJXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 18|T|LL.....OO./IL.....OO./IL.....SS./I.....SSXX/I.ZZJJJXXX/X..ZZXJXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 20|T|LL..OO..../IL..OO..../IL..JJ..../I...JS..XX/I.ZZJSSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 22|T|OO..LL..../OO..IL..../JJ..IL..../J...IS..XX/J.ZZISSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 25|T|.....SS.../JJ..SSILLL/J...OOILXX/J.ZZOOIXXX/X..ZZXIXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 26|T|LL......../IL......../IL..JJOO../I...JSOOXX/I.ZZJSSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 27|T|LL......../IL......../IL..OO.SS./I...OOSSXX/I.ZZJJJXXX/X..ZZXJXXX/X.XXXXXXXX/XX.XXXXXXX|3|Diorama TD
Diorama TD \xB7 28|T|.........I/.........I/........LI/........LI/JJ....OOLL/J....SOOXX/J.ZZ.SSXXX/X..ZZXSXXX/X.XXXXXXXX/XX.XXXXXXX|2|Diorama TD
\u30B8\u30AA\u30E9\u30DETD v3 \xB7 1|T|.....I..../...X.I..../XX.XXI...X/XXXXXIXXXX/XXXXXX.XXX|1|\u30B8\u30AA\u30E9\u30DETD v3
Double Sided Cannon \xB7 1|T|OO.......I/OO.......I/X....ZZLLI/X.....ZZLI/XJJSS.XXLX/XJSS..XXXX/XJXXX.XXXX/XXXX.XXXXX|3|Double Sided Cannon
Double Sided Cannon \xB7 2|T|S........I/SS.....OOI/XS.....OOI/X.....JJJI/X.ZZLLXXJX/X..ZZLXXXX/X.XXXLXXXX/XXXX.XXXXX|3|Double Sided Cannon
Double Sided Cannon \xB7 3|T|.......OOI/.......OOI/X....ZZLLI/X.....ZZLI/XJJSS.XXLX/XJSS..XXXX/XJXXX.XXXX/XXXX.XXXXX|3|Double Sided Cannon
Failed TST \xB7 2|T|........LL/IS.....OOL/ISS....OOL/IXS...JXXX/IX....JXXX/XX.ZZJJXXX/XX..ZZXXXX/XX.XXXXXXX|3|Failed TST
Gamushiro Stacking (X+) \xB7 2|T|I.......OO/I.......OO/IJJ.....LL/IJ....SSLL/XJ.ZZSSXLL/XX..ZZXXLL/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 3|T|IOO......./IOO......./IJJ.....LL/IJ....SSLL/XJ.ZZSSXLL/XX..ZZXXLL/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 4|T|OOJ......./OOJ......./SJJ..L...I/SS...L.LLI/XS.ZZLLXLI/XX..ZZXXLI/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 5|T|LLL......./LOO......./SOO...J..I/SS....JLLI/XS.ZZJJXLI/XX..ZZXXLI/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 6|T|I........./I.......SS/IJJ..L.SSL/IJ...L.LLL/XJ.ZZLLXOO/XX..ZZXXOO/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 7|T|I........./I.....LS../IJJ..LLSS./IJ...LLLS./XJ.ZZLLXOO/XX..ZZXXOO/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 8|T|I........./I.....OO../IJJ...OOLL/IJ....SSLL/XJ.ZZSSXLL/XX..ZZXXLL/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 9|T|I........./I......LS./IJJ..L.LSS/IJ...L.LLS/XJ.ZZLLXOO/XX..ZZXXOO/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 12|T|........L./......LLL./.......OOI/.JJ....OOI/.J....SSLI/XJ.ZZSSXLI/XX..ZZXXLL/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 13|T|.........L/.......LLL/.......OOI/.JJ....OOI/.J....SSLI/XJ.ZZSSXLI/XX..ZZXXLL/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 1 \xB7 1|T|......OO../......OOLI/.JJ...LLLI/.J....SSXI/XJ.ZZSSXXI/XX..ZZXXXX/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 1
Gamushiro Stacking (X+) \xB7 1 \xB7 2|T|LLL....OOI/LJJ....OOI/.J....SSXI/XJ.ZZSSXXI/XX..ZZXXXX/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 1
Gamushiro Stacking (X+) \xB7 1 \xB7 3|T|JJJ....OOI/LLJ....OOI/.L....SSXI/XL.ZZSSXXI/XX..ZZXXXX/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 1
Gamushiro Stacking (X+) \xB7 14|T|I.......LL/I.......LL/IJJ.....LL/IJ....SSLL/XJ.ZZSSXOO/XX..ZZXXOO/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+)
Gamushiro Stacking (X+) \xB7 1 \xB7 4|T|.......LL./........L./........L./.......OOI/.JJ....OOI/.J....SSXI/XJ.ZZSSXXI/XX..ZZXXXX/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 1
Gamushiro Stacking (X+) \xB7 1 \xB7 5|T|.......L../.......L../.......LL./.......OOI/.JJ....OOI/.J....SSXI/XJ.ZZSSXXI/XX..ZZXXXX/XX.XXXXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 1
Gamushiro Stacking (X+) \xB7 2 \xB7 1|T|X.....LLXX/X.....ZLXX/XXX..ZZLXX/XX...ZXXXX/XXX.XXXXXX|2|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 2 \xB7 2|T|.......JJJ/ZZ.....SSJ/XZZL..SSXX/XLLL..OOXX/XXX...OOXX/XX....XXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 2 \xB7 1 \xB7 1|T|XJIIIIXXXX/XJJJSSXXXX/XXXSSXXXXX|1|Gamushiro Stacking (X+) \xB7 2 \xB7 1
Gamushiro Stacking (X+) \xB7 2 \xB7 3|T|.........I/.........I/........LI/.....SLLLI/X..ZZSSJXX/X...ZZSJXX/XXX.OOJJXX/XX..OOXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 2 \xB7 4|T|I........./I........./I........L/I....ZZLLL/X..JJJZZXX/X...SJOOXX/XXX.SSOOXX/XX...SXXXX/XXX.XXXXXX|2|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 2 \xB7 5|T|ZZ.....SLL/JZZ....SSL/JJJ....ISL/XOO....IXX/XOO....IXX/XXX....IXX/XX....XXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 2 \xB7 6|T|LS.....JJJ/LSS....ZZJ/LLS....IZZ/XOO....IXX/XOO....IXX/XXX....IXX/XX....XXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 2 \xB7 7|T|ZZ.....LLL/SZZ....LOO/SSJ....IOO/XSJ....IXX/XJJ....IXX/XXX....IXX/XX....XXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 1 \xB7 5 \xB7 1|T|.......JJJ/.......XSJ/.......XSS/I..ZZLLXXS/I...ZZLXXX/IXX.OOLXXX/IX..OOXXXX/XXX.XXXXXX|3|Gamushiro Stacking (X+) \xB7 1 \xB7 5
Gamushiro Stacking (X+) \xB7 1 \xB7 5 \xB7 2|T|.......LLI/.......XLI/.S...OOXLI/.SS..OOXXI/JJS...ZXXX/JXX..ZZXXX/JX...ZXXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 1 \xB7 5
Gamushiro Stacking (X+) \xB7 1 \xB7 4 \xB7 1 \xB7 1 \xB7 1|T|.....XXX.X/.....XXXXX/OO....XXXX/OO.....XXX/XX....XXXX/XXX..XXXXX/XX...XXXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 1 \xB7 4 \xB7 1 \xB7 1
Gamushiro Stacking (X+) \xB7 2 \xB7 8|T|.......JJJ/ZZ.....SSJ/XZZL.ISSXX/XLLL.IOOXX/XXX..IOOXX/XX...IXXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 2
Gamushiro Stacking (X+) \xB7 12 \xB7 1|T|.......OOI/.......OOI/.S...LLLXI/.SS..LXXXI/JJS...ZXXX/JXX..ZZXXX/JX...ZXXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 12
Gamushiro Stacking (X+) \xB7 8 \xB7 1|T|.....IIIIL/.....ZZLLL/X..JJJZZOO/X...SJXXOO/XXX.SSXXXX/XX...SXXXX/XXX.XXXXXX|2|Gamushiro Stacking (X+) \xB7 8
Gamushiro Stacking (X+) \xB7 12 \xB7 2|T|S.....OOLL/SSJ...OOXL/ISJ...XXXL/IJJ...ZXXX/IXX..ZZXXX/IX...ZXXXX/XXX.XXXXXX|1|Gamushiro Stacking (X+) \xB7 12
Hardtack Stacking \xB7 1 \xB7 1|T|.ZZ......I/OOZZ..LL.I/OOSS...LJI/XSSXXX.LJI/XXXXX..JJX/XXXXXX.XXX/XXXXX.XXXX|3|Hardtack Stacking \xB7 1
Hardtack Stacking \xB7 2 \xB7 2|T|.SS...J.../SSOO..JJJ./ZZOO...LLI/XZZXXX.XLI/XXXXX..XLI/XXXXXX.XXI/XXXXX.XXXX|3|Hardtack Stacking \xB7 2
HDTKI \xB7 3|T|S.......OO/SS......OO/JSZZ....LL/JJJZZ....L/XXXXIIII.L/XXXXXXX..X/XXXXXXXX.X/XXXXX...XX|3|HDTKI
HDTKI 2 \xB7 1|T|S.......OO/SS......OO/JSZZ....LL/JJJZZ....L/XXXXIIII.L/XXXXXXX..X/XXXXXXXX.X/XXXXX...XX|3|HDTKI 2
HDTKI 2 \xB7 2|T|........OO/..SSZ...OO/JSSZZ...LL/JJJZ.....L/XXXXIIII.L/XXXXXXX..X/XXXXXXXX.X/XXXXX...XX|3|HDTKI 2
HDTKI 2 \xB7 3|T|...SS...../JJSSZ...../JOOZZ...LL/JOOZ.....L/XXXXIIII.L/XXXXXXX..X/XXXXXXXX.X/XXXXX...XX|3|HDTKI 2
HDTKI 2 \xB7 4|T|..OO....../.ZOOJ...../ZZSSJ...LL/ZSSJJ....L/XXXXIIII.L/XXXXXXX..X/XXXXXXXX.X/XXXXX...XX|3|HDTKI 2
Honey Cup \xB7 1|T|IIII....../JJSS..OO../JSS...OOLJ/JXX.ZZLLLJ/XXX..ZZXJJ/XXX.XXXXXX/XXXX.XXXXX|3|Honey Cup
Honey Cup \xB7 5|T|.......LL./JJSS..OOLI/JSS...OOLI/JXX.ZZJJJI/XXX..ZZXJI/XXX.XXXXXX/XXXX.XXXXX|3|Honey Cup
Honey Cup \xB7 1 \xB7 1|T|IIII....../XXXX....../XXXX..XX../XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 1 \xB7 3|T|..SS....LL/.SSZ....IL/OOZZ....IL/OOZ.....IJ/XXXX....IJ/XXXX..XXJJ/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 1 \xB7 4|T|..OO....JJ/.ZOO....JI/ZZSS....JI/ZSS.....LI/XXXX....LI/XXXX..XXLL/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 1 \xB7 5|T|........LL/.Z......IL/ZZSS....IL/ZSS...OOIJ/XXXX..OOIJ/XXXX..XXJJ/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 1 \xB7 6|T|........JJ/.Z......JI/ZZSS....JI/ZSS...OOLI/XXXX..OOLI/XXXX..XXLL/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 1 \xB7 7|T|I........./IJJJ....../IOOJ....../IOO....SLL/XXXX...SSL/XXXX..XXSL/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 1 \xB7 8|T|I........./IJJZ....../IJZZ....../IJZ....LLL/XXXX...LOO/XXXX..XXOO/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
Honey Cup \xB7 5 \xB7 2|T|ILLL....../ILZJ..OOS./IZZJ..OOSS/IZJJ...XXS/XXXX..XXXX/XXX...XXXX/XXXX.XXXXX|1|Honey Cup \xB7 5
Honey Cup \xB7 1 \xB7 8 \xB7 1|T|X........./XXXX....../XXXX....../XXX....XXX/XXXX.SSXXX/XXXXSSXXXX|1|Honey Cup \xB7 1 \xB7 8
Honey Cup \xB7 1 \xB7 9|T|I........./ILLL....../ILSS....../ISS...ZOOJ/XXXX.ZZOOJ/XXXX.ZXXJJ/XXX...XXXX/XXXX.XXXXX|2|Honey Cup \xB7 1
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 3|T|LLLL....../LLJJ....../LLJ....SS./XXJ.ZZSSOO/XXX..ZZXOO/XXX.XXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 4|X|LJJJ....../LLLJ....../LLL....SS./XXLTZZSSOO/XXXTTZZXOO/XXXTXXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 5|T|LL.......I/LL.......I/LLJJ.....I/LLJ....SSI/XXJ.ZZSSOO/XXX..ZZXOO/XXX.XXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 8|T|IIII....../LLLL....../LLJJ....../LLJ....SS./XXJ.ZZSSOO/XXX..ZZXOO/XXX.XXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11|X|JJOO....../JSOO..L..I/JSS...LLLI/XXSTZZLLLI/XXXTTZZXLI/XXXTXXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12|X|.SS......./SS......../OOJJ..L..I/OOJ...LLLI/XXJTZZLLLI/XXXTTZZXLI/XXXTXXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 13|X|........SS/IIII..LSSL/JJJ...LLLL/XXJTZZLLOO/XXXTTZZXOO/XXXTXXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 4 \xB7 1|T|XXXXI...../XXXXI...../XXX.I..XX./XXXXIXXXXX|1|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 4
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 2 \xB7 1|T|........SS/OOJJ..XSSI/OOJ...XLLI/XXJ.ZZXXLI/XXX..ZZXLI/XXX.XXXXXX/XXXX.XXXXX|3|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 2
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 3 \xB7 1|T|XXXXI...../XXXXI...../XXX.I..XX./XXXXIXXXXX|1|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 3
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11 \xB7 1|T|.J......../.J......../JJL....SS./LLL...SSOO/XXXX..ZZOO/XXXX..XZZX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11 \xB7 2|T|.L......../.L......../JLL....SS./JJJ...SSOO/XXXX..ZZOO/XXXX..XZZX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12 \xB7 2|T|IOO......./IOOL....../ILLL....../IXXSS..JJZ/XXSS...JZZ/XXXX..XJZX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 13 \xB7 2|T|.........I/.........I/.........I/LLLJ...ZZI/LSSJ..OOZZ/SSJJ..OOXX/XXXX..XXXX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 13
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12 \xB7 3|T|.........I/.........I/.........I/LLLJ...ZSI/LXXJ..ZZSS/XXJJ..ZOOS/XXXX..XOOX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11 \xB7 3|T|.........I/.J.......I/.J.......I/JJL....ZSI/LLL...ZZSS/XXXX..ZOOS/XXXX..XOOX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 11
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12 \xB7 4|T|IZZ......./IJZZ....../IJJJ....../IXXSS..LOO/XXSS...LOO/XXXX..XLLX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12
\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12 \xB7 5|T|.........I/.........I/.........I/LLLJ...OOI/LXXJ..SOOZ/XXJJ..SSZZ/XXXX..XSZX/XXX...XXXX/XXXX.XXXXX|2|\u5C71\u5CB3\u7A4D\u307F2\u53F7 \xB7 12
Izu TST \xB7 1|T|JJ......OO/JL......OO/JL......XX/XLLSS....X/XXSSIIII.X/XXXXXZZ..X/XXXXXXZZ.X/XXXXXX..XX|3|Izu TST
Lion Stacking \xB7 1|T|.S......LL/.SS....OOL/.XS....OOL/.X.....ZXX/IX.JJJZZXX/IX..XJZXXX/IX.XXXXXXX/IXXXX.XXXX|3|Lion Stacking
Luck TST \xB7 2|T|........ZJ/.......ZZJ/OOS....ZJJ/OOSS..LLXX/XXXS...LXX/XXIIII.LXX/XXXXX..XXX/XXXXXX.XXX|3|Luck TST
Luck TST \xB7 3|T|.......JJJ/.......ZZJ/OOS.....ZZ/OOSS..LLXX/XXXS...LXX/XXIIII.LXX/XXXXX..XXX/XXXXXX.XXX|3|Luck TST
Luck TST \xB7 4|T|........S./JJ....ZZSS/JOO....ZZS/JOO...LLXX/XXX....LXX/XXIIII.LXX/XXXXX..XXX/XXXXXX.XXX|3|Luck TST
Mismatch TD (Edge) \xB7 1|T|....LOOS../JJ..LOOSS./J...LLXXS./J.ZZXXXXXI/X..ZZXXXXI/X.XXXXXXXI/XX.XXXXXXI|3|Mismatch TD (Edge)
Mismatch TD (Edge) \xB7 2|T|.....SLL../.....SSL../JJ..OOSL../J...OOXX../J.ZZXXXXXI/X..ZZXXXXI/X.XXXXXXXI/XX.XXXXXXI|3|Mismatch TD (Edge)
Mismatch TD (Edge) \xB7 4|T|OO......../OO..LLL.../JJ..LSS.../J...SSXX../J.ZZXXXXXI/X..ZZXXXXI/X.XXXXXXXI/XX.XXXXXXI|3|Mismatch TD (Edge)
Mismatch TD (Edge) \xB7 5|T|OO......../OO.....SLL/JJ.....SSL/J.....XXSL/J.ZZXXXXXI/X..ZZXXXXI/X.XXXXXXXI/XX.XXXXXXI|3|Mismatch TD (Edge)
New Moon Stacking \xB7 9|T|......LOO./......LOO./..SS..LLZ./ISSJ...ZZ./IXXJJJ.ZXX/IXXXX..XXX/IXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking
New Moon Stacking \xB7 3 \xB7 1|T|L........./L.....XX../LLXX..XXX./XXXX...XX./XXXXXX.XXX/XXXXX..XXX/XXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking \xB7 3
New Moon Stacking \xB7 10|T|......L.../OO....L.../OOSS..LLZ./ISSJ...ZZ./IXXJJJ.ZXX/IXXXX..XXX/IXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking
New Moon Stacking \xB7 11|T|......OOLL/..SS..OOZL/ISSJ...ZZL/IXXJJJ.ZXX/IXXXX..XXX/IXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking
New Moon Stacking \xB7 12|T|..Z......./.ZZ......./.ZSS..LLOO/ISSJ...LOO/IXXJJJ.LXX/IXXXX..XXX/IXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking
New Moon Stacking \xB7 13|T|S..Z....../SSZZ..LLOO/ISZJ...LOO/IXXJJJ.LXX/IXXXX..XXX/IXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking
New Moon Stacking \xB7 14|T|.......ZZ./........ZZ/..SS..LLOO/ISSJ...LOO/IXXJJJ.LXX/IXXXX..XXX/IXXXXX.XXX/XXXXX.XXXX|3|New Moon Stacking
Ren\u2019s TA Stacking v2 \u03B1 Version \xB7 1|T|OO.......I/OO.......I/XX.....LLI/XXZZ....LI/XXXZZSS.LX/XXXXSS..JX/XXXXXXX.JX/XXXXXX.JJX|3|Ren\u2019s TA Stacking v2 \u03B1 Version
Ren\u2019s TA Stacking v2 \u03B1 Version \xB7 2|T|I........./IJJ......./IJ......../IJ......../XXS......Z/XXSS....ZZ/XXXSOO..ZX/XXXXOO...X/XXXXXXX.LX/XXXXXXLLLX|1|Ren\u2019s TA Stacking v2 \u03B1 Version
Ren\u2019s TA Stacking v2 \u03B1 Version \xB7 3|T|I........./IJJ......./IJ......../IJ......../XXS......Z/XXSS....ZZ/XXXSOO..ZX/XXXXOO...X/XXXXXXX.LX/XXXXXXLLLX|2|Ren\u2019s TA Stacking v2 \u03B1 Version
Partial bag 1 [rough-pc] \xB7 1|T|XXXXX...../XXXX....L./XXXXXXX.L./XXXXXXXXLL|1|Partial bag 1 [rough-pc]
RTR Stacking \xB7 2|T|S........./SS....LJJJ/XS....LZZJ/XOO...LLZZ/XOO....XXX/XXIIII.XXX/XXXXX..XXX/XXXXXX.XXX|3|RTR Stacking
RTR Stacking \xB7 3|T|S........./SS....JJLL/XSZ...JOOL/XZZ...JOOL/XZ.....XXX/XXIIII.XXX/XXXXX..XXX/XXXXXX.XXX|3|RTR Stacking
Sauce Stacking \xB7 1|T|IOO....JJJ/IOO....LLJ/IXZZ....LX/IXXZZSS.LX/XXXXSS..XX/XXXXXXX.XX/XXXX..XXXX|3|Sauce Stacking
Sauce Stacking \xB7 2|T|IOO....LLL/IOO....LJJ/IXZZ....JX/IXXZZSS.JX/XXXXSS..XX/XXXXXXX.XX/XXXX..XXXX|3|Sauce Stacking
Tenbin Stacking \xB7 1|T|.......LOO/I......LOO/I....ZZLLX/I.....ZZXX/IJJSS.XXXX/XJSS..XXXX/XJXXX.XXXX/XX.X.XXXXX|3|Tenbin Stacking
Tenbin Stacking \xB7 2|T|.........Z/I....LLLZZ/I....LOOZX/I.....OOXX/IJJSS.XXXX/XJSS..XXXX/XJXXX.XXXX/XX.X.XXXXX|3|Tenbin Stacking
Tenbin Stacking \xB7 3|T|........OO/........OO/JJ.....SSX/J.....SSXX/J.ZZLLXXXX/X..ZZLXXXX/X.XXXLXXXX/XX.X.XXXXX|3|Tenbin Stacking
Tenbin Stacking \xB7 4|T|.........I/.........I/.........I/.........I/........OO/........OO/JJ.....SSX/J.....SSXX/J.ZZLLXXXX/X..ZZLXXXX/X.XXXLXXXX/XX.X.XXXXX|3|Tenbin Stacking
Tenbin Stacking \xB7 5|T|.........I/.........I/.......S.I/.......SSI/JJ....OOSX/J.....OOXX/J.ZZLLXXXX/X..ZZLXXXX/X.XXXLXXXX/XX.X.XXXXX|3|Tenbin Stacking
Tenbin Stacking \xB7 6|T|.......J../.....OOJJJ/.Z...OOSSX/ZZ....SSXX/ZIIII.XXXX/XLLL..XXXX/XLXXX.XXXX/XX.X.XXXXX|3|Tenbin Stacking
Thousand Cranes Cannon \xB7 1|T|.S......../.SS......I/OOSJJ....I/OOXJ....ZI/XXXJ.LLZZI/XXXX..LZXX/XXXX.XLXXX|3|Thousand Cranes Cannon
Thousand Cranes Cannon 3 \xB7 1|T|.........I/...SS....I/OOSSZ...LI/OOXZZ...LI/XXXZJJ..LL/XXXXJ...XX/XXXXJX.XXX|2|Thousand Cranes Cannon 3
Thousand Cranes Cannon 3 \xB7 2|T|.OO......./.OO......I/.SSJJ....I/SSXJ....ZI/XXXJ.LLZZI/XXXX..LZXX/XXXX.XLXXX|3|Thousand Cranes Cannon 3
TOP Cannon \xB7 1|T|I......JJJ/I......LSJ/I.OO...LSS/I.OO...LLS/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 3|T|I........./IJJ....SLL/IJOO...SSL/IJOO....SL/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon 2 \xB7 2|T|JJSS....../JSSL....../JLLL....OO/IIII....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon 2
TOP Cannon \xB7 4|T|LLLJ....../LSSJ....../SSJJ....OO/IIII....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 5|T|IIII....../JJSS....../JSSL....OO/JLLL....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 6|T|IIII....../LLLJ....../LSSJ....OO/SSJJ....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 7|T|ISLL....../ISSL....../IJSL....OO/IJJJ....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 8|T|IJJJ....../ILSJ....../ILSS....OO/ILLS....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 9|T|LS.....JJJ/LSS......J/LLS.....OO/IIII....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 12|T|IS.......L/ISS....LLL/IJS.....OO/IJJJ....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 14|T|L......JJJ/L......SSJ/LL....SSOO/IIII....OO/XXX....XXX/XXX.ZZXXXX/XXX..ZZXXX/XXX.XXXXXX|3|TOP Cannon
TOP Cannon \xB7 16|T|.........I/JJZ....LLI/JZZ...OOLI/JZ....OOLI/XXXS...XXX/XXXSS.XXXX/XXX.S..XXX/XXX.XXXXXX|2|TOP Cannon
Tourmaline Stacking \xB7 1|T|S........./SS....JJJ./XS....OOJI/X.....OOLI/X.ZZXXLLLI/X..ZZXXXXI/X.XXXXXXXX/XXXX.XXXXX|3|Tourmaline Stacking
Tourmaline Stacking \xB7 2|T|S......LL./SS......L./XS....JJLI/X.....JOOI/X.ZZXXJOOI/X..ZZXXXXI/X.XXXXXXXX/XXXX.XXXXX|3|Tourmaline Stacking
Tourmaline Stacking \xB7 3|T|S........./SS....LLL./XS....LOOI/X.....JOOI/X.ZZXXJJJI/X..ZZXXXXI/X.XXXXXXXX/XXXX.XXXXX|3|Tourmaline Stacking
Tourmaline Stacking \xB7 4|T|S........./SS....IOO./XS....IOOL/X.....ILLL/X.ZZXXIJJJ/X..ZZXXXXJ/X.XXXXXXXX/XXXX.XXXXX|3|Tourmaline Stacking
Tourmaline Stacking \xB7 5|T|S........I/SS.....OOI/XS.....OOI/X.....LLLI/X.ZZXXLJJJ/X..ZZXXXXJ/X.XXXXXXXX/XXXX.XXXXX|3|Tourmaline Stacking
Triple Triple PC \xB7 12|T|.......OOJ/I......OOJ/I.....ZZJJ/IS.....ZZX/ISSLLL.XXX/XXSLX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
Triple Triple PC \xB7 13|T|.........J/.........J/........JJ/I.......OO/I.....ZZOO/IS.....ZZX/ISSLLL.XXX/XXSLX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
Triple Triple PC \xB7 14|T|.....J..../I....JJJOO/I.....ZZOO/IS.....ZZX/ISSLLL.XXX/XXSLX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
Triple Triple PC \xB7 15|T|.......ZS./......ZZSS/.JI...ZOOS/.JI....OOX/JJILLL.XXX/XXILX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
Triple Triple PC \xB7 19|T|......IIII/........OO/JJ....ZZOO/JS.....ZZX/JSSLLL.XXX/XXSLX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
Triple Triple PC \xB7 20|T|.....OO..J/I....OO..J/I.....ZZJJ/IS.....ZZX/ISSLLL.XXX/XXSLX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
Triple Triple PC \xB7 22|T|.......SS./......SSOO/.JI...ZZOO/.JI....ZZX/JJILLL.XXX/XXILX..XXX/XXXXXX.XXX/XXX.XXXXXX|3|Triple Triple PC
True PT Stacking 2 \xB7 1|T|IIII....../XXXX....../XXX....SSX/XXX.ZZSSXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 6|T|JJLL.....I/JOOL.....I/JOOL.....I/XXXX.....I/XXX....SSX/XXX.ZZSSXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 7|T|LOOJ.....I/LOOJ.....I/LLJJ.....I/XXXX.....I/XXX....SSX/XXX.ZZSSXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 8|T|I........./IJJ......./IJOO....../IJOO.....L/XXXX...LLL/XXX....SSX/XXX.ZZSSXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 9|T|IIII...JJJ/XXXXSSLOOJ/XXXSS.LOOX/XXX.ZZLLXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 10|T|L........I/L........I/LL.......I/XXXXSSJJJI/XXXSS.OOJX/XXX.ZZOOXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 11|T|.........I/J........I/JJJ......I/XXXXSSLOOI/XXXSS.LOOX/XXX.ZZLLXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 12|X|JJ......../JOO......./JOO......L/XXXX...LLL/XXXIIIISSX/XXXTZZSSXX/XXXTTZZXXX/XXXTXXXXXX|2|True PT Stacking 2
True PT Stacking 2 \xB7 13|T|.......LLL/.......LOO/.......JOO/XXXX...JJJ/XXXIIIISSX/XXX.ZZSSXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 14|T|I........./I.......J./IOO.....J./IOO....JJL/XXXX...LLL/XXX....SSX/XXX.ZZSSXX/XXX..ZZXXX/XXX.XXXXXX|3|True PT Stacking 2
True PT Stacking 2 \xB7 15|T|J.....ZZLL/JJJ....ZZL/XXXXSS.OOL/XXXSS..OOX/XXX.IIIIXX/XXX....XXX/XXX.XXXXXX|2|True PT Stacking 2
Tsar Cannon \xB7 3|X|S..JJ..L../SSIJ...L../XSIJTZZLLX/XXIXTTZZXX/XXIXTXXXXX/XXXXX.XXXX|3|Tsar Cannon
Tsar Cannon \xB7 4|T|IOO......./IOO......./IOOJJ...../IOOJ....SS/XLLJ.ZZSSX/XXLX..ZZXX/XXLX.XXXXX/XXXXX.XXXX|3|Tsar Cannon
Tsar Cannon \xB7 2 \xB7 1|T|I........./I..OO...../I.SOO..JJJ/I.SS...XXJ/XLLS.ZZXXX/XXLX..ZZXX/XXLX.XXXXX/XXXXX.XXXX|3|Tsar Cannon \xB7 2
Tsar Cannon \xB7 2 \xB7 2|T|.......I../.......I../.......IS./.OOJJ..ISS/.OOJ...XXS/XLLJ.ZZXXX/XXLX..ZZXX/XXLX.XXXXX/XXXXX.XXXX|3|Tsar Cannon \xB7 2
Tsar Cannon \xB7 2 \xB7 3|T|.......L../.......L../.......LL./.......OO./S..JJ..OO./SSIJ...XX./XSIJ.ZZXXX/XXIX..ZZXX/XXIX.XXXXX/XXXXX.XXXX|3|Tsar Cannon \xB7 2
Tsar Cannon \xB7 1 \xB7 2|T|........OO/........OO/S..JJ..LXX/SSIJ...LXX/XSIJ.ZZLLX/XXIX..ZZXX/XXIX.XXXXX/XXXXX.XXXX|3|Tsar Cannon \xB7 1
TZT Cannon 2 \xB7 2|T|.......LLI/........LI/........LI/..JJSS..XI/OOJSS...XX/OOJXX.ZZXX/XXXXX..ZZX/XXXXX.XXXX/.XXXX...XX|3|TZT Cannon 2
Yamaha Stacking 2 \xB7 1|T|XXX......X/XXX.....XX/XXXOOXXXXX/XXXOO.XXXX|1|Yamaha Stacking 2
99PC \xB7 1 \xB7 1 \xB7 1|T|XX......../X..X.....X/XXXX...XXX/X.XX..XXXX/X.XXIXXXXX/X..XIXXXXX/XXXXIXXXXX/XXXXIXXXXX|2|99PC \xB7 1 \xB7 1
BTREN \xB7 1|T|..L......./.ZL.JJ..../ZZLLJ...../ZOOSJ.IIII/XOOSS..XXX/XXXXS...XX/XXXXXX.XXX/XXXXX.XXXX|2|BTREN
BTREN 2 \xB7 2|T|......L.../ZZ..LLL..J/SZZ.I....J/SSOOI...JJ/XSOOI..XXX/XXXXI...XX/XXXXXX.XXX/XXXXX.XXXX|2|BTREN 2
MKO Stacking (X+) \xB7 1|T|.S......../XSS...X..X/XXS..XX..X/XX...XXXXX/XXX.XXXXXX|2|MKO Stacking (X+)
MKO Stacking (X+) \xB7 2|X|.....Z..../X...ZZX..X/XX..ZXX..X/XXTTTXXXXX/XXXTXXXXXX|2|MKO Stacking (X+)
MKO Stacking (X+) \xB7 8|T|OO....IIII/OO....LLJJ/X...SSXLJX/XX.SSXXLJX/XX...XXXXX/XXX.XXXXXX|2|MKO Stacking (X+)
MKO Stacking (X+) \xB7 9|X|..L..OOI../LLL..OOIJJ/XZZTTTXIJX/XXZZTXXIJX/XX...XXXXX/XXX.XXXXXX|2|MKO Stacking (X+)
MKO Stacking (X+) \xB7 10|X|.SS......./SSTTTZIIII/XLLTZZXOOX/XXL.ZXXOOX/XXL..XXXXX/XXX.XXXXXX|2|MKO Stacking (X+)
MKO Stacking (X+) \xB7 11|T|OO..JIIIIZ/OO..JJJLZZ/X...SSXLZX/XX.SSXXLLX/XX...XXXXX/XXX.XXXXXX|2|MKO Stacking (X+)
MKO Stacking (X+) \xB7 1 \xB7 2|T|J........./JJJ......./LLL......./LX...ZIIII/XXX.ZZXOOX/XXX.ZXXOOX|2|MKO Stacking (X+) \xB7 1
MKO Stacking (X+) \xB7 1 \xB7 3|T|I........./IOO......./IOO......./IX...ZLLJJ/XXX.ZZXLJX/XXX.ZXXLJX|2|MKO Stacking (X+) \xB7 1
MKO Stacking (X+) \xB7 11 \xB7 1|T|XXOOXXXXXX/XXOOXXXXXX|2|MKO Stacking (X+) \xB7 11
Ginzan PC \xB7 3|T|.........I/.......J.I/.......J.I/OO....JJXI/OOL...ZXXX/LLL..ZZXXX/XS...ZXXXX/XSS.XXXXXX/XXSXXXXXXX|2|Ginzan PC
Ginzan PC \xB7 4|T|.........I/.......J.I/.......J.I/.LL...JJXI/OOL...ZXXX/OOL..ZZXXX/XS...ZXXXX/XSS.XXXXXX/XXSXXXXXXX|2|Ginzan PC
Ginzan PC \xB7 5|X|IIIIZ...OO/SLLZZ...OO/SSLZT..XXX/XSLTTTXXXX/XTTTXXXXXX/XXTXXXXXXX|3|Ginzan PC
Ginzan PC \xB7 6|X|IIIIZLLLOO/...ZZLSSOO/...ZTSSXXX/X..TTTXXXX/XTTTXXXXXX/XXTXXXXXXX|3|Ginzan PC
Ginzan PC \xB7 2 \xB7 1|T|.......XXX/..I....XXX/OOIXX...XX/OOIXXX.XXX/X.IXXXXXXX|2|Ginzan PC \xB7 2
Ginzan PC \xB7 7|T|L......OOJ/L......OOJ/LL..IIIIJJ/ZZ...SSXXX/XZZ.SSXXXX|2|Ginzan PC
Ginzan PC \xB7 8|X|.........I/.......ZJI/OO....ZZJI/OOL..TZJJI/LLL..TTXXX/XSTTTTXXXX/XSSTXXXXXX/XXSXXXXXXX|3|Ginzan PC
Guzzu Nineeto p \xB7 1|T|XXXXXX..../XXXXX...../XXXXXX...L/XXXXXXXLLL|1|Guzzu Nineeto p
Guzzu Nineeto p 2 \xB7 1|T|XXXXXX..../XXXXX...../XXXXXX...L/XXXXXXXLLL|1|Guzzu Nineeto p 2
Guzzu Nineeto p 4 \xB7 1|T|XXXXXX..../XXXXX...../XXXXXX.J../XXXXXXXJJJ|1|Guzzu Nineeto p 4
Partial bag 1 [b1-39e02213] \xB7 1|T|.....XXXXX/....XXXXXX/JJJXXXXXXX/..J.XXXXXX|1|Partial bag 1 [b1-39e02213]
Partial bag 1 [b1-39e02213] 2 \xB7 1|T|.....XXXXX/....XXXXXX/JJJXXXXXXX/..J.XXXXXX|1|Partial bag 1 [b1-39e02213] 2
Partial bag 1 [b1-39e02213] 3 \xB7 1|T|.....XXXXX/....XXXXXX/JJJXXXXXXX/..J.XXXXXX|1|Partial bag 1 [b1-39e02213] 3
Partial bag 1 [b1-ac01182c] \xB7 1|T|XXX.....XX/XXXIIIIXXX/XXX...XXXX/XXX....XXX|1|Partial bag 1 [b1-ac01182c]
Partial bag 1 [b1-ac01182c] \xB7 2|T|XXX.....XX/XXX....XXX/XXX...XXXX/XXXIIIIXXX|1|Partial bag 1 [b1-ac01182c]
Perfect Clear Opener 2 \xB7 1|T|XX.....XXX/XXX....XXX/XXXX...XXX/XXXIIIIXXX|1|Perfect Clear Opener 2
Perfect Clear Opener 3 \xB7 1|T|XX...LXXXX/XXXLLLXXXX/XXXXOOXXXX/XXX.OOXXXX|1|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 2|T|XXIIIIXXXX/XXX...XXXX/XXXXOOXXXX/XXX.OOXXXX|1|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 3|T|XXIIIIXXXX/XXX...XXXX/XXXXSSXXXX/XXXSS.XXXX|1|Perfect Clear Opener 3
Perfect Clear Opener 2 \xB7 1 \xB7 1|T|XX.J...XXX/XXXJJJLXXX/XXXXLLLXXX|2|Perfect Clear Opener 2 \xB7 1
Perfect Clear Opener 4 \xB7 1|T|XXZZLLXXXX/XXXZZLXXXX/XXXX.LXXXX/XXX...XXXX|3|Perfect Clear Opener 4
Perfect Clear Opener 3 \xB7 4|T|....IIII../XX...ZXXXX/XXX.ZZXXXX/XXXXZLXXXX/XXXLLLXXXX|2|Perfect Clear Opener 3
Perfect Clear Opener 4 \xB7 2|T|LLL..JJJOO/LZZ....JOO/XXZZSSXXXX/XXXSS.XXXX/XXXX..XXXX/XXX...XXXX|2|Perfect Clear Opener 4
Perfect Clear Opener 3 \xB7 5|T|.........I/.........I/J.....ZOOI/JJJ..ZZOOI/XX...ZXXXX/XXX...XXXX/XXXX.LXXXX/XXXLLLXXXX|1|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 6|T|.........I/.Z...S...I/ZZ...SSOOI/Z....LSOOI/XX.LLLXXXX/XXX..JXXXX/XXXX.JXXXX/XXX.JJXXXX|1|Perfect Clear Opener 3
Perfect Clear Opener 4 \xB7 3|T|.........I/.J....SLLI/.J.Z..SSLI/JJZZ...SLI/XXZOO.XXXX/XXXOO.XXXX/XXXX..XXXX/XXX...XXXX|2|Perfect Clear Opener 4
Perfect Clear Opener 3 \xB7 7|T|........SS/....JJJSSL/OO....JLLL/OO....IIII/XXZZ..XXXX/XXXZZ.XXXX/XXXX..XXXX/XXX...XXXX|2|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 11|T|.........I/JJ.......I/JS....ZOOI/JSS..ZZOOI/XXS..ZXXXX/XXX...XXXX/XXXX.LXXXX/XXXLLLXXXX|2|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 12|T|.........I/.SS......I/SS....ZOOI/JJJ..ZZOOI/XXJ..ZXXXX/XXX...XXXX/XXXX.LXXXX/XXXLLLXXXX|2|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 8 \xB7 1|T|.........X/....S....X/XXX.SS..XX/XXXXXSXXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|1|Perfect Clear Opener 3 \xB7 8
Perfect Clear Opener 3 \xB7 3 \xB7 2|T|..J......./OOJJJ....L/OOZZ...LLL/XXXZZ.XXXX/XXXXX.XXXX|2|Perfect Clear Opener 3 \xB7 3
Perfect Clear Opener 3 \xB7 9 \xB7 1|T|......ZX../XX...ZZXXX/XXXXXZXXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|1|Perfect Clear Opener 3 \xB7 9
Perfect Clear Opener 3 \xB7 10 \xB7 1|T|......Z..X/.XX..ZZXXX/XXXXXZXXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|1|Perfect Clear Opener 3 \xB7 10
Perfect Clear Opener 2 \xB7 1 \xB7 2|T|.........I/.Z.......I/ZZ....JJJI/Z.....SSJI/XX.OOSSXXX/XXXOO.LXXX/XXXXLLLXXX|1|Perfect Clear Opener 2 \xB7 1
Perfect Clear Opener 3 \xB7 20|T|.........I/......JJJI/.SS...ZZJI/SSOO...ZZI/XXOO..XXXX/XXX...XXXX/XXXX.LXXXX/XXXLLLXXXX|2|Perfect Clear Opener 3
Perfect Clear Opener 3 \xB7 5 \xB7 1|T|.........X/..SS.....X/XSS...XXXX/XXXSSXXXXX/XXSS.XXXXX/XXX...XXXX/XXXX.XXXXX|1|Perfect Clear Opener 3 \xB7 5
Perfect Clear Opener 3 \xB7 17 \xB7 1|T|.......Z../JIIII.ZZSS/JJJXX.ZSSX/XXXX...XXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|2|Perfect Clear Opener 3 \xB7 17
Perfect Clear Opener 3 \xB7 17 \xB7 2|T|.........J/.........J/.......ZJJ/OOLLL.ZZSS/OOLXX.ZSSX/XXXX...XXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|2|Perfect Clear Opener 3 \xB7 17
Perfect Clear Opener 3 \xB7 6 \xB7 1|T|.........I/.....Z...I/....ZZ...I/JJ..ZLL..I/J...SSLOOX/JX.SSXLOOX/XX...XXXXX/XXXX.XXXXX/XXX..XXXXX/XXXX.XXXXX/XXX.XXXXXX|2|Perfect Clear Opener 3 \xB7 6
Perfect Clear Opener 4 \xB7 3 \xB7 1|T|.........I/.....OO..I/.....OOS.I/.....ZZSSI/JJ....ZZSX/JXLLL.XXXX/JXLX..XXXX/XXXXX.XXXX/XXXX..XXXX/XXX...XXXX|3|Perfect Clear Opener 4 \xB7 3
Perfect Clear Opener 4 \xB7 3 \xB7 2|T|.........I/.....ZZ..I/.....SZZ.I/.....SSOOI/JJ....SOOX/JXLLL.XXXX/JXLX..XXXX/XXXXX.XXXX/XXXX..XXXX/XXX...XXXX|3|Perfect Clear Opener 4 \xB7 3
Perfect Clear Opener 3 \xB7 7 \xB7 2|T|........LL/.........L/I........L/I........J/I.....S..J/IZ....SSJJ/ZZ.....SXX/Z...XXXXXX/XX.OO.XXXX/XX.OOXXXXX/XXXX..XXXX/XXX...XXXX|1|Perfect Clear Opener 3 \xB7 7
Perfect Clear Opener 3 \xB7 14 \xB7 1|T|I........./I........./I.......LL/IOO...JJJL/XOOS...ZJL/XXXSS.ZZXX/XXXXS.ZXXX/XXXX...XXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX/XXXXX.XXXX|2|Perfect Clear Opener 3 \xB7 14
Perfect Clear Opener 3 \xB7 3 \xB7 2 \xB7 2|T|L........./L........I/LLS.JJ...I/OOSSJ....I/OOXSJ.ZZ.I/XXXXX..ZZX/XXXXX.XXXX|2|Perfect Clear Opener 3 \xB7 3 \xB7 2
Sus PC \xB7 1|T|.X.....XXX/XXXX...XXX/XXXX...XXX/XXXIIIIXXX|1|Sus PC
\u958B\u5E55TSD(Flat Top) 2 \xB7 18|T|...ZZ....I/S...ZZLLLI/SS.XXXLOOI/XS.XXXXOOI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 6 \xB7 1|T|......I.../...ZZ.IJJJ/S...ZZIOOJ/SS.XXXIOOX/XS.XXXXXXX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 6
\u958B\u5E55TSD(Flat Top) 2 \xB7 19|T|........SS/.......SSZ/........ZZ/LLLIIII.ZJ/LOOXXX...J/XOOXXXX.JJ|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 20|T|.....L..../...LLLZZ.I/S...JJJZZI/SS.XXXJOOI/XS.XXXXOOI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 21|T|I....Z..../IJ..ZZ..../IJJJZ...SS/IOOXXX.SSL/XOOXXXXLLL|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 26|X|TTTZZLL..I/STJJZZL..I/SSJXXXLOOI/XSJXXXXOOI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 27|X|JJSSTZZ..I/JSSTTTZZLI/JOOXXXLLLI/XOOXXXX..I|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 28|X|OOJJSST..I/OOJSSTTTLI/ZZJXXXLLLI/XZZXXXX..I|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 12 \xB7 1|X|XXXXXXTI../XXXXXTTIL./XXXXXXTIL./XXXXXXXILL|1|\u958B\u5E55TSD(Flat Top) 2 \xB7 12
\u958B\u5E55TSD(Flat Top) 2 \xB7 31|T|......I.../...ZZ.ILLL/S...ZZILOO/SS.XXXIJOO/XS.XXXXJJJ|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 32|T|......J.../...ZZ.JJJI/S...ZZLLLI/SS.XXXLOOI/XS.XXXXOOI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 33|T|........J./........J./...ZZ..JJI/S...ZZLLLI/SS.XXXLOOI/XS.XXXXOOI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 34|T|.........I/.........I/...ZZ..OOI/S...ZZJOOI/SS.XXXJJJL/XS.XXXXLLL|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 35|T|.....OO.../...ZZOO.LI/S...ZZLLLI/SS.XXXJJJI/XS.XXXX.JI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 36|T|........J./...ZZLL.JI/S...ZZLJJI/SS.XXXLOOI/XS.XXXXOOI|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 37|T|.........I/.........I/...ZZLL..I/S...ZZLJJI/SS.XXXLJOO/XS.XXXXJOO|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 18 \xB7 2|T|JJJXX....X/XXJXXXXXXX|1|\u958B\u5E55TSD(Flat Top) 2 \xB7 18
\u958B\u5E55TSD(Flat Top) 2 \xB7 38|T|........JJ/........JI/...ZZ...JI/S...ZZOOLI/SS.XXXOOLI/XS.XXXX.LL|2|\u958B\u5E55TSD(Flat Top) 2
\u958B\u5E55TSD(Flat Top) 2 \xB7 12 \xB7 1 \xB7 1|T|XXXXXXXXLL/XXXXXXXXXL/XXXXXXXXXL|3|\u958B\u5E55TSD(Flat Top) 2 \xB7 12 \xB7 1
\u958B\u5E55TSD(Flat Top) 2 \xB7 6 \xB7 1 \xB7 1|T|.......Z../...S.IZZOO/L..SSIZJOO/L...SIXJJJ/LL.XXIXXXX/XX.XXXXXXX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 6 \xB7 1
\u958B\u5E55TSD(Flat Top) 2 \xB7 34 \xB7 2|T|.......I../...OOS.IJJ/L..OOSSIJX/L...ZZSIJX/LL.XXZZXXX/XX.XXXXXXX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 34
\u958B\u5E55TSD(Flat Top) 2 \xB7 26 \xB7 1|X|JJSS.....I/JSS....LLI/JTZZ....LI/TTTZZ...LI/XXXXXXXOOX/XXXXXXXOOX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 26
\u958B\u5E55TSD(Flat Top) 2 \xB7 26 \xB7 2|X|STTT.....I/SST....LLI/JSZZ....LI/JJJZZ...LI/XXXXXXXOOX/XXXXXXXOOX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 26
\u958B\u5E55TSD(Flat Top) 2 \xB7 26 \xB7 3|X|.....ZZLLI/......ZZLI/OO...SSTLI/OO..SSTTJI/XXXXXXXTJX/XXXXXXXJJX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 26
\u958B\u5E55TSD(Flat Top) 2 \xB7 26 \xB7 4|X|IJJZT...../IJZZTT..../IJZLTSS.../ILLLSS..../XXXXXXXOOX/XXXXXXXOOX|2|\u958B\u5E55TSD(Flat Top) 2 \xB7 26
Breakerspin 2 \xB7 1|T|OO.......Z/OO......ZZ/XJJ.....ZL/XJ.....LLL/XJX.SSIIII/XXXSS...XX/XXXXXX.XXX|1|Breakerspin 2
Breakerspin 2 \xB7 2|T|OO......../OO......ZI/XJJ....ZZI/XJ.....ZLI/XJX.SSLLLI/XXXSS...XX/XXXXXX.XXX|1|Breakerspin 2
Breakerspin 2 \xB7 3|T|OO.......Z/OO......ZZ/XJJ.....ZL/XJ...SSLLL/XJX.SSIIII/XXX.....XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 4|T|OO......../OO......ZI/XJJ....ZZI/XJ...SSZLI/XJX.SSLLLI/XXX.....XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 5|T|OO......../OO.......I/XJJ....SSI/XJ...ZSSLI/XJX.ZZLLLI/XXX.Z...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 6|T|XJJ....LLL/XJ...ZZLOO/XJX.SSZZOO/XXXSS...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 7|T|XJJ....LLL/XJ...ZZLOO/XJX.SSZZOO/XXXSS...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 8|T|OO.......I/OO.......I/XJJ.....LI/XJ...ZZ.LI/XJX.SSZZLL/XXXSS...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 9|T|OO......../OO......ZI/XJJ....ZZI/XJ.....ZLI/XJX.SSLLLI/XXXSS...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 10|T|S.......JJ/SS......JI/XSZ.....JI/XZZL...OOI/XZXL...OOI/XXXLL...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 11|T|S........./SS...L...I/XSZLLL...I/XZZJJJ...I/XZXOOJ...I/XXXOO...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 12|T|S........./SSLL.....I/XSZL....JI/XZZL....JI/XZXOO..JJI/XXXOO...XX/XXXXXX.XXX|2|Breakerspin 2
Breakerspin 2 \xB7 6 \xB7 1|T|XXXIIIIXXX|1|Breakerspin 2 \xB7 6
Partial bag 1 [b1-4b520a7b] \xB7 1|T|.........X/.........X/.........X/XXX...XJ.X/XXXX.XXJXX/XXXXXXJJXX|1|Partial bag 1 [b1-4b520a7b]
Partial bag 1 [b1-fdfad6ba] \xB7 1|T|.........X/.........X/.........X/XXX...XX.X/XXZZ.XXXXX/XXXZZXXXXX|1|Partial bag 1 [b1-fdfad6ba]
\u958B\u5E55TSD(Castle Top) \xB7 1|T|.........J/.........J/X..XX.S.JJ/X...XXSSXX/XX.XXXXSXX|1|\u958B\u5E55TSD(Castle Top)
\u958B\u5E55TSD(Castle Top) 3 \xB7 2|T|OOLLL..IJJ/OOLSS..IJX/ZZSS...IJX/XZZXX.XIXX|2|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 3|T|.........Z/JJLLIIIIZZ/J..LS...ZX/JOOLSS...X/XOOXXSX.XX|2|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 4|T|........OO/I.......OO/I.Z.....JJ/IZZ...LLJX/IZSS...LJX/XSSXX.XLXX|2|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 5|T|.........I/.........I/.........I/.........I/.OO.....JJ/SOOZ..LLJX/SSZZ...LJX/XSZXX.XLXX|2|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 6|T|I......J../I......JJJ/ILOOS...ZX/ILOOSS.ZZX/XLLXXSXZXX|1|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 7|T|...I...J../...I...JJJ/LLLIS...ZX/LOOISS.ZZX/XOOXXSXZXX|1|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 8|T|I........L/I......LLL/IJJJS...ZX/IOOJSS.ZZX/XOOXXSXZXX|1|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 9|T|...I.....L/...I...LLL/OOJIS...ZX/OOJISS.ZZX/XJJXXSXZXX|1|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 12|T|........Z./.......ZZ./.......ZI./........I./SLLOOJJ.IX/SSLOOJ..IX/XSLXXJX.XX|3|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 13|T|.....Z..../....ZZ..I./....Z...I./OOJJJ.LLIX/OOSSJ..LIX/XSSXX.XLXX|3|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 14|T|....SS..I./...SS...I./JJJOO.LLIX/ZZJOO..LIX/XZZXX.XLXX|3|\u958B\u5E55TSD(Castle Top) 3
\u958B\u5E55TSD(Castle Top) 3 \xB7 2 \xB7 1|T|XXXXXOOXXX/XXXXXOOXXX|2|\u958B\u5E55TSD(Castle Top) 3 \xB7 2
\u958B\u5E55TSD(Castle Top) 3 \xB7 11 \xB7 1|T|I.......L./I.......L./I.......LL/IS.......X/XSSJJ..OOX/XXSJ...OOX/XXXJ.ZZXXX/XXXX..ZZXX/XXXX.XXXXX/XXXXX.XXXX|3|\u958B\u5E55TSD(Castle Top) 3 \xB7 11
Alpine Stacking 2 \xB7 1 \xB7 1|T|JJ.......X/J...XX.XXX/JXXXXXXXXX/XX.XXXXXXX|1|Alpine Stacking 2 \xB7 1
Partial bag 1 [b1-df930390] \xB7 1|T|XJJ....XX./XJ....XXX./XJ.XX.XXX./X...XXXXXX|1|Partial bag 1 [b1-df930390]
Partial bag 1 [b1-81dbf7de] \xB7 1|T|.........X/.X..I....X/XXX.I...XX/XXXXI..XXX/XXXXIXXXXX|1|Partial bag 1 [b1-81dbf7de]
Partial bag 1 [b1-b353b4fd] \xB7 1|T|.X....I.XX/XXX..XI.XX/XXXX.XI..X/XXXXXXIXXX|1|Partial bag 1 [b1-b353b4fd]
Partial bag 1 [no-s-skim-tsd-tpc] \xB7 1|T|X.......X./XXX.S.XXXX/XXXXSSXXXX/XXXX.S.XXX|1|Partial bag 1 [no-s-skim-tsd-tpc]
Partial bag 1 [anti-pco-heart-tpc] 3 \xB7 1|T|XXXX....../XXX.....XX/XXXXZZ.XXX/XXXXXZZXXX|1|Partial bag 1 [anti-pco-heart-tpc] 3
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0B,T\u7AEF) \xB7 1|T|.....X...I/X...XXXX.I/XXXXXXXXXI/XXXXXXXXXI|2|\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0B,T\u7AEF)
Unnamed bag 1 [sasasa123-136] \xB7 1|T|X.....X..I/XX...XX..I/XXXXXXXXXI/XXXXXXXXXI|2|Unnamed bag 1 [sasasa123-136]
\u30B7\u30EB\u30AB\u30F4\u30A1\u30C6\u30A3\u30D1\u30D5\u30A7 3 \xB7 1|T|XXXXX...../XXXX....L./XXXXXXX.L./XXXXXXXXLL|1|\u30B7\u30EB\u30AB\u30F4\u30A1\u30C6\u30A3\u30D1\u30D5\u30A7 3
\u958B\u5E55TSD(Dingle) \xB7 1|T|..J......./..J......./XJJXX.X.../X...XXXXXX/XX.XXXXXXX|2|\u958B\u5E55TSD(Dingle)
Aoiro\u7832 \xB7 1|T|ZZXXXXXXXX/XZZXX...XX/XX..XX.XXX/X..XX....X|1|Aoiro\u7832
Aoiro\u7832 \xB7 2|T|L........./L........./LLXXXXXXXX/X..XX...XX/XX..XX.XXX/X..XX....X|1|Aoiro\u7832
J\u30D1\u30D5\u30A7(I\u305A\u3089\u3057) 2 \xB7 1|T|.....XXXXX/....XXXXXX/JJJXXXXXXX/..J.XXXXXX|1|J\u30D1\u30D5\u30A7(I\u305A\u3089\u3057) 2
J\u30D1\u30D5\u30A7(I\u305A\u3089\u3057) 3 \xB7 1|T|.....XXXXX/....XXXXXX/JJJXXXXXXX/..J.XXXXXX|1|J\u30D1\u30D5\u30A7(I\u305A\u3089\u3057) 3
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0A,T\u7AEF) \xB7 1|T|.....X...I/X...XX.XXI/XXXXXXXXXI/XXXXXXXXXI|2|\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0A,T\u7AEF)
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0B,T\u4E2D) \xB7 1|T|X........I/XX...X.XXI/XXXXXXXXXI/XXXXXXXXXI|2|\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0B,T\u4E2D)
\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0A,T\u4E2D) \xB7 1|T|X........I/XX...XXX.I/XXXXXXXXXI/XXXXXXXXXI|2|\u3074\u308D\u3057\u304D\u30D1\u30D5\u30A7(O\u4E0A,T\u4E2D)
TPC (Z-Hold) 2 \xB7 1|T|X........X/XXXXX.Z.XX/XXXXXZZ..X/XXXXXZXXXX|1|TPC (Z-Hold) 2
Partial bag 1 [sasasa123-1271] \xB7 1|T|X........./X........./X..J....../X.XJJJ..../XXXXX...XX/XXXXXX.XX.|1|Partial bag 1 [sasasa123-1271]
DIC\u7A4D\u307F \xB7 1|T|.........I/....XX...I/...XXXX..I/XXXXXXXXXI/XX.XXXXXXX|1|DIC\u7A4D\u307F
Unnamed bag 1 [b1-de61e727] \xB7 1|T|..I.XX..../X.IXXXXX../X.I.XXXXXX/XXIXXXXXXX|1|Unnamed bag 1 [b1-de61e727]
Partial bag 1 [ginzan3da-61] \xB7 2|T|.....XX.../J...XXXOO./JJJXXXXOOX|1|Partial bag 1 [ginzan3da-61]
Partial bag 1 [aotaku1039tetris-229] \xB7 1|T|XXXIIIIXXX/XXXXXXXXX./.XXXXXXXXX|1|Partial bag 1 [aotaku1039tetris-229]
Partial bag 1 [b1-3e6ecc54] \xB7 1|T|XXXIIIIXXX/XXXXXXX.XX/.XXXXXXXXX|1|Partial bag 1 [b1-3e6ecc54]
Partial bag 1 [b1-4cf11f8c] \xB7 1|T|XXIIIIXXXX/XX...XX.X./XX..XX..XX/.X..XX..X./.X...X..X.|1|Partial bag 1 [b1-4cf11f8c]
Partial bag 1 [b1-4cf11f8c] 2 \xB7 1|T|XXXIIIIXXX/.XXX.....X/.X.XX....X/XX.XX...XX/XX.X.....X|1|Partial bag 1 [b1-4cf11f8c] 2
Partial bag 1 [tetrismaps-20] \xB7 1 \xB7 1|T|..LL....../...L.....X/XX.LXX...X/X..XXXXXXX/X..X..XXXX|1|Partial bag 1 [tetrismaps-20] \xB7 1
Partial bag 1 [tetrismaps-31] \xB7 1 \xB7 1|T|XX......XX/XXXIIIIXXX/X...XX...X/XX..XX..XX|1|Partial bag 1 [tetrismaps-31] \xB7 1
\u3078\u307C\u30DE\u30A4\u30B9\u30D4\u30F3 \xB7 1 \xB7 1|T|....X...../....XXX..X/.Z...XX..X/ZZ..XXXXXX/Z...XXXXXX|1|\u3078\u307C\u30DE\u30A4\u30B9\u30D4\u30F3 \xB7 1
Partial bag 1 [tetrismaps-200] \xB7 1|T|X..XX.X.../X...XXXXOO/XX.XXXXXOO|2|Partial bag 1 [tetrismaps-200]
Partial bag 1 [tetrismaps-200] \xB7 1 \xB7 1|T|...JJJ..../X..XXJX.../X...XXXXXX/XX.XXXXXXX|2|Partial bag 1 [tetrismaps-200] \xB7 1
Partial bag 1 [tetrismaps-200] \xB7 1 \xB7 2|T|.........J/.........J/X..XX.X.JJ/X...XXXXXX/XX.XXXXXXX|2|Partial bag 1 [tetrismaps-200] \xB7 1
Partial bag 1 [tetrismaps-257] 2 \xB7 1|T|XXXXXX..../XXXXX...../XXXXXX...L/XXXXXXXLLL|1|Partial bag 1 [tetrismaps-257] 2
Partial bag 1 [tetrismaps-257] 3 \xB7 1|T|XXXXXX..../XXXXX...../XXXXXX...L/XXXXXXXLLL|1|Partial bag 1 [tetrismaps-257] 3
Partial bag 1 [b1-9481eec8] \xB7 1|T|.......XXX/ZZXXXXXXXX/XZZ.....XX|1|Partial bag 1 [b1-9481eec8]`);function openerPlan(b,seq,all){var it=openerGen(b,seq,all),r;do r=it.next();while(!r.done);return r.value}function setupSolve(b,cur,hold,queue,canHold,maxL,dl){for(var rows=b.__r||rowsOf(b),tp=tops(b),FULL=(1<<W)-1,cands=[],seq=[cur].concat(queue),i=0;i<SETUPS.length;i++){var S2=SETUPS[i];if(!(S2.L<2||S2.L>maxL)){var xs=0,xe=W-S2.w;S2.wl&&(xe=0),S2.wr&&(xs=W-S2.w);for(var x0=xs;x0<=xe;x0++){for(var lt=H,cx=x0;cx<x0+S2.w;cx++)lt=Math.min(lt,tp[cx]);for(var yT=S2.tr[0],y0=Math.max(0,lt-S2.h);y0<=Math.min(H-S2.h,lt-yT+3);y0++){for(var ok=!0,need={},extra={},n=0,span=(1<<S2.w)-1<<x0,r=0;r<S2.h&&ok;r++){var row=rows[y0+r],tm=S2.emp[r]<<x0&FULL;if(row&tm){ok=!1;break}var nm=S2.fill[r]<<x0&FULL&~row;S2.tr.indexOf(r)>=0&&(nm|=FULL&~span&~row),nm&&(need[y0+r]=nm,n+=pop(nm));var free=(S2.fill[r]|S2.emp[r])<<x0&FULL,q=FULL&~row&~nm&~(S2.emp[r]<<x0&FULL);q&=~(span&free),q&&(extra[y0+r]=q)}for(var ra=1;ra<=3&&y0-ra>=0;ra++){var q2=FULL&~span&~rows[y0-ra];q2&&(extra[y0-ra]=q2)}!ok||n===0||n>30||cands.push({S:S2,x0,y0,need,extra,n})}}}}cands.sort(function(a,c2){return c2.S.L-a.S.L||a.n-c2.n});function cellsIn(k,r2,x,y,need2,extra2,ex){for(var sh=ROT[k][r2],got=0,sp=0,q3=0;q3<4;q3++){var cy=y+sh[q3][1],bit=1<<x+sh[q3][0];if(need2[cy]&&need2[cy]&bit)got++;else if(extra2[cy]&&extra2[cy]&bit)sp++;else return-1}return got>=2&&ex+sp<=6?sp:-1}function take(k,r2,x,y,need2){var nn={},sh=ROT[k][r2];for(var key in need2)nn[key]=need2[key];for(var q3=0;q3<4;q3++){var cy=y+sh[q3][1];nn[cy]!==void 0&&(nn[cy]&=~(1<<x+sh[q3][0]),nn[cy]||delete nn[cy])}return nn}function takeX(k,r2,x,y,extra2){var nn={},sh=ROT[k][r2];for(var key in extra2)nn[key]=extra2[key];for(var q3=0;q3<4;q3++){var cy=y+sh[q3][1];nn[cy]!==void 0&&(nn[cy]&=~(1<<x+sh[q3][0]),nn[cy]||delete nn[cy])}return nn}function left(need2){for(var key in need2)return!0;return!1}var found=null;function dfs(bb,need2,extra2,ex,i2,h,hold1,path){if(!(found||Date.now()>dl||path.length>=8)){if(!left(need2)){var tOk=h==="T"||seq[i2]==="T"||h===null&&seq[i2+1]==="T";if(!tOk)return;bb.__s=null;var sl=slots(bb,tops(bb));sl.r!==void 0&&sl.n>=2&&(found={steps:path.slice(),L:sl.n});return}var opts=[{k:seq[i2],ni:i2+1,nh:h,hold:!1}];hold1&&(h?opts.push({k:h,ni:i2+1,nh:seq[i2],hold:!0}):seq[i2+1]&&opts.push({k:seq[i2+1],ni:i2+2,nh:seq[i2],hold:!0}));for(var o=0;o<opts.length&&!found;o++){var O=opts[o];if(!(!O.k||O.k==="T")){for(var ms=moves(bb,O.k,spawnState(bb,O.k)),ok2=[],m=0;m<ms.length;m++){var M=ms[m],sp=cellsIn(O.k,M.r,M.x,M.y,need2,extra2,ex);sp>=0&&ok2.push({M,sp})}ok2.sort(function(a,c2){return a.sp-c2.sp});for(var m2=0;m2<ok2.length&&!found;m2++){var M2=ok2[m2].M,pr=place(bb,O.k,M2.r,M2.x,M2.y);pr.lines||(path.push({hold:O.hold,P:M2}),dfs(pr.b,take(O.k,M2.r,M2.x,M2.y,need2),takeX(O.k,M2.r,M2.x,M2.y,extra2),ex+ok2[m2].sp,O.ni,O.nh,!0,path),path.pop())}}}}}for(var c=0;c<cands.length&&!found&&Date.now()<dl;c++){var C=cands[c];C.n/4>seq.length-1||(dfs(b,C.need,C.extra,0,0,hold||null,canHold,[]),found&&(found.S=C.S,found.n=C.n))}return found}function fullRows(b,k,r,x,y){for(var rows=(b.__r||rowsOf(b)).slice(),sh=ROT[k][r],FULL=(1<<W)-1,o=[],q=0;q<4;q++)rows[y+sh[q][1]]|=1<<x+sh[q][0];for(var q2=0;q2<4;q2++){var yy=y+sh[q2][1];rows[yy]===FULL&&o.indexOf(yy)<0&&o.push(yy)}return o}function shiftRows(m,cr){var o={};for(var key in m){var yy=+key;if(!(cr.indexOf(yy)>=0)){for(var d=0,i=0;i<cr.length;i++)cr[i]>yy&&d++;o[yy+d]=m[key]}}return o}function tgtNeed(b,Tg){for(var rows=b.__r||rowsOf(b),FULL=(1<<W)-1,S2=Tg.S,x0=Tg.x0,y0=Tg.y0,need={},extra={},n=0,span=(1<<S2.w)-1<<x0,r=0;r<S2.h;r++){var row=rows[y0+r],tm=S2.emp[r]<<x0&FULL;if(row&tm)return null;var nm=S2.fill[r]<<x0&FULL&~row;S2.tr.indexOf(r)>=0&&(nm|=FULL&~span&~row),nm&&(need[y0+r]=nm,n+=pop(nm));var q=FULL&~row&~nm&~tm;q&&(extra[y0+r]=q)}for(var top0=0,c0=0;c0<S2.w;c0++)S2.emp[0]>>c0&1&&(top0|=1<<x0+c0);for(var ra=1;ra<=4&&y0-ra>=0;ra++){var q2=FULL&~rows[y0-ra]&~top0;q2&&(extra[y0-ra]=q2)}for(var roof={},nr=0,r2=0;r2<S2.tr[0];r2++){var rm=need[y0+r2]&span;rm&&(roof[y0+r2]=rm,nr+=pop(rm))}for(var acc=0,bur=0,yb=Math.max(0,y0-6);yb<y0+S2.h;yb++)need[yb]&&(bur+=pop(need[yb]&acc)),acc|=rows[yb];return{need,extra,n,roof,nRoof:nr,bur}}function tgtFeasible(b,Tg,N){if(N.bur)return!1;var rows=b.__r||rowsOf(b),cov={},sv=FORBID;FORBID=tgtForbid(Tg);var KS="IJLOSZ";try{for(var ki=0;ki<KS.length;ki++)for(var k=KS[ki],ms=moves(b,k,spawnState(b,k)),m=0;m<ms.length;m++){for(var M=ms[m],sh=ROT[k][M.r],ok=!0,hit=0,q=0;q<4;q++){var cy=M.y+sh[q][1],bit=1<<M.x+sh[q][0];if(N.need[cy]&&N.need[cy]&bit)hit=1;else if(!(N.extra[cy]&&N.extra[cy]&bit)){ok=!1;break}}if(ok&&hit)for(var q2=0;q2<4;q2++){var cy2=M.y+sh[q2][1];cov[cy2]=(cov[cy2]||0)|1<<M.x+sh[q2][0]}}}finally{FORBID=sv}for(var key in N.need)for(var y=+key,nm=N.need[key],x=0;x<W;x++)if(nm>>x&1){var ry=y+1-Tg.y0,tB=ry>=0&&ry<Tg.S.h&&x>=Tg.x0&&x<Tg.x0+Tg.S.w&&Tg.S.emp[ry]>>x-Tg.x0&1,sup=y===H-1||rows[y+1]>>x&1||tB;if(sup&&!(cov[y]>>x&1))return!1}return!0}function tgtRoofOK(b,Tg,N){if(!N.nRoof)return!0;var b2=b.slice?b.slice():new b.constructor(b);for(var key in N.need)for(var y=+key,nm=N.need[key]&~(N.roof[key]||0),x=0;x<W;x++)nm>>x&1&&(b2[y*W+x]=8);b2.__r=null,b2.__s=null;var roofLeft={};for(var k2 in N.roof)roofLeft[k2]=N.roof[k2];var N2={need:N.roof,extra:N.extra},sv=FORBID;FORBID=tgtForbid(Tg);var KS="IJLOSZ",ok=!1;try{for(var ki=0;ki<KS.length&&!ok;ki++){for(var k=KS[ki],ms=moves(b2,k,spawnState(b2,k)),m=0;m<ms.length;m++){for(var M=ms[m],sh=ROT[k][M.r],good=!0,hit=0,q=0;q<4;q++){var cy=M.y+sh[q][1],bit=1<<M.x+sh[q][0];if(N2.need[cy]&&N2.need[cy]&bit)hit=1;else if(!(N2.extra[cy]&&N2.extra[cy]&bit)&&!(N.need[cy]&&N.need[cy]&bit)){good=!1;break}}if(good&&hit)for(var q2=0;q2<4;q2++){var cy2=M.y+sh[q2][1];roofLeft[cy2]!==void 0&&(roofLeft[cy2]&=~(1<<M.x+sh[q2][0]))}}var left=0;for(var k3 in roofLeft)left|=roofLeft[k3];left||(ok=!0)}}finally{FORBID=sv}return ok}function chainV(S2){return S2.chain?4*(S2.L===3?1.5:1)+4*(S2.L2===3?1.5:1)-(S2.resid?1:0):S2.L>=3?6:4}function tgtPick(b){for(var tp=tops(b),cands=[],LIB=SETUPS.concat(CHAINS),i=0;i<LIB.length;i++){var S2=LIB[i];if(!(S2.L<3&&!S2.chain)&&!(S2.chain&&!CHAINOK)){var xs=0,xe=W-S2.w;S2.wl&&(xe=0),S2.wr&&(xs=W-S2.w);for(var x0=xs;x0<=xe;x0++){for(var lt=H,cx=x0;cx<x0+S2.w;cx++)lt=Math.min(lt,tp[cx]);for(var y0=Math.max(0,lt-S2.h);y0<=Math.min(H-S2.h,lt-S2.tr[0]+3);y0++){var N=tgtNeed(b,{S:S2,x0,y0});!N||N.n<4||N.n>30||cands.push({sc:(N.n+3)*6/chainV(S2)-y0*.4,S:S2,x0,y0,n:N.n,N})}}}}cands.sort(function(p,q){return p.sc-q.sc});for(var c=0;c<cands.length&&c<8;c++)if(tgtFeasible(b,cands[c],cands[c].N)&&tgtRoofOK(b,cands[c],cands[c].N))return cands[c];return null}function tgtStep(st2,dl){var RB=st2.realB||st2.b,Tg=st2.target,N=tgtNeed(RB,Tg);if(!N)return st2.target=null,st2.why="blocked",null;if(!N.n)return st2.target=null,st2.buildName=Tg.S.name||"TST",st2.buildReady=!0,null;var seq=[st2.cur].concat(st2.queue.slice(0,5)),best=null;function cnt(m){var c=0;for(var key in m)c+=pop(m[key]);return c}function cellsIn(k,r,x,y,need,extra){for(var sh=ROT[k][r],got=0,sp=0,rf=0,q=0;q<4;q++){var cy=y+sh[q][1],bit=1<<x+sh[q][0];if(need[cy]&&need[cy]&bit)got++,N.roof[cy]&&N.roof[cy]&bit&&rf++;else if(extra[cy]&&extra[cy]&bit)sp++;else return null}return rf&&cnt(need)-got-(N.nRoof-rf)>0?null:got?{got,sp}:null}function sub(m,k,r,x,y){var nn={},sh=ROT[k][r];for(var key in m)nn[key]=m[key];for(var q=0;q<4;q++){var cy=y+sh[q][1];nn[cy]!==void 0&&(nn[cy]&=~(1<<x+sh[q][0]),nn[cy]||delete nn[cy])}return nn}function go(bb,need,extra,i,h,hold1,depth,score,first,ty0){if(ty0==null&&(ty0=Tg.y0),!(Date.now()>dl)){if(depth===0||!seq[i]){(!best||score>best.score)&&(best={score,first});return}var opts=[{k:seq[i],ni:i+1,nh:h,hold:!1}];hold1&&(h?opts.push({k:h,ni:i+1,nh:seq[i],hold:!0}):seq[i+1]&&opts.push({k:seq[i+1],ni:i+2,nh:seq[i],hold:!0}));for(var any=!1,o=0;o<opts.length;o++){var O=opts[o];if(!(!O.k||O.k==="T"))for(var ms=moves(bb,O.k,spawnState(bb,O.k)),m=0;m<ms.length;m++){var M=ms[m],c=cellsIn(O.k,M.r,M.x,M.y,need,extra);if(c){var pr=place(bb,O.k,M.r,M.x,M.y),ty=ty0,skim=0,ndS=sub(need,O.k,M.r,M.x,M.y),exS=sub(extra,O.k,M.r,M.x,M.y);if(pr.lines){if(!SKIM)continue;for(var cr=fullRows(bb,O.k,M.r,M.x,M.y),bad=!1,nb=0,ci=0;ci<cr.length;ci++)cr[ci]>=ty0&&cr[ci]<ty0+Tg.S.h&&(bad=!0),cr[ci]>=ty0+Tg.S.h&&nb++;if(bad)continue;ndS=shiftRows(ndS,cr),exS=shiftRows(exS,cr),ty=ty0+nb,skim=1}var nd2=ndS,R2=pr.b.__r||rowsOf(pr.b),bur=!1;for(var kq in nd2){var yq=+kq;if(yq>0&&R2[yq-1]&nd2[kq]){bur=!0;break}}if(!bur){var TgL={S:Tg.S,x0:Tg.x0,y0:ty};if(!first||skim){var Nf=tgtNeed(pr.b,TgL);if(!Nf||Nf.n&&!tgtFeasible(pr.b,TgL,Nf))continue}any=!0,go(pr.b,ndS,exS,O.ni,O.nh,!0,depth-1,score+c.got*4-c.sp*(1+(depth===3?.5:0))+M.y*.05-skim*1.5,first||{hold:O.hold,P:M},ty)}}}}!any&&first&&(!best||score>best.score)&&(best={score,first})}}return go(RB,N.need,N.extra,0,st2.hold||null,!st2.held,3,0,null),!best||!best.first?null:best.first}function bookMove(b,k,P){for(var ms=moves(b,k,spawnState(b,k)),i=0;i<ms.length;i++){var m=ms[i];if(m.r===P.r&&m.x===P.x&&m.y===P.y)return m;var sa=ROT[k][m.r].map(function(c){return m.x+c[0]+","+(m.y+c[1])}).sort().join(),sb=ROT[k][P.r].map(function(c){return P.x+c[0]+","+(P.y+c[1])}).sort().join();if(sa===sb)return m}return null}function drops(b,k){for(var out=[],y0=Math.max(0,H-VIS-4),r=0;r<(k==="O"?1:4);r++)for(var x=-2;x<W;x++)if(fits(b,k,r,x,y0)){for(var ac=r===1?["cw"]:r===2?["flip"]:r===3?["ccw"]:[],dx=x-3,q=0;q<Math.abs(dx);q++)ac.push(dx<0?"L":"R");ac.push("drop"),out.push({k,r,x,y:dropY(b,k,r,x,y0),spin:null,acts:ac})}return out}function planLite(st2,fast){st2.b.__r=null,st2.b.__s=null;var inc=0;(st2.incoming||[]).forEach(function(q){inc+=q.n});var opts=[{k:st2.cur,hold:!1}];if(!st2.held){var hk=st2.hold||st2.queue[0];hk&&hk!==st2.cur&&opts.push({k:hk,hold:!0})}for(var cands=[],best=null,bv=-1e9,tNear=!fast&&(st2.cur==="T"||st2.hold==="T"||st2.queue.slice(0,4).indexOf("T")>=0),o=0;o<opts.length;o++)for(var O=opts[o],ms=fast?drops(st2.b,O.k):moves(st2.b,O.k,spawnState(st2.b,O.k),500),i=0;i<ms.length;i++){var P=ms[i],r=place(st2.b,P.k,P.r,P.x,P.y),f=features(r.b),n=r.lines,sp=n&&P.spin;if(STYLE==="combo"){var cs=comboShape(r.b,f),dg=Math.max(0,f.maxH+inc-(VIS-(TALLL&&CSAFE?4:10))),ac=n?attackOf(sp==="T"?"T":sp?"X":null,n,st2.b2bN||0,st2.combo||0,r.pc):0,cb=st2.combo||0,vc=-6*f.holes-.6*f.cover-.3*cs.sb-6*cs.above-3*Math.abs(cs.resid-CWR)+(cs.resid===CWR&&!cs.above?2.5:0)+.55*Math.min(cs.ready,TALLL?16:11)-1.6*dg*dg+ac*1.2;if(n?vc+=1.5+.55*Math.min(cb,14)-(cb>0?1.8*(n-1):0):cb>0&&(vc-=4+.9*Math.min(cb,14)),n&&!cb&&!inc&&f.maxH<VIS-(TALLL?4:7)&&cs.ready<(TALLL?15:10)&&(vc-=(TALLL?9.5:7)-.6*cs.ready),inc&&n&&(vc+=Math.min(inc,n*2+ac)*.6),dangerH(f)+inc>VIS-3&&(vc-=20),cb>0||n){var nk=(O.hold,st2.queue[0]),hk2=O.hold?st2.cur:st2.hold||null,nb=(r.lines,r.b),nx=-9;[nk,hk2].forEach(function(k2){if(k2)for(var m2=drops(nb,k2),j2=0;j2<m2.length;j2++){var r2=place(nb,k2,m2[j2].r,m2[j2].x,m2[j2].y);if(r2.lines){var f2=features(r2.b),c2=comboShape(r2.b,f2),v2=4-6*f2.holes-3*Math.abs(c2.resid-CWR)-6*c2.above-1.8*(r2.lines-1);v2>nx&&(nx=v2)}}}),vc+=nx>-9?.8*nx:-(3+.6*cb)}vc>bv&&(bv=vc,best={hold:O.hold,P});continue}var v=-4*(OVH?f.cav*OVH+OVW*f.ovh:f.holes)-.5*f.cover-.32*f.bump-.03*f.agg-(f.maxH>9?.6*(f.maxH-9)*(f.maxH-9):0)-LCAN*f.canyon-.35*f.wells;if(STYLE==="quad"||STYLE==="tspin"){for(var wl=0,x=0;x<W;x++)x!==WELL&&(wl=Math.max(wl,f.h[x]));v+=-.6*Math.max(0,f.h[WELL]-Math.min(wl,f.h[WELL]+0))*(STYLE==="quad"?1:.4)}if(LITET&&tNear&&!inc&&(STYLE==="tspin"||STYLE==="quad")&&f.maxH<VIS-6){var ws=STYLE==="tspin"?1:.45;r.b.__s=null;var sl=slots(r.b,f.tp);if(sl.n>=2)v+=ws*(sl.n>=3?6:4.5)*LITET;else if(sl.r!==void 0){var need=sl.r===2?2:3,fill=Math.max(0,1-sl.miss/(need*6));v+=ws*(.6+2.6*fill*fill)*LITET}if(sl.n<2){var tb=tsdBuild(r.b,f.tp);v+=ws*.5*tb.v*LITET,tb.cov&&(v+=(OVH?4*OVW:4)+.5)}else v+=(OVH?4*OVW:4)+.5}var atk=n?attackOf(sp==="T"?"T":sp==="Tmini"?"Tmini":sp?"X":null,n,st2.b2bN||0,st2.combo||0,r.pc):0;v+=atk*1.6+(r.pc?20:0),n&&!atk&&!r.pc&&(v-=(STYLE==="combo"?-1.5:inc?0:1.2)*n),n===4&&STYLE==="quad"&&(v+=4),sp==="T"&&n>=2&&(v+=STYLE==="tspin"?6:3),P.k==="T"&&!(sp==="T"&&n)&&STYLE==="tspin"&&(v-=.8),inc&&n&&(v+=Math.min(inc,n*2)*.5),f.maxH+inc>VIS-3&&(v-=20),LITE2&&cands.push({v,hold:O.hold,P,r}),v>bv&&(bv=v,best={hold:O.hold,P})}if(LITE2&&!fast&&STYLE!=="combo"&&best&&st2.cur!=="T"&&(st2.queue[0]==="T"||st2.hold==="T"&&!st2.held)&&cands.length){cands.sort(function(a,c){return c.v-a.v});for(var top=cands.slice(0,6),b2=-1e9,pick=null,ci=0;ci<top.length;ci++){for(var C=top[ci],bb=C.r.b,tm=moves(bb,"T",spawnState(bb,"T"),400),tb=-1e9,ti=0;ti<tm.length;ti++){var TP=tm[ti],tr=place(bb,"T",TP.r,TP.x,TP.y),tn=tr.lines,tsp=tn&&TP.spin,tf=features(tr.b),tv=-4*(OVH?tf.cav*OVH+OVW*tf.ovh:tf.holes)-.5*tf.cover-.32*tf.bump-(tf.maxH>9?.6*(tf.maxH-9)*(tf.maxH-9):0)+1.6*(tn?attackOf(tsp==="T"?"T":tsp==="Tmini"?"Tmini":tsp?"X":null,tn,st2.b2bN||0,0,tr.pc):0)+(tsp==="T"&&tn>=2?6:0)-(tsp==="T"?0:.8);tv>tb&&(tb=tv)}var tot=C.v*.5+tb;tot>b2&&(b2=tot,pick=C)}pick&&(best={hold:pick.hold,P:pick.P})}return best}function*planGen(st2){if(st2.b.__r=null,st2.b.__s=null,TINY&&opt.lite)return planLite(st2,!0);if(opt.lite&&!(STYLE==="combo"&&opt.comboFull)){if(LITEOP&&st2.pieces===0&&!st2.openTried&&(st2.openTried=!0,STYLE!=="combo"&&(STYLE!=="quad"||G.seed%5<3))){var opL=yield*openerGen(st2.b,[st2.cur].concat(st2.queue.slice(0,7)),!0);opL&&(st2.openPlan=opL,st2.openerName=opL.name)}if(LITEOP&&st2.openPlan&&st2.openPlan.length){var oL=st2.openPlan.shift(),okL=oL.P.k===(oL.hold?st2.hold||st2.queue[0]:st2.cur),bmL=okL&&bookMove(st2.b,oL.P.k,oL.P);if(bmL)return{hold:oL.hold,P:bmL,opener:!0};st2.openPlan=null}return planLite(st2)}var inc=0;(st2.incoming||[]).forEach(function(q){inc+=q.n});var f0=features(st2.b),fh=f0.maxH;if(STRAT)if(BASE_STYLE==="combo"){var cs9=comboShape(st2.b,f0);STYLE==="combo"&&!st2.combo&&fh>=VIS-8&&cs9.ready<3&&!(SALV&&cs9.resid<=4&&fh<VIS-9&&!inc&&st2.comboEnd!=null&&st2.pieces-st2.comboEnd<=10)?STYLE="tspin":STYLE!=="combo"&&fh<=6&&(STYLE="combo")}else BASE_STYLE==="pc"&&(STYLE==="pc"&&fh>=8?STYLE="tspin":STYLE!=="pc"&&fh<=4&&(STYLE="pc"));for(var mode=STYLE==="pc"?"clean":st2.pieces<10&&st2.opener==="pc"&&!st2.lines&&!inc?"pc":"play",high=fh+inc>=VIS-9,opening=STYLE!=="pc"&&st2.pieces<14&&!inc&&!high,garb=0,gi=0;gi<st2.b.length;gi++)st2.b[gi]===8&&garb++;var tac="play";if(garb&&f0.holes&&fh+inc>=8&&(tac="dig"),THREAT.oppH+THREAT.oppInc>=VIS-6&&fh+inc<VIS-8&&(tac="kill"),WELL=WELL0,STYLE==="quad"&&opt.gwell!==!1&&st2.incoming&&st2.incoming.length&&fh<VIS-10&&(WELL=st2.incoming[0].hole),tac==="play"&&THREAT.oppH+THREAT.oppInc>=VIS-10&&(tac="press"),st2.tac=tac,st2.pieces===0&&!st2.openTried&&(st2.openTried=!0,STYLE!=="combo"&&(STYLE!=="quad"||G.seed%5<3))){var op=yield*openerGen(st2.b,[st2.cur].concat(st2.queue.slice(0,7)),!0);op&&(st2.openPlan=op,st2.openerName=op.name)}if(REOPEN&&!(st2.openPlan&&st2.openPlan.length)&&!inc&&st2.pieces>=8&&st2.pieces-(st2.reopenAt||-99)>=4&&STYLE!=="combo"&&tac==="play"&&!st2.target){for(var hs=f0.h,top=0,low=[],hx=0;hx<W;hx++)top=Math.max(top,hs[hx]);for(hx=0;hx<W;hx++)hs[hx]<top&&low.push(hx);if(top>0&&top<=VIS-12&&low.length<=1){st2.reopenAt=st2.pieces;var sb=shiftB(st2.b,top),rop=yield*openerGen(sb,[st2.cur].concat(st2.queue.slice(0,7)),!0,null,st2.held?null:st2.hold,low.length?low:null);rop&&(rop.forEach(function(z){z.P=Object.assign({},z.P,{y:z.P.y-top})}),st2.openPlan=rop,st2.openerName=rop.name,st2.stage2=null,st2.stagePin=null,st2.openShift=top,st2.openAt=st2.pieces,st2.reopened=(st2.reopened||0)+1)}}if((!st2.openPlan||!st2.openPlan.length)&&!inc&&STYLE!=="combo"&&tac!=="kill"&&(st2.openerName||REOPEN)&&st2.pieces!==st2.stageTried){st2.stageTried=st2.pieces;var last=(st2.stage2||st2.openerName||"").replace(" (early)",""),ms=stageMatch(st2.b,REOPEN?VIS-10:0);ms.sort(function(a,c){return(c.E.after===last)-(a.E.after===last)||(c.E.sp||0)-(a.E.sp||0)||a.sh-c.sh});var shs=[];ms.forEach(function(m){shs.indexOf(m.sh)<0&&shs.push(m.sh)});for(var si=0;si<shs.length&&si<2&&!(st2.openPlan&&st2.openPlan.length);si++){var osh=shs[si],e2=ms.filter(function(m){return m.sh===osh}).slice(0,14).map(function(m){return m.E}),op2=yield*openerGen(osh?shiftB(st2.b,osh):st2.b,[st2.cur].concat(st2.queue.slice(0,7)),!0,e2,st2.held?null:st2.hold);if(op2){osh&&op2.forEach(function(z){z.P=Object.assign({},z.P,{y:z.P.y-osh})});for(var bb2=st2.b,ok2=!0,z2=0;z2<op2.length&&ok2;z2++){var Z2=op2[z2].P,pz2=place(bb2,Z2.k,Z2.r,Z2.x,Z2.y);pz2.lines?ok2=!1:bb2=pz2.b}if(ok2&&op2.length===(op2.full||op2.length)){bb2.__s=null;var sl2=slots(bb2,tops(bb2));(sl2.r===void 0||sl2.n<2)&&(ok2=!1)}if(!ok2)continue;st2.openPlan=op2,st2.stage2=op2.name,st2.openShift=osh,st2.openAt=st2.pieces,st2.stages=(st2.stages||0)+1}}if(!(st2.openPlan&&st2.openPlan.length)&&st2.openerName&&st2.cur!=="T"&&st2.pieces-(st2.openAt||0)<40){var sl9=slots(st2.b,tops(st2.b));if(sl9.r!==void 0&&sl9.n>=2){for(var RB9=(st2.b.__r||rowsOf(st2.b)).slice(),sh9=ROT.T[sl9.r],FULL9=(1<<W)-1,cl9=[],q9=0;q9<4;q9++)RB9[sl9.y+sh9[q9][1]]|=1<<sl9.x+sh9[q9][0];for(var y9=0;y9<H;y9++)RB9[y9]===FULL9&&cl9.push(y9);if(cl9.length){var post=place(st2.b,"T",sl9.r,sl9.x,sl9.y).b,top9=Math.min.apply(null,cl9),n9=cl9.length,ms9=stageMatch(post,REOPEN?VIS-10:2);ms9.sort(function(a,c){return(c.E.after===last)-(a.E.after===last)||(c.E.sp||0)-(a.E.sp||0)||a.sh-c.sh});var shs9=[];ms9.forEach(function(m){shs9.indexOf(m.sh)<0&&shs9.push(m.sh)});for(var s9=0;s9<shs9.length&&s9<2&&!(st2.openPlan&&st2.openPlan.length);s9++){var o9=shs9[s9],e9=ms9.filter(function(m){return m.sh===o9}).slice(0,12).map(function(m){return m.E}),op9=yield*openerGen(o9?shiftB(post,o9):post,[st2.cur].concat(st2.queue.slice(0,7)),!0,e9,st2.held?null:st2.hold);if(op9){var ok9=!0,bb9=st2.b;if(op9.forEach(function(z){z.P=Object.assign({},z.P,{y:z.P.y-o9-n9});for(var shp=ROT[z.P.k][z.P.r],c9=0;c9<4;c9++)z.P.y+shp[c9][1]>=top9&&(ok9=!1)}),ok9)for(var z9=0;z9<op9.length&&ok9;z9++){var Z=op9[z9].P,pz=place(bb9,Z.k,Z.r,Z.x,Z.y);if(pz.lines){ok9=!1;break}bb9=pz.b}if(ok9){bb9.__s=null;var sl10=slots(bb9,tops(bb9));sl10.r===sl9.r&&sl10.x===sl9.x&&sl10.y===sl9.y&&sl10.n>=sl9.n||(ok9=!1)}ok9&&(st2.openPlan=op9,st2.stage2=op9.name,st2.openShift=o9||0,st2.openAt=st2.pieces,st2.stages=(st2.stages||0)+1,st2.preSpin=(st2.preSpin||0)+1)}}}}}}if(st2.openPlan&&st2.openPlan.length){var ostp=st2.openPlan.shift(),ok=ostp.P.k===(ostp.hold?st2.hold||st2.queue[0]:st2.cur),bm=ok&&bookMove(st2.b,ostp.P.k,ostp.P);if(bm)return{hold:ostp.hold,P:bm,opener:!0};st2.openPlan=null}if(st2.pcPlan&&st2.pcPlan.length){var stp=st2.pcPlan.shift();return{hold:stp.hold,P:stp.P,pc:!0}}if(st2.buildPlan&&st2.buildPlan.length){var bst=st2.buildPlan[0],bok=(st2.gadd||0)===st2.buildG&&bst.P.k===(bst.hold?st2.hold||st2.queue[0]:st2.cur),bbm=bok&&bookMove(st2.b,bst.P.k,bst.P);if(bbm&&(!bst.hold||!st2.held))return st2.buildPlan.shift(),{hold:bst.hold,P:bbm,build:!0};st2.buildPlan=null,st2.buildName=null}yield 0;var press=inc>=3||(THREAT.oppSpike||0)>=5||(THREAT.oppB2B||0)>=5;if(st2.target&&QUICK&&press&&tac!=="kill"&&(st2.target=null,st2.why="cash in",st2.quick=st2.pieces,st2.buildNext=0),st2.target&&(tac==="kill"||THREAT.oppH+THREAT.oppInc>=VIS-8||!QUICK&&(inc||(THREAT.oppSpike||0)>=5))&&(st2.target=null,st2.why="garbage/kill"),st2.quick!=null&&st2.pieces-st2.quick>10&&(st2.quick=null),st2.target&&st2.pieces-st2.targetAt>28&&(st2.target=null,st2.why="slow"),st2.target){var TNn=tgtNeed(st2.realB||st2.b,st2.target);TNn&&TNn.n<(st2.tgtBestN==null?99:st2.tgtBestN)&&(st2.tgtBestN=TNn.n,st2.tgtBestAt=st2.pieces),TNn&&TNn.n&&(st2.pieces-(st2.tgtBestAt||st2.targetAt)>5||!tgtFeasible(st2.realB||st2.b,st2.target,TNn))&&(st2.target=null,st2.why="stuck")}if(st2.target){var tstep=tgtStep(st2,Date.now()+12);if(tstep){var tbm=bookMove(st2.realB||st2.b,tstep.P.k,tstep.P);if(tbm)return{hold:tstep.hold,P:tbm,build:!0};st2.target=null,st2.why="bookmove"}}if(BUILD>=2&&!st2.target&&!inc&&fh<=VIS-12&&st2.pieces>=7&&!(st2.openPlan&&st2.openPlan.length)&&!(st2.buildPlan&&st2.buildPlan.length)&&tac==="play"&&st2.pieces>=(st2.tgtNext||0)&&st2.cur!=="T"){st2.tgtNext=st2.pieces+3;var calm=THREAT.oppH+THREAT.oppInc<VIS-11&&(THREAT.oppSpike||0)<4&&(THREAT.oppB2B||0)<4,tg=calm?tgtPick(st2.b):null;if(tg&&tg.n<=TGTN*(tg.S.chain?1.8:1)){st2.target={S:tg.S,x0:tg.x0,y0:tg.y0},st2.tgtBestN=tg.n,st2.tgtBestAt=st2.pieces,st2.targetG=st2.gadd||0,st2.targetAt=st2.pieces,st2.buildName="TST",st2.buildReady=!1,st2.targetN=tg.n;var ts0=tgtStep(st2,Date.now()+14);if(ts0){var tb0=bookMove(st2.b,ts0.P.k,ts0.P);if(tb0)return{hold:ts0.hold,P:tb0,build:!0}}st2.target=null}}if(yield 0,BUILD>0&&(!inc||st2.quick!=null)&&fh+(st2.quick!=null?inc:0)<=VIS-9&&st2.pieces>=7&&!(st2.openPlan&&st2.openPlan.length)&&!(st2.buildPlan&&st2.buildPlan.length)&&tac!=="kill"&&st2.pieces>=(st2.buildNext||0)){st2.buildNext=st2.pieces+2;var bseq=st2.queue.slice(0,6),hasT=st2.cur==="T"||st2.hold==="T"||bseq.indexOf("T")>=0;if(hasT){var bs=setupSolve(st2.b,st2.cur,st2.hold,bseq,!st2.held,TST3?3:2,Date.now()+(TST3?14:10));if(bs&&bs.steps.length&&(bs.L>=3||BUILD>=1)){st2.buildPlan=bs.steps.slice(1),st2.buildG=st2.gadd||0,st2.buildName=bs.L>=3?"TST":"TSD",st2.buildL=bs.L;var f1=bs.steps[0],bm1=bookMove(st2.b,f1.P.k,f1.P);if(bm1)return{hold:f1.hold,P:bm1,build:!0};st2.buildPlan=null}}}if(yield 0,STYLE==="pc"&&fh<=6){var lm=yield*pcLoopGen(st2,.05);if(lm)return st2.pcPlan=null,st2.pcP=lm.pcP,lm;st2.pcP=0}else if(STYLE!=="pc"&&opt.pcany!==!1&&fh<=4&&!inc&&st2.pieces>=7&&!(st2.openPlan&&st2.openPlan.length)){var lm2=yield*pcLoopGen(st2,st2.pcOn?.5:.9);if(st2.pcOn=!!lm2,lm2)return st2.pcPlan=null,lm2}if(yield 0,fh<=4){var sol=pcSolve(st2.b,st2.cur,st2.held?null:st2.hold,st2.queue.slice(0,5),STYLE==="pc"?22:st2.pieces<12?16:10);if(sol&&(!st2.held||!sol.some(function(z){return z.hold})))return st2.pcPlan=sol.slice(1),{hold:sol[0].hold,P:sol[0].P,pc:!0}}var seq=[st2.cur].concat(st2.queue.slice(0,6)),t0=st2.hold==="T"?0:seq.indexOf("T"),bagLeft=7;if(st2.all){var dn=st2.all.length-st2.queue.length;bagLeft=7-dn%7}var tFar=4;if(st2.all){for(var drawn=st2.all.length-st2.queue.length,p0=drawn+5,b0=Math.floor(p0/7)*7,seenT=!1,bi2=b0;bi2<p0;bi2++)st2.all[bi2]==="T"&&(seenT=!0);tFar=seenT?b0+7-p0+4:(b0+7-p0+1)/2}var D=high?2:STYLE!=="quad"&&t0>=2&&t0<=4?t0+1:3,BW=high?8:D>3?7:10,K=D>3?7:10,CF=opt.lite&&STYLE==="combo"&&opt.comboFull,DEP=CF?3:opt.depth!=null?opt.depth:5;DEP&&(D=high?Math.min(3,DEP):Math.min(DEP,seq.length),BW=CF?3:opt.bw||7,K=CF?4:opt.k||7);function nTs(hold,qi){for(var c=hold==="T"?1:0,i=qi;i<seq.length;i++)seq[i]==="T"&&c++;return NTB===1&&tFar<=6&&c++,NTB===2&&tFar<=6&&!inc&&fh<=8&&(THREAT.oppSpike||0)<3&&THREAT.oppH+THREAT.oppInc<VIS-8&&c++,NTB===3&&(c=1+(hold==="T"?1:0)+(bagLeft<=3?1:0)),Math.min(3,Math.max(1,c))}function tAt(hold,qi){if(hold==="T")return 0;for(var i=qi;i<Math.min(seq.length,6);i++)if(seq[i]==="T")return i-qi+1;return opt.bagT!==!1?Math.max(0,6-qi)+tFar:-1}function bagLeftAt(qi){var all=st2.all,n0=all?all.length-st2.queue.length:0,idx=n0-1+qi,rem="IJLOSTZ".split("");if(!all)return rem;for(var b02=Math.floor(idx/7)*7,i=b02;i<idx&&i<all.length;i++){var j2=rem.indexOf(all[i]);j2>=0&&rem.splice(j2,1)}return rem.length?rem:"IJLOSTZ".split("")}function bestPlace(N,k,hold,qi,d2){var ps=k==="T"?moves(N.b,k,spawnState(N.b,k),500):drops(N.b,k),best2=-1e9,bestN=null;if(ps.length>6){var qs=ps.map(function(P2){var r2=place(N.b,P2.k,P2.r,P2.x,P2.y);if(r2.lines||P2.spin)return{P:P2,q:1e9};var f=features(r2.b);return{P:P2,q:-4*(OVH?f.cav*OVH+OVW*f.ovh:f.holes)-.5*f.cover-.32*f.bump-.03*f.agg-LCAN*f.canyon}});qs.sort(function(a,c){return c.q-a.q});var kn=0;ps=qs.filter(function(o){return o.q===1e9||++kn<=6}).map(function(o){return o.P})}for(var ctx={mode,b2b:N.b2b,combo:N.combo,inc:N.inc,incSoon:0,high,tAt:-1,opening:!1,tac},g=Math.pow(.92,d2),i=0;i<ps.length;i++){var P=ps[i],r=place(N.b,P.k,P.r,P.x,P.y),rw=rewardOf(P,r,ctx),hard=r.lines===4||!!P.spin&&r.lines>0||r.pc,nb2b=r.lines?hard?(N.b2b|0)+1:0:N.b2b,ncombo=r.lines?N.combo+1:0,ninc=Math.max(0,N.inc-(r.lines?r.lines+Math.floor(attackOf(P.spin,r.lines,N.b2b,N.combo,r.pc)):0)),e=evalBoard(r.b,{mode,b2b:nb2b,combo:ncombo,inc:ninc,high,tAt:-1,nT:nTs(hold,qi),tac,holdK:hold}).s,R=N.R+rw*g;R+e>best2&&(best2=R+e,bestN={b:r.b,hold,qi:qi+1,b2b:nb2b,combo:ncombo,inc:ninc,R})}return{v:best2,n:bestN}}function specValue(N,d2){for(var rem=bagLeftAt(N.qi),tot=0,i=0;i<rem.length;i++){var k=rem[i],v=bestPlace(N,k,N.hold,N.qi,d2).v;if(N.hold&&N.hold!==k){var v2=bestPlace(N,N.hold,k,N.qi,d2).v;v2>v&&(v=v2)}tot+=v}return tot/rem.length}function bagValue(N,d2){if(!N.cur)return specValue(N,d2);var c1=bestPlace(N,N.cur,N.hold,N.qi,d2),best2=c1.n?specValue(c1.n,d2+1):-1e9;if(N.hold&&N.hold!==N.cur){var c2=bestPlace(N,N.hold,N.cur,N.qi,d2);if(c2.n){var v2=specValue(c2.n,d2+1);v2>best2&&(best2=v2)}}return best2}for(var beam=[{gq:(st2.incoming||[]).map(function(q){return{n:q.n,hole:q.hole}}),b:st2.b,hold:st2.hold,cur:st2.cur,qi:1,b2b:st2.b2bN||0,combo:st2.combo,inc,R:0,first:null,canHold:!st2.held}],done=[],d=0;d<D;d++){for(var next=[],bi=0;bi<beam.length;bi++)(function(N){var opts=[{k:N.cur,hold:N.hold,qi:N.qi,h:!1}];N.canHold!==!1&&(N.hold&&N.hold!==N.cur?opts.push({k:N.hold,hold:N.cur,qi:N.qi,h:!0}):!N.hold&&N.qi<seq.length&&opts.push({k:seq[N.qi],hold:N.cur,qi:N.qi+1,h:!0}));var lbN=STYLE==="tspin"&&LSTW&&!high&&!opening?lstBook(N.b):null;lbN&&lbN.bad&&(lbN=null),opts.forEach(function(O){if(O.k){var ps=moves(N.b,O.k,spawnState(N.b,O.k),d?500:1400),cand=[];if(lbN){var fp=ps.filter(function(P){return lstAllowed(lbN,P)});fp.length&&(ps=fp)}var ctx={salv:SALV&&STYLE==="combo"&&st2.comboEnd!=null&&st2.pieces-st2.comboEnd<=10&&(st2.comboPeak||0)>=3&&!inc&&fh<VIS-10,mode,b2b:N.b2b,combo:N.combo,inc:N.inc,incSoon:N.inc&&st2.incoming&&st2.incoming.length?st2.incoming[0].n:0,high,tAt:tAt(O.hold,O.qi),opening:opening&&tac==="play",tac},seenC={};if(ps=ps.filter(function(P){for(var sh=ROT[P.k][P.r],ks=[],q=0;q<4;q++)ks.push((P.y+sh[q][1])*W+P.x+sh[q][0]);ks.sort(function(a,b){return a-b});var key2=ks.join(",")+(P.spin||"");return seenC[key2]?!1:(seenC[key2]=1,!0)}),QUICKN&&ps.length>QUICKN){var qs=ps.map(function(P){var r=place(N.b,P.k,P.r,P.x,P.y);if(r.lines||P.spin)return{P,q:1e9};var f=features(r.b);return{P,q:-4*(OVH?f.cav*OVH+OVW*f.ovh:f.holes)-.5*f.cover-.32*f.bump-.03*f.agg-LCAN*f.canyon-(f.maxH>9?.6*(f.maxH-9)*(f.maxH-9):0)}});qs.sort(function(a,c){return c.q-a.q});var keepN=0;ps=qs.filter(function(o){return o.q===1e9?!0:++keepN<=QUICKN}).map(function(o){return o.P})}ps.forEach(function(P){var r=place(N.b,P.k,P.r,P.x,P.y),rw=rewardOf(P,r,ctx),hard=r.lines===4||!!P.spin&&r.lines>0||r.pc,nb2b=r.lines?hard?(N.b2b|0)+1:0:N.b2b,ncombo=r.lines?N.combo+1:0,ninc=Math.max(0,N.inc-(r.lines?r.lines+Math.floor(attackOf(P.spin,r.lines,N.b2b,N.combo,r.pc)):0)),rb=r.b,ngq=N.gq,dead=!1;if(COMBAT&&ngq&&ngq.length){if(r.lines){for(var can=r.lines+Math.floor(attackOf(P.spin,r.lines,N.b2b,N.combo,r.pc)),q2=[],gi2=0;gi2<ngq.length;gi2++){var gn=ngq[gi2].n;if(can>0){var cut=Math.min(can,gn);gn-=cut,can-=cut}gn>0&&q2.push({n:gn,hole:ngq[gi2].hole})}ngq=q2}else{for(var land=Math.min(8,ngq[0].n),hole=ngq[0].hole,gy=0;gy<land;gy++)for(var gx=0;gx<W;gx++)if(rb[gy*W+gx]){dead=!0;break}rb=rb.slice(W*land);for(var gr=0;gr<land;gr++)for(var gx2=0;gx2<W;gx2++)rb.push(gx2===hole?0:8);rb.__r=null,rb.__s=null,ngq=ngq[0].n>land?[{n:ngq[0].n-land,hole}].concat(ngq.slice(1)):ngq.slice(1)}ninc=0;for(var gk=0;gk<ngq.length;gk++)ninc+=ngq[gk].n}var ctx2={mode,b2b:nb2b,combo:ncombo,inc:ninc,high,tAt:tAt(O.hold,O.qi+1),nT:tac==="dig"&&!DIGS?0:nTs(O.hold,O.qi),tac,holdK:O.hold},e=evalBoard(rb,ctx2).s-(dead?1e5:0),R=N.R+rw*Math.pow(.92,d);cand.push({gq:ngq,b:rb,hold:O.hold,cur:seq[O.qi],qi:O.qi+1,b2b:nb2b,combo:ncombo,inc:ninc,R,score:R+e,first:N.first||{hold:O.h,P,s:0},canHold:!0,pc:r.pc})}),cand.sort(function(a,c){return c.score-a.score});for(var i=0;i<Math.min(K,cand.length);i++)next.push(cand[i])}})})(beam[bi]),yield 0;if(!next.length)break;next.sort(function(a,c){return c.score-a.score});for(var kept=[],seen={},tt={},j=0;j<next.length&&kept.length<BW;j++){for(var R0=next[j].b.__r||rowsOf(next[j].b),hk=next[j].hold+(next[j].b2b?"b":"")+next[j].qi,ty=H-1;ty>=0&&R0[ty];ty--)hk+=","+R0[ty];if(!tt[hk]){tt[hk]=1;var fk=next[j].first.P.x+","+next[j].first.P.y+","+next[j].first.P.r+","+next[j].first.hold;seen[fk]=(seen[fk]||0)+1,seen[fk]<=2&&kept.push(next[j])}}if(beam=kept,done=kept,beam.every(function(n){return!n.cur}))break}if(BAGX&&done.length>1&&!high&&tac!=="kill"){for(var LB=Math.min(BAGX,done.length),ex=[],li=0;li<LB;li++)ex.push({n:done[li],v:bagValue(done[li],D)}),yield 0;ex.sort(function(a,c){return c.v-a.v}),done=ex.map(function(e){return e.n}).concat(done.slice(LB))}var best=done[0];if(TGT&&best)for(var tried={},nt=0,di=0;di<done.length&&nt<6;di++){var D=done[di].first,key=D.P.x+","+D.P.y+","+D.P.r+","+D.P.k;if(!tried[key]){tried[key]=1,nt++;var pr0=place(st2.b,D.P.k,D.P.r,D.P.x,D.P.y),Nq=pr0.lines?null:tgtNeed(pr0.b,TGT);if(pr0.lines||Nq&&(!Nq.n||tgtFeasible(pr0.b,TGT,Nq))){best=done[di];break}}}return best?{hold:best.first.hold,P:best.first.P,s:best.score}:null}function tgtVirtual(b,Tg){for(var nb=b.slice(),S2=Tg.S,r=0;r<S2.h;r++)for(var c=0;c<S2.w;c++)if(S2.emp[r]>>c&1){var x=Tg.x0+c,y=Tg.y0+r;if(nb[y*W+x]=1,r===0)for(var ya=y-1;ya>=Math.max(0,Tg.y0-3);ya--)nb[ya*W+x]=1}return nb.__r=null,nb.__s=null,nb}function tgtForbid(Tg){for(var F=new Int32Array(H),S2=Tg.S,r=0;r<S2.h;r++)for(var c=0;c<S2.w;c++)if(S2.emp[r]>>c&1){var x=Tg.x0+c,y=Tg.y0+r;if(F[y]|=1<<x,r===0)for(var ya=y-1;ya>=Math.max(0,Tg.y0-3);ya--)F[ya]|=1<<x}return F}function*planWrap(st2){var res=yield*planWrap0(st2);if(res&&res.P&&!res.P.acts){var bb=st2.b;res.hold,res.P=Object.assign({},res.P,{acts:actsFor(bb,res.P)})}return res}function*planWrap0(st2){var set=!1;st2.target&&BUILD>=2&&(FORBID=tgtForbid(st2.target),TGT=st2.target,set=!0);try{return yield*planGen(st2)}finally{set&&(FORBID=null,TGT=null)}}function plan(st2){var it=planWrap(st2),r;do r=it.next();while(!r.done);return r.value}var st;function bag(){for(var a=NAMES.split(""),i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=a[i];a[i]=a[j],a[j]=t}return a}function reset(newSeed){newSeed!=null&&(G.seed=newSeed>>>0),rnd=mulberry(G.seed*2654435761),st={b:new Array(W*H).fill(0),pid:new Array(W*H).fill(0),queue:bag().concat(bag()),all:null,hold:null,held:!1,cur:null,pos:null,lastRot:!1,kick:-1,lines:0,score:0,pieces:0,tetrises:0,tspins:0,pcs:0,b2b:!1,combo:0,level:1,over:!1,pidN:0,pcPlan:null,callout:null,opener:STYLE==="pc"?"pc":STYLE==="tspin"?"tsd":rnd()<.3?"pc":"tsd",incoming:[],attack:0},st.all=st.queue.slice(),G.st=st}function refill(){if(st.queue.length<7){var nb=bag();st.queue=st.queue.concat(nb),st.all=st.all.concat(nb)}}function spawn(k){st.cur=k||st.queue.shift(),refill();var p=spawnState(st.b,st.cur,st.lastClear);return p?(st.pos=p,st.lastRot=!1,st.kick=-1,!0):(st.over=!0,!1)}function doHold(){if(st.held)return!1;var h=st.hold;return st.hold=st.cur,st.held=!0,spawn(h||null)}function act(a){var p=st.pos,k=st.cur;if(a==="L"||a==="R"){var nx=p.x+(a==="L"?-1:1);return fits(st.b,k,p.r,nx,p.y)?(p.x=nx,st.lastRot=!1,!0):!1}if(a==="DL"||a==="DR"){for(var dd=a==="DL"?-1:1,mv=!1;fits(st.b,k,p.r,p.x+dd,p.y);)p.x+=dd,mv=!0;return mv&&(st.lastRot=!1),mv}if(a==="flip"){var rf=rotate(st.b,k,p.r,p.x,p.y,2);return rf?(st.pos={r:rf.r,x:rf.x,y:rf.y},st.lastRot=!0,st.kick=rf.kick,!0):!1}if(a==="cw"||a==="ccw"){var r=rotate(st.b,k,p.r,p.x,p.y,a==="cw"?1:-1);return r?(st.pos={r:r.r,x:r.x,y:r.y},st.lastRot=!0,st.kick=r.kick,st.lastDir=a==="cw"?1:-1,!0):!1}if(a==="down"||a==="SD1")return fits(st.b,k,p.r,p.x,p.y+1)?(p.y++,st.lastRot=!1,st.score+=1,!0):!1;if(a==="SD"){var y0=dropY(st.b,k,p.r,p.x,p.y);return y0!==p.y&&(st.score+=y0-p.y,p.y=y0,st.lastRot=!1),!0}if(a==="drop"){var y=dropY(st.b,k,p.r,p.x,p.y);return y!==p.y&&(st.lastRot=!1),st.score+=2*(y-p.y),p.y=y,!0}return!1}function lock(){var p=st.pos,s=ROT[st.cur][p.r],id=1+st.pidN++%240,vis=!1;st.spin=spinOf(st.b,st.cur,p,st.lastRot,st.kick);for(var i=0;i<4;i++){var j=(p.y+s[i][1])*W+p.x+s[i][0];st.b[j]=NAMES.indexOf(st.cur)+1,st.pid[j]=id,p.y+s[i][1]>=BUF&&(vis=!0)}st.b.__r=null,st.b.__s=null,st.pieces++,st.held=!1,st.cur=null,st.lastClear=!1;for(var rows=[],y=0;y<H;y++){for(var f=!0,x=0;x<W;x++)if(!st.b[y*W+x]){f=!1;break}f&&rows.push(y)}return rows.length||(st.combo>=2&&(st.comboEnd=st.pieces,st.comboPeak=st.combo),st.combo=0,st.spin&&(st.callout={text:st.spin==="T"?"T-SPIN":st.spin==="Tmini"?"T-SPIN MINI":st.spin+"-SPIN",big:!1},st.spin==="T"&&st.tspins++)),rows}var NUM=["","SINGLE","DOUBLE","TRIPLE","QUAD"];function clearRows(rows){var n=rows.length;if(n){if(st.lastClear=!0,st.openPlan&&st.openPlan.length&&st.openPlan.forEach(function(z){for(var dn=0,cj=0;cj<rows.length;cj++)rows[cj]>z.P.y&&dn++;dn&&(z.P=Object.assign({},z.P,{y:z.P.y+dn}))}),st.target)for(var T0=st.target,ci=0;ci<rows.length&&st.target;ci++)rows[ci]>T0.y0+T0.S.h-1?T0.y0++:rows[ci]>=T0.y0&&(st.target=null);var gRows=0;rows.forEach(function(y2){for(var x2=0;x2<W;x2++)if(st.b[y2*W+x2]===8){gRows++;break}});for(var keepB=[],keepP=[],y=0;y<H;y++)rows.indexOf(y)<0&&(keepB.push(st.b.slice(y*W,y*W+W)),keepP.push(st.pid.slice(y*W,y*W+W)));st.b=[],st.pid=[];for(var e=0;e<n;e++)for(var x=0;x<W;x++)st.b.push(0),st.pid.push(0);keepB.forEach(function(r){st.b=st.b.concat(r)}),keepP.forEach(function(r){st.pid=st.pid.concat(r)});var sp=st.spin,pts,words=[],pc=st.b.every(function(v){return!v}),hard=n===4||!!sp||pc;sp==="T"?(pts=[400,800,1200,1600][n],words.push("T-SPIN "+NUM[n]),st.tspins++):sp==="Tmini"?(pts=[100,200,400][n]||400,words.push("T-SPIN MINI "+NUM[n])):sp?(pts=[100,200,400,600][n],words.push(sp+"-SPIN MINI "+NUM[n])):(pts=[0,100,300,500,800][n],words.push(n===4?"TETRIS":NUM[n]),n===4&&st.tetrises++);var prevN=st.b2bN||0,surge=0,elig=n===4||!!sp;hard&&prevN>0&&(pts*=1.5,words.unshift("BACK-TO-BACK"+(prevN>=2?" \xD7"+prevN:""))),hard?st.b2bN=prevN+1:(prevN>4&&(surge=prevN-1),st.b2bN=0),st.b2b=st.b2bN>0,st.combo++,st.combo>1&&words.push(st.combo-1+" COMBO"),pc&&(pts+=[0,800,1200,1800,2e3][n],words.unshift("PERFECT CLEAR"),st.pcs++),st.score+=Math.round(pts*st.level)+(st.combo>1?50*(st.combo-1)*st.level:0),st.lines+=n,st.level=1+Math.floor(st.lines/10);var base=sp==="T"?[0,2,4,6,10][n]:[0,0,1,2,4][n];hard&&prevN>0&&(base+=1);var cmb=st.combo-1,raw=base;cmb>0&&(raw*=1+.25*cmb,cmb>1&&(raw=Math.max(raw,Math.log(1+1.25*cmb))));var spec=gRows>0&&elig?1:0;st.sendParts={surge,raw,spec,pc};var atk=Math.floor(raw)+spec;st.attack=atk+(pc?5:0)+surge,st.surgeOut=surge,surge&&words.push("SURGE "+surge),st.callout={text:words.join(" \xB7 "),big:pc||sp==="T"||n===4,atk:st.attack}}}function addGarbage(n,hole,pid){st.gadd=(st.gadd||0)+1,st.target&&(st.target={S:st.target.S,x0:st.target.x0,y0:st.target.y0-n},st.targetG=st.gadd,st.target.y0<0&&(st.target=null,st.why="pushed out")),st.buildPlan&&st.buildPlan.length&&st.buildG===st.gadd-1&&(st.buildPlan.forEach(function(z){z.P=Object.assign({},z.P,{y:z.P.y-n})}),st.buildG=st.gadd),st.openShift!=null?st.openShift+=n:st.openShift=n,st.openPlan&&st.openPlan.forEach(function(z){z.P=Object.assign({},z.P,{y:z.P.y-n})});for(var i=0;i<W*n;i++)st.b[i]&&(st.over=!0);st.b=st.b.slice(W*n),st.pid=st.pid.slice(W*n);for(var r=0;r<n;r++)for(var x=0;x<W;x++)st.b.push(x===hole?0:8),st.pid.push(x===hole?0:pid);return!st.over}G.addGarbage=addGarbage;function ghostY(){return dropY(st.b,st.cur,st.pos.r,st.pos.x,st.pos.y)}return G.spinNow=function(){return st.cur&&st.pos?spinOf(st.b,st.cur,st.pos,st.lastRot,st.kick):null},G.setTiny=function(v){TINY=!!v},G.quickPlan=function(){return planLite(st,!0)},G.ROT=ROT,G.setOppd=function(v){OPPD=v},G.setDeep=function(v){v?(opt.bw=14,opt.k=11):(delete opt.bw,delete opt.k)},G.setTst3=function(v){TST3=v},G.fitsAt=function(r,x,y){return!!st.cur&&fits(st.b,st.cur,r,x,y)},G.setComboWell=function(c0,c1){CW0=c0,CW1=c1,CWR=c1-c0,CSAFE=c0<=4&&c1>=5},opt.cwell&&G.setComboWell(opt.cwell[0],opt.cwell[1]),G.setLite=function(v){opt.lite=!!v},G.setComboFull=function(v){opt.comboFull=!!v},G.setupScan=function(){for(var b=st.b,rows=b.__r||rowsOf(b),tp=tops(b),FULL=(1<<W)-1,hits=[],seen={},i=0;i<SETUPS.length;i++){var S2=SETUPS[i],xs=0,xe=W-S2.w;S2.wl&&(xe=0),S2.wr&&(xs=W-S2.w);for(var x0=xs;x0<=xe;x0++){for(var lt=H,cx=x0;cx<x0+S2.w;cx++)lt=Math.min(lt,tp[cx]);for(var yT=S2.tr[0],y0=Math.max(0,lt-yT-1);y0<=Math.min(H-S2.h,lt-yT+2);y0++){for(var ok=!0,f=0,r=0;r<S2.h;r++){var row=rows[y0+r]>>x0;if(row&S2.emp[r]){ok=!1;break}f+=pop(row&S2.fill[r])}if(ok){var miss=S2.fc-f;if(!(miss>3)){for(var out=FULL&~((1<<S2.w)-1<<x0),rm=0,k=0;k<S2.tr.length;k++)rm+=pop(out&~rows[y0+S2.tr[k]]);if(!(miss+rm>12)){var key=y0+yT+","+x0;if(!(seen[key]&&seen[key].M<=miss+rm)){var h={L:S2.L,y:y0+yT,x:x0,miss,M:miss+rm};seen[key]=h,hits.push(h)}}}}}}}hits=hits.filter(function(h2){return seen[h2.y+","+h2.x]===h2});var ys={};return hits.forEach(function(h2){ys[h2.y]=1}),{n:hits.length,tst:hits.some(function(h2){return h2.L>=3}),stack:Object.keys(ys).length>=2,ready:hits.some(function(h2){return h2.miss===0&&h2.M<=4}),hits}},G.setReopen=function(v){REOPEN=v},G.setReady=function(v){READY=v},G.setTiming=function(v){TIMING=v},G.setSurge=function(v){SURGE=v},G.setFlair=function(v){FLAIR=v},G.coolOf=coolOf,G.setHoldv=function(v){HOLDV=v},G.setStrat=function(v){STRAT=v},G.setDig=function(c,sp){c!=null&&(DIGC=c),sp!=null&&(DIGS=sp)},G.setSetups=function(setw,tstw,l3m,build){setw!=null&&(SETW=setw),tstw!=null&&(TSTW=tstw),l3m!=null&&(L3M=l3m),build!=null&&(BUILD=build)},G.ffMove=function(){var P=planLite(st,!0);return!P||P.hold&&!doHold()?!1:(st.pos={r:P.P.r,x:P.P.x,y:P.P.y},st.lastRot=!1,!0)},G.reset=reset,G.spawn=spawn,G.doHold=doHold,G.act=act,G.lock=lock,G.clearRows=clearRows,G.plan=function(){return plan(st)},G.planIter=function(){return planWrap(st)},G._dbg={score1:function(b,P,hold,nT,b2b,combo,inc){var r=place(b,P.k,P.r,P.x,P.y),ctx={mode:"play",b2b,combo,inc,incSoon:0,high:!1,tAt:-1,opening:!1,tac:"play"},rw=rewardOf(P,r,ctx),hard=r.lines===4||!!P.spin&&r.lines>0||r.pc,nb2b=r.lines?hard?(b2b|0)+1:0:b2b,ncombo=r.lines?combo+1:0,ninc=Math.max(0,inc-(r.lines?r.lines+Math.floor(attackOf(P.spin,r.lines,b2b,combo,r.pc)):0));return rw+evalBoard(r.b,{mode:"play",b2b:nb2b,combo:ncombo,inc:ninc,high:!1,tAt:-1,nT,tac:"play",holdK:hold}).s},setWT:function(o){for(var k in o)WT[k]=o[k]},tgtPick:function(b){return tgtPick(b)},tgtNeed:function(b,T){return tgtNeed(b,T)},tgtFeasible:function(b,T,N){return tgtFeasible(b,T,N)},tgtRoofOK:function(b,T,N){return tgtRoofOK(b,T,N)},LIB:function(){return{S:SETUPS,C:CHAINS}},slots:function(b){return slots(b,tops(b))},moves,spawnState,place,features,ROT,openerPlan,setOpeners:function(a){OPENERS=a}},G.ghostY=ghostY,G.fits=fits,G.place=place,G.moves=moves,reset(),G}function ScanTetris(ad,opt){opt=opt||{};var gl=ad.gl,prog=ad.prog(SCAN_BODY),seed0=opt.seed!=null?opt.seed>>>0:((Date.now()^Math.floor(Math.random()*1e9))>>>0)%1e6,round=0;function mk(style,name,tempo){return{tw:0,twv:0,tempo,g:ScanTetrisGame({seed:seed0,style}),style,name,mode:"spawn",at:0,acts:[],lastAct:"",flash:null,overAt:-1,bump:0,wins:0,call:null,callT:-9,sent:0}}var STYLES=["tspin","quad","pc","combo"],TEMPO=opt.tempo||{tspin:1,quad:1,pc:1.02,combo:1},PL=[mk("tspin","A",1),mk("quad","B",1)],hs=(seed0*7+13)%2147483647||1;function hrnd(){return hs=hs*16807%2147483647,hs/2147483647}var view=opt.view||0,roundOverAt=-1,gpid=0,roundStart=0,thought=!1;pickStyles(),PL.forEach(function(c){c.g.reset(seed0)});var SWmax=44,SH=PL[0].g.VIS+4,sheet=new Uint8Array(SWmax*SH*4),tex=gl.createTexture(),SW=22,texW=0;gl.bindTexture(gl.TEXTURE_2D,tex),gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST),gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST),gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE),gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);var inks=opt.inks||0,startT=null,last=0,px=.5,py=.5,lit=0;function setCell(x,y,t,pid,flag,fl){if(!(x<0||y<0||x>=SW||y>=SH)){var j=(y*SW+x)*4;sheet[j]=t,sheet[j+1]=pid,sheet[j+2]=flag,sheet[j+3]=fl}}function paintPlayer(c,ox,t){var g=c.g,st=g.st,ov=c.overAt>=0?Math.min(1,(t-c.overAt)/.6):0,WX=ox+6;function bs(y2){return 1+(g.H-1-y2)}function shape(k,x0,top,pid,flag){var s2=g.ROT[k][0],mx=9,my=9;s2.forEach(function(q){mx=Math.min(mx,q[0]),my=Math.min(my,q[1])}),s2.forEach(function(q){setCell(x0+q[0]-mx,top-(q[1]-my),g.NAMES.indexOf(k)+1,pid,flag,0)})}for(var y=0;y<g.H;y++)for(var x=0;x<g.W;x++){var v=st.b[y*g.W+x];if(v){var fl=0;c.flash&&c.flash.rows.indexOf(y)>=0&&(fl=Math.round(255*Math.min(1,Math.sin(Math.min(1,(t-c.flash.t)/c.flash.d)*Math.PI)*1.2))),ov&&(fl=Math.round(255*ov*.8)),setCell(WX+x,bs(y),v,st.pid[y*g.W+x],0,fl)}}if(st.cur&&st.pos&&!st.over&&(c.mode==="move"||c.mode==="think")){var gy=g.ghostY(),s=g.ROT[st.cur][st.pos.r],ti=g.NAMES.indexOf(st.cur)+1;gy!==st.pos.y&&s.forEach(function(q){setCell(WX+st.pos.x+q[0],bs(gy+q[1]),ti,249,1,0)}),s.forEach(function(q){setCell(WX+st.pos.x+q[0],bs(st.pos.y+q[1]),ti,248,0,0)})}st.hold&&shape(st.hold,ox+1,SH-5,250,st.held?2:0);for(var i=0;i<5;i++)shape(st.queue[i],ox+17,SH-5-i*3,251+i,0)}function inc(c){var n=0;return c.g.st.incoming.forEach(function(q){n+=q.n}),n}function hot(c,t){return c.g.st.incoming.some(function(q){return q.ready<=t})?1:0}function ko(c,t){c.mode="over",c.overAt=t,roundOverAt=t;var o=PL[c===PL[0]?1:0];o.wins++,o.mode="won",o.call={text:"K.O.",big:!0},o.callT=t}function speed(c){return c.tempo/(1+(c.g.st.level-1)*.06)}function step(c,o,t,hurry){var g=c.g,st=g.st;if(c.mode==="spawn"&&t>=c.at&&!thought){thought=!0;for(var of=o.g.st,oh=0,oy=0;oy<o.g.H;oy++){for(var any=!1,ox=0;ox<o.g.W;ox++)if(of.b[oy*o.g.W+ox]){any=!0;break}if(any){oh=o.g.H-oy;break}}if(g.setThreat({oppH:oh,oppInc:inc(o)}),g.spawn())c.it=g.planIter(),c.mode="think",c.thinkT=t;else{ko(c,t);return}}if(c.mode==="think"){var tn=typeof performance<"u"?performance.now():Date.now(),lim=tn+(hurry?40:4),r;do r=c.it.next();while(!r.done&&(typeof performance<"u"?performance.now():Date.now())<lim);if(r.done){var P=r.value;c.it=null,c.acts=[],P?(P.hold&&c.acts.push("hold"),c.acts=c.acts.concat(P.P.acts)):c.acts=["drop"],c.mode="move",c.at=Math.max(t,c.thinkT+.13*speed(c)),c.lastAct=""}}if(c.mode==="move"){if(hurry)for(;c.acts.length&&c.acts[0]!=="drop";){var a0=c.acts.shift();a0==="hold"?g.doHold():a0==="SD"?g.act("SD"):g.act(a0)}for(;c.mode==="move"&&t>=c.at&&c.acts.length;){var a=c.acts.shift();if(a==="hold"){if(!g.doHold()){ko(c,t);return}c.at=t+.1*speed(c),c.lastAct=a;continue}if(a==="SD"){if(g.act("SD1")){c.acts.unshift("SD"),c.at=t+.024,c.lastAct=a;break}continue}if(a==="DL"||a==="DR"){var a1=a==="DL"?"L":"R";if(g.act(a1)){c.acts.unshift(a),c.at=t+(c.lastAct===a?.022:.11)*speed(c),c.lastAct=a;break}continue}var ok=g.act(a);if(ok&&(a==="cw"||a==="ccw")&&g.spinNow()&&(c.twv+=(a==="cw"?1:-1)*4.4),!ok&&(a==="L"||a==="R")&&(c.acts=c.acts.filter(function(x){return x!=="L"&&x!=="R"})),a==="drop"){var rows=g.lock();if(c.bump=Math.min(1,c.bump+.7),st.over){ko(c,t);return}if(st.callout&&!rows.length&&(c.call=st.callout,c.callT=t,st.callout=null),rows.length)c.flash={rows,t,d:rows.length>=3||st.spin?.42:.28},c.mode="clear",c.at=t+c.flash.d;else{for(var cap=8;cap>0&&st.incoming.length&&st.incoming[0].ready<=t;){var q=st.incoming[0],n=Math.min(cap,q.n);if(q.n-=n,cap-=n,q.n<=0&&st.incoming.shift(),!g.addGarbage(n,q.hole,241+gpid++%7)){ko(c,t);return}}c.mode="spawn",c.at=t+.1*speed(c)}break}var das=a===c.lastAct&&(a==="L"||a==="R");c.at=t+(das?.032:a==="cw"||a==="ccw"?.07:.085)*speed(c),c.lastAct=a}c.mode==="move"&&!c.acts.length&&(c.acts=["drop"])}if(c.mode==="clear"&&t>=c.at){g.clearRows(c.flash.rows),c.flash=null;var atk=st.attack||0;st.attack=0,st.callout&&(c.call=st.callout,c.callT=t,st.callout=null);var sp=st.sendParts||{surge:0,raw:atk,spec:0,pc:!1};st.sendParts=null;var el=t-roundStart,mult=el<180?1:1+.008*(el-180),parts=[];if(sp.surge){var sg=Math.floor(sp.surge*mult),ch=Math.floor(sg/3+.5);parts.push(ch,ch,Math.max(0,sg-2*ch))}parts.push(Math.floor(sp.raw*mult)+sp.spec),sp.pc&&parts.push(Math.floor(5*mult)),parts.forEach(function(amt){if(!(amt<=0)){for(var bonus=st.pieces<=14&&inc(c)>=c.sent?amt:0;(amt>0||bonus>0)&&st.incoming.length;)amt>0?amt--:bonus--,--st.incoming[0].n<=0&&st.incoming.shift();amt>0&&o.mode!=="over"&&(o.g.st.incoming.push({n:amt,hole:Math.floor(hrnd()*10),ready:t+.333}),c.sent+=amt)}}),c.mode="spawn",c.at=t+.08*speed(c)}}function pickStyles(){var nS=STYLES.length,a=Math.floor(hrnd()*nS),b=(a+1+Math.floor(hrnd()*(nS-1)))%nS;opt.pair&&(a=STYLES.indexOf(opt.pair[0]),b=STYLES.indexOf(opt.pair[1])),[a,b].forEach(function(k,i){var c=PL[i];c.style=STYLES[k],c.g.setStyle(c.style);var M=c.style==="quad"?[9,0,6,3,7,2]:c.style==="tspin"?[9,0]:[9];c.well=M[Math.floor(hrnd()*M.length)],c.g.setWell(c.well),c.tempo=TEMPO[c.style]*(i===round%2?1.04:1)})}function newRound(t){round++,pickStyles(),PL.forEach(function(c){c.g.reset(seed0+round),c.mode="spawn",c.at=t+.7,c.flash=null,c.overAt=-1,c.acts=[],c.sent=0,c.call=null}),roundOverAt=-1,roundStart=t}function statOf(c,t){var s=c.g.st;return{name:c.name,style:c.style,method:c.style==="quad"||c.style==="tspin"?c.well+"-"+(9-c.well):"",tac:c.g.st.tac||"play",wins:c.wins,score:s.score,lines:s.lines,level:s.level,pieces:s.pieces,tetrises:s.tetrises,tspins:s.tspins,pcs:s.pcs,sent:c.sent,incoming:inc(c),callout:c.call&&t-c.callT<2.2?c.call.text:"",atk:c.call&&c.call.atk||0}}return{inks:function(k){inks=k},view:function(k){if(k==null)return view;view=k},reset:function(){newRound(last)},status:function(){var el=last-roundStart;return{mult:el<90?1:1+(el-90)/70,seed:seed0+round,round:round+1,view,a:statOf(PL[0],last),b:statOf(PL[1],last)}},stats:function(){var c=PL[view===1?1:0],s=c.g.st,el=Math.max(1,last-(startT||last));return{score:s.score,lines:s.lines,level:s.level,pieces:s.pieces,tetrises:s.tetrises,tspins:s.tspins,pcs:s.pcs,pps:s.pieces/el}},frame:function(t,ptr){startT===null&&(startT=t,roundStart=t,PL[0].at=PL[1].at=t+.5);var dt=Math.min(.05,t-last||0);last=t;var hurry=ptr&&ptr.pressed;thought=!1,roundOverAt<0?(step(PL[0],PL[1],t,hurry&&view!==1),roundOverAt<0&&step(PL[1],PL[0],t,hurry&&view!==0)):t-roundOverAt>2.6&&newRound(t);var show=view===2?[0,1]:[view];SW=view===2?44:22,sheet.fill(0),show.forEach(function(i,k){paintPlayer(PL[i],k*22,t)}),gl.bindTexture(gl.TEXTURE_2D,tex),texW!==SW?(gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,SW,SH,0,gl.RGBA,gl.UNSIGNED_BYTE,sheet.subarray(0,SW*SH*4)),texW=SW):gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,SW,SH,gl.RGBA,gl.UNSIGNED_BYTE,sheet.subarray(0,SW*SH*4)),PL.forEach(function(c){for(var k=0;k<6;k++){var h=dt/6;c.twv+=(-900*c.tw-34*c.twv)*h,c.tw+=c.twv*h}c.tw=Math.max(-.055,Math.min(.055,c.tw))});var bump=0,dz=[0,0],mt=[[0,0],[0,0]],tw=[0,0];show.forEach(function(i,k){var c=PL[i];c.bump*=Math.pow(5e-4,dt),bump=Math.max(bump,c.bump);for(var g=c.g,dg=0,x=0;x<g.W;x++)for(var y=0;y<g.H;y++)if(g.st.b[y*g.W+x]){dg=Math.max(dg,g.H-y);break}dz[k]=Math.max(0,Math.min(1,(dg+inc(c)-(g.VIS-6))/5)),mt[k]=[inc(c),hot(c,t)],tw[k]=c.tw}),PL.forEach(function(c){show.indexOf(PL.indexOf(c))<0&&(c.bump*=Math.pow(5e-4,dt))});var tin=ptr&&ptr.in?1:0;lit+=(tin-lit)*Math.min(1,dt*6),ptr&&ptr.in&&(px=ptr.x,py=ptr.y);var shv=new Float32Array(12);show.forEach(function(i,k){var st=PL[i].g.st,W=function(n){return n?n==="I"?0:n==="O"?1:.5:0};shv[k*6]=W(st.hold);for(var j=0;j<5;j++)shv[k*6+1+j]=W(st.queue[j])}),ad.use(prog),ad.arr(prog,"slotSh",shv,1),ad.run(prog,{anchor:opt.anchor||[.5,.5],fill:(opt.fill||1)*(view===2&&opt.fill2||1),sheet:tex,sheetN:[SW,SH],wellR:[6,1,10,20],wellR2:view===2?[28,1,10,20]:[0,0,0,0],meter1:mt[0],meter2:mt[1],twist1:tw[0],twist2:tw[1],danger:dz[0],danger2:dz[1],now:t,ptr:[px,py],ptrIn:lit,inks,bump:Math.sin(bump*3.1416)*bump})}}}typeof module<"u"&&(module.exports={ScanTetrisGame});

window.ScanTetrisGame=ScanTetrisGame;
