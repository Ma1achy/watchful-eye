// Who a player is from moment to moment: the habits they have on for a spell, and how late they read the other board.

export function lvOf(c,thr){ return Math.min(1,.25+.75*Math.max(0,(c.skill-.15)/(thr+.1-.15))); }

export function habits(c,fresh){ var g=c.g, ap=c.setupAp||0, st=g.st;
  if(!c.kn){ c.kn=[]; for(var q=0;q<9;q++) c.kn.push(Math.random()); }
  if(!fresh&&st.pieces<(c.spellAt||0)) return; c.spellAt=st.pieces+8+Math.floor(Math.random()*18);
  var on=function(thr){ return Math.random()<lvOf(c,thr); };
  if(g.setSetups) g.setSetups(null,null,null, c.kn[0]<lvOf(c,.45)&&on(.45)?(c.kn[1]<(.35+.65*ap)*lvOf(c,.55)?2:1):0);   /* level 2 (towers, cannons, the chains) for many more now that they're built from verified shapes */
  if(g.setReopen) g.setReopen(c.kn[2]<lvOf(c,.45)&&on(.45)?(c.kn[3]<ap*lvOf(c,.55)?2:1):0);
  var dg=on(.4); if(g.setDig) g.setDig(dg?1:.5, dg&&c.kn[4]<lvOf(c,.4)?1:0);
  if(g.setStrat) g.setStrat(c.kn[5]<lvOf(c,.35)&&on(.35)?(c.kn[6]<lvOf(c,.6)?2:1):0);
  if(g.setComboFull) g.setComboFull(c.kn[7]<lvOf(c,.3)&&on(.3));
  if(g.setReady) g.setReady(on(.5)?1:0);
  if(g.setOppd) g.setOppd(on(.55)?1:0);
  if(g.setTst3) g.setTst3(c.kn[8]<ap*lvOf(c,.5)&&on(.5)?1:0);
  if(g.setTiming) g.setTiming(on(.7)?.5:0);
  if(g.setSurge) g.setSurge(on(.6)?1:0);
  if(g.setFlair) g.setFlair((.2+1.3*lvOf(c,.6))*(.6+.8*(c.spinny!=null?c.spinny:.5)));
  if(g.setHoldv) g.setHoldv(on(.5)&&Math.random()<.3+(c.neat||0)?1:0); }

export function threatFor(c,t,cur){ var lag=Math.max(0,.7-c.skill)*3; if(lag<.05){ c.thH=null; return cur; } var H=c.thH||(c.thH=[]); H.push({t:t,v:cur}); while(H.length>2&&H[1].t<=t-lag) H.shift(); return H[0].t<=t-lag?H[0].v:cur; }
