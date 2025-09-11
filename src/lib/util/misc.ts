import { createAnimation, getIonPageElement, TransitionOptions } from "@ionic/vue";
import dayjs from "dayjs";
import { Ref } from "vue";
import { appConfig } from "../config";

export const nilUid = "00000000-0000-0000-0000-000000000000";
export const maxUid = "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF";

export function getFiles(contentType?: string, multiple?: boolean): Promise<File[]> {
	return new Promise(resolve => {
		const i = document.createElement("input");
		document.body.appendChild(i);
		i.type = "file";
		i.style = "visibility: hidden";
		if(multiple)
			i.multiple = multiple;
		if(contentType)
			i.accept = contentType;

		i.onchange = async () => {
			document.body.removeChild(i);
			if (!i.files) return resolve([]);

			const arr: File[] = [];

			for(const file of i.files){
				arr.push(file);
			}

			resolve(arr);
		};

		i.oncancel = () => {
			document.body.removeChild(i);
			resolve([]);
		}

		i.click();
	});
}

export async function compressGzip(data: BufferSource) {
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

export async function decompressGzip(data: BufferSource) {
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

export function formatDate(date: Date, withDate?: "collapsed" | "expanded"){
	if(withDate)
		return dayjs(date).format(`${withDate === "expanded" ? "LL" : "ll"}, ${appConfig.locale.twelveHourClock ? 'hh:mm A' : "HH:mm"}`);
	return dayjs(date).format(`${appConfig.locale.twelveHourClock ? 'hh:mm A' : "HH:mm"}`);
}

export function formatWrittenTime(dateStart: Date, dateEnd: Date){
	const duration = dayjs.duration(dayjs(dateStart).diff(dateEnd));

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/(?<![1-9])0\w\s?/g, "");
}

export function slideAnimation(_: HTMLElement, opts: TransitionOptions, directionOverride?: Ref<string>) {
	const transition = createAnimation().duration(200).easing('cubic-bezier(0.47,0,0.745,0.715)');

	const directions = {
		left: [40, 0, -40],
		right: [-40, 0, 40]
	}

	const direction = directions[(directionOverride?.value || opts.direction) === "back" ? "right" : "left"];

	if(opts.leavingEl){
		const leavingPage = createAnimation().addElement(getIonPageElement(opts.leavingEl))
			.onFinish((currentStep) => {
				if (currentStep === 1 && leavingPage.elements.length > 0) {
					leavingPage.elements[0].style.setProperty('display', 'none');
				}
			})
			.fromTo('transform', `translateX(${direction[1]}px)`, `translateX(${direction[2]}px)`)
			.fromTo('opacity', 1, 0);

		transition.addAnimation(leavingPage);
	}

	const enteringPage = createAnimation().addElement(getIonPageElement(opts.enteringEl))
		.fill('both')
		.beforeRemoveClass('ion-page-invisible')
		.fromTo('transform', `translateX(${direction[0]}px)`, `translateX(${direction[1]}px)`)
		.fromTo('opacity', 0, 1)
		.onFinish((currentStep) => {
			if (currentStep === 1 && enteringPage.elements.length > 0) {
				enteringPage.elements[0].style.removeProperty('display');
			}
		});

	const enteringToolbarEle = getIonPageElement(opts.enteringEl).querySelector('ion-toolbar');
	if(enteringToolbarEle){
		const enteringToolBar = createAnimation();
		enteringToolBar.addElement(enteringToolbarEle);
		transition.addAnimation(enteringToolBar);
	}

	transition.addAnimation(enteringPage);

	return transition;
}