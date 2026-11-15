// Far away: what a pixel covering several cells averages to.
vec4 farSample(vec2 w){ vec2 l; if(!pickB(w,l)) return vec4(0.); float fa=AL; ivec4 m=cellAt(ivec2(floor(l+vec2(0.,CDROP))));
  float wall=0.; { vec2 q=l; bool s2=q.x>=22.; float x0=s2?28.:6.; if(q.y>.6&&q.y<21.&&(abs(q.x-(x0-.3))<.3||abs(q.x-(x0+10.3))<.3)) wall=1.; if(q.y>.6&&q.y<.9&&q.x>x0-.6&&q.x<x0+10.6) wall=1.; }
  if(m.r>0) return vec4(inkOf(m.r),(m.b==1?.3:.9)*fa); return vec4(vec3(70,112,100)/255.,wall*.8*fa); }
