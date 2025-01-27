#!/bin/env node
"use strict";

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import * as TOML from "smol-toml";

function spawnAsync(cmd, args){
	return new Promise(resolve => {
		const _process = spawn(cmd, args, {stdio: "pipe"});

		let stdout = "", stderr = "";

		_process.stdout.on("data", (chunk) => stdout += Buffer.from(chunk).toString("utf-8"))
		_process.stderr.on("data", (chunk) => stderr += Buffer.from(chunk).toString("utf-8"))

		_process.on("exit", (code) => {
			resolve({
				code,
				stdout,
				stderr
			})
		})
	})
}

async function main(){
	const revcount = Number((await spawnAsync("git", ["rev-list", "--count", "HEAD"])).stdout);

	if(revcount){
		console.log("Revision count is", revcount);
		const packageJson = JSON.parse(await readFile(resolve(import.meta.dirname, "package.json"), "utf-8"));
		const tauriConfJson = JSON.parse(await readFile(resolve(import.meta.dirname, "src-tauri", "tauri.conf.json"), "utf-8"));
		const tauriCargoToml = TOML.parse(await readFile(resolve(import.meta.dirname, "src-tauri", "Cargo.toml"), "utf-8"));

		const version = packageJson.version + "+" + revcount;
		packageJson.version = version;
		tauriConfJson.version = version;
		tauriCargoToml.package.version = version;

		await writeFile(resolve(import.meta.dirname, "package.json"), JSON.stringify(packageJson, undefined, 2), "utf-8");
		await writeFile(resolve(import.meta.dirname, "src-tauri", "tauri.conf.json"), JSON.stringify(tauriConfJson, undefined, 2), "utf-8");
		await writeFile(resolve(import.meta.dirname, "src-tauri", "Cargo.toml"), TOML.stringify(tauriCargoToml), "utf-8");

		if(process.env.GITHUB_ENV){
			await appendFile(process.env.GITHUB_ENV, `AMPERSAND_VERSION=${version}`, "utf-8");
			console.log("Appended $AMPERSAND_VERSION to GitHub Actions environment.")
		}
	}
}

main();