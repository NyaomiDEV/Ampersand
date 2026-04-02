import { actionSheetController, alertController, createAnimation, getIonPageElement, toastController, TransitionOptions } from "@ionic/vue";
import dayjs from "dayjs";
import { Ref } from "vue";
import { appConfig } from "../config";
import { Member, System, Tag } from "../db/entities";
import i18next, { computePercentage, getLocaleInfo } from "../i18n";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { basename, sep } from "@tauri-apps/api/path";
import { findMimeType } from "../mime";
import { IndexEntry } from "../db/tables";

export async function getDocumentFile(extensions?: string[], asFile?: true): Promise<File | undefined>;
export async function getDocumentFile(extensions?: string[], asFile?: false): Promise<Uint8Array<ArrayBuffer> | undefined>;
export async function getDocumentFile(extensions?: string[], asFile?: boolean) {
	const path = await open({
		multiple: false,
		filters: extensions ? [{ name: "File", extensions }]: [],
		fileAccessMode: "copy", // TODO: use scoped access in future Tauri updates (iOS)
		pickerMode: "document"
	});
	if(!path) return;
	const array = await readFile(path);
	if(!asFile)
		return array;

	let filename = path.split(sep()).pop() || `file_${Date.now()}`;

	// use Tauri Path API to get basename from Android content:// URIs
	if (path.startsWith("content://"))
		filename = await basename(path);
	
	const ext = filename.split(".").pop()!;

	return new File([array], filename, { type: findMimeType(ext !== filename ? ext : "") });
}

export async function getImageFile() {
	const path = await open({
		multiple: false,
		pickerMode: "image"
	});
	if (!path) return;
	const array = await readFile(path);
	return array;
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
		return dayjs(date).format(`${withDate === "expanded" ? "LL" : "ll"}, ${getLocaleInfo().lt}`);
	return dayjs(date).format(getLocaleInfo().lt);
}

export function formatWrittenTime(dateStart: Date, dateEnd: Date){
	const duration = dayjs.duration(dayjs(dateStart).diff(dateEnd));

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/(?<![1-9])0\w\s?/g, "");
}

export function slideAnimation(_: HTMLElement, opts: TransitionOptions, directionOverride?: Ref<string>) {
	const OFFSET = 40;
	const backwards = (directionOverride?.value || opts.direction) === "back";
	const transition = createAnimation()
		.duration(200)
		.easing(backwards ? "cubic-bezier(0.47,0,0.745,0.715)" : "cubic-bezier(0.36,0.66,0.04,1)");

	if(opts.leavingEl){
		const leavingPage = createAnimation().addElement(getIonPageElement(opts.leavingEl))
			.keyframes([
				{ offset: 0, opacity: 1, transform: "translateX(0px)" },
				{ offset: 0.5, opacity: 0 },
				{ offset: 1, opacity: 0, transform: `translateX(${OFFSET * (backwards ? 1 : -1)}px)` }
			]);

		transition.addAnimation(leavingPage);
	}

	const enteringPage = createAnimation().addElement(getIonPageElement(opts.enteringEl))
		.fill("both")
		.keyframes([
			{ offset: 0, opacity: 0, transform: `translateX(${OFFSET * (backwards ? -1 : 1)}px)` },
			{ offset: 0.5, opacity: 0 },
			{ offset: 1, opacity: 1, transform: "translateX(0px)" }
		]);

	transition.addAnimation(enteringPage);

	return transition;
}

export function languagePicker(): Promise<string> {
	return new Promise(resolve => {
		void (async () => {
			const buttons = Object.entries(i18next.services.resourceStore.data).sort((a, b) => {
				if (a[0].includes("-x-") && !b[0].includes("-x-")) return 1;
				else if (!a[0].includes("-x-") && b[0].includes("-x-")) return -1;

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const langA: string = (a[1].other as Record<string, any>)?.languageName?.inEnglish || a[0];
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const langB: string = (b[1].other as Record<string, any>)?.languageName?.inEnglish || b[0];
				return langA.localeCompare(langB);
			}).map(x => ({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				text: `${(x[1] as any).other?.languageName?.local || x[0]} (${(x[1] as any).other?.languageName?.inEnglish || x[0]}) (${computePercentage(x[0])}%)`,
				data: { lng: x[0] }
			}));

			const controller = await actionSheetController.create({
				header: i18next.t("appSettings:locale.language"),
				buttons: [...buttons,
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel"
					}
				]
			});

			controller.addEventListener("willDismiss", (e) => resolve(e.detail.data?.lng));

			await controller.present();
		})();
	});
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
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "outline",
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
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				buttons: [
					{
						text: i18next.t("other:alerts.no"),
						role: "outline",
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

export function sortMembers(a: IndexEntry<Member>, b: IndexEntry<Member>) {
	switch (appConfig.showMembersApartFromCustomFronts) {
		case "off":
			if ((a.isPinned || false) === (b.isPinned || false))
				return a.name!.localeCompare(b.name!);
			else
				return a.isPinned && !b.isPinned ? -1 : 1;
		case "before":
			if ((a.isPinned || false) === (b.isPinned || false)) {
				if ((a.isCustomFront || false) === (b.isCustomFront || false))
					return a.name!.localeCompare(b.name!);
				else
					return a.isCustomFront && !b.isCustomFront ? -1 : 1;
			} else
				return a.isPinned && !b.isPinned ? -1 : 1;
		case "after":
			if ((a.isPinned || false) === (b.isPinned || false)) {
				if ((a.isCustomFront || false) === (b.isCustomFront || false))
					return a.name!.localeCompare(b.name!);
				else
					return a.isCustomFront && !b.isCustomFront ? 1 : -1;
			} else
				return a.isPinned && !b.isPinned ? -1 : 1;
	}
}

export function sortSystems(a: IndexEntry<System>, b: IndexEntry<System>) {
	if (a.uuid === appConfig.defaultSystem) return -1;
	if (b.uuid === appConfig.defaultSystem) return 1;

	if (a.isPinned && !b.isPinned) return -1;
	if (!a.isPinned && b.isPinned) return 1;

	return a.name!.localeCompare(b.name!);
}

export function sortTags(a: IndexEntry<Tag>, b: IndexEntry<Tag>) {
	return a.name!.localeCompare(b.name!);
}

export const imageClips = import.meta.webpackContext("../../assets/shapes/", { recursive: false, include: /\.svg$/ }).keys().map(x => x.replace(/^\.\/(.*)\.svg$/, "$1"));
