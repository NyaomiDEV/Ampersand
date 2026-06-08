import { securityConfig } from "../../config";
import { newFile } from "../../fileref";
import { fetchImage } from "../../util/fetchImage";
import { resizeImage } from "../../util/image";

export async function getImage(url?: string | null, resizeWidth?: number){
	if(!securityConfig.allowRemoteContent || !url) return;

	try {
		const request = await fetchImage(url);
		if (!request) throw new Error("no image after all");
		const image = await newFile([request.blob], url.split("/").pop()!);
		return await resizeImage(image, resizeWidth);
	} catch (_e) {
		return;
	}
}