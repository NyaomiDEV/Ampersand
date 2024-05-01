const blobURLs = new Map<Blob, string>();

export function getBlobURL(blob: Blob){
	if(blobURLs.has(blob))
		return blobURLs.get(blob);

	const url = URL.createObjectURL(blob);

	blobURLs.set(blob, url);

	return url;
}
