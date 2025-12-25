import { authenticate, checkStatus } from "@tauri-apps/plugin-biometric";
import { securityConfig } from "./config";
import { md5 } from "./util/md5";
import { t } from "i18next";
import { ref } from "vue";
import { platform } from "@tauri-apps/plugin-os";

export const isLocked = ref(false);

if (securityConfig.password)
	isLocked.value = true;

function hashPassword(plaintext: string){
	return `md5:${Array.from(md5(new TextEncoder().encode(plaintext))).map(x => x.toString(16)).join("")}`;
}

function comparePassword(plaintext: string){
	const storedPassword = securityConfig.password?.split(":");
	if(!storedPassword) return true;

	let hashedPlaintext;
	switch(storedPassword[0]){
		case "md5":
			hashedPlaintext = Array.from(md5(new TextEncoder().encode(plaintext))).map(x => x.toString(16)).join("");
			break;
	}

	if(storedPassword[1]) return storedPassword[1] === hashedPlaintext;
	return storedPassword[0] === hashedPlaintext;
}

function isOldPassword(){
	return securityConfig.password?.split(":").length !== 2;
}

export function getLockedStatus(){
	if (securityConfig.password === undefined || !securityConfig.usePassword) return false;
	return isLocked.value;
}

export function lock(){
	if (isLocked.value) return false;

	isLocked.value = true;
	return true;
}

export async function unlockWithBiometrics(){
	if(!await areBiometricsAvailable()) return false;
	try{
		await authenticate(t("lock:biometrics.reason"), {
			confirmationRequired: true,
			title: t("lock:biometrics.title")
		});
		isLocked.value = false;
		return true;
	}catch(e){
		console.error(e);
		return false;
	}
}

export function unlockWithPassword(plaintextPwd: string) {
	if(comparePassword(plaintextPwd)) {
		isLocked.value = false;

		// migrate people to md5
		if(isOldPassword())
			securityConfig.password = hashPassword(plaintextPwd);

		return true;
	}

	return false;
}

export function disableApplock(plaintextPwd: string) {
	if (comparePassword(plaintextPwd)) {
		isLocked.value = false;
		securityConfig.usePassword = false;
		securityConfig.useBiometrics = false;
		securityConfig.password = undefined;
		return true;
	}

	return false;
}

export function enableApplock(plaintextPwd: string) {
	if (isLocked.value) return false;

	securityConfig.password = hashPassword(plaintextPwd);
	securityConfig.usePassword = true;

	return true;
}

export async function areBiometricsAvailable(){
	if(platform() !== "android" || platform() !== "ios") return false;

	const status = await checkStatus();
	if(status.error || status.errorCode || !status.isAvailable) return false;
	return true;
}
