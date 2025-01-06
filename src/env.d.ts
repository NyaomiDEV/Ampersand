/// <reference types="@rsbuild/core/types" />

export declare global {
	interface Window {
		isTauri: boolean | undefined,
		AmpersandNative: AmpersandNative
	}
}

export interface AmpersandNative {
	exitApp: () => void
}
