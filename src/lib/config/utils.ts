function isObject(item: object): item is object {
	return (item && typeof item === "object" && !Array.isArray(item));
}

export function merge<T>(target: object, ...sources: (object | undefined)[]): T {
	sources = sources.filter(x => !!x);
	const source = sources.shift();
	if (!source) return target as T;

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				merge(target[key], source[key]);
			} else
				Object.assign(target, { [key]: source[key] });

		}
	}
	return merge(target, ...sources);
}

export function debounce<T extends unknown[]>(this: unknown, func: (...args: T) => void | Promise<void>, timeout: number): (...args: Parameters<typeof func>) => void {
	let timer: number;
	return (...args: Parameters<typeof func>) => {
		clearTimeout(timer);
		timer = setTimeout(() => func.apply(this, args), timeout);
	};
}