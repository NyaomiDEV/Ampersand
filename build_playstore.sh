#!/bin/sh

export AMPERSAND_BUILD_TYPE=stable
export AMPERSAND_VERSION=0.3.1-rc1
export AMPERSAND_GOES_TO_APP_STORE=1

node upgrade-vcs.mjs
corepack pnpm tauri android build --aab --target aarch64 armv7
