#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
LOCALE="${LOCALE:-en}"
OUTPUT_DIR="${OUTPUT_DIR:-./screenshots}"
WINDOW_STANDARD="${WINDOW_STANDARD:-1440,1100}"
WINDOW_TALL="${WINDOW_TALL:-1440,2200}"
WAIT_TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-60}"
VIRTUAL_TIME_BUDGET="${VIRTUAL_TIME_BUDGET:-7000}"

if command -v google-chrome >/dev/null 2>&1; then
  BROWSER_BIN="google-chrome"
elif command -v chromium >/dev/null 2>&1; then
  BROWSER_BIN="chromium"
elif command -v chromium-browser >/dev/null 2>&1; then
  BROWSER_BIN="chromium-browser"
else
  echo "No supported headless browser found. Install google-chrome or chromium." >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"

echo "Waiting for ${BASE_URL} to respond..."
for _ in $(seq 1 "${WAIT_TIMEOUT_SECONDS}"); do
  if curl -fsS "${BASE_URL}/${LOCALE}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}/${LOCALE}" >/dev/null 2>&1; then
  echo "Timed out waiting for ${BASE_URL}/${LOCALE}" >&2
  exit 1
fi

capture() {
  local path="$1"
  local filename="$2"
  local window_size="$3"

  echo "Capturing ${path} -> ${filename}"
  "${BROWSER_BIN}" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --virtual-time-budget="${VIRTUAL_TIME_BUDGET}" \
    --window-size="${window_size}" \
    --screenshot="${OUTPUT_DIR}/${filename}" \
    "${BASE_URL}${path}"
}

capture "/${LOCALE}" "glossary-os-home.png" "${WINDOW_STANDARD}"
capture "/${LOCALE}/explore" "glossary-os-explore.png" "${WINDOW_STANDARD}"
capture "/${LOCALE}/term/pda" "glossary-os-term-pda.png" "${WINDOW_STANDARD}"
capture "/${LOCALE}/term/pda" "glossary-os-copilot-inline.png" "${WINDOW_TALL}"
capture "/${LOCALE}/copilot?term=pda" "glossary-os-copilot-workspace.png" "${WINDOW_STANDARD}"
capture "/${LOCALE}/paths" "glossary-os-paths.png" "${WINDOW_STANDARD}"
capture "/${LOCALE}/paths/anchor" "glossary-os-path-anchor.png" "${WINDOW_STANDARD}"

echo "Screenshots saved to ${OUTPUT_DIR}"
