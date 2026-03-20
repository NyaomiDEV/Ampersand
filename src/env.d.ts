/// <reference types="@rsbuild/core/types" />

import { Config, Mode } from "@ionic/core";

export declare global {
	module "*.md" {
		const text: string;
		export default text;
	}


	interface Window {
		isTauri: boolean | undefined,
		Ionic: {
			config: Config,
			mode: Mode
		}
	}
}
