import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import Mermaid from "../../components/Mermaid.vue";

const mermaidExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	renderer: {
		code(token) {
			if(token.lang !== "mermaid")
				return false;

			return h(Mermaid, { directives: token.text });
		}
	},
};

export default mermaidExtension;