import { reactive } from "vue";

type Severity = "log" | "info" | "warn" | "error" | "debug";
type ConsoleObject = {
	date: Date,
	severity: Severity,
	stack?: ParsedStack[],
	data: string[]
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

function normalizeLogEntries(...data) {
	const normalizedData: string[] = [];
	let styleMarkersRemaining = 0;

	for(const chunk of data){
		if(styleMarkersRemaining){
			styleMarkersRemaining--;
			continue;
		}

		if(typeof chunk === "string"){
			const styleMarkersLen = chunk.match(/%c/g)?.length;
			normalizedData.push(chunk.replace(/%[oOdisfc]/g, ""));
			if(styleMarkersLen) styleMarkersRemaining = styleMarkersLen;
		}
		else if(chunk instanceof Error)
			normalizedData.push(`${chunk.name}: ${chunk.message}\n${chunk.stack || "No stack available"}\n${chunk.cause ? `Caused by ${normalizeLogEntries(chunk.cause).join("")}` : ""}`);
		else
			normalizedData.push(`${chunk}`);
	}
	return normalizedData;
}



function log(...data){
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "log",
		stack: normalizeStackTrace(stack),
		data: normalizeLogEntries(...data)
	});
	oldConsole.log(...data);
}

function info(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "info",
		stack: normalizeStackTrace(stack),
		data: normalizeLogEntries(...data)
	});
	oldConsole.info(...data);
}

function warn(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "warn",
		stack: normalizeStackTrace(stack),
		data: normalizeLogEntries(...data)
	});
	oldConsole.warn(...data);
}

function error(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "error",
		stack: normalizeStackTrace(stack),
		data: normalizeLogEntries(...data)
	});
	oldConsole.error(...data);
}

function debug(...data) {
	const stack = new Error().stack;
	store.push({
		date: new Date(),
		severity: "debug",
		stack: normalizeStackTrace(stack),
		data: normalizeLogEntries(...data)
	});
	oldConsole.debug(...data);
}


window.console.log = log;
window.console.info = info;
window.console.warn = warn;
window.console.error = error;
window.console.debug = debug;

export { store };