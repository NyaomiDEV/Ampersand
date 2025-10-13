import type { MarkedExtension } from "marked";
import { Parser } from "./parser.ts";
import { renderer } from "./renderer.ts";
import { VNode } from "vue";

const vueExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	hooks: {
		provideParser() {
			return this.block ? Parser.parse : Parser.parseInline;
		},
	},
	renderer,
};

export default vueExtension;