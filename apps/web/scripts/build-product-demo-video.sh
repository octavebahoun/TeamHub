#!/usr/bin/env bash
# Rebuild /public/videos/wine-product-demo.{mp4,webm} from demo-frames.
# Requires ffmpeg (or ffmpeg-static binary via FFMPEG env).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRAMES="$ROOT/public/videos/demo-frames"
OUT="$ROOT/public/videos"
FF="${FFMPEG:-ffmpeg}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

ordered=(
  wine-demo-06-home.jpg
  wine-demo-01-tasks.jpg
  wine-demo-02-chat.jpg
  wine-demo-03-crm.jpg
  wine-demo-04-analytics.jpg
  wine-demo-05-billing.jpg
)

i=0
for f in "${ordered[@]}"; do
  "$FF" -y -i "$FRAMES/$f" \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xf6f5f1,setsar=1,fps=24,format=yuv420p" \
    "$WORK/f$(printf '%02d' $i).jpg"
  i=$((i + 1))
done

{
  for n in 00 01 02 03 04 05; do
    echo "file '$WORK/f$n.jpg'"
    echo "duration 2.5"
  done
  echo "file '$WORK/f05.jpg'"
} >"$WORK/list.txt"

"$FF" -y -f concat -safe 0 -i "$WORK/list.txt" -vf "fps=24,format=yuv420p" -an \
  -c:v libx264 -preset veryfast -crf 28 -movflags +faststart \
  "$OUT/wine-product-demo.mp4"

cp "$WORK/f01.jpg" "$OUT/wine-product-demo-poster.jpg"

ls -lh "$OUT/wine-product-demo.mp4" "$OUT/wine-product-demo-poster.jpg"
