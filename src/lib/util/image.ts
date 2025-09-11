export async function resizeImage(image: File, maxWidthHeight = 512){
	const bitmap = await createImageBitmap(image);
	let width = 0;
	let height = 0;

	if(bitmap.width <= maxWidthHeight && bitmap.height <= maxWidthHeight){
		if (image.type === "image/webp")
			return image; // we don't really need to do anything here

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

	if(!ctx) return image; // as a fallback

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

	const blob = await canvas.convertToBlob({
		type: "image/webp",
		quality: 1
	});

	return new File([blob], image.name.replace(/\.[^\.]*?$/, ".webp"), {
		lastModified: image.lastModified,
		type: blob.type
	});
}
