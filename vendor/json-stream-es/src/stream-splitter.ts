/**
 * Transforms a ReadableStream of chunks into a ReadableStream of ReadableStreams of chunks
 */
export class StreamSplitter<I, P extends Record<any, any> = {}> extends TransformStream<I, ReadableStream<I> & P> {
	protected lastChunkIdx: number | undefined = undefined;

	protected nestedStreams: Record<number, ReadableStream<I> & P> = {};
	protected currentNestedStream: (ReadableStream<I> & P) | undefined = undefined;

	protected nestedWriters: Record<number, WritableStreamDefaultWriter<I>> = {};
	protected currentWriter: WritableStreamDefaultWriter<I> | undefined = undefined;

	constructor(protected options: {
		/**
		 * When a new nested readable stream is created, the properties returned by this function are added to the stream
		 * object. The provided chunk parameter contains the first chunk that will be emitted on the nested stream.
		 */
		getNestedStreamProperties(chunk: I): P;

		/**
		 * Is called for each chunk with the currently active nested stream (containing the properties created by
		 * getNestedStreamProperties). If this returns false, the current nested stream is closed and a new nested
		 * stream is started, with the current chunk being the first one emitted.
		 * If not defined, getNestedStreamProperties() is called for each chunk and a new nested stream is started
		 * whenever its result changes (compared by a shallow equality check, checking for strict equality of all
		 * the object properties).
		 */
		belongsToNestedStream?: (chunk: I, stream: ReadableStream<I> & P) => boolean;
	}) {
		super({});

		let chunkIdx = 0;
		const [mainInput, nestedInput] = (this.readable as any as ReadableStream<I>).pipeThrough(new TransformStream({
			transform: (chunk, controller) => {
				controller.enqueue([chunkIdx++, chunk]);
			}
		})).tee();

		const main = new TransformStream<[number, I], ReadableStream<I> & P>({
			transform: ([chunkIdx, chunk], controller) => this.transformMain([chunkIdx, chunk], controller)
		});
		main.readable.tee = function(this: ReadableStream<ReadableStream<I> & P>): [ReadableStream<ReadableStream<I> & P>, ReadableStream<ReadableStream<I> & P>] {
			return teeNestedStream(this);
		};
		Object.defineProperty(this, "readable", { get: () => main.readable, configurable: true });
		mainInput.pipeTo(main.writable).catch(() => undefined);

		const nested = new WritableStream<[number, I]>({
			write: ([chunkIdx, chunk], _controller) => this.handleNestedChunk([chunkIdx, chunk]),
			close: () => this.handleNestedClose(),
			abort: (reason) => this.handleNestedAbort(reason)
		});
		nestedInput.pipeTo(nested).catch(() => undefined);
	}

	protected transformMain([chunkIdx, chunk]: [number, I], controller: TransformStreamDefaultController<ReadableStream<I> & P>): void {
		this.handleChunk([chunkIdx, chunk]);

		if (this.nestedStreams[chunkIdx]) {
			controller.enqueue(this.nestedStreams[chunkIdx]);
			delete this.nestedStreams[chunkIdx];
		}
	}

	protected async handleNestedChunk([chunkIdx, chunk]: [number, I]): Promise<void> {
		this.handleChunk([chunkIdx, chunk]);

		if (this.nestedWriters[chunkIdx]) {
			if (this.currentWriter) {
				try {
					await this.currentWriter.close();
				} catch {
					// Current nested stream was canceled
				}
			}

			this.currentWriter = this.nestedWriters[chunkIdx];
			delete this.nestedWriters[chunkIdx];
		}

		if (this.currentWriter) {
			try {
				await this.currentWriter.write(chunk);
			} catch (err) {
				// Current nested stream was canceled
			}
		}
	}

	protected async handleNestedClose(): Promise<void> {
		await Promise.all([
			...Object.values(this.nestedWriters),
			...this.currentWriter ? [this.currentWriter] : []
		].map((w) => w.close()));
	}

	protected async handleNestedAbort(reason: any): Promise<void> {
		await Promise.all([
			...Object.values(this.nestedWriters),
			...this.currentWriter ? [this.currentWriter] : []
		].map((w) => w.abort(reason)));
	}

	protected handleChunk([chunkIdx, chunk]: [number, I]): void {
		if (this.lastChunkIdx != null && chunkIdx <= this.lastChunkIdx) {
			// Chunk already handled
			return;
		}

		if (!this.currentNestedStream || !this.belongsToNestedStream(chunk, this.currentNestedStream)) {
			const nestedStream = new TransformStream<I, I>();
			const stream = Object.assign(nestedStream.readable, this.options.getNestedStreamProperties(chunk));
			this.nestedStreams[chunkIdx] = stream;
			this.currentNestedStream = stream;
			this.nestedWriters[chunkIdx] = nestedStream.writable.getWriter();
		}

		this.lastChunkIdx = chunkIdx;
	}

	protected belongsToNestedStream(chunk: I, stream: ReadableStream<I> & P): boolean {
		if (this.options.belongsToNestedStream) {
			return this.options.belongsToNestedStream(chunk, stream);
		} else {
			const chunkProperties = this.options.getNestedStreamProperties(chunk);
			const [streamKeys, chunkKeys] = [Object.keys(stream), Object.keys(chunkProperties)];
			return streamKeys.length === chunkKeys.length && streamKeys.every((k) => chunkKeys.includes(k) && stream[k] === chunkProperties[k]);
		}
	}
}

function teeNestedStream<I, P extends Record<any, any>>(stream: ReadableStream<ReadableStream<I> & P>): [ReadableStream<ReadableStream<I> & P>, ReadableStream<ReadableStream<I> & P>] {
	const [stream1, stream2] = stream.pipeThrough(new TransformStream({
		transform: (chunk, controller) => {
			const [nestedStream1, nestedStream2] = chunk.tee();
			const nestedStreamProperties = Object.fromEntries(Object.entries(chunk));
			controller.enqueue([
				Object.assign(nestedStream1, nestedStreamProperties),
				Object.assign(nestedStream2, nestedStreamProperties),
			]);
		}
	})).tee();

	return [
		stream1.pipeThrough(new TransformStream({
			transform: (chunk, controller) => {
				controller.enqueue(chunk[0]);
			}
		})),
		stream2.pipeThrough(new TransformStream({
			transform: (chunk, controller) => {
				controller.enqueue(chunk[1]);
			}
		}))
	];
}