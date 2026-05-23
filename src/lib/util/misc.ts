import { ActionSheetButton, actionSheetController, alertController, createAnimation, getIonPageElement, toastController, TransitionOptions } from "@ionic/vue";
import dayjs from "dayjs";
import { Ref } from "vue";
import { appConfig } from "../config";
import { Asset, BoardMessage, CustomField, FrontingEntry, ImageClip, Member, Note, System } from "../db/entities";
import i18next, { computePercentage, getLocaleInfo } from "../i18n";
import { open } from "../native/open";
import { readFile } from "@tauri-apps/plugin-fs";
import { basename, sep } from "@tauri-apps/api/path";
import { findMimeType } from "../mime";
import type { IndexEntry } from "../db/types";

export async function getDocumentFile(extensions?: string[], asFile?: true): Promise<File | undefined>;
export async function getDocumentFile(extensions?: string[], asFile?: false): Promise<Uint8Array<ArrayBuffer> | undefined>;
export async function getDocumentFile(extensions?: string[], asFile?: boolean) {
	const path = await open({
		multiple: false,
		filters: extensions ? [{ name: "File", extensions }]: [],
		fileAccessMode: "scoped",
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

export function formatDate(date: Date, withDate?: "collapsed" | "expanded" | "only-collapsed" | "only-expanded"){
	if(withDate){
		switch(withDate){
			case "collapsed":
				return dayjs(date).format(`ll, ${getLocaleInfo().lt}`);
			case "expanded":
				return dayjs(date).format(`LL, ${getLocaleInfo().lt}`);
			case "only-collapsed":
				return dayjs(date).format("ll");
			case "only-expanded":
				return dayjs(date).format("LL");
		}
	}
	return dayjs(date).format(getLocaleInfo().lt);
}

export function formatWrittenTime(dateStart: Date, dateEnd: Date){
	const duration = dayjs.duration(dayjs(dateStart).diff(dateEnd));

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/^(?:(?<![1-9])0[yMdhm]\s?)+/g, "");
}

export function formatWrittenTimeAbsolute(durationMs: number) {
	const duration = dayjs.duration(dayjs(durationMs).diff(0));

	return duration.format("Y[y] M[M] D[d] H[h] m[m] s[s]").replace(/^(?:(?<![1-9])0[yMdhm]\s?)+/g, "");
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

export function languagePicker(): Promise<string | undefined> {
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

export async function sha256(data: string | BufferSource){
	if(typeof data === "string")
		data = new TextEncoder().encode(data);

	const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", data));

	let hex = "";
	hash.forEach(b => hex += b.toString(16).padStart(2, "0"));
	return hex;
}

export function presencePhrase(rating: number): string {
	rating = Math.round(rating);
	switch (rating) {
		case 0:
			return i18next.t("other:presence.absent");
		case 1:
		case 2:
			return i18next.t("other:presence.heavilyDissociating");
		case 3:
		case 4:
			return i18next.t("other:presence.dissociating");
		case 5:
		case 6:
			return i18next.t("other:presence.zonedOut");
		case 7:
		case 8:
			return i18next.t("other:presence.present");
		case 9:
		case 10:
			return i18next.t("other:presence.fullyGrounded");
	}
	return "";
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

export function sortFrontingEntries(a: IndexEntry<FrontingEntry>, b: IndexEntry<FrontingEntry>) {
	return b.startTime!.valueOf() - a.startTime!.valueOf();
}

export function sortBoardMessages(a: IndexEntry<BoardMessage>, b: IndexEntry<BoardMessage>){
	if (a.isPinned && !b.isPinned) return -1;
	if (!a.isPinned && b.isPinned) return 1;
	return sortDate(a, b);
}

export function sortAssets(a: IndexEntry<Asset>, b: IndexEntry<Asset>) {
	return a.friendlyName!.localeCompare(b.friendlyName!);
}

export function sortCustomFields(a: IndexEntry<CustomField>, b: IndexEntry<CustomField>) {
	return a.priority! - b.priority!;
}

export function sortNotes(a: IndexEntry<Note>, b: IndexEntry<Note>) {
	return a.priority! - b.priority!;
}

export function sortName(a: { name?: string }, b: { name?: string }) {
	return a.name!.localeCompare(b.name!);
}

export function sortDate(a: { date?: Date; }, b: { date?: Date; }) {
	return b.date!.valueOf() - a.date!.valueOf();
}

export function sortDateAsc(a: { date?: Date; }, b: { date?: Date; }) {
	return a.date!.valueOf() - b.date!.valueOf();
}

export function isUuid(str: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export const imageClips = import.meta.webpackContext("../../assets/shapes/", { recursive: false, include: /\.svg$/ });

export function imageClipPicker(header: string): Promise<ImageClip | null | undefined> {
	return new Promise(resolve => {
		void (async () => {
			const buttons = imageClips.keys().map(x => ({
				text: i18next.t(`other:shapes.${x.replace(/^\.\/(.*)\.svg$/, "$1")}`),
				icon: imageClips(x) as string, // resolves to data URI with svg inside
				data: { it: x.replace(/^\.\/(.*)\.svg$/, "$1") }
			}));

			const controller = await actionSheetController.create({
				header,
				buttons: [
					...buttons,
					{
						text: i18next.t("other:shapes.noShape"),
						data: { it: null }
					},
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel"
					}
				]
			});

			controller.addEventListener("willDismiss", (e) => resolve(e.detail.data?.it));

			await controller.present();
		})();
	});
}

export const fontQuickNames = {
	cursive: "Rochester",
	pixel: "Departure Mono",
	dots: "Bitcount Single",
	digital: "Orbitron",
	handwritten: "Shantell Sans",
	serif: "EB Garamond",
	typewriter: "TT2020",
	monospace: "JetBrains Mono",
	playful: "Lobster Two",
	holy: "Cinzel",
	bubbly: "Gluten",
	marker: "Permanent Marker",
	gothic: "KJV1611",
	stencil: "Saira Stencil",
	mystery: "Mystery Quest",
	italian: "Playwrite IT Traditional",
	metal: "Metal Mania",
	cutesy: "Twinkle Star",
	indie: "Amatic SC",
	deco: "Ribeye Marrow",
	pop: "Unbounded",
	terminal: "Workbench",
	western: "Rye",
	glitch: "Rubik Glitch",
	varsity: "Graduate",
	stripes: "Big Shoulders Inline",
	futuristic: "Audiowide",
	drip: "Rubik Wet Paint",
	pineapple: "Some Time Later",
	cracks: "Rubik Distressed",
};

export const fontFamilies = [
	"Rochester",
	"Departure Mono",
	"Bitcount Single",
	"Orbitron",
	"Shantell Sans",
	"EB Garamond",
	"TT2020",
	"JetBrains Mono",
	"Lobster Two",
	"Cinzel",
	"Gluten",
	"Permanent Marker",
	"KJV1611",
	"Saira Stencil",
	"Mystery Quest",
	"Playwrite IT Traditional",
	"Metal Mania",
	"Twinkle Star",
	"Amatic SC",
	"Ribeye Marrow",
	"Unbounded",
	"Workbench",
	"Rye",
	"Rubik Glitch",
	"Graduate",
	"Big Shoulders Inline",
	"Audiowide",
	"Rubik Wet Paint",
	"Some Time Later",
	"Rubik Distressed",
	"Bodoni Moda",
	"Recursive"
];

function normalizeFontName(x: string){
	const quickName = Object.entries(fontQuickNames).find(f => f[1] === x);
	return quickName ? `${i18next.t(`other:fonts.${quickName[0]}`)} (${x})` : x;
}

export function fontFamilyPicker(header: string): Promise<string | null | undefined> {
	return new Promise(resolve => {
		void (async () => {
			const buttons: ActionSheetButton[] = fontFamilies.map(x => ({
				text: normalizeFontName(x),
				data: { it: x },
				htmlAttributes: {
					style: { "font-family": x }
				}
			}));

			const controller = await actionSheetController.create({
				header,
				buttons: [
					...buttons,
					{
						text: i18next.t("other:fonts.noFont"),
						data: { it: null }
					},
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel"
					}
				]
			});

			controller.addEventListener("willDismiss", (e) => resolve(e.detail.data?.it));

			await controller.present();
		})();
	});
}
