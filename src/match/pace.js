// How fast and how cleanly a person plays under pressure (the JavaScript bots; the WebAssembly ones do this in Rust).
import { inc } from './garbage.js';

export function stress(c){ var g=c.g, b=g.st.b, h=0; for(var y=g.H-24;y<g.H&&!h;y++) for(var x=0;x<g.W;x++) if(b[y*g.W+x]){ h=g.H-y; break; } return Math.max(0,Math.min(1,(h+inc(c)-6)/12)); }

export function speed(c,t){ var k=c.tempo/(1+Math.min(.12,(c.g.st.level-1)*.015))*(c.paceS||1), sp=c.stressN||0;
  k*=1-sp*(.16-.1*Math.max(0,c.nerve||0)+.08*Math.max(0,-(c.nerve||0)));   // under pressure (the stack near the top) everyone hurries: the steely most, the nervy least
  if(t!=null){ k*=Math.exp((c.vamp||0)*.55*(c.drift||0))*((c.tiltTo||-9)>t?1.25:1); }   // streaks: in the zone, or off it; tilt drags
  return Math.max(.3,k); }

export function missRate(c,t){ var nv=Math.max(0,c.nerve||0), sp=c.stressN||0; if(!nv||!c.sloppy) return 0;   // slips: only the nervy, only under pressure, and rarely
  var m=.06*nv*Math.max(0,sp-.35)*(1.2-c.skill); if((c.tiltTo||-9)>t) m+=.025*nv*(1.2-c.skill); return Math.min(.015,m*.4); }
