import { setCanGoBack } from "../native/plugin";

let routerCanGoBack = false;
let modalCanGoBack = false;

let oldCanGoBack = false;

export async function setRouterCanGoBack(value: boolean){
	routerCanGoBack = value;
	await processCanGoBack();
}

export async function setModalCanGoBack(value: boolean) {
	modalCanGoBack = value;
	await processCanGoBack();
}

async function processCanGoBack(){
	const newCanGoBack = routerCanGoBack || modalCanGoBack;

	if (newCanGoBack !== oldCanGoBack) {
		oldCanGoBack = newCanGoBack;
		await setCanGoBack(newCanGoBack);
	}
}
