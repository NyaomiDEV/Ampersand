/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function revive(_key: string, value: any, errorCallback?: (error: Error) => void) {
	if (typeof value === "object" && value !== null) {
		if ("_meta" in value) {
			if (value._meta.type === "map") 
				return new Map(value.value);
			else if (value._meta.type === "set") 
				return new Set(value.value);
			else if (value._meta.type === "escaped-meta") {
				return {
					...value,
					_meta: value._meta.value,
				};
			} else if (value._meta.type === "file") {
				const array = new Uint8Array(value.value.length);
				for (let i = 0; i < value.value.length; i++) 
					array[i] = (value.value as string).charCodeAt(i);
				
				return new File(
					[array],
					value._meta.name,
					{
						lastModified: value._meta.lastModified,
						type: value._meta.mimeType
					}
				);
			} else {
				errorCallback?.(
					new Error("Unexpected meta type: " + value._meta, {
						cause: value._meta,
					})
				);
			}
		}
	}
	return value;
}

export function replace(_key: string, value: any) {
	if (typeof value === "object" && value !== null) {
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
			const req = new XMLHttpRequest();
			req.overrideMimeType("text/plain; charset=x-user-defined");
			req.open("GET", URL.createObjectURL(value), false);
			req.send();
			if (req.status !== 200 && req.status !== 0) 
				throw new Error("Bad File access: " + req.status);
			
			return {
				_meta: { type: "file", name: value.name, lastModified: value.lastModified, mimeType: value.type },
				value: req.responseText
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
	}
	return value;
}