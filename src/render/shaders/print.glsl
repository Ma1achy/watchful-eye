// Laying ink on the paper, and the far and middle prints.
vec3 printInk(vec3 col,vec3 ink,float cov,vec2 p,float ph,float P){ if(cov<=.001) return col;
  float ragged=sc_n(p/(csd*.058))*.022+sc_n(p/(csd*.7)+5.)*.04;
  float half_=clamp(pow(cov,1.25)*.42+ragged*step(.04,cov),0.,.5);
  float a=clamp((half_-abs(ph))*P/1.6,0.,1.);
  float dn=.86+.10*sc_n(p/(csd*.47)+11.)+.05*sc_n(p/(csd*.09)+13.);
  float halo=clamp((half_+.10-abs(ph))*P/5.,0.,1.)*.10;
  return mix(col,ink,clamp(a*dn,0.,1.))+ink*halo*(1.-a); }
vec3 midShade(vec3 col,vec2 w,float cs,vec2 p,float ph,float P){ vec4 acc=vec4(0.); float k=.5/cs;
  for(int i=0;i<4;i++){ vec2 o=(vec2(float(i&1),float(i>>1))-.5+vec2(.125,-.125)*(float(i)-1.5))*k; vec4 s=midSample(w+o,cs); acc+=vec4(s.rgb*s.a,s.a); }
  vec3 ink=acc.a>0.?acc.rgb/acc.a:col; return printInk(col,ink,acc.a/4.,p,ph,P); }
vec3 farShade(vec3 col,vec2 w,float cs,vec2 p,float ph,float P){ vec4 acc=vec4(0.); float k=.5/cs;
  for(int i=0;i<4;i++){ vec2 o=(vec2(float(i&1),float(i>>1))-.5)*k; vec4 s=farSample(w+o); acc+=vec4(s.rgb*s.a,s.a); }
  vec3 ink=acc.a>0.?acc.rgb/acc.a:col; return printInk(col,ink,acc.a/4.*clamp((cs-.035)/.06,0.,1.),p,ph,P); }
