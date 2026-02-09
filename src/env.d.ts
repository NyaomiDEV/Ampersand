/// <reference types="@rsbuild/core/types" />

import { Config, Mode } from "@ionic/core";

export declare global {
	interface Window {
		isTauri: boolean | undefined,
		Ionic: {
			config: Config,
			mode: Mode
		}
	}
}
