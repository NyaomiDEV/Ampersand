import { appDataDir, documentDir, sep } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, remove, writeFile } from "@tauri-apps/plugin-fs";
import { exit } from "@tauri-apps/plugin-process";
import { getConfigDirectory } from "../../config/store";
import { intoStream } from "../utils";

async function recursiveCopyDir(src: string, dst: string) {
	await mkdir(dst, { recursive: true });

	for (const entry of await readDir(src)) {
		const newSrcPath = src + sep() + entry.name;
		const newDstPath = dst + sep() + entry.name;
		if (entry.isDirectory)
			await recursiveCopyDir(newSrcPath, newDstPath);
		else 
			await writeFile(newDstPath, intoStream(newSrcPath), { mode: 0o777 });
	}
}

export async function escapeHatch() {
	const ourDir = `${await documentDir() + sep()}ampersand_escape_hatch_${Date.now()}`;
	await mkdir(ourDir, { recursive: true });

	// copy app config
	await mkdir(`${ourDir + sep()}config`);
	const appConfig = await getConfigDirectory();
	await recursiveCopyDir(appConfig, `${ourDir + sep()}config`);

	// copy database
	await mkdir(`${ourDir + sep()}database`);
	const appDatabase = `${await appDataDir() + sep()}database`;
	await recursiveCopyDir(appDatabase, `${ourDir + sep()}database`);
}

export async function reverseEscapeHatch() {
	const ourDir = `${await documentDir() + sep()}ampersand_illegitimate_intake`;
	if (
		!await exists(ourDir) ||
		!await exists(`${ourDir + sep()}database`) ||
		!await exists(`${ourDir + sep()}config`)
	) throw new Error("NOPE");

	// copy app config
	const appConfig = await getConfigDirectory();
	await remove(appConfig, { recursive: true });
	await mkdir(appConfig, { recursive: true });
	await recursiveCopyDir(`${ourDir + sep()}config`, appConfig);

	// copy database
	const appDatabase = `${await appDataDir() + sep()}database`;
	await remove(appDatabase, { recursive: true });
	await mkdir(appDatabase, { recursive: true });
	await recursiveCopyDir(`${ourDir + sep()}database`, appDatabase);

	setTimeout(
		() => exit(0), 1000
	);
}