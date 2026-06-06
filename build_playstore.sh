#!/bin/sh

export AMPERSAND_BUILD_TYPE="stable-oldpackage"
export AMPERSAND_GOES_TO_PLAY_STORE=1

node upgrade-vcs.mjs
yarn tauri android build --aab --target aarch64 armv7
