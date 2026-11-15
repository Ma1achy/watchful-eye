// Value noise for the paper and the ink.
float sc_h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float sc_n(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(sc_h(i),sc_h(i+vec2(1,0)),u.x),mix(sc_h(i+vec2(0,1)),sc_h(i+vec2(1,1)),u.x),u.y)*2.-1.; }
float sc_f(vec2 p){ return (sc_n(p)+.5*sc_n(p*2.03+7.)+.25*sc_n(p*4.1+3.))/1.75; }
