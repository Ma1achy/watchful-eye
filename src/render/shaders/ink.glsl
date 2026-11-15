// The three inks, by piece kind.
vec3 inkOf(int t){
  if(t==8) return vec3(.6,.6,.57);
  if(inks<.5){ vec3 G=vec3(36,150,92)/255., M=vec3(170,52,140)/255., O=vec3(238,92,44)/255.;
    if(t==1) return G; if(t==2) return O; if(t==3) return G; if(t==4) return M; if(t==5) return O; if(t==6) return M; return G; }
  if(t==1) return vec3(49,199,239)/255.; if(t==2) return vec3(247,211,8)/255.; if(t==3) return vec3(173,77,156)/255.; if(t==4) return vec3(66,182,66)/255.;
  if(t==5) return vec3(239,32,41)/255.; if(t==6) return vec3(90,101,173)/255.; return vec3(239,121,33)/255.; }
