#!/usr/bin/env bash
# ND — descarga las voces japonesas a assets/voice/*.mp3
#
# Los MP3 se versionan en el repo: despues de generarlos, el juego
# funciona SIN CONEXION. Este script solo hace falta para regenerarlos.
#
#   bash tools/fetch_voice.sh          # descarga solo lo que falta
#   bash tools/fetch_voice.sh --force  # regenera todo
#
# Fuente de verdad: assets/voice/lines.js

set -u
cd "$(dirname "$0")/.."
VOICE_DIR="assets/voice"
LINES="$VOICE_DIR/lines.js"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

[ -f "$LINES" ] || { echo "falta $LINES"; exit 1; }
mkdir -p "$VOICE_DIR"

echo "endpoint: Google Translate TTS (tl=ja)"
echo "las lineas salen de $LINES"
echo

# key<TAB>texto, directo por pipe: no usa ficheros temporales.
python3 -c '
import re,sys
src=open(sys.argv[1],encoding="utf-8").read()
for m in re.finditer(r"(\w+)\s*:\s*\{[^}]*?ja:\x27((?:[^\x27\\\\]|\\\\.)*)\x27",src):
    print(m.group(1)+"\t"+m.group(2).replace("\\\\\x27","\x27"))
' "$LINES" | while IFS=$'\t' read -r key text; do
  [ -z "${key:-}" ] && continue
  out="$VOICE_DIR/$key.mp3"

  if [ -s "$out" ] && [ "$FORCE" -eq 0 ]; then
    printf '  skip  %-16s ya existe (%s bytes)\n' "$key" "$(wc -c <"$out" | tr -d ' ')"
    continue
  fi

  code=$(curl -sS -G --max-time 30 -A "Mozilla/5.0" \
    "https://translate.google.com/translate_tts" \
    --data-urlencode "ie=UTF-8" \
    --data-urlencode "client=tw-ob" \
    --data-urlencode "tl=ja" \
    --data-urlencode "ttsspeed=1" \
    --data-urlencode "q=$text" \
    -o "$out.tmp" -w "%{http_code}" 2>/dev/null)

  size=$(wc -c <"$out.tmp" 2>/dev/null | tr -d ' ')
  magic=$(head -c 1 "$out.tmp" 2>/dev/null | od -An -tx1 | tr -d ' \n')

  if [ "$code" = "200" ] && [ "${size:-0}" -gt 2000 ] && [ "$magic" = "ff" ]; then
    mv "$out.tmp" "$out"
    printf '  OK    %-16s %6s bytes  %s\n' "$key" "$size" "$text"
  else
    rm -f "$out.tmp"
    printf '  FALLA %-16s http=%s size=%s magic=%s  %s\n' "$key" "$code" "${size:-0}" "${magic:-none}" "$text"
  fi
  sleep 0.3
done

echo
printf 'descargados: %s mp3\n' "$(ls -1 "$VOICE_DIR"/*.mp3 2>/dev/null | wc -l | tr -d ' ')"
du -sh "$VOICE_DIR" 2>/dev/null | cut -f1 | sed 's/^/peso total: /'