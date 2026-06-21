#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_DIR="$ROOT_DIR/docker/assets"
DEST="$ASSET_DIR/codex-linux-musl.tar.gz"

mkdir -p "$ASSET_DIR"

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)
    ASSET="codex-x86_64-unknown-linux-musl.tar.gz"
    ;;
  arm64|aarch64)
    ASSET="codex-aarch64-unknown-linux-musl.tar.gz"
    ;;
  *)
    echo "unsupported arch: $ARCH" >&2
    exit 1
    ;;
esac

if [[ -f "$DEST" ]]; then
  echo "using cached asset: $DEST"
  exit 0
fi

curl \
  --fail \
  --location \
  --retry 5 \
  --retry-delay 2 \
  --retry-all-errors \
  "https://github.com/openai/codex/releases/download/rust-v0.141.0/${ASSET}" \
  -o "$DEST"
echo "downloaded: $DEST"
