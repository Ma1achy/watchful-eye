#version 300 es
// Common to every fragment shader: the full-screen pass, hashes and noise.
precision highp float; in vec2 uv; out vec4 fragColor; uniform vec2 res; uniform float u_seed;
#define px (1./res)
float lum(vec3 c){ return dot(c,vec3(.299,.587,.114)); }
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x),u.y); }
float fbm(vec2 p, float oct){ float a=.5,s=0.,n=0.; for(int i=0;i<8;i++){ if(float(i)>=oct) break; s+=a*vnoise(p); n+=a; p=p*2.03+17.1; a*=.5; } return s/n; }
vec2 rot2(vec2 v,float a){ float c=cos(a),s=sin(a); return vec2(c*v.x-s*v.y,s*v.x+c*v.y); }
