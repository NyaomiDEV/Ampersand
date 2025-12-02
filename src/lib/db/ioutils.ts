import { Channel } from "@tauri-apps/api/core";
import { invokePlugin } from "../native/plugin";

type Progress = {
	progress: number,
	finished: boolean;
};

export function exportDatabaseToBinary() {
	// Tauri Channel for progress
	const progressChannel = new Channel<Progress>();

	// EventTarget for presentation
	const progress = new EventTarget();

	progressChannel.onmessage = (e) => {
		progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: e.progress } }));
		if (e.finished)
			progress.dispatchEvent(new Event("finish"));
	};
	progress.dispatchEvent(new Event("start"));
	const dbPromise = invokePlugin<boolean>("db_export", { progressChannel });
	return { progress, dbPromise };
}

// Ideally, Rust should call the OS to get the path, we don't want to make the frontend do much anymore
// TODO: Drop _data parameter
export function importDatabaseFromBinary(_data: unknown) {
	// Tauri Channel for progress
	const progressChannel = new Channel<Progress>();

	// EventTarget for presentation
	const progress = new EventTarget();

	progressChannel.onmessage = (e) => {
		progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: e.progress } }));
		if (e.finished)
			progress.dispatchEvent(new Event("finish"));
	};
	progress.dispatchEvent(new Event("start"));
	const dbPromise = invokePlugin<boolean>("db_import", { progressChannel });
	return { progress, dbPromise };
}
