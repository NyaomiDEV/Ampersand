import { JsonParser } from "./json-parser.ts";
import { StringRole, arrayEnd, arrayStart, booleanValue, colon, comma, nullValue, numberValue, objectEnd, objectStart, stringChunk, stringEnd, stringStart, whitespace, type JsonChunk } from "./types.ts";
import { AbstractTransformStream, iterableToStream, streamToIterable, stringToStream } from "./utils.ts";

type AnyIterable<T> = Iterable<T> | AsyncIterable<T> | ReadableStream<T>;

function normalizeStream<T, S extends symbol>(iterable: AnyIterable<T>, symbol: S): ReadableStream<T> & { [K in S]: true } {
	if (Symbol.asyncIterator in iterable || Symbol.iterator in iterable) {
		return Object.assign(iterableToStream(iterable), { [symbol]: true as const });
	} else {
		return Object.assign(iterable, { [symbol]: true as const });
	}
}

const stringStreamSymbol = Symbol("stringStream");
export type StringStream = ReadableStream<string> & { [stringStreamSymbol]: true };
export function stringStream(stream: AnyIterable<string>): StringStream {
	return normalizeStream(stream, stringStreamSymbol);
}
export function isStringStream(value: any): value is StringStream {
	return value && typeof value === "object" && !!value[stringStreamSymbol];
}

const objectStreamSymbol = Symbol("objectStream");
export type ObjectStream<V> = ReadableStream<[key: string | StringStream, value: V]> & { [objectStreamSymbol]: true };
export function objectStream<T>(obj: AnyIterable<[key: string | StringStream, value: T]>): ObjectStream<T> {
	return normalizeStream(obj, objectStreamSymbol);
}
export function isObjectStream(value: any): value is ObjectStream<any> {
	return value && typeof value === "object" && !!value[objectStreamSymbol];
}

const arrayStreamSymbol = Symbol("arrayStream");
export type ArrayStream<V> = ReadableStream<V> & { [arrayStreamSymbol]: true };
export function arrayStream<T>(obj: AnyIterable<T>): ArrayStream<T> {
	return normalizeStream(obj, arrayStreamSymbol);
}
export function isArrayStream(value: any): value is ArrayStream<any> {
	return value && typeof value === "object" && !!value[arrayStreamSymbol];
}


type SyncOrAsync<T> = T | Promise<T> | (() => T | Promise<T>);
export type SerializableJsonValue = SyncOrAsync<
	| { [key: string | number]: SerializableJsonValue }
	| (ReadableStream<[key: string | StringStream, value: SerializableJsonValue]> & { [objectStreamSymbol]: true }) // Cannot use ObjectStream<StreamedJsonValue> due to circular reference
	| Array<SerializableJsonValue>
	| ReadableStream<SerializableJsonValue> & { [arrayStreamSymbol]: true } // Cannot use ArrayStream<StreamedJsonValue> due to circular reference
	| string
	| StringStream
	| number | boolean | null
	| undefined
>;

function normalizeSpace(space: string | number | undefined): string {
	if (typeof space === "number") {
		return " ".repeat(space);
	} else if (typeof space === "string") {
		return space;
	} else {
		return "";
	}
}

