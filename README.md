# Watchful Eye

A sea of bot matches, every one played on an exact engine in
WebAssembly, watched by a wandering camera that goes looking for the best moments.

**Live:** https://ma1achy.github.io/watchful-eye/

## Embedding

```html
<iframe src="https://ma1achy.github.io/watchful-eye/?still" style="width:100%;aspect-ratio:16/9;border:0"
        title="Watchful Eye" loading="lazy"></iframe>
```

It fills whatever size it's given. Options in the address:

- `?seed=123`: a particular sea (otherwise a new one each visit)
- `?still`: no dragging or scrolling, so an embed never takes the page's scroll
- `?js`: the original JavaScript bots instead of the WebAssembly engine
- `?timing`: the start-up timings, in a corner (they're always in the console)

## How it's put together

Every match runs in WebAssembly in a pool of workers (one per spare core): the engine and two bots per match. The page
draws the latest snapshot each match has sent, with one fragment shader over a texture atlas of every board, and a
camera that roams the sea and picks what to look at.

```
index.html            the page shell: meta tags, preloads, one module script
css/sea.css
assets/               link-preview image and icons
engine/four_sea.wasm  the engine and bots (built from Four's crates/four-sea; see tools/sync-engine.sh)
data/                 the bots' opener book and setup library, read by the module at start-up
dist/                 the built scripts the page loads (npm run build; committed, since Pages serves them as they are)
src/
  main.js             start-up order, the frame loop, the preload and reveal
  options.js          what the address asks for
  reveal.js           the preload state: boards hidden, then shown together
  engine/             the WebAssembly side
    pool.js           the workers, matches added and replaced, snapshots and events in, the readiness rule
    worker.js         a worker: steps its matches on their own clocks, head starts first (built as dist/worker.js)
    boot.js           compiling the module once and fetching the book and setups, all in parallel
    layout.js         the snapshot and event layout, confirmed by the module
    game-view.js      what the sea reads a game through (a snapshot dressed as the old game object)
    shapes.js         piece shapes for drawing holds, queues and the active piece
  match/              one pair of bots and everything the page adds on top
    pair.js           the match driver: players, rounds, reading snapshots and lock events, interest for the camera
    habits.js         habits a player has on for a spell; reading the other board late
    pace.js           human pace and slips (for the JavaScript bots)
    garbage.js        garbage waiting and ready
    reading.js        reading a board as a viewer would: surface, T-slots, intentions, a summary
  world/              the sea itself
    sea.js            tiles and which game each shows, the frame: what's in view, fidelity, painting, drawing
    paint.js          painting each game into the atlas
    slots.js          the tile-to-game hash (the shader has the same one)
  camera/
    camera.js         the director: flights, framing a board or a match, roaming, input
    flight.js         the shape of a camera move
  render/
    sea-shader.js     the sea's fragment shader, assembled from shaders/
    shaders/*.glsl    uniforms, noise, inks, cells, boards, and the far, middle and near prints
  gl/
    minigl.js         full-screen passes in WebGL 2, with background shader compiles
    shaders/          the common header and the vertex shader
  input/pointer.js    the pointer, for the sea's light
  debug/timing.js     start-up timings
  legacy/scantetris.js  the original JavaScript engine and bots (?js only; built as dist/legacy.js)
tools/
  build.mjs           bundles src/ into dist/ with esbuild
  sync-engine.sh      builds the module from a Four checkout and optimises it with wasm-opt
  export-data.cjs     writes data/ from the JavaScript engine's book and setup library
  shots.mjs           screenshots at several screen shapes, with timings and page errors
  bench/engine.html   how long the matches take to be ready, without drawing
```

## Working on it

```sh
npm install
npm run build            # or: npm run watch
npm run serve            # http://localhost:8080/
npm run shots            # with the server running: screenshots in shots/
npm run engine -- ../Four   # rebuild engine/four_sea.wasm from a Four checkout
```

Open `/tools/bench/engine.html?n=160` on the local server for the engine's start-up time on its own.
