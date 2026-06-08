import type { JsonChunk } from "./types.ts";
import { AbstractTransformStream } from "./utils.ts";

/**
 * Converts a stream of JsonChunks into a JSON string stream.
 */
export class JsonStringifier extends AbstractTransformStream<JsonChunk | { rawValue: string }, string> {
	constructor() {
		super();
	}

	protected override transform(chunk: JsonChunk | { rawValue: string }, controller: TransformStreamDefaultController<string>): void {
		controller.enqueue(chunk.rawValue);
	}

	protected override flush(controller: TransformStreamDefaultController<string>): void {
		controller.terminate();
	}
}