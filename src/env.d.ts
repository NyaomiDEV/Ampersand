/// <reference types="@rsbuild/core/types" />

import { Config, Mode } from "@ionic/core"

export declare global {
	interface Window {
		isTauri: boolean | undefined,
		AmpersandNative: AmpersandNative,
		Ionic: {
			config: Config,
			mode: Mode
		}
	}
}

export interface AmpersandNative {
	exitApp: () => void,
	openFile: (path: string) => boolean
}
