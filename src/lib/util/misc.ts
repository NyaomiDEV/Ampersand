import { ActionSheetButton, actionSheetController, alertController, createAnimation, getIonPageElement, toastController, TransitionOptions } from "@ionic/vue";
import type { TextFieldTypes } from "@ionic/core";
import dayjs from "dayjs";
import { Ref } from "vue";
import { appConfig } from "../config";
import { Asset, BoardMessage, CustomField, FrontingEntry, ImageClip, JournalPost, Member, Note, System } from "../db/entities";
import i18next, { computePercentage, getLocaleInfo } from "../i18n";
import { open, save } from "../native/open";
import { mkdir, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { basename, dirname, pictureDir, sep } from "@tauri-apps/api/path";
import { findMimeType } from "../mime";
import type { IndexEntry } from "../db/types";
import { platform } from "@tauri-apps/plugin-os";
import { newFile } from "../fileref";

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

	return newFile([array], filename, { type: findMimeType(ext !== filename ? ext : "") });
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

export async function saveImageFile(image: File){
	let path: string | undefined = `${await pictureDir()}${sep()}${image.name}`;

	if (platform() !== "ios") {
		// Use save file dialog outside of iOS
		const _path = await save({
			defaultPath: path,
			filters: [{
				name: image.type === "image/webp" ? "WebP image" : "PNG image",
				extensions: [image.type === "image/webp" ? "webp" : "png"]
			}]
		});
		if (_path) path = _path;
		else path = undefined; // save file got canceled
	}

	if (!path) throw new Error("no path");

	// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
	if (!path.startsWith("content://")) {
		// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
		const _dirname = await dirname(path);
		await mkdir(_dirname, { recursive: true });
	}

	await writeFile(path, image.stream(), { append: false, create: true });
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

export async function promptOptions(header: string, inputs: { name: string, value: string }[], subHeader?: string, message?: string): Promise<void | string[]> {
	return new Promise((resolve) => {
		void (async () => {
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				inputs: inputs.map(x => ({
					type: "checkbox",
					label: x.name,
					value: x.value
				})),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
					}
				]
			});
			await alert.present();
			const detail = await alert.onDidDismiss();
			
			if(detail.role === "confirm")
				resolve(detail.data.values);
			else
				resolve();
		})();
	});
}

export async function promptInput(header: string, fields: { name: string, type?: TextFieldTypes, placeholder: string; }[], subHeader?: string, message?: string): Promise<void | Record<string, string>> {
	return new Promise((resolve) => {
		void (async () => {
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				inputs: fields.map(x => ({
					type: x.type || "text",
					name: x.name,
					placeholder: x.placeholder
				})),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
					}
				]
			});
			await alert.present();
			const detail = await alert.onDidDismiss();

			if (detail.role === "confirm")
				resolve(detail.data.values);
			else
				resolve();
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

export async function sha256(data: BlobPart | BlobPart[]){
	const convert = async (v: BlobPart): Promise<Uint8Array<ArrayBuffer>> => {
		if(v instanceof Blob)
			return v.bytes();
		else if (ArrayBuffer.isView(v))
			return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
		else if (v instanceof ArrayBuffer)
			return new Uint8Array(v);

		return new TextEncoder().encode(v);
	};

	let _data: Uint8Array<ArrayBuffer>;
	if(Array.isArray(data)){
		const parts = await Promise.all(data.map(v => convert(v)));

		_data = new Uint8Array(parts.reduce((a, b) => a + b.byteLength, 0));

		let offset = 0;
		for (const arr of parts) {
			_data.set(arr, offset);
			offset += arr.byteLength;
		}
	}
	else
		_data = await convert(data);

	const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", _data));

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
	if (!a.endTime && b.endTime) return -1;
	if (a.endTime && !b.endTime) return 1;
	return b.startTime!.valueOf() - a.startTime!.valueOf();
}

export function sortBoardMessages(a: IndexEntry<BoardMessage>, b: IndexEntry<BoardMessage>){
	if (a.isPinned && !b.isPinned) return -1;
	if (!a.isPinned && b.isPinned) return 1;
	return sortDate(a, b);
}

export function sortJournalPosts(a: IndexEntry<JournalPost>, b: IndexEntry<JournalPost>) {
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
	round: "Gluten",
	marker: "Permanent Marker",
	bubbly: "Bagel Fat One",
	gothic: "KJV1611",
	stencil: "Saira Stencil",
	mystery: "Mystery Quest",
	italian: "Playwrite IT Traditional",
	metal: "Metal Mania",
	cutesy: "Twinkle Star",
	elegant: "Grandiflora One",
	indie: "Amatic SC",
	summer: "Pacifico",
	deco: "Ribeye Marrow",
	pop: "Unbounded",
	terminal: "Workbench",
	western: "Rye",
	stripes: "Train One",
	glitch: "Rubik Glitch",
	varsity: "Graduate",
	futuristic: "Audiowide",
	spotty: "Flavors",
	drip: "Rubik Wet Paint",
	bone: "Snowburst One",
	nature: "Tapestry",
	pineapple: "Some Time Later",
	cracks: "Rubik Distressed",
	cow: "Moo Lah Lah",
	outline: "Moirai One",
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
	"Bagel Fat One",
	"KJV1611",
	"Saira Stencil",
	"Mystery Quest",
	"Playwrite IT Traditional",
	"Metal Mania",
	"Twinkle Star",
	"Grandiflora One",
	"Amatic SC",
	"Pacifico",
	"Ribeye Marrow",
	"Unbounded",
	"Workbench",
	"Rye",
	"Train One",
	"Rubik Glitch",
	"Graduate",
	"Audiowide",
	"Flavors",
	"Rubik Wet Paint",
	"Snowburst One",
	"Tapestry",
	"Some Time Later",
	"Rubik Distressed",
	"Moo Lah Lah",
	"Moirai One",
	"Urbanist",
	"Outfit",
	"Montserrat",
	"Bodoni Moda",
	"Recursive",
	"Cinzel Decorative",
	"Geom",
	"Jost",
	"Twinkle Star Variant",
	"Grandiflora One Decorative",
	"Pacifico Variant"
];

function normalizeFontName(x: string){
	const quickName = Object.entries(fontQuickNames).find(f => f[1] === x);
	return quickName ? `${i18next.t(`other:fonts.${quickName[0]}`)} (${x})` : x;
}

export function fontFamilyPicker(header: string): Promise<string | null | void> {
	return new Promise(resolve => {
		void (async () => {
			const assetFont = Symbol();

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
						text: i18next.t("other:fonts.assetFont"),
						data: { it: assetFont }
					},
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
			await controller.present();

			const detail = await controller.onDidDismiss();
			if(!detail.data.it) return resolve();

			if(detail.data.it === assetFont){
				const data = (await promptInput(
					i18next.t("other:fonts.assetFont"),
					[{ name: "name", placeholder: i18next.t("other:alerts.assetFontPlaceholder") }],
				))?.name;

				resolve(data || null);
			}

			resolve(detail.data.it);
		})();
	});
}
