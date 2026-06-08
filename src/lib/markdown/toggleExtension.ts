import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { IonToggle } from "@ionic/vue";
import { splitList } from "./utils";

const toggleExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "toggle",
			level: "block",
			start(src: string) { return src.match(/^\[toggle/)?.index; },
			tokenizer(src: string) {
				const rule = /^\[toggle=((?:true|false)(?::start|:end)?)\](.*?)\[\/toggle\]/;
				const match = rule.exec(src);
				if (match) {
					const values = splitList(match[1]);
					const enabled = values[0] === "true";
					let placement = "start";

					if (values[1] === "end") 
						placement = "end";

					const token = {
						type: "toggle",
						raw: match[0],
						enabled,
						placement,
						text: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				return h(
					IonToggle,
					{
						justify: "space-between",
						labelPlacement: token.placement,
						checked: token.enabled,
						onClick: (e: PointerEvent) => e.stopImmediatePropagation()
					},
					() => token.text.length
						? h("div", token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.text)
						: undefined
				);
			}
		}
	]
};

export default toggleExtension;