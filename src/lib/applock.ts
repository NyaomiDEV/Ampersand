import { authenticate, checkStatus } from "@tauri-apps/plugin-biometric";
import { securityConfig } from "./config";
import sha1 from "./util/sha1";
import { t } from "i18next";
import { ref } from "vue";

export const isLocked = ref(false);

if (securityConfig.password)
	isLocked.value = true;

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
	try{
		await authenticate(t("lock:biometrics.reason"), {
			confirmationRequired: false,
			maxAttemps: 3,
			title: t("lock:biometrics.title")
		});
		isLocked.value = false;
		return true;
	}catch(e){
		return false;
	}
}

export function unlockWithPassword(plaintextPwd: string) {
	const password = new TextDecoder().decode(sha1(new TextEncoder().encode(plaintextPwd)));

	if(securityConfig.password === password) {
		isLocked.value = false;
		return true;
	}

	return false;
}

export function disableApplock(plaintextPwd: string) {
	const password = new TextDecoder().decode(sha1(new TextEncoder().encode(plaintextPwd)));

	if (securityConfig.password === password) {
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

	const password = new TextDecoder().decode(sha1(new TextEncoder().encode(plaintextPwd)));
	securityConfig.password = password;
	securityConfig.usePassword = true;

	return true;
}

export async function areBiometricsAvailable(){
	if(!('isTauri' in window)) return false;

	const status = await checkStatus();
	if(status.error || status.errorCode || !status.isAvailable) return false;
	return true;
}
