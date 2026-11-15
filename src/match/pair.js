// One pair of bots playing each other under League rules: in WebAssembly (the match runs in a worker and this reads its
// snapshots) or, with ?js, the original JavaScript bots. Also everything the page adds on top: who the players are
// (skill, style, flavour), what they're up to, and how interesting the match is right now, for the camera.
import { SEAW } from '../engine/pool.js';
import { reveal } from '../reveal.js';
import { inc, hot } from './garbage.js';
import { lvOf, habits, threatFor } from './habits.js';
import { stress, speed, missRate } from './pace.js';
import { statOf, surface, tSlot, hasT, intents } from './reading.js';

export function createPair(idx,ctx){ var seedBase=ctx.seedBase, now=ctx.now, STYLES=ctx.STYLES, G0REF=ctx.G0REF, ffQ=ctx.ffQ, ScanTetrisGame=ctx.legacy; var seed0=(seedBase+idx*7919)%1000003, round=0, ffDone=0, ff=0, roundOverAt=-1, roundStart=0, late=false, thought=false, sliceMs=2.5, gpid=0, hs=(seed0*7+13)%2147483647||1;
  function hrnd(){ hs=(hs*16807)%2147483647; return hs/2147483647; }
  function mk(name){ return {tw:0,twv:0,tempo:1,g:(typeof SEAW!=="undefined"&&SEAW.on)? SEAW.game(G0REF().ROT,G0REF().NAMES) : ScanTetrisGame({seed:seed0,style:'tspin',lite:true,pcms:60}),style:'tspin',name:name,mode:'spawn',at:0,acts:[],lastAct:'',flash:null,overAt:-1,bump:0,wins:0,call:null,callT:-9,sent:0,ex:0,exT:0,fdir:1,enterAt:-99}; }
  // excitement: what's just happened to a player, bumped by events and fading (half of it gone in five seconds)
  // what actually happened, kept briefly: for the director to react to, and for testing whether it was there to see it
  var EV=[]; function evt(c,k,t){ EV.push({t:t,k:k,side:c===PL[0]?0:1}); if(EV.length>40) EV.shift(); }
  function bumpEx(c,v,t){ c.ex=c.ex*Math.pow(.5,Math.max(0,t-c.exT)/5)+v; c.exT=t; }
  var PL=[mk('A'),mk('B')];


  function ko(c,t){ evt(c,'ko',t); c.mode='over'; c.overAt=t; roundOverAt=t; c.fdir=hrnd()<.5?-1:1; bumpEx(c,6,t); bumpEx(PL[c===PL[0]?1:0],6,t); var o=PL[c===PL[0]?1:0]; o.wins++; o.mode='won'; o.wonAt=t; o.call={text:'K.O.',big:true}; o.callT=t; }
  // how a person plays a piece, as opposed to how the planner would: a pause to read the board before the first input
  // (short through an opener they know by heart or in a run of clears; long after garbage has just come up, for a spin
  // that needs care, as a long round wears on; skewed, as reaction times are, and drifting in streaks), inputs wasted on
  // the way (tapping across instead of holding, going a column too far and back, the long way round), and, rarely, the
  // nervy slips (a column off when rushing, or dropping before the last turn of a spin)
  function gz(){ return (hrnd()+hrnd()+hrnd()-1.5)*2; }
  // the pace of a match, as people have it: fast through an opener or a continuation they know by heart, then a moment to
  // read what's left; a burst once something's solved (a spin landed, a dig finished, a combo cashed, the kill in sight);
  // tighter or shakier under pressure, by temperament; and tiring as a long round wears on, in waves, with second winds.
  // Each piece moves the pace part of the way toward where all that puts it, so it ramps rather than jumps. The best vary
  // least, the middling most
  function pace(c,t){ var st=c.g.st, sd=c===PL[0]?0:1, o=PL[1-sd], el=t-roundStart, amp=.45+.9*4*c.skill*(1-c.skill), p=1;
    var plan=!!(st.openPlan&&st.openPlan.length); if(plan) p*=.82; else if(c.hadPlan) c.lull=4+Math.floor(hrnd()*4); c.hadPlan=plan;
    if(c.lull>0){ p*=1.22; c.lull--; }
    for(var i=EV.length-1;i>=0&&EV[i].t>(c.evSeen||-1);i--){ var E=EV[i]; if(E.side!==sd) continue; if(/tsd|tst|quad|pc|surge/.test(E.k)) c.burst=Math.max(c.burst||0,5+hrnd()*4); }
    c.evSeen=EV.length?EV[EV.length-1].t:c.evSeen;
    var gar=0, b=st.b, W=c.g.W, H=c.g.H; for(var y=H-24;y<H;y++){ for(var x=0;x<W;x++){ var j=y*W+x; if(b[j]&&st.pid[j]>=241&&st.pid[j]<=247){ gar++; break; } } }
    if((c.garPrev||0)>=3&&gar===0) c.burst=Math.max(c.burst||0,5+hrnd()*3);   // dug out
    if((c.comboPrev||0)>=4&&st.combo===0) c.burst=Math.max(c.burst||0,4+hrnd()*3); c.garPrev=gar; c.comboPrev=st.combo;
    if(surface(o.g)+inc(o)>=15&&surface(c.g)+inc(c)<12) c.burst=Math.max(c.burst||0,3);   // the kill in sight
    if(c.burst>0){ p*=.8+.08*Math.max(0,1-c.burst/6); c.burst--; }
    var ninc=inc(c); if(ninc>0) p*=1-.1*Math.min(1,ninc/6);   // garbage queued: hurrying to cancel it
    if(c.fat==null){ c.fat=.06+.16*(1-c.skill)*hrnd(); c.fph=hrnd()*6.3; c.fper=25+hrnd()*25; }
    p*=1+c.fat*(1-Math.exp(-el/100))*(.7+.3*Math.sin(el/c.fper+c.fph));   // tiring, in waves
    if((c.wind||0)>0){ p*=.84; c.wind--; } else if(el>45&&hrnd()<.012) c.wind=8+Math.floor(hrnd()*8);   // a second wind
    p=Math.pow(p,amp); c.paceS=(c.paceS||1)+(Math.max(.6,Math.min(1.55,p))-(c.paceS||1))*.3; return c.paceS; }
  function humanise(c,P,t){ c.goal=P&&P.P? {r:P.P.r,x:P.P.x,y:P.P.y} : null; var A=c.acts, st=c.g.st, sd=A.indexOf('SD'), spin=false, k=pace(c,t);
    for(var i=sd+1;sd>=0&&i<A.length;i++) if(A[i]==='cw'||A[i]==='ccw'||A[i]==='flip'){ spin=true; break; }
    c.drift=(c.drift||0)*.86+.5*gz()*.5;   // in the zone, or not: the pace runs in streaks
    if(st.openPlan&&st.openPlan.length) k*=.6; else if(st.combo>=2) k*=.85;
    if(c.rose){ k*=1.15+.35*Math.max(0,c.nerve||0); c.rose=0; }   // garbage just came up: a glance at the new floor (longer for the nervy)
    if(spin) k*=1.3;
    k*=1+.12*(1-c.skill)*Math.min(1,(t-roundStart)/120);
    k*=Math.exp((.1+.45*(c.vamp||0))*gz()*.6);
    // finesse: the chances per opportunity come from skill; only in open air, so each one undoes cleanly
    var pf=Math.min(.2,(c.fin||0)*.09), open=(c.stressN||0)<.4, top=sd<0?A.length:sd;
    if(pf>0){
      for(var j=0;j<top;j++){ if((A[j]==='DL'||A[j]==='DR')&&hrnd()<pf) A[j]=A[j]==='DL'?'tL':'tR'; }
      if(open){ var last=-1, run=0, dir='';
        for(j=0;j<top;j++){ if(A[j]==='L'||A[j]==='R'){ if(A[j]===dir) run++; else { dir=A[j]; run=1; } last=j; } }
        if(run>=2&&hrnd()<pf*.7){ var o=dir==='L'?'R':'L'; A.splice(last+1,0,'f'+dir,'f'+o); top+=2; }
        for(j=0;j<top;j++){ if(A[j]==='ccw'&&hrnd()<pf*.5){ A.splice(j,1,'fcw','fcw','cw'); top+=2; break; } if(A[j]==='flip'&&hrnd()<pf*.6){ A.splice(j,1,'cw','cw'); top+=1; break; } }
        } }
    // slips: rare, nervy, under pressure
    if(c.sloppy&&c.pps<2.3&&(c.stressN||0)>.35&&hrnd()<missRate(c,t)){ c.goal=null; c.slips=(c.slips||0)+1; var di=A.lastIndexOf('drop');   // slips: very rare; only slow, nervy players, only under pressure; never the fast
      if(spin&&sd>=0){ A.splice(sd,A.length-sd,'drop'); }   // dropped before the spin
      else { var lh=''; for(j=di-1;j>=0;j--) if(A[j]==='L'||A[j]==='R'||A[j]==='DL'||A[j]==='DR'){ lh=A[j]; break; }
        var mv=lh==='L'?'L':lh==='R'?'R':lh==='DL'?'R':lh==='DR'?'L':(hrnd()<.5?'L':'R'); if(di<0) A.push(mv); else A.splice(di,0,mv); } }   // a column too far
    return k; }



  function send(c,o,t,ready){ var st=c.g.st, atk=st.attack||0; st.attack=0; var sp=st.sendParts||{surge:0,raw:atk,spec:0,pc:false}; st.sendParts=null;
    var el=t-roundStart, mult=el<180?1:1+.008*(el-180), parts=[], tot=0;
    if(sp.surge){ var sg=Math.floor(sp.surge*mult), ch=Math.floor(sg/3+.5); parts.push(ch,ch,Math.max(0,sg-2*ch)); }
    parts.push(Math.floor(sp.raw*mult)+sp.spec); if(sp.pc) parts.push(Math.floor(5*mult));
    parts.forEach(function(amt){ if(amt<=0) return; var bonus=(st.pieces<=14&&inc(c)>=c.sent)?amt:0;
      while((amt>0||bonus>0)&&st.incoming.length){ if(amt>0) amt--; else bonus--; if(--st.incoming[0].n<=0) st.incoming.shift(); }
      if(amt>0&&o.mode!=='over'){ o.g.st.incoming.push({n:amt,hole:Math.floor(hrnd()*10),ready:ready}); if(amt>=4&&(o.nerve||0)>.2) o.tiltTo=t+3+3*o.nerve; c.sent+=amt; tot+=amt; } }); if(tot>=4) c.bigAt=t;
    if(tot) bumpEx(c,.8+tot*.45,t); if(sp.pc){ bumpEx(c,6,t); evt(c,'pc',t); } if(sp.surge){ bumpEx(c,3,t); evt(c,'surge',t); } if(tot>=6) evt(c,'big',t); }
  function rise(c,t){ var st=c.g.st, cap=8; while(cap>0&&st.incoming.length&&st.incoming[0].ready<=t){ var q=st.incoming[0], n=Math.min(cap,q.n); q.n-=n; cap-=n; if(q.n<=0) st.incoming.shift();
      /* the hole moves now and then inside an attack (about one row in ten), as it does in a real game: big attacks came up as one clean straight column, which looked made */
      var gp=241+(gpid++%7), left=n; while(left>0){ var run=1; while(run<left&&hrnd()>.1) run++; if(!c.g.addGarbage(run,q.hole,gp)) return false; left-=run; if(left>0){ var nh=Math.floor(hrnd()*9); q.hole=nh>=q.hole?nh+1:nh; } }
      bumpEx(c,.3*n,t); c.rose=1; } return true; }
  function step(c,o,t){ var g=c.g, st=g.st;
    if(c.mode==='spawn'&&t>=c.at&&!thought){ thought=true; var of=o.g.st, oh=0; for(var oy=0;oy<o.g.H;oy++){ var any=false; for(var ox=0;ox<o.g.W;ox++) if(of.b[oy*o.g.W+ox]){ any=true; break; } if(any){ oh=o.g.H-oy; break; } }
      g.setThreat(threatFor(c,t,{oppH:oh,oppInc:inc(o),oppB2B:o.g.st.b2bN||0,oppSpike:o.g.spikeEst?o.g.spikeEst():0,oppSpent:o.bigAt!=null&&t-o.bigAt<2.5})); habits(c,false); c.stressN=stress(c); if(g.spawn()){
        // human slips of judgement (not of the fingers): rare, only the less skilled and not the fast, only under pressure.
        // A panic hold (swapping for no good reason), or a few pieces of tunnel vision (deciding worse, then recovering)
        if(c.skill<.6&&c.pps<3.2&&(c.stressN||0)>.55){ var pz=(1-c.skill)*(.6+Math.max(0,c.nerve||0)); if(!g.st.held&&hrnd()<.035*pz){ g.doHold(); c.slipJ=(c.slipJ||0)+1; }
          if(!c.tunnel&&hrnd()<.02*pz){ c.tunnel=3+Math.floor(hrnd()*3); if(g.setLite) g.setLite(true); c.slipJ=(c.slipJ||0)+1; } }
        if(c.tunnel&&--c.tunnel<=0){ c.tunnel=0; if(g.setLite) g.setLite(c.liteBase!=null?c.liteBase:true); }
        c.it=g.planIter(); c.mode='think'; c.thinkT=t; } else { ko(c,t); return; } }
    if(c.mode==='think'){ var lim=now()+sliceMs, r; do { r=c.it.next(); } while(!r.done&&now()<lim);
      if(!r.done&&c.g.quickPlan&&t-c.thinkT>(sliceMs<3?1.5:4)){ r={done:true,value:c.g.quickPlan()}; }   /* thinking too long for the time it's getting (a crowd board sharing the budget): it goes with a quick drop, rather than standing there */
      if(r.done){ var P=r.value; c.it=null; c.acts=[]; if(P){ if(P.hold) c.acts.push('hold'); c.acts=c.acts.concat(P.P.acts); } else c.acts=['drop'];
        var think=humanise(c,P,t);
        c.mode='move'; c.at=Math.max(t,c.thinkT+.13*speed(c,t)*think); c.lastAct=''; } }
    if(c.mode==='move'){
      while(c.mode==='move'&&t>=c.at&&c.acts.length){ var a=c.acts.shift();
        if(a.charAt(0)==='f'){ var fa=a.slice(1); if(!g.act(fa)) c.acts.shift(); c.at=t+(fa==='cw'||fa==='ccw'?.07:.085)*speed(c,t); c.lastAct=fa; break; }   // a wasted input; if it can't happen, nor does its undo
        if(a==='tL'||a==='tR'){ if(g.act(a.charAt(1))){ c.acts.unshift(a); c.at=t+.095*speed(c,t); c.lastAct=a; break; } continue; }   // tapped across instead of held
        if(a==='hold'){ if(!g.doHold()){ ko(c,t); return; } c.at=t+.1*speed(c,t); c.lastAct=a; continue; }
        if(a==='SD'){ if(g.act('SD1')){ c.acts.unshift('SD'); c.at=t+.024; c.lastAct=a; break; } continue; }
        if(a==='DL'||a==='DR'){ var a1=a==='DL'?'L':'R'; if(g.act(a1)){ c.acts.unshift(a); c.at=t+(c.lastAct===a?.022:.11)*speed(c,t); c.lastAct=a; break; } continue; }
        var ok=g.act(a); if(ok&&(a==='cw'||a==='ccw'||a==='flip')&&g.spinNow()) c.twv+=(a==='ccw'?-1:1)*4.4;
        if(!ok&&(a==='L'||a==='R')) c.acts=c.acts.filter(function(x){ return x!=='L'&&x!=='R'; });
        if(a==='drop'){ var gp=c.goal, ps=st.pos; if(gp&&ps&&(ps.r!==gp.r||ps.x!==gp.x||ps.y!==gp.y)&&(!g.fitsAt||g.fitsAt(gp.r,gp.x,gp.y))) st.pos={r:gp.r,x:gp.x,y:gp.y};   /* only onto free cells: a stale plan never puts a piece inside the stack */   // a wasted input never moves where it lands
          var rows=g.lock(); c.bump=Math.min(1,c.bump+.7); if(st.over){ ko(c,t); return; }
          if(st.callout&&!rows.length){ c.call=st.callout; c.callT=t; st.callout=null; }
          if(rows.length){ c.flash={rows:rows,t:t,d:(rows.length>=3||st.spin?.42:.28)*Math.max(.45,Math.min(1.1,speed(c,t)))}; c.mode='clear'; c.at=t+c.flash.d; }
          else { if(!rise(c,t)){ ko(c,t); return; } c.mode='spawn'; c.at=t+.1*speed(c,t); }
          break; }
        var das=(a===c.lastAct&&(a==='L'||a==='R')); c.at=t+(das?.032:(a==='cw'||a==='ccw'?.07:.085))*speed(c,t); c.lastAct=a; }
      if(c.mode==='move'&&!c.acts.length) c.acts=['drop']; }
    if(c.mode==='clear'&&t>=c.at){ var nr=c.flash.rows.length; if(st.spin){ bumpEx(c,2.5,t); evt(c,st.spin==='T'&&nr>=3?'tst':st.spin==='T'&&nr===2?'tsd':'spin',t); } else if(nr===4){ bumpEx(c,1.8,t); evt(c,'quad',t); } if(st.combo>=4) evt(c,'combo',t); g.clearRows(c.flash.rows); c.flash=null; if(st.callout){ c.call=st.callout; c.callT=t; st.callout=null; }
      send(c,o,t,t+.333); c.mode='spawn'; c.at=t+.08*speed(c,t); } }
  // each player has a main (a T-spinner, a four-wide player, a Tetris stacker, a perfect-clear player) and plays it most
  // rounds, now and then something else; a four-wide main keeps the same well (their side, or the centre)
  /* what a player does well, they do every time; what they half know, they do in spells. Every habit the strong ones have, everyone has,
   but a weaker player has it on only some of the time: for a stretch of eight to twenty-five pieces they're reading the opponent, keeping a
   cannon in mind, holding their back-to-back for the right moment; then they drift and it lapses, and comes back. How often it's on rises
   with skill (a quarter of the time at the bottom, nearly always at the top). Book lines and the full combo game are things a player knows or
   doesn't (the odds of knowing rise with skill, and the draw is kept: it's who they are), and even then they only reach for them in a spell */


/* and the slower ones read the other board a beat late: what they react to (a spike coming, the opponent's back-to-back, a stack near the top)
   is how things stood up to a second and a half ago, so their surges and their bracing land late */

function pickStyles(){ var nS=STYLES.length;
    [0,1].forEach(function(i){ var c=PL[i]; if(c.main==null){ var mv=hrnd(); c.main=mv<.62?'tspin':mv<.77?'combo':mv<.87?'pc':'quad'; if(c.main==='quad'&&c.skill>=.45) c.main='tspin'; if(c.skill<.4&&hrnd()<.3) c.main='quad';   /* Tetris-only play is a beginner's game here: the good ones spin */
      if(c.main==='tspin'){ var fv=hrnd(); c.flav=fv<.25?'cannon':fv<.45?'spinner':fv<.7?'surger':fv<.85?'stacker':'classic';   /* the surger: League's back-to-back game, a long chain kept and spent as one Surge spike */   /* T-spin players in flavours: the cannon builder, the spin-anything player, the clean stacker who never breaks back-to-back, the all-rounder */
        if(c.flav==='cannon') c.setupAp=Math.max(c.setupAp||0,.75+.25*hrnd()); else if(c.flav==='spinner') c.spinny=Math.max(c.spinny||0,.8+.2*hrnd()); else if(c.flav==='stacker'||c.flav==='surger'){ c.neat=Math.max(c.neat||0,.8+.2*hrnd()); c.greed=Math.max(c.greed||0,.8+.2*hrnd()); } } var wv=hrnd(); c.mainWell=wv<.32?[3,6] : wv<.62?[0,3] : wv<.92?[6,9] : [3,5]; }
      var k=hrnd()<.85? STYLES.indexOf(c.main) : Math.floor(hrnd()*nS); if(k<0) k=0; c.style=STYLES[k]; c.g.setStyle(c.style); if(c.g.setComboWell){ var CWV=c.style!=='combo'?[3,6] : c.mainWell; c.g.setComboWell(CWV[0],CWV[1]); c.cwell=CWV; } /* a combo player's well: side four-wide (either wall) most (it wins head to head), centre four-wide, now and then a centre three-wide */ var M=c.style==='quad'?[9,0,6,3,7,2]:c.style==='tspin'?[9,0]:[9]; c.well=M[Math.floor(hrnd()*M.length)]; c.g.setWell(c.well); c.tempo=1.9/c.pps;
      var W=c.g.WT; if(W){ if(!c.W0) c.W0=Object.assign({},W); W.defend=c.W0.defend*(1.4-.8*c.aggr); W.danger=c.W0.danger*(1.3-.6*c.aggr); W.b2b=c.W0.b2b*(.7+.6*c.greed); W.b2bBreak=c.W0.b2bBreak*(.6+.8*c.greed); W.plain=c.W0.plain*(.8+.4*c.aggr);
        // mid-game setups (DT cannons, STSDs, TST towers...): the strong, keen ones keep building them even through a back-to-back chain
        if(c.g.setSetups){ var ap=c.setupAp||0, sk2=Math.max(0,(c.skill-.2)/.8); c.g.setSetups(1.3*(.7+.8*ap*(.4+.6*sk2)), sk2*ap>.15? TSTW_MAX*Math.min(1,sk2*ap*1.6) : 0, 1+2*ap*sk2, null);   /* the setup-obsessed (a few) build TST towers and cannons too: it costs them, as it does people */
        habits(c,true); }   // the skilled keep an answer ready once the stack's up   // reading the game: surge timing, bracing, cancelling, answering spikes   // digging: combos kept going, spins looked for   // the setup finder (TSDs, STSDs) for the decent; book lines picked up mid-game by the keen
        W.holes=c.W0.holes*(.65+.7*c.neat); W.cover=c.W0.cover*(.6+.8*c.neat); W.bp=c.W0.bp*(.7+.6*c.neat); W.otherSpin=c.W0.otherSpin*(1.6-1.5*c.spinny)-1.2*Math.max(0,c.spinny-.6); W.mini=c.W0.mini*(1.4-1.1*c.spinny); /* the spin-lovers take spins with any piece (each keeps back-to-back) and minis; the rest mostly don't */ } }); }
  function newRound(t){ ffDone=0; round++; pickStyles(); PL.forEach(function(c){ if(c.overAt>=0) c.enterAt=t; c.wonAt=-1; c.g.reset(seed0+round); c.paceS=1; c.lull=0; c.burst=0; c.wind=0; c.hadPlan=false; c.mode='spawn'; c.at=t+.7; c.flash=null; c.overAt=-1; c.acts=[]; c.it=null; c.sent=0; c.call=null; }); roundOverAt=-1; roundStart=t; }
  // (kept for reference, unused) a seeded stack, as a game some way in looks (rows up to the well, a hole or two,
  // sometimes garbage underneath), then a few pieces played on it instantly. Every tile of the world gets its own.
  function synth(c){ var g=c.g, st=g.st, W=g.W, H=g.H, h=Math.floor(Math.pow(hrnd(),1.4)*11), gr=hrnd()<.35?1+Math.floor(hrnd()*4):0, pid=1, well=c.well!=null?c.well:9;
    for(var r=0;r<h;r++){ var y=H-1-r, isG=r<gr, hole=isG?Math.floor(hrnd()*10):(hrnd()<.8?well:Math.floor(hrnd()*10)), extra=!isG&&hrnd()<.18?Math.floor(hrnd()*10):-1, run=0, col=0;
      for(var x=0;x<W;x++){ var j=y*W+x; if(x===hole||x===extra){ st.b[j]=0; st.pid[j]=0; run=0; continue; }
        if(isG){ st.b[j]=8; st.pid[j]=241; continue; }
        if(run<=0){ run=1+Math.floor(hrnd()*4); col=1+Math.floor(hrnd()*7); pid=1+((pid+Math.floor(hrnd()*5)+1)%239); } st.b[j]=col; st.pid[j]=pid; run--; } }
    st.b.__r=null; st.b.__s=null; }
  // how good this pair is: a level for the match (mostly middling, some beginners, some sharp), each bot near it. Skill
  // sets how fast they move and think, how often a piece goes a column astray, and whether they plan with the full search
  // or the quick one; each bot also has its own temper, from cautious (clears early, defends) to reckless (builds high
  // for the big attack)
  // the spread is the League's: a crowd of keen players. A match's pace is drawn around 2.9 pieces a second (most between
  // 2.3 and 3.5; under 2 is rare, 4 and up a handful), the two players close to it; skill follows from pace
  var TSTW_MAX=.5;
  function skills(){ var base=Math.max(1.6,Math.min(4.6,2.9+.55*gz()));
    PL.forEach(function(c){ c.pps=Math.max(1.5,Math.min(4.7,base+(hrnd()-.5)*.4)); c.skill=Math.max(.2,Math.min(1,Math.pow((c.pps-1)/3.3,.8))); c.miss=0;
      // character, independent of skill: temper (cautious..reckless), greed (cashes out..holds back-to-back for a surge),
      // neatness (messy..clean stack), nerve (-1 comes good under pressure .. +1 panics), rhythm (metronome..bursts and
      // pauses), spin-love (plain..all-spins and minis)
      c.setupAp=hrnd(); c.aggr=hrnd(); c.greed=hrnd(); c.neat=hrnd(); c.nerve=hrnd()*2-1; c.rhythm=Math.pow(hrnd(),1.5); c.spinny=hrnd(); c.rph=hrnd()*6.3; c.tiltTo=-9;
      // how much its pace wanders: most in the middle of the range (a sharp player is a metronome; a beginner is slow, but evenly so)
      var bell=4*c.skill*(1-c.skill); c.vamp=Math.min(.6,(.04+.8*bell*bell)*(.6+.8*c.rhythm)); c.pj=0;
      // finesse: wasted inputs on the way to the right place (a step out and back, a turn and back). None at the top
      c.sloppy=c.pps<2.3&&hrnd()<.25;   // a few slow players make mistakes at all (about one in forty-odd overall); everyone else plays clean, however slow
      c.fin=c.skill>.86? 0 : 2.3*Math.pow(1-c.skill,2.2); }); }   // finesse is movement, not a mistake: everyone below the top has some
  function init(seed){ seed0=seed%1000003; hs=(seed0*7+13)%2147483647||1; round=0; roundOverAt=-1; roundStart=0; gpid=0; ffDone=0;
    skills(); PL.forEach(function(c){ c.main=null; }); pickStyles(); PL.forEach(function(c){ c.g.reset(seed0); c.mode='spawn'; c.at=0; c.flash=null; c.overAt=-1; c.acts=[]; c.it=null; c.sent=0; c.call=null; c.wins=Math.floor(hrnd()*3); c.tw=c.twv=c.bump=0; c.ex=0; c.exT=0; c.enterAt=-99; c.tiltTo=-9; c.wonAt=-1; });
    ff=8+Math.min(160,Math.floor(-Math.log(1-hrnd()*.9999)*22)); late=hrnd()<.22; if(late) ff=500; 
    if((typeof SEAW!=="undefined"&&SEAW.on)){ var pcs=8+Math.min(160,Math.floor(-Math.log(1-hrnd()*.9999)*22)), head=Math.floor(pcs/2.9*60)+(late&&wadded?1800:0);   /* (not in the first wave: the sea comes up sooner, and the late ones come along as it plays) */ ff=0; late=false; wround=-1; wlast=null;
      if(wadded) SEAW.replace(idx,PL[0].skill,PL[1].skill,seed0,head); else { SEAW.add(idx,PL[0].skill,PL[1].skill,seed0,head); wadded=true; } wpersona(); } }   /* about one in five is run on to its last moments: a stack near the top, or the knockout itself, so browsing the sea catches the ends of games */   // mostly early on (half within ~27 pieces), a long tail of games well into a round   // played, not drawn: the game run on quickly from its first piece
  var wadded=false, wround=-1, wlast=null;
  function wpersona(){ PL.forEach(function(c,k){ var ap=c.flav==='cannon'?Math.max(c.setupAp||0,.8):(c.setupAp||0), gr=c.flav==='spinner'?Math.max(c.greed||0,.8):(c.greed||.5);   /* a player's flavour: the cannon builders keen on setups, the spinners greedy for back-to-back */
    SEAW.persona(idx,k,[c.pps||2.5,c.aggr||.5,gr,c.neat||.5,c.nerve||0,c.vamp||.1,c.spinny||.5,ap,c.fin||0,c.sloppy?1:0,({tspin:0,quad:1,combo:2,pc:3})[c.style]||0,c.well!=null?c.well:9,c.skill||.5,c.flav==='surger'?1:0,0,0]); }); }
  // the match lives in a worker (Four's engine, the Rust bots): read what it sent, and turn its locks into the sea's events
  function wevent(e,t,light){ var c=PL[e[0]], st=c.g.st, lines=e[1], spin=e[2], pc=e[3], sent=e[5], b2b=e[6], combo=e[7];
    var turn=(e[4]>>1)-2; if(spin&&!light) c.twv+=(turn<0?-1:1)*4.4;   /* the twist a spin gives the board, as the old game did on the turn into the slot */
    c.bump=Math.min(1,c.bump+.7); c.sent+=sent; if(sent>=4) c.bigAt=t; if(sent) bumpEx(c,Math.min(2,sent*.25),t);
    if(lines&&light){ if(spin){ bumpEx(c,2.5,t); evt(c,spin===2&&pc===7&&lines>=3?'tst':spin===2&&pc===7&&lines===2?'tsd':'spin',t); } else if(lines===4){ bumpEx(c,1.8,t); evt(c,'quad',t); } }
    else if(lines){ var rows=[]; for(var j=0;j<240;j++){ st.b[160+j]=SEAW.COL[e[18+j]]; st.pid[160+j]=e[258+j]; }   /* the board the moment before the clear, as the engine had it */
      for(var r=0;r<24;r++) if((e[16]>>r)&1) rows.push(16+r);
      c.flash={rows:rows,t:t,d:(lines>=3||spin?.42:.28)*Math.max(.45,Math.min(1.1,2.9/Math.max(1,c.pps)))}; c.mode='clear';
      if(spin){ bumpEx(c,2.5,t); evt(c,spin===2&&pc===7&&lines>=3?'tst':spin===2&&pc===7&&lines===2?'tsd':'spin',t); } else if(lines===4){ bumpEx(c,1.8,t); evt(c,'quad',t); } if(combo>=4) evt(c,'combo',t); }
    var nm=['','SINGLE','DOUBLE','TRIPLE','QUAD'][Math.min(4,lines)], tx='';
    var pb=c.wb2b||0; c.wb2b=b2b; var surge=lines&&pb>=5&&b2b===0;   /* a chain past four broken: the Surge goes */
    if(spin&&lines) tx=(pc===7?(spin===2?'T-SPIN ':'T-SPIN MINI '):SEAW.NAME[pc]+'-SPIN ')+nm; else if(lines===4) tx='QUAD';
    if(e[4]&1) tx='ALL CLEAR'; if(tx&&b2b>=2) tx+=' · B2B ×'+(b2b-1); if(lines&&combo>=3) tx+=(tx?' · ':'')+(combo-1)+' COMBO';
    if(surge){ tx='SURGE ×'+(pb-1)+(tx?' · '+tx:''); bumpEx(c,3+Math.min(4,(pb-4)*.4),t); evt(c,'surge',t); }
    if(tx){ c.call={text:tx,atk:sent,big:sent>=6}; c.callT=t; } }
  var hadS=false;
  function wsync(t,vis){ var Q=SEAW.ev[idx];
    var onScr=SEAW.seen[idx]&&performance.now()-SEAW.seen[idx].t<500;   // a board on screen takes its events when it's drawn (flash, twist); the camera's look mustn't use them up
    var wevS=false; if(Q&&Q.length&&(vis||!onScr)){ wevS=true; var light=!vis||Q.length>3; for(var q=0;q<Q.length;q++) wevent(Q[q],t,light); Q.length=0; }
    var S=SEAW.snap[idx]; if(!S){ hadS=false; return; } var L=SEAW.L, ROT=PL[0].g.ROT;
    if(!hadS){ hadS=true; if(reveal.at&&!reveal.hidden) PL.forEach(function(c){ c.enterAt=t; }); }   // a match that's ready after the sea is shown fades in on its own
    for(var k=0;k<2;k++){ var c=PL[k], g=c.g, st=g.st, o=L.HEADER+k*L.PF, fl=c.flash&&t<c.flash.t+c.flash.d;
      if(c.flash&&!fl) c.flash=null; if(wevS) c.wS=null;
      if(!fl&&c.wS!==S){ c.wS=S; for(var y=0;y<24;y++) for(var x=0;x<10;x++){ var j=(16+y)*10+x; st.b[j]=SEAW.COL[S[o+L.CELLS+y*10+x]]; st.pid[j]=S[o+L.PIDS+y*10+x]; } }
      var alive=!!S[o], nm=SEAW.NAME[S[o+1]]; st.over=!alive;
      if(nm&&alive){ var cl=[], gc=[]; for(var j2=0;j2<8;j2++){ cl.push(S[o+27+j2]); gc.push(S[o+35+j2]); } st.cur=nm; st.pos=SEAW.posOf(ROT,nm,S[o+2],cl); g.gy=SEAW.posOf(ROT,nm,S[o+2],gc).y; } else st.cur=null;
      st.hold=SEAW.NAME[S[o+6]]||null; st.held=!!S[o+7]; st.queue=[]; for(var q2=0;q2<5;q2++) st.queue.push(SEAW.NAME[S[o+8+q2]]||null);
      st.b2bN=S[o+13]; st.combo=Math.max(0,S[o+14]-1); var n=S[o+15]; st.incoming=n?[{n:n,ready:t}]:[]; st.pieces=S[o+16]; st.lines=S[o+17]; st.score=S[o+18]*100;
      c.style=S[o+26]?'quad':'tspin';
      var bu=S[o+L.BUILD]; if(bu>0){ var bn=SEAW.setupNames()[bu-1]||'TST'; st.target={S:{name:bn}}; st.targetN=st.targetN||S[o+L.BUILD+1]; st.tgtBestN=S[o+L.BUILD+1]; st.buildName=bn; } else { st.target=null; st.targetN=0; }
      var bl=S[o+L.BOOK]; if(bl>0){ st.openerName=SEAW.bookNames()[bl-1]||''; st.openPlan=new Array(S[o+L.BOOK+1]); } else { st.openerName=null; st.openPlan=null; }
      if(c.mode!=='over'&&c.mode!=='won') c.mode=fl?'clear':'move'; }
    if(wround<0) wround=S[3];
    if(S[1]===1){ if(roundOverAt<0){ var lo=S[2]>=0?1-S[2]:(S[L.HEADER]?1:0); ko(PL[lo],t); } }
    else if(roundOverAt>=0||S[3]!==wround){ newRound(t); PL.forEach(function(c){ c.mode='move'; }); wpersona(); }
    wround=S[3];
    wlast=S; }
  init(seed0);
  function ffEnd(c,t){ if(late){ late=false; ff=0; ko(c,t); } else newRound(t); }
  function ffPiece(t){ for(var i=0;i<2;i++){ var c=PL[i], o=PL[1-i], g=c.g, st=g.st; if(!g.spawn()){ ffEnd(c,t); return; }
      if(!g.ffMove()) g.act('drop');
      var rows=g.lock(); if(st.over){ ffEnd(c,t); return; } st.callout=null;
      if(rows.length){ g.clearRows(rows); send(c,o,t,-1); } else if(!rise(c,t)){ ffEnd(c,t); return; } }
    ffDone++; if(late&&ffDone>40&&hrnd()<.6&&(surface(PL[0].g)+inc(PL[0])>=15||surface(PL[1].g)+inc(PL[1])>=15)){ late=false; ff=0; } }   /* near the top: stop there and let it play out live */





  function interest(t,lead){ if((typeof SEAW!=="undefined"&&SEAW.on)) wsync(t,false); var axs=[[0,0,0,0],[0,0,0,0]], ax=function(i,k,v){ axs[i][k]+=v; return v*ctx.taste()[k]; }, ctr=lead?Math.max(4,lead+1.5):4, wid=lead?Math.max(3.5,lead*.45):3.5, tt=this.last>=0?this.last:t, el=this.started?tt-roundStart:ffDone*1.1, sc=[0,0], why=[[],[]], pair=0, pw=[];
    PL.forEach(function(c,i){ var g=c.g, st=g.st, h=surface(g), n=inc(c), s=0, w=why[i], b=st.b, W=g.W, H=g.H, cells=0, gar=0;
      for(var y=H-24;y<H;y++){ var hasG=false; for(var x=0;x<W;x++){ var j=y*W+x; if(b[j]){ cells++; if(st.pid[j]>=241&&st.pid[j]<=247) hasG=true; } } if(hasG) gar++; }
      var d=Math.max(0,Math.min(1,(h+n-9)/9)); if(d>0){ s+=ax(i,0,2*Math.pow(d,1.4)); if(d>.5) w.push('danger'); }
      var ts=tSlot(g), tT=hasT(st), su=g.setupScan? g.setupScan() : null; if(su&&su.ready) ts=Math.max(ts,1);
      if(ts){ s+=ax(i,1,ts*(tT?1.6:.6)); if(tT&&ts>=1) w.push('spin'); }
      // mid-game setups: a TST slot, or two slots stacked (a DT cannon, an STSD, ...): the most worth waiting for
      if(su&&su.n){ var near=su.hits.filter(function(h){ return h.miss<=1&&h.M<=9; }), stk=false;
        for(var i1=0;i1<near.length&&!stk;i1++) for(var i2=i1+1;i2<near.length;i2++){ var p1=near[i1], p2=near[i2]; if(Math.abs(p1.y-p2.y)>=2&&Math.abs(p1.x-p2.x)<=3&&(p1.miss===0||p2.miss===0)){ stk=true; break; } }
        if(stk){ s+=ax(i,1,2.8+(tT?1:0)); w.push('cannon'); } else if(near.some(function(h){ return h.L>=3; })){ s+=ax(i,1,2+(tT?.8:0)); w.push('tst'); } else if(near.length){ s+=ax(i,1,.7); } }
      // a named line in progress from the book: an opener, or a mid-game continuation (DT cannon, C-spin, STSD...)
      if(st.openPlan&&st.openPlan.length&&st.openerName){ var mid=st.pieces>=7, cool=g.coolOf?g.coolOf(st.stage2||st.openerName):1; s+=ax(i,1,(mid?2.4:1.2)+cool*(mid?1.1:1.4));   /* the showy lines (cannons, Hachispin, towers) are what's worth flying over for */ w.push((mid?'setup:':'opener:')+(st.stage2||st.openerName).replace(/ \(mirror\)/,'').split(' · ')[0]); }
      if(st.target){ var tl=Math.max(0,1-(st.tgtBestN||st.targetN||20)/Math.max(8,st.targetN||20)), cnm=st.target.S&&st.target.S.name; s+=ax(i,1,2.2+2.4*tl+(cnm?1.4+1.2*tl:0)); w.push(cnm&&tl>.55?'cannon':'tower'); }   /* a tower or a chain (a DT cannon, a double-double) going up: worth more the nearer it is */   // a TST tower going up: worth more the nearer it is
      else if(st.buildPlan&&st.buildPlan.length){ s+=ax(i,1,1.2); w.push('building'); }
      if(st.b2bN>=2){ s+=ax(i,2,Math.min(3,st.b2bN*.3)+(st.b2bN>=4?1:0)); if(st.b2bN>=4) w.push('surge'); }
      if(st.combo>=3){ s+=ax(i,1,Math.min(2,st.combo*.35)); w.push('combo'); }
      if(gar>=4&&n===0){ s+=ax(i,0,Math.min(1.8,.6+gar*.15)); w.push('dig'); }
      if(st.pieces>4&&cells>0&&cells<=36&&h<=4&&!gar&&cells%2===0){ var pcl=(st.pcPlan&&st.pcPlan.length)||st.pcOn; s+=ax(i,1,pcl?3:c.style==='pc'?1.2:.5); if(pcl) w.push('pc'); }
      var ex=c.ex*Math.pow(.5,Math.max(0,tt-c.exT)/5); s+=ax(i,2,Math.min(3.5,Math.max(0,ex-1.5)*.45)); if(ex>6) w.push('hot');
      intents(c).forEach(function(it){ var sec=it.eta/Math.max(1,c.pps), f=Math.exp(-Math.pow((sec-ctr)/wid,2));   /* due about when the camera gets there */ s+=ax(i,1,it.w*f); if(f>.4) w.push('soon:'+it.k); });
      s+=ax(i,3,Math.max(0,(c.pps-2.4))*.9+1.3*Math.max(0,c.skill-.5)+(c.flav==='cannon'||c.flav==='spinner'?.5:0));   // the fast, the good and the flashy are worth a look
      if(c.star&&tt-c.star<300){ s+=ax(i,2,1.2+(s>3?1:0)); w.push('star'); }   /* someone it's watched do something special: it comes back for them */
      sc[i]=s; });
    var a0=PL[0], a1=PL[1], exn=function(c){ return c.ex*Math.pow(.5,Math.max(0,tt-c.exT)/5); };
    if(exn(a0)>3&&exn(a1)>3&&(inc(a0)>0||inc(a1)>0)){ pair+=2*ctx.taste()[2]; pw.push('battle'); }
    if(roundOverAt>=0){ pair+=4*ctx.taste()[0]; pw.push('ko'); } else if(Math.min(a0.g.st.pieces,a1.g.st.pieces)<10){ pair+=2.5*ctx.taste()[3]; pw.push('start'); }
    if(el>180){ pair+=ctx.taste()[2]; pw.push('overtime'); }
    var sk=(a0.skill+a1.skill)/2; pair+=1.2*sk; if(sk>.8) pw.push('pro');
    var side=sc[1]>sc[0]?1:0, W2=pw.concat(why[side]), RANK=['cannon','tst','spin','setup','surge','pc','ko','combo','danger','dig','star','start','opener','battle','overtime','hot'], kind='';
    for(var q=0;q<RANK.length&&!kind;q++) for(var q2=0;q2<W2.length;q2++) if(W2[q2].indexOf(RANK[q])===0){ kind=RANK[q]; break; }
    this.lastAx=[axs[0][0]+axs[1][0],axs[0][1]+axs[1][1],axs[0][2]+axs[1][2],axs[0][3]+axs[1][3]]; return {s:sc[side]+.5*sc[1-side]+pair,side:side,sc:sc,why:W2,kind:kind,ax:this.lastAx}; }
  return { PL:PL, inc:inc, hot:hot, idx:idx, interest:interest, held:0, events:EV, reseed:function(seed,t){ init(seed); this.started=false; ffQ.push(this); },
    lite:function(v,deep){ PL.forEach(function(c){ c.liteBase=v||c.skill<.38; c.g.setLite(c.tunnel?true:c.liteBase); if(c.g.setDeep) c.g.setDeep(!v&&!!deep&&(c.skill>=.5||(c.kn&&c.kn[0]<c.skill*1.4))); }); },   // the match being watched may search wider (there's time: it's the only one) skill:function(){ return (PL[0].skill+PL[1].skill)/2; },
    anim:function(t){ var tt=this.last>=0?this.last:t; return roundOverAt>=0||PL.some(function(c){ return (c.overAt>=0&&tt-c.overAt<3)||tt-c.enterAt<2.5; }); },
    isLate:function(){ return late; },
    cutFF:function(){ if(late){ late=false; ff=Math.min(ff,4); } else ff=Math.min(ff,12); },
    ff:function(){ return ff; }, ffStep:function(t){ if(ff>0){ ffPiece(t); ff--; PL.forEach(function(c){ c.ex=0; }); } },   // run on to a match's last moments, then wait
    started:false,
    last:-1,
    // out of view a game stands still; when it comes back its clock is moved on by the gap, so nothing in it jumps
    shift:function(g){ roundStart+=g; if(roundOverAt>=0) roundOverAt+=g; PL.forEach(function(c){ c.at+=g; c.exT+=g; c.enterAt+=g; c.tiltTo+=g; if(c.wonAt>=0) c.wonAt+=g; if(c.thinkT!=null) c.thinkT+=g; if(c.flash) c.flash.t+=g; if(c.overAt>=0) c.overAt+=g; c.callT+=g; c.g.st.incoming.forEach(function(q){ q.ready+=g; }); }); },
    tiny:function(v){ if(this.tn===v) return; this.tn=v; PL.forEach(function(c){ if(c.g.setTiny) c.g.setTiny(v); }); },
    wsync:function(t){ this.last=t; this.started=true; wsync(t,true); },
    step:function(t,ms,flow){ if((typeof SEAW!=="undefined"&&SEAW.on)){ this.last=t; this.started=true; wsync(t,true); return; } sliceMs=ms||2.5; if(this.last>=0&&t-this.last>.12&&!(flow&&t-this.last<1.5)) this.shift(t-this.last-.12); this.last=t;   /* flow: on screen but skipped a frame or two (the crowd shares the budget): its time runs on and it catches up, rather than standing still */
      if(!this.started){ this.started=true; ff=0; roundStart=t-ffDone*1.1; PL[0].at=t+hrnd()*1.5; PL[1].at=t+hrnd()*1.5; }
      thought=false; if(roundOverAt<0){ step(PL[0],PL[1],t); if(roundOverAt<0) step(PL[1],PL[0],t); } else if(t-roundOverAt>2.6) newRound(t); },
    status:function(t){ var el=t-roundStart; return {mult:el<180?1:1+.008*(el-180),seed:seed0+round,round:round+1,a:statOf(PL[0],t),b:statOf(PL[1],t)}; } }; }
