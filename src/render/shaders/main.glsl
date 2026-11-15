// Each pixel: the paper and its lines, then the three prints cross-faded by scale.
vec4 run(){
  vec2 p=uv*res; float cs=cam.z; vec2 A=anchor*res;
  float P=max(4.,csd/4.3);
  vec2 mp=ptr*res; float pr=length(p-mp)/(csd*3.2); float near=ptrIn*exp(-pr*pr);
  float yy=p.y, ph=fract(yy/P+.5)-.5;
  float mott=(sc_f(p/(csd*1.6))*7.+sc_f(p/(csd*.3))*3.+(sc_h(floor(p))-.5)*4.4)/255.;
  vec3 ground=vec3(42,45,43)/255.+mott; vec3 col=ground;
  float dens=(.75+.25*sc_f(p/(csd*1.05)+3.))*(1.+.9*near);
  col+=clamp(1.-abs(ph)/.055,0.,1.)*dens*(vec3(58,128,118)/255.-ground)*.85;
  col+=clamp(1.-abs(abs(ph)-.5)/.04,0.,1.)*(.5+.5*sc_f(p/(csd*.8)+9.))*(vec3(92,44,54)/255.-ground)*.35;
  vec2 w=(p-A)/cs+cam.xy;
  // three prints of the same thing, cross-faded by size: far (a pixel is a few cells: their average), middle (cells a few
  // pixels: flat, outlined), near (the full chiselled, striped print). No hard switch anywhere
  if(cs<2.) col=farShade(col,w,cs,p,ph,P);
  else if(cs<3.6) col=mix(farShade(col,w,cs,p,ph,P),midShade(col,w,cs,p,ph,P),smoothstep(2.,3.6,cs));
  else if(cs<6.) col=midShade(col,w,cs,p,ph,P);
  else if(cs<10.) col=mix(midShade(col,w,cs,p,ph,P),nearShade(col,p,w,cs,P,ph,yy,mp),smoothstep(6.,10.,cs));
  else col=nearShade(col,p,w,cs,P,ph,yy,mp);
  if(sc_h(floor(p/1.3)+71.)>.99965) col+=.16;
  return vec4(col,1.); }
