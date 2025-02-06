const dataURLs = new Map<File, string>();

export function getObjectURL(file: File){
	const maybeEntry = [...dataURLs.entries()].find(([k]) => k.name === file.name);

	if(maybeEntry)
		return maybeEntry[1];

	const url = URL.createObjectURL(file);

	dataURLs.set(file, url);

	return url;
}

export async function getFile(url: string): Promise<File | undefined> {
	return dataURLs.entries().find(([_, _url]) => _url === url)?.[0];
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