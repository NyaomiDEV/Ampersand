import { securityConfig } from "./config";
import sha1 from "./util/sha1";

let isLocked = false;
if (securityConfig.password)
	isLocked = true;

export function getLockedStatus(){
	if (securityConfig.password === undefined || !securityConfig.usePassword) return false;
	return isLocked;
}

export function unlock(plaintextPwd: string) {
	const password = new TextDecoder().decode(sha1(new TextEncoder().encode(plaintextPwd)));

	if(securityConfig.password === password) {
		isLocked = false;
		return true;
	}

	return false;
}

export function disableApplock(plaintextPwd: string) {
	const password = new TextDecoder().decode(sha1(new TextEncoder().encode(plaintextPwd)));

	if (securityConfig.password === password) {
		isLocked = false;
		securityConfig.usePassword = false;
		securityConfig.password = undefined;
		return true;
	}

	return false;
}

export function enableApplock(plaintextPwd: string) {
	if(isLocked) return false;

	const password = new TextDecoder().decode(sha1(new TextEncoder().encode(plaintextPwd)));
	securityConfig.password = password;
	securityConfig.usePassword = true;

	return true;
}
