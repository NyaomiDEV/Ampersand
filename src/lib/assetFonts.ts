import { onUnmounted, reactive } from "vue";
import { useBlob } from "../lib/util/blob";

const fonts = reactive(new Map<string, {
	file: File,
	atRule: string;
}>());

export const _useAssetFonts = {
	appendFont: (_a: string, _f: File) => {},
	deleteFont: (_a: string) => {}
};

export function useAssetFonts(){
	const fontNames: string[] = [];

	function appendFont(assetName: string, file: File){
		fontNames.push(assetName);
		return _useAssetFonts.appendFont(assetName, file);
	}

	function deleteFont(assetName: string){
		const index = fontNames.findIndex(x => x === assetName);
		if(index < 0) return;
		_useAssetFonts.deleteFont(assetName);
		fontNames.splice(index, 1);
	}

	function deleteAllFonts(){
		for(const font of fontNames)
			deleteFont(font);
	}

	onUnmounted(() => {
		deleteAllFonts();
	});

	return {
		appendFont,
		deleteAllFonts,
		deleteFont
	};
}

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

	_useAssetFonts.appendFont = appendFont;
	_useAssetFonts.deleteFont = deleteFont;

	return { fonts };
}

