import { setCanGoBack } from "../native/plugin";

let routerCanGoBack = false;
let modalCanGoBack = false;

let oldCanGoBack = false;

export function setRouterCanGoBack(value: boolean){
	routerCanGoBack = value;
	processCanGoBack();
}

export function setModalCanGoBack(value: boolean) {
	modalCanGoBack = value;
	processCanGoBack();
}

function processCanGoBack(){
	const newCanGoBack = routerCanGoBack || modalCanGoBack;

	if (newCanGoBack !== oldCanGoBack) {
		oldCanGoBack = newCanGoBack;
		setCanGoBack(newCanGoBack);
	}
}
