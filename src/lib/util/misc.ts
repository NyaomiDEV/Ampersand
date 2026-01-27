import { alertController, createAnimation, getIonPageElement, toastController, TransitionOptions } from "@ionic/vue";
import dayjs from "dayjs";
import { Ref } from "vue";
import { appConfig } from "../config";

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

		i.onchange = () => {
			document.body.removeChild(i);
			if (!i.files) return resolve([]);

			const arr: File[] = [];

			for(const file of i.files)
				arr.push(file);

			resolve(arr);
		};

		i.oncancel = () => {
			document.body.removeChild(i);
			resolve([]);
		};

		i.click();
	});
}

export function compressGzip(data: BufferSource) {
	return new Blob([data])
		.stream()
		.pipeThrough<Uint8Array>(new CompressionStream("gzip"));
}

export function decompressGzip(data: BufferSource) {
	return new Blob([data])
		.stream()
		.pipeThrough<Uint8Array>(new DecompressionStream("gzip"));
}

export function formatDate(date: Date, withDate?: "collapsed" | "expanded"){
	if(withDate)
		return dayjs(date).format(`${withDate === "expanded" ? "LL" : "ll"}, ${appConfig.locale.twelveHourClock ? "hh:mm A" : "HH:mm"}`);
	return dayjs(date).format(`${appConfig.locale.twelveHourClock ? "hh:mm A" : "HH:mm"}`);
}

export function formatWrittenTime(dateStart: Date, dateEnd: Date){
	const duration = dayjs.duration(dayjs(dateStart).diff(dateEnd));

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/(?<![1-9])0\w\s?/g, "");
}

export function slideAnimation(_: HTMLElement, opts: TransitionOptions, directionOverride?: Ref<string>) {
	const transition = createAnimation().duration(200).easing("cubic-bezier(0.47,0,0.745,0.715)");

	const directions = {
		left: [40, 0, -40],
		right: [-40, 0, 40]
	};

	const direction = directions[(directionOverride?.value || opts.direction) === "back" ? "right" : "left"];

	if(opts.leavingEl){
		const leavingPage = createAnimation().addElement(getIonPageElement(opts.leavingEl))
			.fromTo("transform", `translateX(${direction[1]}px)`, `translateX(${direction[2]}px)`)
			.fromTo("opacity", 1, 0);

		transition.addAnimation(leavingPage);
	}

	const enteringPage = createAnimation().addElement(getIonPageElement(opts.enteringEl))
		.fill("both")
		.fromTo("transform", `translateX(${direction[0]}px)`, `translateX(${direction[1]}px)`)
		.fromTo("opacity", 0, 1);

	const enteringToolbarEle = getIonPageElement(opts.enteringEl).querySelector("ion-toolbar");
	if(enteringToolbarEle){
		const enteringToolBar = createAnimation();
		enteringToolBar.addElement(enteringToolbarEle);
		transition.addAnimation(enteringToolBar);
	}

	transition.addAnimation(enteringPage);

	return transition;
}

export async function toast(message: string, duration = 1500){
	try {
		const toast = await toastController.create({
			message,
			duration,
			position: "bottom",
			swipeGesture: "vertical"
		});

		await toast.present();
	} catch (_e) {
		return;
	}
}

export async function promptOkCancel(header: string, subHeader?: string, message?: string){
	return new Promise((resolve) => {
		void (async () => {
			const i18next = (await import("../i18n")).default;
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		})();
	});
}

export async function promptYesNo(header: string, subHeader?: string, message?: string) {
	return new Promise((resolve) => {
		void (async () => {
			const i18next = (await import("../i18n")).default;
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				buttons: [
					{
						text: i18next.t("other:alerts.no"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.yes"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		})();
	});
}

export function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;

	let proto = value;
	while (Object.getPrototypeOf(proto) !== null) 
		proto = Object.getPrototypeOf(proto);
	

	return Object.getPrototypeOf(value) === proto;
};

export function flattenObject(obj: object) {
	const newObj = {};

	function insideFlatten(obj: object, prefix: string){
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				const newKey = prefix ? `${prefix}.${key}` : key;
				if (typeof obj[key] === "object") 
					insideFlatten(obj[key], newKey);
				else
					newObj[newKey] = obj[key];
			}
		}
	}

	insideFlatten(obj, "");

	return newObj;
}

export function renderStars(stars: number){
	const emptyStar = "\u2606";
	const fullStar = "\u2605";

	let ret = "";
	for(let i = 0; i < 10; i++){
		if(i < stars)
			ret += fullStar;
		else 
			ret += emptyStar;
	}
	return ret;
}