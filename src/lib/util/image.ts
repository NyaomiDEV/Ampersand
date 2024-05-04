export async function resizeImage(image: File){
	const bitmap = await createImageBitmap(image);

	let width = 0, height = 0;
	if (bitmap.width > bitmap.height) {
		width = 256;
		height = (bitmap.height / bitmap.width) * 256;
	} else {
		width = (bitmap.width / bitmap.height) * 256;
		height = 256;
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
