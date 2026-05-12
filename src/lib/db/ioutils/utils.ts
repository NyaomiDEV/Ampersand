import { FileHandle } from "@tauri-apps/plugin-fs";

export function intoStream(fd: FileHandle, onRead?: (bytes: number) => void, toText?: false): ReadableStream<Uint8Array<ArrayBuffer>>;
export function intoStream(fd: FileHandle, onRead?: (bytes: number) => void, toText?: true): ReadableStream<string>;
export function intoStream(fd: FileHandle, onRead?: (bytes: number) => void, toText?: boolean): ReadableStream<string | Uint8Array<ArrayBuffer>> {
	return new ReadableStream({
		async start(controller) {
			const decoder = new TextDecoder();
			async function read() {
				const buf = new Uint8Array(512000);
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

				return read();
			}
			return read();
		}
	});
}