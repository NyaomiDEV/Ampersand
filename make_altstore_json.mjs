#!/bin/env node
"use strict";

import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

async function generateAltStoreJson() {
	const version = process.env.AMPERSAND_VERSION;
	const tagName = process.env.GITHUB_REF_NAME != "main" ? process.env.GITHUB_REF_NAME : "dev";
	const ipaPath = process.env.IPA_PATH || "src-tauri/gen/apple/build/arm64/Ampersand.ipa";
	const repoName = "NyaomiDEV/Ampersand";

	const title = (await readFile("metadata/en-US/title.txt", "utf-8")).trim();
	const shortDescription = (await readFile("metadata/en-US/short_description.txt", "utf-8")).trim();
	const fullDescription = (await readFile("metadata/en-US/full_description.txt", "utf-8")).trim();

	const ipaStat = await stat(ipaPath);
	const size = ipaStat.size;
	const date = new Date().toISOString();

	const downloadUrl = `https://github.com/${repoName}/releases/download/${tagName}/Ampersand.ipa`;
	const iconUrl = `https://raw.githubusercontent.com/${repoName}/main/branding/icon/1024.png`;

	const altStoreSource = {
		name: title,
		identifier: "moe.ampersand.app.source",
		subtitle: shortDescription,
		description: fullDescription,
		iconURL: iconUrl,
		apps: [
			{
				name: title,
				bundleIdentifier: "moe.ampersand.app",
				developerName: "NyaomiDEV",
				subtitle: shortDescription,
				localizedDescription: fullDescription,
				iconURL: iconUrl,
				versions: [
					{
						version: version,
						date: date,
						downloadURL: downloadUrl,
						localizedDescription: `Version ${version}`,
						size: size
					}
				]
			}
		]
	};

	await writeFile("altstore.json", JSON.stringify(altStoreSource, undefined, 2), "utf-8");
	console.log("altstore.json generated successfully.");
}

generateAltStoreJson().catch(err => {
	console.error(err);
	process.exit(1);
});
