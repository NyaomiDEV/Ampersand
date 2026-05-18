import { FileHandle, open } from "@tauri-apps/plugin-fs";

export function intoStream(fd: FileHandle | string, onRead?: (bytes: number) => void, toText?: false): ReadableStream<Uint8Array<ArrayBuffer>>;
export function intoStream(fd: FileHandle | string, onRead?: (bytes: number) => void, toText?: true): ReadableStream<string>;
export function intoStream(fdOrPath: FileHandle | string, onRead?: (bytes: number) => void, toText?: boolean): ReadableStream<string | Uint8Array<ArrayBuffer>> {
	const decoder = new TextDecoder();
	const chunkSize = 1024 * 1000;

	let fd: FileHandle;

	const source: UnderlyingDefaultSource<string | Uint8Array<ArrayBuffer>> = {
		async start() {
			fd = typeof fdOrPath === "string" ? await open(fdOrPath, { read: true }) : fdOrPath;
		},
		async cancel() {
			await fd.close();
		},
		async pull(controller) {
			const buf = new Uint8Array(chunkSize);
			try {
				const bytesRead = await fd.read(buf);
				if (bytesRead !== null && bytesRead > 0) {
					const chk = buf.slice(0, bytesRead);
					controller.enqueue(toText ? decoder.decode(chk) : chk);
					onRead?.(bytesRead);
				}
				else if (bytesRead === null) {
					await fd.close();
					return controller.close();
				}
			}catch(e){
				await fd.close();
				controller.error(e);
				throw e;
			}
		}
	};

	return new ReadableStream(source, { highWaterMark: 4 });
}
