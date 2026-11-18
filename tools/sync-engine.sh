#!/usr/bin/env bash
# Builds Four's sea module (crates/four-sea) for the web and puts it in engine/: a release WebAssembly build, then
# wasm-opt for size. Also rebuilds data/setups.txt from data/setups.raw.txt with the same engine. Usage: tools/sync-engine.sh /path/to/Four
set -euo pipefail
FOUR="${1:?usage: tools/sync-engine.sh /path/to/Four}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
# the newest stable compiler, not the one Four pins for its own checks: the module comes out about a third faster
TOOLCHAIN="${SEA_TOOLCHAIN:-stable}"
( cd "$FOUR" && cargo "+$TOOLCHAIN" build --release -p four-sea --target wasm32-unknown-unknown )
mkdir -p "$HERE/engine"
npx --no-install wasm-opt -O3 --strip-debug \
  --enable-bulk-memory --enable-sign-ext --enable-nontrapping-float-to-int --enable-mutable-globals \
  "$FOUR/target/wasm32-unknown-unknown/release/four_sea.wasm" -o "$HERE/engine/four_sea.wasm"
# the setup library: the raw shapes, fired on this engine, and the chains generated from them
# (with the named shapes written by hand: data/setups.extra.txt; and the holes and chains cut out of the opener
# book: data/setups.openers.txt, from Four's examples/opener_shapes)
RAW="$(mktemp)"
cat "$HERE/data/setups.raw.txt" "$HERE/data/setups.extra.txt" "$HERE/data/setups.openers.txt" > "$RAW"
( cd "$FOUR" && cargo "+$TOOLCHAIN" run --release -p four-sea --example setup_lib -- "$RAW" "$HERE/data/setups.txt" )
rm -f "$RAW"
echo "engine/four_sea.wasm: $(wc -c < "$HERE/engine/four_sea.wasm") bytes, from Four $(git -C "$FOUR" rev-parse --short HEAD)"
