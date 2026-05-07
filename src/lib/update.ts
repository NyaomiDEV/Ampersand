import { securityConfig } from "./config";
import type { GitHubRelease, UpdateCheckResponse } from "./types";
import { version } from "../../package.json";
import { fetch } from "@tauri-apps/plugin-http";

async function getReleases(){
	const response = await fetch(
		"https://api.github.com/repos/NyaomiDEV/Ampersand/releases",
		{
			headers: {
				"X-GitHub-Api-Version": "2022-11-28"
			}
		}
	);
	if(response.ok)
		return await response.json() as GitHubRelease[];
	return undefined;
}

export async function checkUpdates(): Promise<UpdateCheckResponse | undefined> {
	if(!securityConfig.allowRemoteContent) return undefined;
	const isCiBuild = import.meta.env.AMPERSAND_IS_CI_BUILD === "1";
	const releases = await getReleases();
	if(!releases) return undefined;

	const response: UpdateCheckResponse = {
		version: "",
		url: `https://github.com/NyaomiDEV/Ampersand/releases/${isCiBuild ? "dev" : "latest"}`,
	};

	const latestRelease = isCiBuild
		? releases.find(x => x.tag_name === "dev")
		: releases.toSorted((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf()).find(x => x.prerelease === false && x.draft === false);

	if(latestRelease){
		const versionMatch = latestRelease.name?.match(/\((\d+\.\d+\.\d+(?:\+?\d+))\)/);
		if(!versionMatch) return undefined;
		response.version = latestRelease.tag_name === "dev" ? versionMatch[1] : latestRelease.tag_name;
		response.url = latestRelease.html_url;
	}

	return response;
}

function versionStringToComponents(version: string) {
	const parts = version.split(".");
	const response = {
		major: 0,
		minor: 0,
		patch: 0,
		commits_after: 0
	};

	response.major = parseInt(parts[0]);
	if(parts[1]) response.minor = parseInt(parts[1]);
	if(parts[2]){
		const _parts = parts[2].split("+");
		response.patch = parseInt(_parts[0]);
		response.commits_after = parseInt(_parts[1] || "0");
	}

	return response;
}

export function checkIsUpdateNewer(response: UpdateCheckResponse){
	const version_a = versionStringToComponents(version);
	const version_b = versionStringToComponents(response.version);

	return version_a.major < version_b.major ||
		version_a.minor < version_b.minor ||
		version_a.patch < version_b.patch ||
		version_a.commits_after < version_b.commits_after;
}