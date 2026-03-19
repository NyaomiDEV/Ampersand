const dataURLs = new Map<string, File>();

export function getObjectURL(file: File){
	const maybeCachedEntry = dataURLs.entries().find(x => x[1] === file);
	if(maybeCachedEntry) return maybeCachedEntry[0];

	const url = URL.createObjectURL(file);
	dataURLs.set(url, file);
	return url;
}

export function getFile(url: string): File | undefined {
	return Array.from(dataURLs.entries()).find(_obj => _obj[0] === url)?.[1];
}
