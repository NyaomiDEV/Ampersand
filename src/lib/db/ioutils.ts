import { Typeson } from "typeson";
import { getTables, ShittyTable } from "./tables";
import { file, map, undef } from "typeson-registry";
import { decode, encode } from "@msgpack/msgpack";
import { decompressGzip } from "../util/misc";
import { accessibilityConfig, appConfig, securityConfig } from "../config";
import { UUIDable } from "./entities";
import { deleteNull, replace, revive, walk } from "../json";
import { appConfigDir, appDataDir, dirname, documentDir, sep } from "@tauri-apps/api/path";
import { mkdir, readFile, open as openFile, readDir, copyFile, remove, exists } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { exit } from "@tauri-apps/plugin-process";

const AMPERSAND_BACKUP_MAGICS = new Map<number, number[]>([
	[1, [0x1F, 0x8B]], // GZip magic, because we used to use GZip
	[2, [0x41, 0x4D, 0x50, 0x44, 0x42, 0x00, 0x00, 0x02, 0x00, 0x00]] // AMPDB..<version2>..{data}
]);

const typeson = new Typeson({
	sync: false
}).register([
	file,
	undef,
	map
]);

function matchMagic(bin: Uint8Array){
	for(const [version, magic] of AMPERSAND_BACKUP_MAGICS.entries()){
		let matches = true;

		for(let i = 0; i < magic.length; i++){
			if(magic[i] !== bin[i]){
				matches = false;
				break;
			}
		}

		if(matches) return version;
	}
	return undefined;
}

function stripMagic(bin: Uint8Array, version: number){
	const magic = AMPERSAND_BACKUP_MAGICS.get(version);
	if(!magic) return undefined;

	const newArray = new Uint8Array(bin.length - magic.length);
	newArray.set(bin.slice(magic.length), 0);
	return newArray;
}

async function _exportDatabase(progress: EventTarget){
	progress.dispatchEvent(new Event("start"));
	const config = { appConfig, accessibilityConfig, securityConfig };
	const database: Record<string, Array<unknown>> = {};

	let progressTotal = 0;
	for(const [_name, table] of Object.entries(getTables())) 
		progressTotal += table.count();
	
	let progressCurrent = 0;
	for (const [name, table] of Object.entries(getTables())) {
		database[name] = [];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		for (const x of table.index.map(x => x.uuid)) {
			const data = await table.get(x);
			if (data) database[name].push(data);
			progressCurrent++;
			progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
		}
	}

	const finished = deleteNull(walk({ config, database }, replace));
	progress.dispatchEvent(new Event("finish"));
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return finished;
}

export function exportDatabaseToBinary(path: string){
	const progress = new EventTarget();
	const status = _exportDatabase(progress)
		.then(async res => {
			const data = encode(res, { ignoreUndefined: true });

			// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
			if (!path.startsWith("content://")) {
				// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
				const _dirname = await dirname(path);
				await mkdir(_dirname,{ recursive: true });
			}


			const magic = AMPERSAND_BACKUP_MAGICS.get(2)!;

			const fd = await openFile(path, { write: true });
			await fd.write(new Uint8Array(magic));
			await fd.write(data);
			await fd.close();
			return true;
		})
		.catch(_e => false);

	return { progress, status };
}

async function _importDatabase(tablesAndConfig: Record<string, unknown>, progress: EventTarget){
	try{
		progress.dispatchEvent(new Event("start"));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let revived: any;
		if(tablesAndConfig.$types) // typeson
			revived = await typeson.revive(tablesAndConfig);
		else
			revived = walk(tablesAndConfig, revive);

		const progressTotal = Object.getOwnPropertyNames(revived.database).length + 3;
		let progressCurrent = 0;

		Object.assign(appConfig, revived.config.appConfig);
		progressCurrent++;

		Object.assign(accessibilityConfig, revived.config.accessibilityConfig);
		progressCurrent++;

		Object.assign(securityConfig, revived.config.securityConfig);
		progressCurrent++;

		for (const key of Object.getOwnPropertyNames(revived.database)) {
			const table: ShittyTable<UUIDable> = getTables()[key];
			if (table) {
				if(await table.clear() === false) return false;
				if(await table.bulkAdd(revived.database[key]) === false) return false;
			}
			progressCurrent++;
			progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
		}
	}catch(_e){
		console.error(_e);
		return false;
	}

	progress.dispatchEvent(new Event("finish"));
	return true;
}

export function importDatabaseFromBinary() {
	const progress = new EventTarget();

	const status = open({
		multiple: false,
		filters: [{ name: "Ampersand Backup file", extensions: ["ampdb"] }],
		fileAccessMode: "scoped",
		pickerMode: "document"
	}).then(async path => {
		if(!path) return false;

		let array = await readFile(path);
		const magicVersion = matchMagic(array);
		if(!magicVersion) return false;

		switch(magicVersion){
			case 1:
				// it's gzip, decompress it
				const reader = decompressGzip(array).getReader();
				const chunks: Uint8Array[] = [];
				while (true) {
					const { done, value } = await reader.read();
					if (value) chunks.push(value);
					if (done) {
						reader.releaseLock();
						break;
					}
				}

				const length = chunks.reduce((p, c) => p + c.length, 0);
				let offset = 0;

				array = new Uint8Array(length);
				chunks.forEach(item => {
					array.set(item, offset);
					offset += item.length;
				});
				break;
			default:
				// in all other cases we need to strip our magic
				const stripped = stripMagic(array, magicVersion);
				if(!stripped) return false;
				array = stripped;
				break;
		}

		return _importDatabase(
			decode(array) as Record<string, unknown>,
			progress
		);
	})
		.catch(_e => false);

	return { progress, status };
}

async function recursiveCopyDir(src: string, dst: string) {
	await mkdir(dst, { recursive: true });

	for (const entry of await readDir(src)) {
		const newSrcPath = src + sep() + entry.name;
		const newDstPath = dst + sep() + entry.name;
		if (entry.isDirectory)
			await recursiveCopyDir(newSrcPath, newDstPath);
		else
			await copyFile(newSrcPath, newDstPath);
	}
}

export async function escapeHatch(){
	const ourDir = `${await documentDir() + sep()}ampersand_escape_hatch_${Date.now()}`;
	console.log(ourDir);
	await mkdir(ourDir, { recursive: true });

	// copy app config
	await mkdir(`${ourDir + sep()}config`);
	await copyFile(`${await appConfigDir()}${sep()}appConfig.json`, `${ourDir + sep()}config${sep()}appConfig.json`);

	// copy database
	await mkdir(`${ourDir + sep()}database`);
	const appDatabase = `${await appDataDir() + sep()}database`;
	await recursiveCopyDir(appDatabase, `${ourDir + sep()}database`);
}

export async function reverseEscapeHatch() {
	const ourDir = `${await documentDir() + sep()}ampersand_illegitimate_intake`;
	if(
		!await exists(ourDir) ||
		!await exists(`${ourDir + sep()}database`) ||
		!await exists(`${ourDir + sep()}config${sep()}appConfig.json`)
	) throw new Error("NOPE");

	// copy app config
	await copyFile(`${ourDir + sep()}config${sep()}appConfig.json`, `${await appConfigDir()}${sep()}appConfig.json`);

	// copy database
	const appDatabase = `${await appDataDir() + sep()}database`;
	await remove(appDatabase, { recursive: true });
	await mkdir(appDatabase, { recursive: true });
	await recursiveCopyDir(`${ourDir + sep()}database`, appDatabase);

	setTimeout(
		() => exit(0), 1000
	);
}