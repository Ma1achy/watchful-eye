// Which of the NP games a tile shows when it hasn't been given one: a hash of where it is, so there's no edge and no
// visible repeat. The shader's slotOf() is the same hash.
export function seaSlot(tx,ty,NP){ var h=(Math.imul(tx|0,73856093)^Math.imul(ty|0,19349663))>>>0; h=(h^(h>>>13))>>>0; h=Math.imul(h,0x5bd1e995)>>>0; h=(h^(h>>>15))>>>0; return h%NP; }
