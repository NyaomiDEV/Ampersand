import { StringRole, arrayEnd, arrayStart, booleanValue, colon, comma, nullValue, numberValue, objectEnd, objectStart, stringChunk, stringEnd, stringStart, whitespace, type JsonChunk } from "./types.ts";
import { AbstractTransformStream } from "./utils.ts";

enum StateType {
	START = "start",
	OBJECT_AFTER_START = "object_after_start", OBJECT_AFTER_KEY = "object_after_key", OBJECT_AFTER_COLON = "object_after_colon", OBJECT_AFTER_VALUE = "object_after_value", OBJECT_AFTER_COMMA = "object_after_comma",
	ARRAY_AFTER_START = "array_after_start", ARRAY_AFTER_VALUE = "array_after_value", ARRAY_AFTER_COMMA = "array_after_comma",
	BOOLEAN_OR_NULL = "boolean_or_null",
	NUMBER_MINUS = "number_minus", NUMBER_DIGITS = "number_digits", NUMBER_POINT = "number_point", NUMBER_DECIMAL_DIGITS = "number_decimal_digits",
	NUMBER_E = "number_e", NUMBER_E_PLUSMINUS = "number_e_plusminus", NUMBER_E_DIGITS = "number_e_digits",
	WHITESPACE = "whitespace",
	STRING = "string", STRING_AFTER_BACKSLASH = "string_after_backslash", STRING_AFTER_BACKSLASH_U = "string_after_backslash_u",
	END = "end"
};

/** States where the start of a new value (object/array/string/number/boolean/null) is allowed. */
const VALUE_START_ALLOWED = [StateType.START, StateType.OBJECT_AFTER_COLON, StateType.ARRAY_AFTER_START, StateType.ARRAY_AFTER_COMMA] as const;
const VALUE_START_ALLOWED_MULTI = [...VALUE_START_ALLOWED, StateType.END] as const;
/** States whree the start of an object key string is allowed. */
const KEY_START_ALLOWED = [StateType.OBJECT_AFTER_START, StateType.OBJECT_AFTER_COMMA] as const;
/** States where a whilespace character is allowed. */
const WHITESPACE_ALLOWED = [
	StateType.START, StateType.OBJECT_AFTER_START, StateType.OBJECT_AFTER_KEY, StateType.OBJECT_AFTER_COLON, StateType.OBJECT_AFTER_VALUE, StateType.OBJECT_AFTER_COMMA,
	StateType.ARRAY_AFTER_START, StateType.ARRAY_AFTER_VALUE, StateType.ARRAY_AFTER_COMMA,
	StateType.END
] as const;

type AnyState = {
	type: StateType.START | StateType.END
} | {
	type: (
		| StateType.OBJECT_AFTER_START | StateType.OBJECT_AFTER_KEY | StateType.OBJECT_AFTER_COLON | StateType.OBJECT_AFTER_VALUE
		| StateType.OBJECT_AFTER_COMMA | StateType.ARRAY_AFTER_START | StateType.ARRAY_AFTER_VALUE | StateType.ARRAY_AFTER_COMMA
	);
	parentState: State<typeof VALUE_START_ALLOWED_MULTI[number]>;
} | {
	type: StateType.BOOLEAN_OR_NULL;
	rawValue: string;
	parentState: State<typeof VALUE_START_ALLOWED_MULTI[number]>;
} | {
	type: StateType.WHITESPACE;
	rawValue: string;
	parentState: State<typeof WHITESPACE_ALLOWED[number]>;
} | {
	type: (
		| StateType.NUMBER_MINUS | StateType.NUMBER_DIGITS | StateType.NUMBER_POINT | StateType.NUMBER_DECIMAL_DIGITS
		| StateType.NUMBER_E | StateType.NUMBER_E_PLUSMINUS | StateType.NUMBER_E_DIGITS
	);
	rawValue: string;
	parentState: State<typeof VALUE_START_ALLOWED_MULTI[number]>;
} | {
	type: StateType.STRING;
	value: string;
	rawValue: string;
	role: StringRole;
	parentState: State<typeof VALUE_START_ALLOWED_MULTI[number] | typeof KEY_START_ALLOWED[number]>;
} | {
	type: StateType.STRING_AFTER_BACKSLASH;
	rawValue: string;
	parentState: State<StateType.STRING>;
} | {
	type: StateType.STRING_AFTER_BACKSLASH_U;
	/** The unicode hex code */
	value: string;
	rawValue: string;
	parentState: State<StateType.STRING>;
};

