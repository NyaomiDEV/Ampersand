/** A JavaScript value that can be stringified to JSON. */
export type JsonValue = { [key: string]: JsonValue } | Array<JsonValue> | string | number | boolean | null;

export enum JsonChunkType {
	/** A whitespace that appears between JSON tokens and has no semantic meaning. */
	WHITESPACE = "WHITESPACE",

	/** A comma that separates two array/object items. */
	COMMA = "COMMA",

	/** A colon that separates an object key from its value. */
	COLON = "COLON",

	/**
	 * The start of an object, represented by a curly open bracket. Will be followed by zero or more properties, each one represented
	 * by a string key (one STRING_KEY_START, zero or more STRING_KEY_CHUNKs, one STRING_KEY_END) for the key, a
	 * COLON, a series of chunks for the value and a COMMA (except for the last property); and finally an OBJECT_END.
	 */
	OBJECT_START = "OBJECT_START",

	/** The end of an object, represented by a curly close bracket. */
	OBJECT_END = "OBJECT_END",

	/**
	 * The start of an array, represented by a square open bracket. Will be followed by zero or more chunks representing the values,
	 * each followed by a COMMA (except the last one); and finally an ARRAY_END.
	 */
	ARRAY_START = "ARRAY_START",

	/** The end of an array, represented by a square close bracket. */
	ARRAY_END = "ARRAY_END",

	/**
	 * The start of a string, represented by a double quote. Will be followed by zero or more STRING_CHUNKs and finally
	 * a STRING_END.
	 */
	STRING_START = "STRING_START",

	/**
	 * A section of a string value. Unicode characters are always fully included, so an escape value like \uffff will never span across multiple chunks.
	 */
	STRING_CHUNK = "STRING_CHUNK",

	/** The end of a string value, represented by a double quote. */
	STRING_END = "STRING_END",

	/** A number. May be positive/negative and an integer/float, and the raw value can have an exponent. */
	NUMBER_VALUE = "NUMBER_VALUE",

	/** A boolean, either true or false. */
	BOOLEAN_VALUE = "BOOLEAN_VALUE",

	/** A null value. */
	NULL_VALUE = "NULL_VALUE"
}

export enum StringRole {
	/** A string used as a property key inside an object. */
	KEY = "KEY",
	/** A string used as a value. */
	VALUE = "VALUE"
}

export type JsonChunk<Type extends JsonChunkType = JsonChunkType> = Extract<(
	| { type: JsonChunkType.WHITESPACE }
	| { type: JsonChunkType.COMMA }
	| { type: JsonChunkType.COLON }
	| { type: JsonChunkType.OBJECT_START }
	| { type: JsonChunkType.OBJECT_END }
	| { type: JsonChunkType.ARRAY_START }
	| { type: JsonChunkType.ARRAY_END }
	| { type: JsonChunkType.STRING_START; role: StringRole }
	| {
		type: JsonChunkType.STRING_CHUNK;
		role: StringRole;
		/** The string value of the string value, without quotes and with backslash escapes resolved. */
		value: string;
	}
	| { type: JsonChunkType.STRING_END; role: StringRole }
	| { type: JsonChunkType.NUMBER_VALUE; value: number }
	| { type: JsonChunkType.BOOLEAN_VALUE; value: boolean }
	| { type: JsonChunkType.NULL_VALUE; value: null }
) & {
	/** The raw JSON code for this chunk. The concatenated rawValues of all chunks form a valid JSON value. */
	rawValue: string;
}, { type: Type }>;

export function whitespace(rawValue: string): JsonChunk<JsonChunkType.WHITESPACE> {
	return {
		type: JsonChunkType.WHITESPACE,
		rawValue
	};
}

export function comma(rawValue = ","): JsonChunk<JsonChunkType.COMMA> {
	return {
		type: JsonChunkType.COMMA,
		rawValue
	};
}

export function colon(rawValue = ":"): JsonChunk<JsonChunkType.COLON> {
	return {
		type: JsonChunkType.COLON,
		rawValue
	};
}

export function objectStart(rawValue = "{"): JsonChunk<JsonChunkType.OBJECT_START> {
	return {
		type: JsonChunkType.OBJECT_START,
		rawValue
	};
}

export function objectEnd(rawValue = "}"): JsonChunk<JsonChunkType.OBJECT_END> {
	return {
		type: JsonChunkType.OBJECT_END,
		rawValue
	};
}

export function arrayStart(rawValue = "["): JsonChunk<JsonChunkType.ARRAY_START> {
	return {
		type: JsonChunkType.ARRAY_START,
		rawValue
	};
}

export function arrayEnd(rawValue = "]"): JsonChunk<JsonChunkType.ARRAY_END> {
	return {
		type: JsonChunkType.ARRAY_END,
		rawValue
	};
}

export function stringStart(role = StringRole.VALUE, rawValue = "\""): JsonChunk<JsonChunkType.STRING_START> {
	return {
		type: JsonChunkType.STRING_START,
		role,
		rawValue
	};
}

export function stringChunk(value: string, role = StringRole.VALUE, rawValue?: string): JsonChunk<JsonChunkType.STRING_CHUNK> {
	return {
		type: JsonChunkType.STRING_CHUNK,
		role,
		value,
		rawValue: rawValue ?? JSON.stringify(value).slice(1, -1)
	};
}

export function stringEnd(role = StringRole.VALUE, rawValue = "\""): JsonChunk<JsonChunkType.STRING_END> {
	return {
		type: JsonChunkType.STRING_END,
		role,
		rawValue
	};
}

export function numberValue(value: number, rawValue?: string): JsonChunk<JsonChunkType.NUMBER_VALUE> {
	return {
		type: JsonChunkType.NUMBER_VALUE,
		value,
		rawValue: rawValue ?? JSON.stringify(value)
	};
}

export function booleanValue(value: boolean, rawValue?: string): JsonChunk<JsonChunkType.BOOLEAN_VALUE> {
	return {
		type: JsonChunkType.BOOLEAN_VALUE,
		value,
		rawValue: rawValue ?? JSON.stringify(value)
	};
}

export function nullValue(rawValue = "null"): JsonChunk<JsonChunkType.NULL_VALUE> {
	return {
		type: JsonChunkType.NULL_VALUE,
		value: null,
		rawValue
	};
}