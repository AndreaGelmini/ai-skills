#!/usr/bin/env bash
#
# carosello-to-short.sh — Turn slide-*.png files into a vertical YouTube Short.
# Usage: bash scripts/carosello-to-short.sh <slide-directory> [output.mp4]
#
# Optional: SLIDE_SECONDS=7 TRANSITION=0.5 XT=fade BG=0x080F1F FPS=30
# Requires FFmpeg and FFprobe. Does not use Imejis API or render credits.
set -euo pipefail

INPUT_DIR="${1:?Usage: $0 <slide-directory> [output.mp4]}"
[[ -d "$INPUT_DIR" ]] || { echo "Input directory not found: $INPUT_DIR" >&2; exit 1; }
INPUT_DIR="$(cd "$INPUT_DIR" && pwd)"
OUTPUT="${2:-$INPUT_DIR/youtube-short.mp4}"

SLIDE_SECONDS="${SLIDE_SECONDS:-7}"
TRANSITION="${TRANSITION:-0.5}"
XT="${XT:-fade}"
BG="${BG:-0x080F1F}"
FPS="${FPS:-30}"
CANVAS_W=1080
CANVAS_H=1920

command -v ffmpeg >/dev/null || { echo "FFmpeg is required." >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "FFprobe is required." >&2; exit 1; }
[[ "$FPS" =~ ^[1-9][0-9]*$ ]] || { echo "FPS must be a positive integer." >&2; exit 1; }
[[ "$BG" =~ ^0x[[:xdigit:]]{6}$ ]] || { echo "BG must be 0xRRGGBB." >&2; exit 1; }
awk -v s="$SLIDE_SECONDS" -v t="$TRANSITION" 'BEGIN {
  if (s !~ /^[0-9]+([.][0-9]+)?$/ || t !~ /^[0-9]+([.][0-9]+)?$/ || s <= t || t <= 0)
    exit 1
}' || { echo "Require SLIDE_SECONDS > TRANSITION > 0." >&2; exit 1; }
[[ "$XT" =~ ^[a-z][a-z0-9]*$ ]] || { echo "Invalid xfade transition name." >&2; exit 1; }

# Compatible with Bash 3.2+ (including default macOS Bash).
slides=()
while IFS= read -r file; do slides+=("$file"); done < <(
  find "$INPUT_DIR" -maxdepth 1 -type f -name 'slide-*.png' | LC_ALL=C sort
)
NT=${#slides[@]}
(( NT >= 2 )) || { echo "Need at least two slide-*.png files." >&2; exit 1; }

TOTAL=$(awk -v n="$NT" -v s="$SLIDE_SECONDS" -v t="$TRANSITION"   'BEGIN{printf "%.2f", n*s - (n-1)*t}')
echo "Found $NT slides; estimated duration: ${TOTAL}s"
if awk -v total="$TOTAL" 'BEGIN{exit !(total>180)}'; then
  echo "Warning: exceeds the 3-minute YouTube Short maximum." >&2
fi
if [[ -e "$OUTPUT" ]]; then
  echo "Output exists; refusing to overwrite: $OUTPUT" >&2
  exit 1
fi
mkdir -p "$(dirname "$OUTPUT")"

inputs=()
filters=()
for i in "${!slides[@]}"; do
  inputs+=(-loop 1 -t "$SLIDE_SECONDS" -i "${slides[$i]}")
  filters+=(
    "[$i:v]scale=$CANVAS_W:$CANVAS_H:force_original_aspect_ratio=decrease,setsar=1,pad=$CANVAS_W:$CANVAS_H:(ow-iw)/2:(oh-ih)/2:$BG,format=yuv420p,fps=$FPS,settb=AVTB[v$i]"
  )
done

prev="v0"
for (( i=1; i<NT; i++ )); do
  offset=$(awk -v k="$i" -v s="$SLIDE_SECONDS" -v t="$TRANSITION"     'BEGIN{printf "%.3f", k*(s-t)}')
  out="x$i"
  filters+=("[$prev][v$i]xfade=transition=$XT:duration=$TRANSITION:offset=$offset[$out]")
  prev="$out"
done
filters+=("[$prev]format=yuv420p[vout]")
FILTER_GRAPH=$(IFS=';'; echo "${filters[*]}")

ffmpeg -hide_banner -loglevel error -stats -n "${inputs[@]}"   -filter_complex "$FILTER_GRAPH" -map "[vout]"   -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS"   -movflags +faststart "$OUTPUT"

ffprobe -v error -select_streams v:0 -show_entries stream=width,height   -of default=noprint_wrappers=1 "$OUTPUT"
echo "Saved: $OUTPUT"
