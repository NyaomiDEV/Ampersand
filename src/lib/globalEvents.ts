type GlobalEventMap = {
	"members:search": SearchEvent,
	"journal:search": SearchEvent
}

export interface SearchEvent extends CustomEvent {
	detail: {
		search: string
	}
}

interface GlobalEvents extends EventTarget {
	addEventListener<K extends keyof GlobalEventMap>(
		type: K,
		listener: (ev: GlobalEventMap[K]) => void,
		options?: boolean | AddEventListenerOptions
	): void;
	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: EventListenerOptions | boolean
	): void;
}

export const globalEvents: GlobalEvents = new EventTarget();