type State<T extends StateType = StateType> = AnyState & { type: T };

/** Type guard to check whether the given state has any of the given types. */
function isState<T extends StateType>(state: State, types: readonly [...T[]]): state is State & { type: T } {
	return (types as ReadonlyArray<StateType>).includes(state.type);
}

/**
 * Given the state when a value (object/array/string/number/boolean/null) was started, returns the
 * new state after the value was finished.
 */
function getStateAfterValue(stateBeforeValue: State<typeof VALUE_START_ALLOWED_MULTI[number] | typeof KEY_START_ALLOWED[number]>): State {
	if (isState(stateBeforeValue, [StateType.START, StateType.END])) {
		return { ...stateBeforeValue, type: StateType.END };
	} else if (stateBeforeValue.type === StateType.OBJECT_AFTER_COLON) {
		return { ...stateBeforeValue, type: StateType.OBJECT_AFTER_VALUE };
	} else if (isState(stateBeforeValue, [StateType.ARRAY_AFTER_START, StateType.ARRAY_AFTER_COMMA])) {
		return { ...stateBeforeValue, type: StateType.ARRAY_AFTER_VALUE };
	} else if (isState(stateBeforeValue, [StateType.OBJECT_AFTER_START, StateType.OBJECT_AFTER_COMMA])) {
		return { ...stateBeforeValue, type: StateType.OBJECT_AFTER_KEY };
	} else {
		throw new Error(`Invalid value state ${stateBeforeValue.type}.`);
	}
}

type Context = {
	char: string;
	position: number;
};

export class UnexpectedCharError extends Error {
	constructor(context: Context) {
		super(`Unexpected character "${context.char}" at position ${context.position}.`);
	}
}

export class PrematureEndError extends Error {
	constructor() {
		super("Premature end of JSON stream.");
	}
}

/**
 * Each character that is possible after a \ inside a string, mapped to the character that it replaces.
 */
const STRING_ESCAPE_CHARS = {
	"\"": "\"",
	"\\": "\\",
	"/": "/",
	"b": "\b",
	"f": "\f",
	"n": "\n",
	"r": "\r",
	"t": "\t"
};

/** Whitespace characters allowed between tokens. */
const WHITESPACE_CHARS = [" ", "\t", "\n", "\r"];
/** Record separator char that is ignored between JSON documents in multi mode. */
const RS_CHARS = ["\x1e"];
const NUMBER_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const HEX_NUMBER_CHARS = [...NUMBER_CHARS, "a", "b", "c", "d", "e", "f", "A", "B", "C", "D", "E", "F"];

const BOOLEAN_OR_NULL = { false: false, true: true, null: null };
const BOOLEAN_OR_NULL_FIRST_CHARS = Object.keys(BOOLEAN_OR_NULL).map((k) => k[0]);
const BOOLEAN_OR_NULL_CHARS = [...new Set(Object.keys(BOOLEAN_OR_NULL).flatMap((k) => [...k]))];

export type JsonParserOptions = {
	/** If true, the stream is allowed to contain multiple JSON values on the root level */
	multi?: boolean;
}

/**
 * Parses a JSON string stream into a stream of JsonChunks.
 * Unless multi is true, the JSON string must contain only one JSON value (object/array/string/number/boolean/null)
 * on the root level, otherwise the stream will fail with an error.
 */
export class JsonParser extends AbstractTransformStream<string, JsonChunk> {
	protected state: State = { type: StateType.START };
	protected lengthBeforeCurrentChunk = 0;

	constructor(protected options: JsonParserOptions = {}) {
		super();
	}

