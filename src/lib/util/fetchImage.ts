import { ClientOptions, fetch } from "@tauri-apps/plugin-http";
import { version } from "../../../package.json";
import { platform } from "@tauri-apps/plugin-os";

const ua = `Ampersand/${version} (${platform()})`;

const knownProviders = [
	{
		domains: ["scratchupload.org", "scratchupload.xyz"],
		ua,
		extras: {
			alt: "alttext"
		}
	}
];

function getProvider(input: URL | string){
	const url = new URL(input);

	for(const maybeProvider of knownProviders){
		if(maybeProvider.domains.includes(url.hostname.toLowerCase()))
			return maybeProvider;
	}

	return undefined;
}

export async function fetchImage(input: URL | string, init?: RequestInit & ClientOptions) {
	const provider = getProvider(input);
	
	const req = new Request(input);

	if(provider?.ua)
		req.headers.set("User-Agent", provider.ua);

	const res = await fetch(req, init);
	const extras: Record<string, string> = {};

	if(provider?.extras){
		for(const [k, v] of Object.entries(provider.extras)){
			const header = res.headers.get(v);
			if (header) extras[k] = header;
		}
	}

	return {
		blob: await res.blob(),
		extras
	};
}