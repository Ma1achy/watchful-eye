// Which board a tile shows, and reading its cells and per-board metadata from the atlas.
int slotOf(vec2 ti){ vec2 m=ti-mapO; if(m.x>=0.&&m.y>=0.&&m.x<mapN.x&&m.y<mapN.y){ vec4 v=texelFetch(mapT,ivec2(m),0); int s=int(v.r*255.+.5)+int(v.g*255.+.5)*256; if(s<65535) return s; }
  uint x=uint(int(ti.x+tO.x)), y=uint(int(ti.y+tO.y)); uint h=(x*73856093u)^(y*19349663u); h^=h>>13; h*=0x5bd1e995u; h^=h>>15; return int(h%uint(NP)); }
ivec2 blockOf(int s){ int bx=int(nb.x); return ivec2((s-(s/bx)*bx)*44,(s/bx)*25); }
ivec2 BO;
ivec4 cellAt(ivec2 c){ if(c.x<0||c.y<0||c.x>=44||c.y>=24) return ivec4(0); return ivec4(texelFetch(sheet,BO+c,0)*255.+.5); }
vec4 metaAt(int i){ return texelFetch(sheet,BO+ivec2(i,24),0); }
bool same(ivec4 a,ivec4 b){ return b.r>0 && a.g==b.g && a.b==b.b; }
// a board that's lost falls off the wall like a picture whose nail gave: it tips to one side about the nail (the top
// middle), and keeps turning as it drops away, fading; the next round's board is brought in from far off, growing from a
// point to its place. A pixel is taken back through that motion to find what it shows; a falling board can swing or drop
// into the margins of the tiles around it, so those are looked at too, but only for pairs flagged as moving
