// Garbage a player has waiting: how much, and whether any of it is ready to rise.

export function inc(c){ var n=0; c.g.st.incoming.forEach(function(q){ n+=q.n; }); return n; }

export function hot(c,t){ return c.g.st.incoming.some(function(q){ return q.ready<=t; })?1:0; }
