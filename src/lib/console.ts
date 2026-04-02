/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive } from "vue";

type Severity = "log" | "info" | "warn" | "error" | "debug";
type ConsoleObject = {
	date: Date,
	severity: Severity,
	data: any[]
};

const oldConsole = {
	log: window.console.log,
	info: window.console.info,
	warn: window.console.warn,
	error: window.console.error,
	debug: window.console.debug
};

const store = reactive<ConsoleObject[]>([]);

function log(...data){
	store.push({
		date: new Date(),
		severity: "log",
		data
	});
	oldConsole.log(...data);
}

function info(...data) {
	store.push({
		date: new Date(),
		severity: "info",
		data
	});
	oldConsole.info(...data);
}

function warn(...data) {
	store.push({
		date: new Date(),
		severity: "warn",
		data
	});
	oldConsole.warn(...data);
}

function error(...data) {
	store.push({
		date: new Date(),
		severity: "error",
		data
	});
	oldConsole.error(...data);
}

function debug(...data) {
	store.push({
		date: new Date(),
		severity: "debug",
		data
	});
	oldConsole.debug(...data);
}


window.console.log = log;
window.console.info = info;
window.console.warn = warn;
window.console.error = error;
window.console.debug = debug;

export { store };