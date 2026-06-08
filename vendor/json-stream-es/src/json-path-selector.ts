import type { JsonChunkWithPath, JsonPath } from "./json-path-detector.ts";
import { AbstractTransformStream, arrayStartsWith } from "./utils.ts";

/**
 * A selector that can be set for a PathSelector stream.
 * If this is an array, the path has to match the items in the array. Undefined items in the array match any key in the path. Arrays
 * in the array match any of their values.
 * If this is a function, it is called with the path and should return true if the path matches the selector.
 */
export type JsonPathSelectorExpression = (
	| Array<Array<string | number> | string | number | undefined>
	| ((path: JsonPath) => boolean)
);

export function matchesJsonPathSelector(path: JsonPath, selector: JsonPathSelectorExpression): boolean {
	if (typeof selector === "function") {
		return selector(path);
	} else {
		return path.length === selector.length && selector.every((v, i) => {
			if (v === undefined) {
				return true;
			} else if (Array.isArray(v)) {
				return v.includes(path[i]);
			} else {
				return path[i] === v;
			}
		});
	}
}

/**
 * Takes a JsonChunkWithPath stream as emitted by JsonPathDetector and forwards only those chunks that match the specified selector.
 */
export class JsonPathSelector extends AbstractTransformStream<JsonChunkWithPath, JsonChunkWithPath> {
	protected currentPathPrefix: Array<string | number> | undefined = undefined;

	constructor(protected selector: JsonPathSelectorExpression) {
		super();
	}

	protected override transform(chunk: JsonChunkWithPath, controller: TransformStreamDefaultController<JsonChunkWithPath>): void {
		if (this.currentPathPrefix && arrayStartsWith(chunk.path, this.currentPathPrefix)) {
			controller.enqueue(chunk);
		} else if (matchesJsonPathSelector(chunk.path, this.selector)) {
			this.currentPathPrefix = chunk.path;
			controller.enqueue(chunk);
		} else {
			this.currentPathPrefix = undefined;
		}
	}

	protected override flush(controller: TransformStreamDefaultController<JsonChunkWithPath>): void {
		controller.terminate();
	}
}