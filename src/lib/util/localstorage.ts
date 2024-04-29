export function set(key: string, value: any){
	return window.localStorage.setItem(key, JSON.stringify(value));
}

export function get(key: string): any {
	return JSON.parse(window.localStorage.getItem(key) ?? "null");
}

export function keyFromIndex(index: number): any {
	return window.localStorage.key(index);
}

export function remove(key: string) {
	return window.localStorage.removeItem(key);
}

export function length(): number {
	return window.localStorage.length;
}

export function clear() {
	return window.localStorage.clear();
}

export function setCompound(rootKey: string, value: any) {
	for(const key of Object.getOwnPropertyNames(value)){
		const currentKey = rootKey + "." + key;

		if (typeof value[key] === 'object' && !Array.isArray(value[key]) && value[key] !== null){
			setCompound(currentKey, value[key]);
			continue;
		}

		set(currentKey, value);
	}
}

export function getCompound(rootKey: string): any {
	const obj: any = {};
	for(let i = 0; i < window.localStorage.length; i++){
		const key = window.localStorage.key(i);
		const keyArray = key?.split(".");
		if(!key || !keyArray || keyArray[0] !== rootKey) continue;
		keyArray.shift();

		const value = get(key);
		
		let a = obj;
		for(let i = 0; i < keyArray.length; i++){
			if(i < keyArray.length - 1){
				if (!a[keyArray[i]])
					a[keyArray[i]] = {};
				a = a[keyArray[i]];
				continue;
			}

			a[keyArray[i]] = value;
		}
	}

	return obj;
}