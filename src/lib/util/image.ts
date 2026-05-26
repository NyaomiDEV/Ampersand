import { decodeAsync, encode } from "@msgpack/msgpack";
import { getImageFile } from "./misc";
import { deleteNull, replace, revive, walk, walkAsync } from "../serialization";

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

export async function getImageOrMetadata(maxWidthHeight = 512): Promise<{ image: File, metadata: object } | undefined>{
	const arrayBuffer = await getImageFile();
	if (!arrayBuffer) return;

	const ret = {
		image: new File([], "empty"),
		metadata: {}
	};

	const iend = new Uint8Array([0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
	const end = arrayBuffer.findLastIndex((_v, i, a) => {
		let found = true;
		for(let j = 0; j < iend.length; j++){
			if(iend[j] !== a[i + j])
				found = false;
		}

		return found;
	});

	if(end < 0){ // no image metadata
		ret.image = await resizeImage(new Blob([arrayBuffer]), maxWidthHeight);
    	return ret;
    } else
		ret.image = await resizeImage(new Blob([arrayBuffer.slice(0, end + iend.length - 1)]), maxWidthHeight);

	// we have meta! decode it
	const blob = new Blob([arrayBuffer.slice(end + iend.length)]);
	const uncompressed = blob.stream().pipeThrough(new DecompressionStream("gzip"));

	ret.metadata = walk(await decodeAsync(uncompressed) as object, revive);

	return ret;
}

export async function encodeImageWithMetadata(image: File | undefined, name: string, metadata: object){
	if(!image) {
		image = new File([
			new TextEncoder().encode(
				(await import("../../assets/ampersand_logo.svg?raw")).default
			)
		], "ampersand_logo.svg");
	}

	const bitmap = await createImageBitmap(image);
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	const blob = await canvas.convertToBlob({
		type: "image/png"
	});

	// prepare metadata
	const meta = await new Response(
		new Blob([
			encode(deleteNull(await walkAsync(metadata, replace)))
		]).stream().pipeThrough(new CompressionStream("gzip"))
	).blob();

	return new File([blob, meta], `${name}.png`);
}