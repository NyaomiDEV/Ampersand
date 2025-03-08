import { md5 } from "./md5";

const dataURLs = new Map<string, {
	file: File,
	url: string
}>();

export function getObjectURL(file: File){
	const hash = Array.from(md5(new TextEncoder().encode(file.name + file.lastModified + file.size))).map(x => x.toString(16)).join("");
	if(dataURLs.has(hash))
		return dataURLs.get(hash)!.url;

	const url = URL.createObjectURL(file);

	dataURLs.set(hash, {
		file,
		url
	});

	return url;
}

export function getFile(url: string): File | undefined {
	return Array.from(dataURLs.values()).find(_obj => _obj.url === url)?.file;
}

export function getDataURL(url: string): Promise<string | null> {
	return new Promise(async resolve => {
		const file = await getFile(url);
		if(!file) return resolve(null);
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			resolve(reader.result as string);
		});
		reader.readAsDataURL(file);
	});
}