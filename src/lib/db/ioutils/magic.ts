export const AMPERSAND_BACKUP_MAGICS = new Map<number, number[]>([
	[1, [0x1F, 0x8B]], // GZip magic, because we used to use GZip
	[2, [0x41, 0x4D, 0x50, 0x44, 0x42, 0x00, 0x00, 0x02, 0x00, 0x00]] // AMPDB..<version2>..{data}
]);

export const AMPERSAND_ARCHIVE_MAGICS = new Map<number, number[]>([
	[1, [0x41, 0x4D, 0x50, 0x41, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00]] // AMPAR..<version1>..{data}
]);

export function matchMagicOld(bin: Uint8Array){
	for(const [version, magic] of AMPERSAND_BACKUP_MAGICS.entries()){
		let matches = true;

		for(let i = 0; i < magic.length; i++){
			if(magic[i] !== bin[i]){
				matches = false;
				break;
			}
		}

		if(matches) return version;
	}

	return undefined;
}

export function matchMagicNew(bin: Uint8Array) {
	for (const [version, magic] of AMPERSAND_ARCHIVE_MAGICS.entries()) {
		let matches = true;

		for (let i = 0; i < magic.length; i++) {
			if (magic[i] !== bin[i]) {
				matches = false;
				break;
			}
		}

		if (matches) return version;
	}

	return undefined;
}

export function stripMagicOld(bin: Uint8Array, version: number){
	const magic = AMPERSAND_BACKUP_MAGICS.get(version);
	if(!magic) return undefined;

	const newArray = new Uint8Array(bin.length - magic.length);
	newArray.set(bin.slice(magic.length), 0);
	return newArray;
}

export function stripMagicNew(bin: Uint8Array, version: number) {
	const magic = AMPERSAND_ARCHIVE_MAGICS.get(version);
	if (!magic) return undefined;

	const newArray = new Uint8Array(bin.length - magic.length);
	newArray.set(bin.slice(magic.length), 0);
	return newArray;
}