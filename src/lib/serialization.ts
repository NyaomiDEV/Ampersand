/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { isPlainObject } from "./util/misc";

export type SerializedMap<K, V> = {
	_meta: { type: "map"; };
	value: [K, V][];
};

export type SerializedSet<V> = {
	_meta: { type: "set"; },
	value: V[];
};

export type SerializedFile = {
	_meta: {
		type: "file",
		name: string,
		mimeType: string;
	},
	value: Uint8Array;
};

export type Serialized<T> =
	T extends Map<infer K, infer V> ? SerializedMap<K, V> :
	T extends Set<infer V> ? SerializedSet<V> :
	T extends File ? SerializedFile :
	T extends object ? { [K in keyof T]: Serialized<T[K]> }
	: T;

export function revive(value: any) {
	if (typeof value === "object" && value !== null && "_meta" in value) {
		switch (value._meta.type) {
			case "map":
				return new Map(value.value);
			case "set":
				return new Set(value.value);
			case "file": {
				if(typeof value.value === "string"){
					// old way
					const array = new Uint8Array(value.value.length);
					for (let i = 0; i < value.value.length; i++)
						array[i] = (value.value as string).charCodeAt(i);

					return new File(
						[array],
						value._meta.name,
						{
							type: value._meta.mimeType
						}
					);
				} else {
					// new way
					return new File(
						[value.value],
						value._meta.name,
						{
							type: value._meta.mimeType
						}
					);
				}
			}
			case "escaped-meta":
				return { ...value, _meta: value._meta.value };
		}
	}
	return value;
}

export async function replace(value: any) {
	if (typeof value !== "object" || value === null) return value;

	if (value instanceof Map) {
		return {
			_meta: { type: "map" },
			value: Array.from(value.entries()),
		};
	} else if (value instanceof Set) {
		return {
			_meta: { type: "set" },
			value: Array.from(value.values()),
		};
	} else if (value instanceof File) {			
		return {
			_meta: { type: "file", name: value.name, mimeType: value.type },
			value: await value.bytes()
		};
	} else if ("_meta" in value) {
		// escape "_meta" properties
		return {
			...value,
			_meta: {
				type: "escaped-meta",
				value: value._meta,
			},
		};
	}

	return value;
}

export function walk(obj: object, replacer: (obj: object) => object): object {
	const newVal = replacer(obj);
	if (typeof newVal !== "object" || newVal === null || newVal instanceof File) return newVal;

	if (Array.isArray(newVal)) {
		for (let i = 0; i < newVal.length; i++)
			newVal[i] = walk(newVal[i], replacer);
	} else if (newVal instanceof Map) {
		const _newMap = new Map();
		for (const k of newVal.keys())
			_newMap.set(walk(k, replacer), walk(newVal.get(k), replacer));
		return _newMap;
	} else if (newVal instanceof Set) 
		return [...newVal].map(x => walk(x, replacer));
	else {
		for (const k in newVal)
			newVal[k] = walk(newVal[k], replacer);
	}

	return newVal;
}

export async function walkAsync(obj: object, replacer: (obj: object) => Promise<object>): Promise<object> {
	const newVal = await replacer(obj);
	if (typeof newVal !== "object" || newVal === null || newVal instanceof File) return newVal;

	if (Array.isArray(newVal)) {
		for (let i = 0; i < newVal.length; i++)
			newVal[i] = await walkAsync(newVal[i], replacer);
	} else if (newVal instanceof Map) {
		const _newMap = new Map();
		for (const k of newVal.keys())
			_newMap.set(await walkAsync(k, replacer), await walkAsync(newVal.get(k), replacer));
		return _newMap;
	} else if (newVal instanceof Set)
		return await Promise.all([...newVal].map(x => walkAsync(x, replacer)));
	else {
		for (const k in newVal)
			newVal[k] = await walkAsync(newVal[k], replacer);
	}

	return newVal;
}

export function deleteNull(obj){
	if (Array.isArray(obj)) {
		return obj
			.filter(x => x !== null && typeof x !== "undefined")
			.map(x => deleteNull(x));
	} else if (isPlainObject(obj)){
		return Object.fromEntries(
			Object.entries(obj)
				.filter(([_, v]) => v !== undefined && v !== null)
				.map(([k, v]) => [k, deleteNull(v)])
		);
	}

	return obj;
}

export function deleteFile(obj) {
	if (Array.isArray(obj)) {
		return obj
			.filter(x => !(x instanceof File))
			.map(x => deleteFile(x));
	} else if (isPlainObject(obj)){
		return Object.fromEntries(
			Object.entries(obj)
				.filter(([_, v]) => !(v instanceof File))
				.map(([k, v]) => [k, deleteFile(v)])
		);
	}
		
	return obj;
};