	/**
	 * Checks whether a token that doesn't have an explicit end character (that is: numbers and whitespaces) has ended, and if
	 * so, update the state and emit the appropriate chunks.
	 * @param char The next character on the stream. Is used to check whether the current token ends (for example, a number is ended
	 *     by a non-number character). If undefined, the stream is assumed to have ended, so the current token must always end.
	 */
	protected checkValueEnd(controller: TransformStreamDefaultController<JsonChunk>, char: string | undefined): void {
		if (this.state.type === StateType.WHITESPACE && (char == null || !WHITESPACE_CHARS.includes(char))) {
			if (this.state.rawValue.length > 0) {
				controller.enqueue(whitespace(this.state.rawValue));
			}
			this.state = this.state.parentState;
		}

		if (
			(this.state.type === StateType.NUMBER_DIGITS && (char == null || ![...NUMBER_CHARS, ".", "e", "E"].includes(char)))
			|| (this.state.type === StateType.NUMBER_DECIMAL_DIGITS && (char == null || ![...NUMBER_CHARS, "e", "E"].includes(char)))
			|| (this.state.type === StateType.NUMBER_E_DIGITS && (char == null || !NUMBER_CHARS.includes(char)))
		) {
			controller.enqueue(numberValue(Number(this.state.rawValue), this.state.rawValue));
			this.state = getStateAfterValue(this.state.parentState);
		}
	}

