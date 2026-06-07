#!/bin/sh

export AMPERSAND_BUILD_TYPE=rc
export AMPERSAND_VERSION=0.3.0-rc3
export AMPERSAND_GOES_TO_APP_STORE=1

node upgrade-vcs.mjs
yarn tauri android build --aab --target aarch64 armv7
