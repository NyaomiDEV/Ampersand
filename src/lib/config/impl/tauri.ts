// TODO: ACTUAL TAURI IMPL
import { get as lGet, set as lSet } from './localStorage';

export function get(key: string){
	return lGet(key);	
}

export function set(key: string, value: any) {
	return lSet(key, value);	
}