	/**
	 * Handle a single character piped into the stream.
	 */
	protected handleChar(controller: TransformStreamDefaultController<JsonChunk>, context: Context): void {
		const char = context.char;

		// End chunks that don't have an explicit end char
		this.checkValueEnd(controller, char);


		// Objects

		if (char === "{" && isState(this.state, this.options.multi ? VALUE_START_ALLOWED_MULTI : VALUE_START_ALLOWED)) {
			controller.enqueue(objectStart(char));
			this.state = {
				type: StateType.OBJECT_AFTER_START,
				parentState: this.state
			};
			return;
		}

		if (char === "}" && isState(this.state, [StateType.OBJECT_AFTER_START, StateType.OBJECT_AFTER_VALUE])) {
			controller.enqueue(objectEnd(char));
			this.state = getStateAfterValue(this.state.parentState);
			return;
		}

		if (char === ":" && isState(this.state, [StateType.OBJECT_AFTER_KEY])) {
			controller.enqueue(colon(char));
			this.state = {
				type: StateType.OBJECT_AFTER_COLON,
				parentState: this.state.parentState
			};
			return;
		}

		if (char === "," && isState(this.state, [StateType.OBJECT_AFTER_VALUE])) {
			controller.enqueue(comma(char));
			this.state = {
				type: StateType.OBJECT_AFTER_COMMA,
				parentState: this.state.parentState
			};
			return;
		}


		// Arrays

		if (char === "[" && isState(this.state, this.options.multi ? VALUE_START_ALLOWED_MULTI : VALUE_START_ALLOWED)) {
			controller.enqueue(arrayStart(char));
			this.state = {
				type: StateType.ARRAY_AFTER_START,
				parentState: this.state
			};
			return;
		}

		if (char === "]" && isState(this.state, [StateType.ARRAY_AFTER_START, StateType.ARRAY_AFTER_VALUE])) {
			controller.enqueue(arrayEnd(char));
			this.state = getStateAfterValue(this.state.parentState);
			return;
		}

		if (char === "," && isState(this.state, [StateType.ARRAY_AFTER_VALUE])) {
			controller.enqueue(comma(char));
			this.state = {
				type: StateType.ARRAY_AFTER_COMMA,
				parentState: this.state.parentState
			};
			return;
		}


		// Boolean/null

		if (BOOLEAN_OR_NULL_FIRST_CHARS.includes(char) && isState(this.state, this.options.multi ? VALUE_START_ALLOWED_MULTI : VALUE_START_ALLOWED)) {
			this.state = {
				type: StateType.BOOLEAN_OR_NULL,
				rawValue: char,
				parentState: this.state
			};
			return;
		}

		if (BOOLEAN_OR_NULL_CHARS.includes(char) && this.state.type === StateType.BOOLEAN_OR_NULL) {
			const rawValue = `${this.state.rawValue}${char}`;
			for (const [key, value] of Object.entries(BOOLEAN_OR_NULL)) {
				if (rawValue === key) {
					if (typeof value === "boolean") {
						controller.enqueue(booleanValue(value, rawValue));
					} else {
						controller.enqueue(nullValue(rawValue));
					}

					this.state = getStateAfterValue(this.state.parentState);
					return;
				}

				if (key.startsWith(rawValue)) {
					this.state.rawValue = rawValue;
					return;
				}
			}
		}


		// Strings

		if (char === "\"") {
			if (isState(this.state, this.options.multi ? VALUE_START_ALLOWED_MULTI : VALUE_START_ALLOWED)) {
				controller.enqueue(stringStart(StringRole.VALUE, char));
				this.state = {
					type: StateType.STRING,
					value: "",
					rawValue: "",
					role: StringRole.VALUE,
					parentState: this.state
				};
				return;
			}

			if (isState(this.state, KEY_START_ALLOWED)) {
				controller.enqueue(stringStart(StringRole.KEY, char));
				this.state = {
					type: StateType.STRING,
					value: "",
					rawValue: "",
					role: StringRole.KEY,
					parentState: this.state
				};
				return;
			}

			if (isState(this.state, [StateType.STRING])) {
				if (this.state.rawValue.length > 0) {
					controller.enqueue(stringChunk(this.state.value, this.state.role, this.state.rawValue));
				}

				controller.enqueue(stringEnd(this.state.role, char));
				this.state = getStateAfterValue(this.state.parentState);
				return;
			}
		}

		if (char === "\\" && isState(this.state, [StateType.STRING])) {
			this.state = {
				type: StateType.STRING_AFTER_BACKSLASH,
				rawValue: char,
				parentState: this.state
			};
			return;
		}

		if (Object.prototype.hasOwnProperty.call(STRING_ESCAPE_CHARS, char) && isState(this.state, [StateType.STRING_AFTER_BACKSLASH])) {
			this.state = {
				...this.state.parentState,
				value: `${this.state.parentState.value}${STRING_ESCAPE_CHARS[char as keyof typeof STRING_ESCAPE_CHARS]}`,
				rawValue: `${this.state.parentState.rawValue}${this.state.rawValue}${char}`
			};
			return;
		}

		if (char === "u" && isState(this.state, [StateType.STRING_AFTER_BACKSLASH])) {
			this.state = {
				type: StateType.STRING_AFTER_BACKSLASH_U,
				value: "",
				rawValue: `${this.state.rawValue}${char}`,
				parentState: this.state.parentState
			};
			return;
		}

		if (HEX_NUMBER_CHARS.includes(char) && isState(this.state, [StateType.STRING_AFTER_BACKSLASH_U])) {
			this.state.value += char;
			this.state.rawValue += char;
			if (this.state.value.length === 4) {
				this.state = {
					...this.state.parentState,
					value: `${this.state.parentState.value}${String.fromCharCode(parseInt(this.state.value, 16))}`,
					rawValue: `${this.state.parentState.rawValue}${this.state.rawValue}`
				};
			}
			return;
		}

		if (char.charCodeAt(0) >= 0x20 && isState(this.state, [StateType.STRING])) {
			this.state.value += char;
			this.state.rawValue += char;
			return;
		}


		// Numbers

		if (char === "-" && isState(this.state, this.options.multi ? VALUE_START_ALLOWED_MULTI : VALUE_START_ALLOWED)) {
			this.state = {
				type: StateType.NUMBER_MINUS,
				rawValue: char,
				parentState: this.state
			};
			return;
		}

		if ((char === "-" || char === "+") && this.state.type === StateType.NUMBER_E) {
			this.state = {
				type: StateType.NUMBER_E_PLUSMINUS,
				rawValue: `${this.state.rawValue}${char}`,
				parentState: this.state.parentState
			};
			return;
		}

		if (char === "." && this.state.type === StateType.NUMBER_DIGITS) {
			this.state = {
				type: StateType.NUMBER_POINT,
				rawValue: `${this.state.rawValue}${char}`,
				parentState: this.state.parentState
			};
			return;
		}

		if ((char === "e" || char === "E") && isState(this.state, [StateType.NUMBER_DIGITS, StateType.NUMBER_DECIMAL_DIGITS])) {
			this.state = {
				type: StateType.NUMBER_E,
				rawValue: `${this.state.rawValue}${char}`,
				parentState: this.state.parentState
			};
			return;
		}

		if (NUMBER_CHARS.includes(char)) {
			if (this.state.type === StateType.NUMBER_MINUS) {
				this.state = {
					type: StateType.NUMBER_DIGITS,
					rawValue: `${this.state.rawValue}${char}`,
					parentState: this.state.parentState
				};
				return;
			}

			if (this.state.type === StateType.NUMBER_POINT) {
				this.state = {
					type: StateType.NUMBER_DECIMAL_DIGITS,
					rawValue: `${this.state.rawValue}${char}`,
					parentState: this.state.parentState
				};
				return;
			}

			if (isState(this.state, [StateType.NUMBER_E, StateType.NUMBER_E_PLUSMINUS])) {
				this.state = {
					type: StateType.NUMBER_E_DIGITS,
					rawValue: `${this.state.rawValue}${char}`,
					parentState: this.state.parentState
				};
				return;
			}

			if (isState(this.state, [StateType.NUMBER_DIGITS, StateType.NUMBER_DECIMAL_DIGITS, StateType.NUMBER_E_DIGITS])) {
				this.state.rawValue += char;
				return;
			}

			if (isState(this.state, this.options.multi ? VALUE_START_ALLOWED_MULTI : VALUE_START_ALLOWED)) {
				this.state = {
					type: StateType.NUMBER_DIGITS,
					rawValue: char,
					parentState: this.state
				};
				return;
			}
		}


		// Whitespaces

		if (WHITESPACE_CHARS.includes(char) || (this.options.multi && isState(this.state, [StateType.START, StateType.END]) && RS_CHARS.includes(char))) {
			if (this.state.type === StateType.WHITESPACE) {
				this.state.rawValue += char;
				return;
			}

			if (isState(this.state, WHITESPACE_ALLOWED)) {
				this.state = {
					type: StateType.WHITESPACE,
					rawValue: char,
					parentState: this.state
				};
				return;
			}
		}


		throw new UnexpectedCharError(context);

	}

