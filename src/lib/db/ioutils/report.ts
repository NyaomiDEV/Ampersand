import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { mkdir, open as openFile } from "@tauri-apps/plugin-fs";
import { save } from "../../native/open";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { System, Member, UUID, FrontingEntry } from "../entities";
import { toDataURI } from "../../util/blob";
import { getSystem, getSystemsIndex } from "../tables/system";
import { getMember, getMemberIndex } from "../tables/members";
import i18next from "../../i18n";
import { formatDate } from "../../util/misc";
import { getFrontingEntry, getFrontingEntryIndex } from "../tables/frontingEntries";

import reportStyle from "./report_style.css?raw";
import AmpersandLogo from "../../../assets/ampersand_logo.svg?raw";
import accountCircle from "@material-symbols/svg-600/rounded/account_circle-fill.svg?raw";
import systemCircle from "@material-symbols/svg-600/rounded/supervised_user_circle.svg?raw";

const encoder = new TextEncoder();

function escape(string: string) {
	const htmlEscapes = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	};

	return (string && /[&<>"']/.test(string))
		? string.replace(/[&<>"']/g, (substring) => htmlEscapes[substring] as string || substring)
		: string;
}

function getStylesheet(){
	return reportStyle
		.replace(/{{(.*?)}}/g, (_, ...args) => i18next.t(args[0]))
		.trim().replace(/\n?\t*/g, "");
}

function intestationToHtml(date: string){
	return [
		"<section class=\"header\">",
		AmpersandLogo.trim().replace(/\n?\t*/g, ""),
		"<span>Ampersand Report</span>",
		`<span>${date}</span>`,
		"</section>"
	].join("");
}

async function systemToHtml(system: System) {
	return [
		"<div class=\"system\">",
		system.image
			? `<img src="${await toDataURI(system.image)}" alt="System image" />`
			: systemCircle.trim().replace(/\n?\t*/g, ""),
		"<div class=\"details\">",
		system.color && `<div class="color-dot" style="--data-color: ${system.color}"></div>`,
		`<h2 class="name">${escape(system.name)}</h2>`,
		"</div>",
		"</div>",
	].filter(x => !!x).join("");
}

async function memberToHtml(member: Member){
	return [
		"<div class=\"member\">",
		member.image
			? `<img src="${await toDataURI(member.image)}" alt="System image" />`
			: accountCircle.trim().replace(/\n?\t*/g, ""),
		"<div class=\"details\">",
		`<h2 class="name">${member.color ? `<div class="color-dot" style="--data-color: ${member.color}"></div>` : ""}${escape(member.name)}</h2>`,
		`<span class="system">${getSystemsIndex().find(x => x.uuid === member.system)?.name || member.system}</span>`,
		member.role && `<span class="role">${escape(member.role)}</span>`,
		member.pronouns && `<span class="pronouns">${escape(member.pronouns)}</span>`,
		member.age && `<span class="age">${member.age}</span>`,
		member.isArchived && `<span class="custom-front">${i18next.t("members:edit.archived")}</span>`,
		member.isCustomFront && `<span class="custom-front">${i18next.t("members:edit.customFront")}</span>`,
		"</div>",
		"</div>"
	].filter(x => !!x).join("");
}

function getFrontingEntryHeader(){
	return [
		"<div class=\"fronting-entry header\">",
		`<span class="member">${i18next.t("tagManagement:edit.type.member")}</span>`, // i know this is wonky
		`<span class="start-date">${i18next.t("frontHistory:edit.startTime")}</span>`,
		`<span class="end-date">${i18next.t("frontHistory:edit.endTime")}</span>`,
		`<span class="custom-status">${i18next.t("frontHistory:edit.customStatus")}</span>`,
		`<span class="presence">${i18next.t("analytics:presence")}</span>`, // i know this is wonky
		"</div>"
	].filter(x => !!x).join("");
}

function frontingEntryToHtml(entry: FrontingEntry) {
	return [
		`<div class="fronting-entry${entry.isMainFronter ? " is-main-fronter" : ""}">`,
		`<span class="member">${
			getMemberIndex().find(x => x.uuid === entry.member)?.name || entry.member
		}${entry.influencing ?
			`<span class="influencing">${
				i18next.t("frontHistory:influencing", { influencedMember: getMemberIndex().find(x => x.uuid === entry.influencing)?.name || entry.influencing })
			}</span>` : ""
		}</span>`,
		`<span class="start-date"><date value="${entry.startTime.valueOf()}">${formatDate(entry.startTime, "collapsed")}</date></span>`,
		entry.endTime && `<span class="end-date"><date value="${entry.endTime.valueOf()}">${formatDate(entry.endTime, "collapsed")}</date></span>`,
		entry.customStatus && `<span class="custom-status">${escape(entry.customStatus)}</span>`,
		entry.presence?.size && `<span class="presence">${((entry.presence.values().reduce((p, c) => p + c, 0) / entry.presence.size) / 2).toFixed(1)}</span>`,
		"</div>"
	].filter(x => !!x).join("");
}

export function exportReport(systems: UUID[]) {

	async function _export() {
		try {
			const date = dayjs().format("YYYY-MM-DD");
			const fileName = `ampersand-report-${date}.html`;
			let path: string | undefined = `${await documentDir()}${sep()}${fileName}`;

			if (platform() !== "ios") {
				// Use save file dialog outside of iOS
				const _path = await save({
					defaultPath: path,
					filters: [{
						name: "Web page",
						extensions: ["html"]
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

			const fd = await openFile(path, { create: true, write: true, truncate: true });
			await fd.write(encoder.encode(`<!DOCTYPE html><html><head><title>Ampersand Report - ${date}</title><style>${getStylesheet()}</style></head><body>`));
			progress.dispatchEvent(new Event("start"));

			// write header
			await fd.write(encoder.encode(intestationToHtml(date)));

			// make progress computations
			const members = getMemberIndex().filter(x => systems.includes(x.system!)).map(x => x.uuid);
			const frontingEntries = getFrontingEntryIndex().filter(x => members.includes(x.member!) && x.endTime && Date.now() - x.startTime!.valueOf() < 1000 * 60 * 60 * 24 * 30).map(x => x.uuid);

			const progressTotal = systems.length + members.length + frontingEntries.length;
			let progressCurrent = 0;

			// write systems info
			await fd.write(encoder.encode("<section class=\"systems\"><div class=\"grid\">"));
			for(const uuid of systems){
				const system = await getSystem(uuid);
				if(system) await fd.write(encoder.encode(await systemToHtml(system)));
				progressCurrent++;
				progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
			}
			await fd.write(encoder.encode("</div></section>"));

			// write members info
			await fd.write(encoder.encode("<section class=\"members\"><div class=\"grid\">"));
			for (const index of members) {
				const member = await getMember(index);
				if (member) await fd.write(encoder.encode(await memberToHtml(member)));
				progressCurrent++;
				progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
			}
			await fd.write(encoder.encode("</div></section>"));

			// write fronting entry info
			await fd.write(encoder.encode("<section class=\"fronting-entries\">"));
			await fd.write(encoder.encode(getFrontingEntryHeader()));
			for (const index of frontingEntries) {
				const entry = await getFrontingEntry(index);
				if (entry) await fd.write(encoder.encode(frontingEntryToHtml(entry)));
				progressCurrent++;
				progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
			}
			await fd.write(encoder.encode("</section>"));

			// close file
			await fd.write(encoder.encode("</body></html>"));
			await fd.close();
			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
			console.error(_e);
			return false;
		}
	}

	const progress = new EventTarget();
	const status = _export();
	return { progress, status };
}
