export type EncryptedPayload = {
	iv: BufferSource,
	salt: BufferSource,
	data: BufferSource
};

async function getKeyFromPassword(password: string) {
	return await crypto.subtle.importKey(
		"raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
	);
}

export async function encrypt(unencryptedData: BufferSource, password: string) {
	const dKey = await getKeyFromPassword(password);
	const salt = crypto.getRandomValues(new Uint8Array(16));

	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: 100000,
			hash: "SHA-256"
		},
		dKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt"]
	);

	const iv = crypto.getRandomValues(new Uint8Array(12));

	const data = new Uint8Array(await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		unencryptedData
	));

	return {
		iv,
		salt,
		data
	};
}

export async function decrypt(payload: EncryptedPayload, password: string) {
	const { iv, salt, data } = payload;

	const dKey = await getKeyFromPassword(password);
	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: 100000,
			hash: "SHA-256"
		},
		dKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["decrypt"]
	);

	return new Uint8Array(await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv
		},
		key,
		data
	));
}