	/**
	 * Called at the end of the transformation of a chunk. Should flush partial values where applicable,
	 * in particular and incomplete strings or whitespaces can be emitted.
	 */
	protected handleChunkEnd(controller: TransformStreamDefaultController<JsonChunk>): void {
		const stringState = (
			this.state.type === StateType.STRING ? this.state :
			isState(this.state, [StateType.STRING_AFTER_BACKSLASH, StateType.STRING_AFTER_BACKSLASH_U]) ? this.state.parentState :
			undefined
		);
		if (stringState) {
			controller.enqueue(stringChunk(stringState.value, stringState.role, stringState.rawValue));
			stringState.rawValue = "";
			stringState.value = "";
		}

		if (this.state.type === StateType.WHITESPACE && this.state.rawValue.length > 0) {
			controller.enqueue(whitespace(this.state.rawValue));
			this.state.rawValue = "";
		}
	}

	/**
	 * Transforms an incoming chunk.
	 */
	protected override transform(chunk: string, controller: TransformStreamDefaultController<JsonChunk>): void {
		for (let i = 0; i < chunk.length; i++) {
			this.handleChar(controller, { char: chunk[i], position: this.lengthBeforeCurrentChunk + i });
		}
		this.lengthBeforeCurrentChunk += chunk.length;

		this.handleChunkEnd(controller);
	}

	/**
	 * Called when the end of the incoming stream is reached. Checks that a complete value has been emitted.
	 */
	protected override flush(controller: TransformStreamDefaultController<JsonChunk>): void {
		this.checkValueEnd(controller, undefined);

		if (this.state.type !== StateType.END && (!this.options.multi || this.state.type !== StateType.START)) {
			throw new PrematureEndError();
		}

		controller.terminate();
	}
}