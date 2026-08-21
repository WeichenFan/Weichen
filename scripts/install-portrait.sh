#!/usr/bin/env bash
# Install a generated painted portrait as the Lamplight portrait.
#   ./scripts/install-portrait.sh ~/Downloads/whatever-you-saved.png
#
# Crops to 4:5 from the top (portraits are head-led, so the chin is what goes),
# resizes to 900px wide and writes the WebP the page actually loads. Keeps a
# lossless master alongside so the painting can be recropped later.
set -euo pipefail

SRC="${1:?usage: install-portrait.sh <image>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/assets/img/portrait-disco.webp"
MASTER="$ROOT/assets/portrait-disco-master.png"

[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }

# `identify -format` emits no trailing newline, so `read` returns 1 at EOF and
# `set -e` would kill the script here. The \n in the format string is required.
read -r W H < <(magick identify -format "%w %h\n" "$SRC")
echo "source: ${W}x${H}"

# 4:5 centre crop, biased to the top third so the face is never cut
magick "$SRC" \
  -gravity North -crop "$(python3 -c "
w,h=$W,$H
tw = min(w, int(h*0.8))
th = min(h, int(tw*1.25))
print(f'{tw}x{th}+0+0')")" +repage \
  -strip "$MASTER"

magick "$MASTER" -resize 900x -strip -quality 88 -define webp:method=6 "$OUT"

echo "wrote $OUT"
magick identify "$OUT"
echo "wrote $MASTER (lossless master)"
