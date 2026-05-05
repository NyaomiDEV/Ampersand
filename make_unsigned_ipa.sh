#!/usr/bin/env bash

set -euo pipefail

IS_CI_BUILD="$(if [ "$GITHUB_REF_NAME" = "main" ]; then echo -n "true"; fi)"

APP_NAME="ampersand"
APP_PRODUCT="Ampersand$(if [ -n "$IS_CI_BUILD" ]; then echo -n " CI"; fi)"
PROJECT_DIR="src-tauri/gen/apple"
PROJECT_PATH="$PROJECT_DIR/${APP_NAME}.xcodeproj"
SCHEME="${APP_NAME}_iOS"
ARCHIVE_PATH="$PROJECT_DIR/build/App.xcarchive"
DERIVED_DATA_PATH="$PROJECT_DIR/DerivedData"
APP_BUNDLE_PATH="$ARCHIVE_PATH/Products/Applications/${APP_PRODUCT}.app"
IPA_PATH="${IPA_PATH:-Ampersand.ipa}"
GITHUB_REF_NAME="${GITHUB_REF_NAME:-""}"

IDENTIFIER="$(node -p "require('./src-tauri/tauri.conf.json').identifier")"
TMP_DIR="$(node -p "require('os').tmpdir()")"
SERVER_ADDR_FILE="$TMP_DIR/${IDENTIFIER}-server-addr"
TAURI_OPEN_LOG="${TAURI_OPEN_LOG:-$TMP_DIR/${APP_NAME}-ios-build-open.log}"
TAURI_PID=""

cleanup() {
  local exit_code=$?

  if [[ -n "$TAURI_PID" ]] && kill -0 "$TAURI_PID" 2>/dev/null; then
    kill "$TAURI_PID" 2>/dev/null || true
    wait "$TAURI_PID" 2>/dev/null || true
  fi

  rm -f "$SERVER_ADDR_FILE"

  if [[ "${KEEP_XCODE_ARTIFACTS:-0}" != "1" ]]; then
    rm -rf "$PROJECT_DIR/build" "$DERIVED_DATA_PATH" "$PROJECT_DIR/assets"
  fi

  if [[ $exit_code -ne 0 && -f "$TAURI_OPEN_LOG" ]]; then
    echo "--- tauri ios build --open log ---"
    cat "$TAURI_OPEN_LOG"
  elif [[ -f "$TAURI_OPEN_LOG" ]]; then
    rm -f "$TAURI_OPEN_LOG"
  fi

  exit "$exit_code"
}

trap cleanup EXIT

echo "--- Cleaning previous iOS build artifacts ---"
rm -rf "$PROJECT_DIR/build" "$DERIVED_DATA_PATH" "$PROJECT_DIR/assets" Payload "$IPA_PATH"
mkdir -p "$PROJECT_DIR/build"
rm -f "$SERVER_ADDR_FILE"

echo "--- Starting tauri ios build --open ---"
yarn tauri ios build --open >"$TAURI_OPEN_LOG" 2>&1 &
TAURI_PID="$!"

echo "--- Waiting for Tauri CLI websocket bridge ---"
for _ in $(seq 1 120); do
  if [[ -s "$SERVER_ADDR_FILE" ]]; then
    break
  fi

  if ! kill -0 "$TAURI_PID" 2>/dev/null; then
    echo "Error: tauri ios build --open exited before writing $SERVER_ADDR_FILE"
    exit 1
  fi

  sleep 1
done

if [[ ! -s "$SERVER_ADDR_FILE" ]]; then
  echo "Error: timed out waiting for $SERVER_ADDR_FILE"
  exit 1
fi

echo "--- Archiving unsigned app ---"
xcodebuild archive \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -archivePath "$ARCHIVE_PATH" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -configuration release \
  -destination "generic/platform=iOS" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGN_ENTITLEMENTS="" \
  CODE_SIGNING_INJECT_BASE_ENTITLEMENTS=NO \
  PRODUCT_BUNDLE_IDENTIFIER="moe.ampersand.app$(if [ -n "$IS_CI_BUILD" ]; then echo -n ".ci"; fi)" \
  PRODUCT_NAME="$APP_PRODUCT"

if [[ ! -d "$APP_BUNDLE_PATH" ]]; then
  echo "Error: archived app bundle not found at $APP_BUNDLE_PATH"
  exit 1
fi

PAYLOAD_DIR="$(mktemp -d "$TMP_DIR/${APP_NAME}-ipa-payload-XXXXXX")"
mkdir -p "$PAYLOAD_DIR/Payload"
cp -R "$APP_BUNDLE_PATH" "$PAYLOAD_DIR/Payload/"

echo "--- Packaging IPA ---"
(
  cd "$PAYLOAD_DIR"
  COPYFILE_DISABLE=1 zip -qry "$OLDPWD/$IPA_PATH" Payload
)
rm -rf "$PAYLOAD_DIR"

echo "Successfully created unsigned IPA: $IPA_PATH"
