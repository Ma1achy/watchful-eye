// The engine on its own, for tools/bench/engine.html.
export { SEAW, startPool } from './engine/pool.js';
import { SEAW } from './engine/pool.js';
import { bootEngine } from './engine/boot.js';
SEAW.bootEngine = bootEngine;
