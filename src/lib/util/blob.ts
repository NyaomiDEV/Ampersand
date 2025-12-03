import { SQLFile } from "../db/entities";
import { fileToJSFile } from "../db/tables/files";

const dataURLs = new Map<string, {
	file: File,
	url: string
}>();

export async function getObjectURL(file: SQLFile){
	if(dataURLs.has(file.id))
		return dataURLs.get(file.id)!.url;

	const jsfile = await fileToJSFile(file);
	const url = URL.createObjectURL(jsfile);

	dataURLs.set(file.id, {
		file: jsfile,
		url
	});

	return url;
}

export function getFile(url: string): File | undefined {
	return Array.from(dataURLs.values()).find(_obj => _obj.url === url)?.file;
}
