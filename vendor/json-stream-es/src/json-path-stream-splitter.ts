import type { JsonChunkWithPath, JsonPath } from "./json-path-detector.ts";
import { StreamSplitter } from "./stream-splitter.ts";
import { arrayStartsWith } from "./utils.ts";

type P = {
	path: JsonPath;
};

export type JsonStreamWithPath = ReadableStream<JsonChunkWithPath> & P;

/**
 * Splits up the incoming ReadableStream<JsonChunkWithPath> as emitted by JsonPathSelector and emits a nested
 * ReadableStream<JsonChunkWithPath> for each JSON document in the stream. Each emitted nested stream gets
 * a "path" property that contains the path of the document as selected by JsonPathSelector. The individual
 * JSON chunks of the nested stream have the path prefix of their document removed, so that the nested
 * stream can be piped through the other transformers (such as JsonPathSelector or JsonDeserializer) as if
 * it contained an independent JSON document.
 */
export class JsonPathStreamSplitter extends StreamSplitter<JsonChunkWithPath, P> {
	constructor() {
		super({
			getNestedStreamProperties: (chunk) => ({ path: chunk.path }),
			belongsToNestedStream: (chunk, stream) => arrayStartsWith(chunk.path, stream.path)
		});

		const readable = this.readable.pipeThrough(new TransformStream<JsonStreamWithPath, JsonStreamWithPath>({
			transform: (subStream, controller) => {
				controller.enqueue(Object.assign(subStream.pipeThrough(new TransformStream<JsonChunkWithPath, JsonChunkWithPath>({
					transform: (chunk, controller) => {
						controller.enqueue({
							...chunk,
							path: chunk.path.slice(subStream.path.length)
						});
					}
				})), {
					path: subStream.path
				}));
			}
		}));
		Object.defineProperty(this, "readable", { get: () => readable, configurable: true });
	}
}