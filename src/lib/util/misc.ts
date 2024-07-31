import dayjs from "dayjs";
import Duration from "dayjs/plugin/duration";
dayjs.extend(Duration);

export function getFiles(contentType?: string, multiple?: boolean): Promise<File[]> {
	return new Promise(resolve => {
		const i = document.createElement("input");
		i.type = "file";
		if(multiple)
			i.multiple = multiple;
		if(contentType)
			i.accept = contentType;

		i.onchange = async () => {
			if (!i.files) return resolve([]);

			const arr: File[] = [];

			for(const file of i.files){
				arr.push(file);
			}

			resolve(arr);
		};

		i.click();

	});
}

export function downloadBlob(data: Uint8Array, fileName: string) {
	const blob = new Blob([data], { type: "application/octet-stream" });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();
	setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export async function compressGzip(data: Uint8Array) {
	const reader = new Blob([data])
		.stream()
		.pipeThrough<Uint8Array>(new CompressionStream("gzip"))
		.getReader();

	let result = new Uint8Array();

	for(;;){
		const { done, value } = await reader.read();
		if (done) break;

		if (value) {
			const _new = new Uint8Array(result.length + value.length);
			_new.set(result);
			_new.set(value, result.length);
			result = _new;
		}
	}

	return result;
}

export async function decompressGzip(data: Uint8Array) {
	const reader = new Blob([data])
		.stream()
		.pipeThrough<Uint8Array>(new DecompressionStream("gzip"))
		.getReader();

	let result = new Uint8Array();

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;

		if (value) {
			const _new = new Uint8Array(result.length + value.length);
			_new.set(result);
			_new.set(value, result.length);
			result = _new;
		}
	}

	return result;
}

export function formatWrittenTime(dateStart: Date, dateEnd: Date){
	const duration = dayjs.duration(dayjs(dateStart).diff(dateEnd));

	console.log(duration);

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/(?<![1-9])0\w\s?/g, "");
}