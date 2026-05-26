#!/bin/env node
"use strict";

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import * as TOML from "smol-toml";

//
// UTILITY FUNCTIONS
//
function getBuildType(){
	if(process.env.AMPERSAND_BUILD_TYPE && ["local", "prebeta", "unstable", "stable"].includes(process.env.AMPERSAND_BUILD_TYPE))
		return process.env.AMPERSAND_BUILD_TYPE;

	if(process.env.GITHUB_REF_NAME) {
		if (!process.env.GITHUB_REF_NAME.startsWith("refs/tags/"))
			return "unstable";
		else if (process.env.GITHUB_REF_NAME.startsWith("refs/tags/") && process.env.GITHUB_REF_NAME.includes("-"))
			// 0.2.1-beta1, 0.2.1-pre2, etc.
			return "prebeta";
		else
			return "stable";
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
		default:
		case "stable":
		case "local": {
			if (/^\d+\.\d+\.\d+$/.exec(process.env.AMPERSAND_VERSION) !== null)
				return {
					revcount,
					version: process.env.AMPERSAND_VERSION,
				}

			return {
				revcount,
				version: process.env.GITHUB_REF_NAME?.replace("refs/tags/", "") || packageJson.version
			}
		}
		case "prebeta": {
			if (/^\d+\.\d+\.\d+\-.+$/.exec(process.env.AMPERSAND_VERSION) !== null)
				return {
					revcount,
					version: process.env.AMPERSAND_VERSION,
				}

			const version = process.env.GITHUB_REF_NAME.replace("refs/tags/", "");
			return {
				revcount,
				version
			}
		}
		case "unstable": {
			if (/^\d+\.\d+\.\d+\+\d+$/.exec(process.env.AMPERSAND_VERSION) !== null)
				return {
					revcount,
					version: process.env.AMPERSAND_VERSION,
				}

			const closestTag = (await spawnAsync("git", ["tag", "--list", "--sort=-creatordate"], import.meta.dirname)).stdout.trim().split("\n").find(x => x !== "dev" && !x.includes("-"));
			const deltaRevcount = parseInt((await spawnAsync("git", ["rev-list", "--count", closestTag], import.meta.dirname)).stdout);
			return {
				revcount,
				version: packageJson.version + "+" + (revcount - deltaRevcount)
			}
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

	// If this is a build that is not a local one, modify files
	// -- This specifically helps us have consistent versions when tagging
	// -- but we most probably won't need this in local builds
	if (buildType !== "local") {
		// Modify parsed manifests
		packageJson.version = version.version;
		tauriConfJson.version = process.env.AMPERSAND_BUILD_TARGET === "ios" ? version.version.split("+")[0].split("-")[0] : version.version;
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
 