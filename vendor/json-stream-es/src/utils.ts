/**
 * Converts a ReadableStream into an AsyncIterable so the stream can be consumed using "for await".
 * In the latest Streams API, ReadableStream is an AsyncIterable, but not all browsers support this yet.
 */
export async function* streamToIterable<T>(stream: ReadableStream<T>): AsyncGenerator<T, void, undefined> {
	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				return;
			} else {
				yield value;
			}
		}
	} finally {
		// Is also called if iterator is quit early (by using break;)
		reader.cancel().catch(() => undefined);
	}
}

/**
 * Converts a sync/async iterable into an UnderlyingDefaultSource, which can be used as the argument to construct a ReadableStream.
 */
export function iterableToSource<T>(iterable: AsyncIterable<T> | Iterable<T>): UnderlyingDefaultSource<T> {
	const iterator = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
	return {
		async pull(controller) {
			const { value, done } = await iterator.next();
			if (done) {
				controller.close();
			} else {
				controller.enqueue(value);
			}
		},
	};
}

export function iterableToStream<T>(iterable: AsyncIterable<T> | Iterable<T>, strategy?: QueuingStrategy<T>): ReadableStream<T> {
	return new ReadableStream<T>(iterableToSource(iterable), strategy);
}

export async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
	const reader = stream.getReader();
	const result: T[] = [];

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			return result;
		} else {
			result.push(value);
		}
	}
}

export async function streamToString(stream: ReadableStream<string>): Promise<string> {
	return (await streamToArray(stream)).join("");
}

export function stringToStream(string: string): ReadableStream<string> {
	return iterableToStream([string]);
}

export function concatStreams<T>(...streams: Array<ReadableStream<T> | (() => ReadableStream<T>)>): ReadableStream<T> {
	const transform = new TransformStream();
	(async () => {
		for (const stream of streams) {
			await (typeof stream === "function" ? stream() : stream).pipeTo(transform.writable, { preventClose: true });
		}
		await transform.writable.close();
	})().catch(async (err) => {
		await transform.writable.abort(err);
	});
	return transform.readable;
}

export type TransformerAbortCallback<O> = (reason: any, controller: TransformStreamDefaultController<O>) => void | PromiseLike<void>;

/**
 * A transform stream that provides an abort() handler to transform stream abortions.
 * More info can be found on https://stackoverflow.com/a/78489418/242365.
 */
export class AbortHandlingTransformStream<I, O> extends TransformStream<I, O> {
    constructor(
        transformer?: Transformer<I, O> & {
            abort?: TransformerAbortCallback<O>;
        },
        writableStrategy?: QueuingStrategy<I>,
        readableStrategy?: QueuingStrategy<O>
    ) {
        const { abort, start, ...rest } = transformer ?? {};
        let controller: TransformStreamDefaultController<O>;
        super({
            ...rest,
            start: (c) => {
                controller = c;
                start?.(c);
            }
        }, writableStrategy, readableStrategy);

        const writer = this.writable.getWriter();
        const writable = new WritableStream({
            write: (chunk) => writer.write(chunk),
            close: () => writer.close(),
            abort: async (reason) => {
                if (abort) {
                    try {
                        await abort(reason, controller);
                    } catch (err: any) {
                        await writer.abort(err);
                    }
                } else {
                    await writer.abort(reason);
                }
            }
        });

        Object.defineProperty(this, "writable", {
            get: () => writable,
			configurable: true
        });
    }
}

/**
 * A transform stream where rather than specifying a transformer as a constructor argument, you override its methods to implement the
 * transformation.
 */
export abstract class AbstractTransformStream<I, O> extends AbortHandlingTransformStream<I, O> {
	constructor(writableStrategy?: QueuingStrategy<I>, readableStrategy?: QueuingStrategy<O>) {
		super({
			transform: (chunk, controller) => {
				return this.transform(chunk, controller);
			},
			flush: (controller) => {
				return this.flush(controller);
			},
			abort: (reason, controller) => {
				return this.abort(reason, controller);
			}
		}, writableStrategy, readableStrategy);
	}

	protected abstract transform(chunk: I, controller: TransformStreamDefaultController<O>): void | Promise<void>;

	protected flush(controller: TransformStreamDefaultController<O>): void | Promise<void> {
		controller.terminate();
	}

	protected abort(reason: any, controller: TransformStreamDefaultController<O>): void | Promise<void> {
		controller.error(reason);
	}
}

/**
 * A TransformStream that is set up by providing a ReadableStream mapper rather than transforming individual chunks using
 * start(), transform() and flush().
 * This allows access to ReadableStream methods such as pipeThrough(), which makes it easy to reuse other TransformStreams
 * in the implementation.
 * @param transformReadable Retrieves one parameter with a ReadableStream that emits the input data of the TransformStream.
 *     Should return a ReadableStream whose output will become the output data of the TransformStream.
 */
// https://stackoverflow.com/a/78404600/242365
export class PipeableTransformStream<I, O> extends TransformStream<I, O> {
	constructor(transformReadable: (readable: ReadableStream<I>) => ReadableStream<O>, writableStrategy?: QueuingStrategy<I>, readableStrategy?: QueuingStrategy<O>) {
		super({}, writableStrategy);
		const readable = transformReadable(this.readable as any).pipeThrough(new TransformStream({}, undefined, readableStrategy));
		Object.defineProperty(this, "readable", { get: () => readable });
	}
}

export function arrayStartsWith<T>(array: T[], startsWith: T[]): boolean {
	return array.length >= startsWith.length && startsWith.every((v, i) => array[i] === v);
}