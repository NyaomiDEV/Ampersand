#!/bin/env node
"use strict";

import * as TOML from "smol-toml";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const toml = TOML.parse(await readFile(resolve(import.meta.dirname, "src-tauri", "rust-toolchain.toml"), "utf-8"));

console.log("Rust toolchain version: %s", toml.toolchain.channel);
console.log("Rust toolchain profile: %s", toml.toolchain.profile);
console.log("Rust toolchain components:", toml.toolchain.components);
console.log("Rust toolchain targets:", toml.toolchain.targets);

// If in CI, export as output
if (process.env.GITHUB_OUTPUT) {
	await appendFile(process.env.GITHUB_OUTPUT, `rust_toolchain_version=${toml.toolchain.channel}\n`, "utf-8");
	await appendFile(process.env.GITHUB_OUTPUT, `rust_toolchain_profile=${toml.toolchain.profile}\n`, "utf-8");
	await appendFile(process.env.GITHUB_OUTPUT, `rust_toolchain_components=${toml.toolchain.components.join(",")}\n`, "utf-8");
	await appendFile(process.env.GITHUB_OUTPUT, `rust_toolchain_targets=${toml.toolchain.targets.join(",")}\n`, "utf-8");

}