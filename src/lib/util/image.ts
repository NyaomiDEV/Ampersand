import { getImageFile } from "./misc";

export async function resizeImage(image: Blob, maxWidthHeight = 512): Promise<File> {
	const bitmap = await createImageBitmap(image);
	let width: number;
	let height: number;

	if(bitmap.width <= maxWidthHeight && bitmap.height <= maxWidthHeight){
		if (image.type === "image/webp")
			return new File([image], `img_${Date.now()}.webp`); // we don't really need to do anything here

		// or else we just go through everything just to convert to WEBP
		width = bitmap.width;
		height = bitmap.height;
	} else if (bitmap.width > bitmap.height) {
		width = maxWidthHeight;
		height = (bitmap.height / bitmap.width) * maxWidthHeight;
	} else {
		width = (bitmap.width / bitmap.height) * maxWidthHeight;
		height = maxWidthHeight;
	}

	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d");

	if (!ctx){
		const ext = image.type === "image/webp" ? "webp" : "png";
		return new File([image], `img_${Date.now()}.${ext}`); // as a fallback
	}

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

	const blob = await canvas.convertToBlob({
		type: "image/webp",
		quality: 1
	});

	const ext = blob.type === "image/webp" ? "webp" : "png";
	return new File([blob], `img_${Date.now()}.${ext}`);
}

export async function getResizedImage(maxWidthHeight = 512){
	const arrayBuffer = await getImageFile();
	if(!arrayBuffer) return;

	return await resizeImage(new Blob([arrayBuffer]), maxWidthHeight);
}