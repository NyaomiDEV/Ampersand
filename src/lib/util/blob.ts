import { onUnmounted } from "vue";
import { getExtension } from "../mime";

export function useBlob(){
	const dataURLs = new Map<string, File>();

	onUnmounted(clear);

	function getObjectURL(file: File) {
		const maybeCachedEntry = dataURLs.entries().find(x => x[1] === file);
		if (maybeCachedEntry) return maybeCachedEntry[0];

		const url = URL.createObjectURL(file);
		dataURLs.set(url, file);
		return url;
	}

	function revokeObjectURL(urlOrFile: string | File){
		const url = dataURLs.entries().find(x => {
			if(urlOrFile instanceof File)
				return x[1] === urlOrFile;
			return x[0] === urlOrFile;
		})?.[0];

		if(url){
			URL.revokeObjectURL(url);
			dataURLs.delete(url);
		}
	}

	function getFile(url: string): File | undefined {
		return Array.from(dataURLs.entries()).find(_obj => _obj[0] === url)?.[1];
	}

	function clear(){
		dataURLs.entries().forEach(x => URL.revokeObjectURL(x[0]));
		dataURLs.clear();
	}

	return {
		getFile,
		getObjectURL,
		revokeObjectURL,
		clear
	};
}

export function toDataURI(file: File): Promise<string>{
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener("load", () => resolve(reader.result as string));
		reader.addEventListener("error", () => reject(new Error(reader.error?.message)));
		reader.readAsDataURL(file);
	});
}

export async function fromDataURI(uri: string): Promise<File> {
	const blob = await (await window.fetch(uri)).blob();
	return new File([blob], `file_${Date.now()}.${getExtension(blob.type)}`, { type: blob.type });
}