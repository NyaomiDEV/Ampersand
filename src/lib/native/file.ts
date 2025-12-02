import { readFile } from "@tauri-apps/plugin-fs";
import { SQLFile } from "../db/entities";
import { appDataDir, sep } from "@tauri-apps/api/path";

const filePath = `${await appDataDir() + sep()}files${sep()}`;

async function fileToJSFile(file: SQLFile){
	const data = await readFile(`${filePath}${file.id}`);
	return new File([data], file.friendlyName);
}