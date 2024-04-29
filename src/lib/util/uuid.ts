import sha1 from "./sha1";

export const AppNamespace = "db130dfe-e83d-4b87-85e9-729fefbc5def";

export function parseUUIDintoBytes(uuid: string) {
	const chunks = uuid.replace(/\-/g, "").match(/(.{1,2})/g)!;
	const bytes = new Uint8Array(16);
	for(let i = 0; i < 16; i++) bytes[i] = parseInt(chunks[i], 16);

	return bytes;
}

export function makeUUIDv5(namespace: string, name: string){
	const te = new TextEncoder();
	const nameBuffer = te.encode(name);
	const namespaceBuffer = parseUUIDintoBytes(namespace);

	const buffer = new Uint8Array(namespaceBuffer.length + nameBuffer.length);
	buffer.set(namespaceBuffer);
	buffer.set(nameBuffer, namespaceBuffer.length);

	const sha1array = sha1(buffer);

	sha1array[6] = (sha1array[6] & 0x0f) | 0x50;
	sha1array[8] = (sha1array[8] & 0x3f) | 0x80;

	const uuid = new Uint8Array(16);

	for(let i = 0; i < 16; i++) uuid[i] = sha1array[i];

	return toHexStr(uuid);
}

export function toHexStr(uint8: Uint8Array) {
	const hex = Array.from(uint8).map((i) => i.toString(16).padStart(2, '0'));

	return [
		...hex.slice(0, 4),
		"-",
		...hex.slice(4, 6),
		"-",
		...hex.slice(6, 8),
		"-",
		...hex.slice(8, 10),
		"-",
		...hex.slice(10)
	].join("");
}
