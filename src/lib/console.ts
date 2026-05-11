/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive } from "vue";

type Severity = "log" | "info" | "warn" | "error" | "debug";
type ConsoleObject = {
	date: Date,
	severity: Severity,
	stack?: ParsedStack[],
	data: any[]
};

type ParsedStack = {
	code: string,
	location: string,
	row: number,
	col: number
};

const v8Stack = /^at (.*?) \((.*?):([0-9]*?):([0-9]*?)\)$/;
const jscStack = /^(.*?)@(.*?):([0-9]*?):([0-9]*?)$/;

const oldConsole = {
	log: window.console.log,
	info: window.console.info,
	warn: window.console.warn,
	error: window.console.error,
	debug: window.console.debug
};

const store = reactive<ConsoleObject[]>([]);

function normalizeStackTrace(stack?: string){
	if(!stack) return;

	const stackLines = stack.split("\n").map(x => x.trim());
	const parsedStack: ParsedStack[] = [];
	
	for(const line of stackLines){
		const matches = v8Stack.exec(line);
		if(matches !== null){
			parsedStack.push({
				code: matches[1],
				location: matches[2].startsWith("http") ? matches[2].split("/").pop()! : matches[2],
				row: parseInt(matches[3]),
				col: parseInt(matches[4])
			});
		} else {
			const matches = jscStack.exec(line);
			if (matches !== null) {
				parsedStack.push({
					code: matches[1],
					location: matches[2].startsWith("http") ? matches[2].split("/").pop()! : matches[2],
					row: parseInt(matches[3]),
					col: parseInt(matches[4])
				});
			}
		}
	}
	
	return parsedStack;
}

function log(...data){
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "log",
		stack: normalizeStackTrace(stack),
		data
	});
	oldConsole.log(...data);
}

function info(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "info",
		stack: normalizeStackTrace(stack),
		data
	});
	oldConsole.info(...data);
}

function warn(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "warn",
		stack: normalizeStackTrace(stack),
		data
	});
	oldConsole.warn(...data);
}

function error(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "error",
		stack: normalizeStackTrace(stack),
		data
	});
	oldConsole.error(...data);
}

function debug(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "debug",
		stack: normalizeStackTrace(stack),
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