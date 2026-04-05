import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

function parseStyle(style: string) {
	return Object.fromEntries(style
		.trim()
		.split("\n")
		.map(x => {
			const i = x.indexOf(" ");
			return [
				x.slice(0, i),
				Object.fromEntries(
					x.slice(i+1).split(",").map(y => {
						const j = y.indexOf("=");
						return [y.slice(0, j), y.slice(j+1).split(":")];
					})
				)
			];
		}));
}

const customTableExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "custom-table",
			level: "block",
			start(src: string) { return src.match(/\+\+\+/)?.index; },
			tokenizer(src: string) {
				const rule = /^\+\+\+\n(.+?)\n---\n(.+?)\n\+\+\+(?:\n|$)/s;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "custom-table",
						raw: match[0],
						tableStyle: match[1],
						table: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const map = parseStyle(token.tableStyle);
				const cssStyle: Record<string, string> = {};

				for(const part in map){
					switch(part){
						case "th":
							if(map[part].bg)
								cssStyle["--markdown-th-bg"] = map[part].bg[0];
							if(map[part].fg)
								cssStyle["--markdown-th-fg"] = map[part].fg[0];
							break;
						case "td":
							if(map[part].bg)
								cssStyle["--markdown-td-bg"] = map[part].bg[0];
							if(map[part].fg)
								cssStyle["--markdown-td-fg"] = map[part].fg[0];
							break;
					}
				}

				return h("div",
					{
						class: "custom-table",
						style: cssStyle
					},
					token.tokens && token.tokens.length ? this.parser.parse(token.tokens) : token.table
				);
			}
		}
	]
};

export default customTableExtension;