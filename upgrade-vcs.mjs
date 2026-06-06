#!/bin/env node
"use strict";

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import * as TOML from "smol-toml";

const buildsThatHappenLocally = [
	"local",
	"rc",
	"stable-oldpackage",
	"stable"
]

//
// UTILITY FUNCTIONS
//
function getBuildType(){
	if (process.env.AMPERSAND_BUILD_TYPE && [...buildsThatHappenLocally, "unstable", "rc-sideload", "stable-sideload"].includes(process.env.AMPERSAND_BUILD_TYPE))
		return process.env.AMPERSAND_BUILD_TYPE;

	if(process.env.GITHUB_REF) {
		console.log()
		if (!process.env.GITHUB_REF.startsWith("refs/tags/"))
			return "unstable";
		else if (process.env.GITHUB_REF.startsWith("refs/tags/") && process.env.GITHUB_REF.includes("-rc"))
			// 0.2.1-rc1, 0.2.1-rc2, etc.
			return "rc-sideload";
		else
			return "stable-sideload";
	}

	return "local";
}

function spawnAsync(cmd, args, cwd){
	return new Promise(resolve => {
		const _process = spawn(cmd, args, {stdio: "pipe", cwd});

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

async function getVersion(buildType){
	const revcount = parseInt((await spawnAsync("git", ["rev-list", "--count", "HEAD"], import.meta.dirname)).stdout);
	const packageJson = JSON.parse(await readFile(resolve(import.meta.dirname, "package.json"), "utf-8"));

	switch(buildType){
		default: {
			if ((buildType.startsWith("rc") ? /^\d+\.\d+\.\d+\-rc\d+$/ : /^\d+\.\d+\.\d+$/).exec(process.env.AMPERSAND_VERSION) !== null){
				return {
					revcount,
					version: process.env.AMPERSAND_VERSION,
				};
			}

			return {
				revcount,
				version: process.env.GITHUB_REF_NAME || packageJson.version
			};
		}
		case "unstable": {
			if (/^\d+\.\d+\.\d+\+\d+$/.exec(process.env.AMPERSAND_VERSION) !== null) {
				return {
					revcount,
					version: process.env.AMPERSAND_VERSION,
				};
			}

			const closestTag = (await spawnAsync("git", ["tag", "--list", "--sort=-creatordate"], import.meta.dirname)).stdout.trim().split("\n").find(x => x !== "dev" && !x.includes("-rc"));
			const deltaRevcount = parseInt((await spawnAsync("git", ["rev-list", "--count", closestTag], import.meta.dirname)).stdout);
			return {
				revcount,
				version: closestTag + "+" + (revcount - deltaRevcount)
			};
		}
	}
}

async function patchFiles(buildType, version) {
	// Read manifest files
	const packageJson = JSON.parse(await readFile(resolve(import.meta.dirname, "package.json"), "utf-8"));
	const tauriConfJson = JSON.parse(await readFile(resolve(import.meta.dirname, "src-tauri", "tauri.conf.json"), "utf-8"));
	const tauriCargoToml = TOML.parse(await readFile(resolve(import.meta.dirname, "src-tauri", "Cargo.toml"), "utf-8"));
	const tauriPluginCargoToml = TOML.parse(await readFile(resolve(import.meta.dirname, "src-tauri-plugin", "Cargo.toml"), "utf-8"));

	// Modify parsed manifests
	tauriConfJson.bundle.android.versionCode = version.revcount;
	tauriConfJson.bundle.iOS.bundleVersion = `${version.revcount}`;
	tauriConfJson.bundle.macOS.bundleVersion = `${version.revcount}`;
	tauriConfJson.bundle.windows.wix.version = `${version.version.replace(/(?:\+|\-rc)\d+$/, "")}.${version.revcount % 65535}`;

	// We need to modify files if this is an RC build (we'd be passing the version through AMPERSAND_VERSION env)
	// otherwise, for automated builds we always modify the files
	if (!buildsThatHappenLocally.filter(x => x !== "rc").includes(buildType)) {
		// Modify parsed manifests
		packageJson.version = version.version;
		tauriCargoToml.package.version = version.version;
		tauriPluginCargoToml.package.version = version.version;

		// Write modified manifests
		await writeFile(resolve(import.meta.dirname, "package.json"), JSON.stringify(packageJson, undefined, 2), "utf-8");
		await writeFile(resolve(import.meta.dirname, "src-tauri", "Cargo.toml"), TOML.stringify(tauriCargoToml), "utf-8");
		await writeFile(resolve(import.meta.dirname, "src-tauri-plugin", "Cargo.toml"), TOML.stringify(tauriPluginCargoToml), "utf-8");
	}

	// Write modified manifests
	await writeFile(resolve(import.meta.dirname, "src-tauri", "tauri.conf.json"), JSON.stringify(tauriConfJson, undefined, 2), "utf-8");
}

//
// MAIN CODE
//

const buildType = getBuildType();
const version = await getVersion(buildType);

console.log("New version is %s (%s) -- Buildtype '%s'", version.version, version.revcount, buildType);

// If in CI, export as env
if (process.env.GITHUB_ENV) {
	await appendFile(process.env.GITHUB_ENV, `AMPERSAND_VERSION=${version.version}\n`, "utf-8");
	await appendFile(process.env.GITHUB_OUTPUT, `ampersand_version=${version.version}\n`, "utf-8");

	await appendFile(process.env.GITHUB_ENV, `AMPERSAND_BUILD_TYPE=${buildType}\n`, "utf-8");
	await appendFile(process.env.GITHUB_OUTPUT, `ampersand_build_type=${buildType}\n`, "utf-8");
}

// If NO_PATCH is not set, patch files
if(!process.env.NO_PATCH)
	await patchFiles(buildType, version);
 