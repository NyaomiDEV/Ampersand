import { onUnmounted } from "vue";
import { getExtension } from "../mime";
import { newFile } from "../fileref";

const globalDataURLs = new Map<string, [File, number]>();

export function useBlob(){
	const usedDataURLs: Set<string> = new Set();

	onUnmounted(clear);

	function getObjectURL(file: File) {
		for(const [url, fileref] of globalDataURLs){
			const _file = fileref[0];
			if(_file === file){
				if(!usedDataURLs.has(url)){
					fileref[1]++;
					usedDataURLs.add(url);
				}
				return url;
			}
		}
		const url = URL.createObjectURL(file);
		globalDataURLs.set(url, [file, 1]);
		usedDataURLs.add(url);
		return url;
	}

	function revokeObjectURL(urlOrFile: string | File){
		const url = globalDataURLs.entries().find(x => {
			if(urlOrFile instanceof File)
				return x[1][0] === urlOrFile;
			return x[0] === urlOrFile;
		})?.[0];

		if(url){
			const _scope = globalDataURLs.get(url);
			if(!_scope) return;
			_scope[1]--;
			if(_scope[1] < 1){
				globalDataURLs.delete(url);
				URL.revokeObjectURL(url);
			}
			usedDataURLs.delete(url);
		}
	}

	function clear(){
		usedDataURLs.forEach(x => revokeObjectURL(x));
	}

	return {
		getObjectURL,
		revokeObjectURL,
		clear
	};
}

export function getFile(url: string): File | undefined {
	return Array.from(globalDataURLs).find(_obj => _obj[0] === url)?.[1][0];
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
	if(!uri.startsWith("data:")) throw new Error("this is not a data URI");
	const blob = await (await window.fetch(uri)).blob();
	return newFile([blob], `file_${Date.now()}.${getExtension(blob.type)}`, { type: blob.type });
}
