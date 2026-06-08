import { sha256 } from "./util/misc";

const fileHashes: Map<string, Set<WeakRef<File>>> = new Map();
const registry = new FinalizationRegistry<string>((key) => {
	fileHashes.get(key)?.forEach((x, _, s) => {
		if(!x.deref())
			s.delete(x);
	});

	if (fileHashes.get(key)?.size === 0)
		fileHashes.delete(key);
});

export async function newFile(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag){
	const hash = await sha256(fileBits);
	const set = fileHashes.getOrInsert(hash, new Set());

	let file: File | undefined;

	for(const x of set) {
		const maybeFile = x.deref();
		if(maybeFile){
			// Assign the first file, just in case
			// NOTE: This File assignment shouldn't be that much problematic as far as memory goes...
			// ...I hope
			if(!file)
				file = new File([maybeFile], fileName, options);

			if(maybeFile.name === fileName && options?.type ? options.type === maybeFile.type : true){
				// If the file we found is the exact same, then assign it and discard others
				file = maybeFile;
				break;
			}
		}
	}
	
	if(file)
		return file;

	file = new File(fileBits, fileName, options);

	set.add(new WeakRef(file));
	registry.register(file, hash);
	return file;
}