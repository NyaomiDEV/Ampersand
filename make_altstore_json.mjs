#!/bin/env node
"use strict";

import { readFile, writeFile, stat } from "node:fs/promises";

async function generateAltStoreJson() {
	const version = process.env.AMPERSAND_VERSION;
	const tagName = (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== "main") ? process.env.GITHUB_REF_NAME : "dev";
	const ipaPath = process.env.IPA_PATH || "src-tauri/gen/apple/build/arm64/Ampersand.ipa";
	const repoName = process.env.GITHUB_REPOSITORY || "NyaomiDEV/Ampersand";

	const title = (await readFile("metadata/en-US/title.txt", "utf-8")).trim();
	const shortDescription = (await readFile("metadata/en-US/short_description.txt", "utf-8")).trim();
	const fullDescription = (await readFile("metadata/en-US/full_description.txt", "utf-8")).trim();

	const ipaStat = await stat(ipaPath);
	const size = ipaStat.size;
	const date = new Date().toISOString();

	const downloadUrl = `https://github.com/${repoName}/releases/download/${tagName}/Ampersand-${version}.ipa`;
	const iconUrl = `https://raw.githubusercontent.com/${repoName}/main/branding/icon/1024.png`;

	let altStoreSource;
	const existingJsonUrl = `https://github.com/${repoName}/releases/latest/download/altstore.json`;

	try {
		console.log(`Attempting to fetch existing altstore.json from ${existingJsonUrl}...`);
		const response = await fetch(existingJsonUrl, { redirect: "follow" });
		if (response.ok) {
			altStoreSource = await response.json();
			console.log("Existing altstore.json loaded.");
		} else {
			console.warn(`Could not fetch existing altstore.json (Status: ${response.status}). Starting fresh.`);
		}
	} catch (err) {
		console.warn("Error fetching existing altstore.json. Starting fresh.", err.message);
	}

	const newVersionEntry = {
		version: version,
		date: date,
		downloadURL: downloadUrl,
		localizedDescription: `Version ${version}`,
		size: size
	};

	if (!altStoreSource) {
		altStoreSource = {
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
					versions: [newVersionEntry]
				}
			]
		};
	} else {
		// Update top-level metadata
		altStoreSource.name = title;
		altStoreSource.subtitle = shortDescription;
		altStoreSource.description = fullDescription;

		const app = altStoreSource.apps.find(a => a.bundleIdentifier === "moe.ampersand.app");
		if (app) {
			app.name = title;
			app.subtitle = shortDescription;
			app.localizedDescription = fullDescription;
			
			// Prepend new version and remove duplicates (by version string)
			const otherVersions = app.versions.filter(v => v.version !== version);
			app.versions = [newVersionEntry, ...otherVersions].slice(0, 10);
		} else {
			// This shouldn't happen if the source is ours, but just in case
			altStoreSource.apps.push({
				name: title,
				bundleIdentifier: "moe.ampersand.app",
				developerName: "NyaomiDEV",
				subtitle: shortDescription,
				localizedDescription: fullDescription,
				iconURL: iconUrl,
				versions: [newVersionEntry]
			});
		}
	}

	await writeFile("altstore.json", JSON.stringify(altStoreSource, undefined, 2), "utf-8");
	console.log("altstore.json generated successfully with version history.");
}

generateAltStoreJson().catch(err => {
	console.error(err);
	process.exit(1);
});
