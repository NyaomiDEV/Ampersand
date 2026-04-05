import { reactive } from "vue";
import { useBlob } from "../lib/util/blob";

const fonts = reactive(new Map<string, {
	file: File,
	atRule: string;
}>());

export const useAssetFonts = {
	appendFont: (_a: string, _f: File) => {},
	deleteFont: (_a: string) => {}
};

export function setupAssetFonts(blobFunctions: ReturnType<typeof useBlob>){
	function appendFont(assetName: string, file: File) {
		if(!fonts.has(assetName)){
			const atRule = makeCssAtRule(assetName, file);
			fonts.set(assetName, { file, atRule });
		}
	}

	function deleteFont(assetName: string){
		const file = fonts.get(assetName)?.file;
		if(file){
			blobFunctions.revokeObjectURL(file);
			fonts.delete(assetName);
		}
	}

	function makeCssAtRule(name: string, font: File) {
		return `@font-face { font-family: "${name}"; src: url(${blobFunctions.getObjectURL(font)}); }`;
	}

	useAssetFonts.appendFont = appendFont;
	useAssetFonts.deleteFont = deleteFont;

	return { fonts };
}

