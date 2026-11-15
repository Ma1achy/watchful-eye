#!/usr/bin/env bash
# Builds Four's sea module (crates/four-sea) for the web and puts it in engine/: a release WebAssembly build, then
# wasm-opt for size. Usage: tools/sync-engine.sh /path/to/Four
set -euo pipefail
FOUR="${1:?usage: tools/sync-engine.sh /path/to/Four}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
( cd "$FOUR" && cargo build --release -p four-sea --target wasm32-unknown-unknown )
mkdir -p "$HERE/engine"
npx --no-install wasm-opt -O3 --strip-debug \
  --enable-bulk-memory --enable-sign-ext --enable-nontrapping-float-to-int --enable-mutable-globals \
  "$FOUR/target/wasm32-unknown-unknown/release/four_sea.wasm" -o "$HERE/engine/four_sea.wasm"
echo "engine/four_sea.wasm: $(wc -c < "$HERE/engine/four_sea.wasm") bytes, from Four $(git -C "$FOUR" rev-parse --short HEAD)"
