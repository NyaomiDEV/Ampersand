import { JsonDeserializer, type JsonValueAndPath } from "./json-deserializer.ts";
import { JsonParser, type JsonParserOptions } from "./json-parser.ts";
import { JsonSerializer, serializeJsonValue, type JsonSerializerOptions, type SerializableJsonValue } from "./json-serializer.ts";
import { JsonStringifier } from "./json-stringifier.ts";
import { JsonPathDetector, type JsonPath } from "./json-path-detector.ts";
import { JsonPathSelector, matchesJsonPathSelector, type JsonPathSelectorExpression } from "./json-path-selector.ts";
import { JsonPathStreamSplitter } from "./json-path-stream-splitter.ts";
import type { JsonValue } from "./types.ts";
import { AbstractTransformStream, PipeableTransformStream } from "./utils.ts";

export function stringifyJsonStream(value: SerializableJsonValue, space?: string | number): ReadableStream<string> {
	return serializeJsonValue(value, space).pipeThrough(new JsonStringifier());
}

export function stringifyMultiJsonStream(space?: string | number, options?: JsonSerializerOptions): TransformStream<SerializableJsonValue, string> {
	return new PipeableTransformStream((readable) => {
		return readable
			.pipeThrough(new JsonSerializer(space, options))
			.pipeThrough(new JsonStringifier());
	});
}

class ValueExtractor extends AbstractTransformStream<JsonValueAndPath, JsonValue> {
	protected override transform(chunk: JsonValueAndPath, controller: TransformStreamDefaultController<JsonValue>) {
		controller.enqueue(chunk.value);
	}
}

export function parseJsonStreamWithPaths(
	selector: JsonPathSelectorExpression | undefined,
	options?: JsonParserOptions
): TransformStream<string, JsonValueAndPath> {
	return new PipeableTransformStream((readable) => {
		let result = readable
			.pipeThrough(new JsonParser(options))
			.pipeThrough(new JsonPathDetector());
		if (selector) {
			result = result.pipeThrough(new JsonPathSelector((path) => path.length > 0 && matchesJsonPathSelector(path.slice(0, -1), selector)));
		}
		return result.pipeThrough(new JsonDeserializer());
	});
}

export function parseJsonStream(
	selector: JsonPathSelectorExpression | undefined,
	options?: JsonParserOptions
): TransformStream<string, JsonValue> {
	return new PipeableTransformStream((readable) => {
		let result = readable.pipeThrough(new JsonParser(options))
		if (selector) {
			result = result
				.pipeThrough(new JsonPathDetector())
				.pipeThrough(new JsonPathSelector((path) => path.length > 0 && matchesJsonPathSelector(path.slice(0, -1), selector)));
		}
		return result
			.pipeThrough(new JsonDeserializer())
			.pipeThrough(new ValueExtractor());
	});
}

export function parseNestedJsonStreamWithPaths(
	selector: JsonPathSelectorExpression,
	options?: JsonParserOptions
): TransformStream<string, ReadableStream<JsonValueAndPath> & { path: JsonPath }> {
	return new PipeableTransformStream((readable) => {
		return readable
			.pipeThrough(new JsonParser(options))
			.pipeThrough(new JsonPathDetector())
			.pipeThrough(new JsonPathSelector(selector))
			.pipeThrough(new JsonPathStreamSplitter())
			.pipeThrough(new TransformStream({
				transform: (chunk, controller) => {
					controller.enqueue(Object.assign(
						chunk
							.pipeThrough(new JsonPathSelector([undefined]))
							.pipeThrough(new JsonDeserializer()),
						{ path: chunk.path }
					));
				}
			}));
	});
}

export function parseNestedJsonStream(
	selector: JsonPathSelectorExpression,
	options?: JsonParserOptions
): TransformStream<string, ReadableStream<JsonValue> & { path: JsonPath }> {
	return new PipeableTransformStream((readable) => {
		return readable
			.pipeThrough(parseNestedJsonStreamWithPaths(selector, options))
			.pipeThrough(new TransformStream({
				transform: (chunk, controller) => {
					controller.enqueue(Object.assign(
						chunk.pipeThrough(new ValueExtractor()),
						{ path: chunk.path }
					));
				}
			}));
	});
}