async function* serializeJson(value: SerializableJsonValue, space?: string | number, spacePrefix = "", key = ""): AsyncIterable<JsonChunk> {
	const normalizedSpace = normalizeSpace(space);
	let val = await (typeof value === "function" && !("toJSON" in value) ? value() : value);
	val = (val && "toJSON" in Object(val)) ? Object(val).toJSON(key) : val;

	if (typeof val === "boolean" || (typeof val === "object" && Object.prototype.toString.call(val) === "[object Boolean]")) {
		yield booleanValue(Boolean(val));
	} else if (typeof val === "number" || (typeof val === "object" && Object.prototype.toString.call(val) === "[object Number]")) {
		const num = Number(val);
		if (isFinite(num)) {
			yield numberValue(num);
		} else {
			yield nullValue();
		}
	} else if (typeof val === "bigint" || (typeof val === "object" && Object.prototype.toString.call(val) === "[object BigInt]")) {
		yield numberValue(Number(val), String(val));
	} else if (typeof val === "string" || (typeof val === "object" && Object.prototype.toString.call(val) === "[object String]") || isStringStream(val)) {
		yield stringStart();
		for await (const chunk of isStringStream(val) ? streamToIterable(val) : [String(val)]) {
			yield stringChunk(chunk);
		}
		yield stringEnd();
	} else if ("isRawJSON" in JSON && (JSON as any).isRawJSON(val)) {
		for await (const chunk of streamToIterable(stringToStream((val as any).rawJSON).pipeThrough(new JsonParser()))) {
			yield chunk;
		}
	} else if (Array.isArray(val) || isArrayStream(val)) {
		yield arrayStart();

		let i = 0;
		for await (const v of isArrayStream(val) ? streamToIterable(val) : val) {
			if (i > 0) {
				yield comma();
			}

			if (normalizedSpace) {
				yield whitespace(`\n${spacePrefix}${normalizedSpace}`);
			}

			for await (const chunk of serializeJson(v, space, `${spacePrefix}${normalizedSpace}`, `${i}`)) {
				yield chunk;
			}

			i++;
		}

		if (i > 0 && normalizedSpace) {
			yield whitespace(`\n${spacePrefix}`);
		}

		yield arrayEnd();
	} else if (typeof val === "object" && val) {
		yield objectStart();

		let first = true;
		for await (const [k, rawV] of isObjectStream(val) ? streamToIterable(val) : Object.entries(val)) {
			const v = await (typeof rawV === "function" ? rawV() : rawV);
			if (v === undefined || typeof k === "symbol" || typeof v === "symbol") {
				continue;
			}

			if (first) {
				first = false;
			} else {
				yield comma();
			}

			if (normalizedSpace) {
				yield whitespace(`\n${spacePrefix}${normalizedSpace}`);
			}

			yield stringStart(StringRole.KEY);
			for await (const chunk of isStringStream(k) ? streamToIterable(k) : [`${k}`]) {
				yield stringChunk(chunk, StringRole.KEY);
			}
			yield stringEnd(StringRole.KEY);
			yield colon();

			if (normalizedSpace) {
				yield whitespace(" ");
			}

			for await (const chunk of serializeJson(v, space, `${spacePrefix}${normalizedSpace}`, isStringStream(k) ? "" : k)) {
				yield chunk;
			}
		}

		if (!first && normalizedSpace) {
			yield whitespace(`\n${spacePrefix}`);
		}

		yield objectEnd();
	} else {
		yield nullValue();
	}
}

export type JsonSerializerOptions = {
	/** White space characters to insert before the first emitted root value. Not emitted if no values are emitted. */
	beforeFirst?: string;
	/** White space characters to insert before each but the first emitted root value. Defaults to a newline (\n). */
	delimiter?: string;
	/** White space characters to insert after the last emitted root value. Not emitted if no values are emitted. */
	afterLast?: string;
};

/**
 * Converts any JSON-stringifiable JavaScript values into a stream of JsonChunks.
 */
export class JsonSerializer extends AbstractTransformStream<SerializableJsonValue, JsonChunk> {
	protected first = true;

	constructor(protected space?: string | number, protected options?: JsonSerializerOptions) {
		super();
	}

	override async transform(value: SerializableJsonValue, controller: TransformStreamDefaultController<JsonChunk>): Promise<void> {
		if (this.first) {
			if (this.options?.beforeFirst) {
				controller.enqueue(whitespace(this.options.beforeFirst));
			}
			this.first = false;
		} else if (this.options?.delimiter !== "") {
			controller.enqueue(whitespace(this.options?.delimiter ?? "\n"));
		}

		for await (const chunk of serializeJson(value, this.space)) {
			controller.enqueue(chunk);
		}
	}

	protected override flush(controller: TransformStreamDefaultController<JsonChunk>): void | Promise<void> {
		if (!this.first && this.options?.afterLast) {
			controller.enqueue(whitespace(this.options.afterLast));
		}

		controller.terminate();
	}
}
/**
 * Converts any single JSON-stringifiable JavaScript value into a stream of JsonChunks.
 */
export function serializeJsonValue(value: SerializableJsonValue, space?: string | number): ReadableStream<JsonChunk> {
	const serializer = new JsonSerializer(space);
	const writer = serializer.writable.getWriter();
	writer.write(value).catch(() => undefined);
	writer.close().catch(() => undefined);
	return serializer.readable;
}