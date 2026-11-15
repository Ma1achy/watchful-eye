// A worker of the sea: it owns some of the matches (each one Four's engine with two Rust bots, in WebAssembly), steps
// them in real time and posts their snapshots and lock events to the page. Built as its own file (dist/worker.js).
/* Every match keeps its own clock. The worker always steps whichever of its matches is furthest behind real time, one
   frame at a time (what's on screen first), and sends a match's state as soon as it has moved on. Nothing waits for a
   round over all the matches, so no match ever gets a burst of frames at once. When the machine can't keep up, a match
   far behind has its clock moved on (the frames are skipped, not played in a rush): the far sea runs a little slow,
   and what's on screen keeps its pace. */
var E=null, LEN=0, EVLEN=498, M={}, ids=[], want={}, manual=false, busy=0, offFull=true, lastPost={};
function now(){ return performance.now(); }
function qual(m,full){ full=full===2?2:full?1:0; if(m.q!==full){ m.q=full; E.sea_quality(m.i,full); } }   // 2: the deep planner, for what's on screen
function post(list,done){ var out=[], tr=[];
  for(var k=0;k<list.length;k++){ var m=list[k], ev=null, s=null, nev=E.sea_drain(m.i);
    if(nev){ ev=new Int32Array(new Int32Array(E.memory.buffer,E.sea_events_ptr(),nev*EVLEN)); tr.push(ev.buffer); }
    s=new Int32Array(new Int32Array(E.memory.buffer,E.sea_snapshot(m.i),LEN)); tr.push(s.buffer); out.push({id:m.id,s:s,ev:ev}); m.dirty=false; }
  postMessage({snaps:out,load:busy,full:offFull,done:!!done},tr); }
function heads(until,moved){ // head starts: the cheap search runs a new match on to mid-game; the ones on screen first, then the
  // nearest to done (so as many boards as possible are ready soonest)
  while(now()<until){ var h=null; for(var k=0;k<ids.length;k++){ var m=ids[k]; if(m.head>0&&(!h||(want[m.id]|0)>(want[h.id]|0)||((want[m.id]|0)===(want[h.id]|0)&&m.head<h.head))) h=m; }
    if(!h) return false; qual(h,0); var n=Math.min(30,h.head); E.sea_step(h.i,n); h.head-=n;
    if(h.head<=0){ E.sea_drain(h.i); h.base=now(); h.frame=0; h.dirty=true; moved[h.id]=h; } } return true; }
function slice(){ var t0=now(), stepped=0, moved={};
  heads(t0+(Object.keys(want).length?2:8),moved);   // a quarter of every slice, so new boards fill in even when the sea is busy (all of it before anything is on screen)
  while(now()-t0<8){ var best=null, bv=0, t=now();
    for(var k=0;k<ids.length;k++){ var m=ids[k]; if(m.head>0||m.paused) continue;
      var behind=(t-m.base)*0.06-m.frame, cap=want[m.id]?6:45;
      if(behind>cap){ m.base+=(behind-cap)/0.06; behind=cap; }   // too far behind: skip ahead, never rush
      var v=behind+(want[m.id]===2?3:want[m.id]?1.5:0); if(behind>=1&&v>bv){ bv=v; best=m; } }
    if(best){ qual(best,want[best.id]===2?2:(want[best.id]||offFull)?1:0); E.sea_step(best.i,1); best.frame++; best.dirty=true; moved[best.id]=best; stepped++; continue; }
    // nothing is due: the rest of the slice goes to head starts
    if(!heads(t0+8,moved)) break; }
  var work=now()-t0; busy=busy*.97+.03*Math.min(1,work/8);
  if(busy>.85) offFull=false; else if(busy<.5) offFull=true;
  // send what moved: what's on screen every slice, the rest at most twice a second
  var t1=now(), list=[]; for(var id in moved){ var mm=moved[id]; if(want[id]||t1-(lastPost[id]||0)>500){ list.push(mm); lastPost[id]=t1; } }
  if(list.length) post(list,false);
  // straight on while there's work (a message-channel turn: the add/want messages still get through between slices);
  // a short rest when everything is up to date
  if(work>=7.5) ch.port2.postMessage(0); else setTimeout(slice,4); }
var ch=new MessageChannel(); ch.port1.onmessage=function(){ if(!manual) slice(); };
// messages that come before the module is ready (matches are added as soon as the page has drawn its players) wait here
var pending=[];
self.onmessage=function(e){ var d=e.data; if(d.init){ init(d); return; } if(!E){ pending.push(d); return; } handle(d); };
function init(d){ manual=!!d.manual; WebAssembly.instantiate(d.module,{}).then(function(inst){ E=inst.exports; LEN=E.sea_snapshot_len();
      if(d.book){ var tb=new TextEncoder().encode(d.book), bp=E.sea_alloc(tb.length); new Uint8Array(E.memory.buffer,bp,tb.length).set(tb); E.sea_book(); }
      if(d.setups){ var ts=new TextEncoder().encode(d.setups), sp=E.sea_alloc(ts.length); new Uint8Array(E.memory.buffer,sp,ts.length).set(ts); E.sea_setups(); }
      postMessage({ready:true,len:LEN}); var q=pending; pending=[]; q.forEach(handle); if(!manual) slice(); }); }
function handle(d){
  if(d.tick!=null){ // the recorder's clock: every match exactly n frames on, head starts finished, then answer
    var list=[]; ids.forEach(function(m){ if(m.head>0){ qual(m,0); E.sea_step(m.i,m.head); m.head=0; E.sea_drain(m.i); } qual(m,1); if(d.tick) E.sea_step(m.i,d.tick); m.frame+=d.tick; if(want[m.id]||m.frame%30<d.tick||m.dirty) list.push(m); });
    post(list,true); return; }
  if(d.add){ var m={id:d.id,i:E.sea_add(d.a,d.b,d.seed),q:1,frame:0,base:now(),head:d.head|0,paused:false,dirty:true}; M[d.id]=m; ids.push(m); return; }
  if(d.replace){ var r=M[d.id]; E.sea_replace(r.i,d.a,d.b,d.seed); r.q=1; r.frame=0; r.base=now(); r.head=d.head|0; r.dirty=true; return; }
  if(d.want){ want={}; d.lo.forEach(function(id){ want[id]=1; }); d.want.forEach(function(id){ want[id]=2; }); return; }
  if(d.persona){ var pm=M[d.id]; if(!pm) return; new Float32Array(E.memory.buffer,E.sea_persona_ptr(),16).set(d.v); E.sea_persona(pm.i,d.p); return; }
  if(d.pause){ M[d.id].paused=d.on; return; } }
