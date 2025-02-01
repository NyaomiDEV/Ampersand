import { createAnimation, getIonPageElement, TransitionOptions } from "@ionic/vue";
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

		i.oncancel = () => {
			resolve([]);
		}

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

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/(?<![1-9])0\w\s?/g, "");
}

export function slideAnimation(_: HTMLElement, opts: TransitionOptions) {
	const transition = createAnimation().duration(200).easing('cubic-bezier(0.47,0,0.745,0.715)');

	const leavingPage = createAnimation().addElement(getIonPageElement(opts.baseEl))
		.onFinish((currentStep) => {
			if (currentStep === 1 && leavingPage.elements.length > 0) {
				leavingPage.elements[0].style.setProperty('display', 'none');
			}
		})
		.fromTo('transform', `translateX(0px)`, `translateX(-40px)`)
		.fromTo('opacity', 1, 0);

	const enteringPage = createAnimation().addElement(getIonPageElement(opts.enteringEl))
		.fromTo('transform', `translateX(40px)`, `translateX(0px)`)
		.fromTo('opacity', 0, 1);

	transition.addAnimation([leavingPage, enteringPage]);

	return transition;
}