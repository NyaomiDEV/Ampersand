import { appConfigDir, appDataDir, documentDir, sep } from "@tauri-apps/api/path";
import { copyFile, exists, mkdir, readDir, remove } from "@tauri-apps/plugin-fs";
import { exit } from "@tauri-apps/plugin-process";

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

export async function escapeHatch() {
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
	if (
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