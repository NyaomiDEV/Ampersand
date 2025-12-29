import { exitApp } from "../native/plugin";

let routerCanGoBack = false;
let modalCanGoBack = false;
let shouldNotExit = false;

export function setRouterCanGoBack(value: boolean){
	routerCanGoBack = value;
	shouldNotExit = modalCanGoBack || routerCanGoBack;
}

export function setModalCanGoBack(value: boolean) {
	modalCanGoBack = value;
	shouldNotExit = modalCanGoBack || routerCanGoBack;
}

export async function maybeExit(){
	if(!shouldNotExit)
		await exitApp();
}