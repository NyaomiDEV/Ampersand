import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";

function parseStyle(style: string) {
	return Object.fromEntries(style
		.trim()
		.split("\n")
		.map(x => {
			const i = x.indexOf(" ");
			return [
				x.slice(0, i).trim(),
				Object.fromEntries(
					x.slice(i+1).trim().split(";").map(y => {
						const j = y.indexOf("=");
						return [y.slice(0, j).trim(), y.slice(j+1).trim().split(":").map(z => z.trim())];
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
						case "table":
							if(map[part].collapse?.[0] === "false") 
								cssStyle["--markdown-border-collapse"] = "separate";

							if(map[part].spacing?.length)
								cssStyle["--markdown-border-spacing"] = map[part].spacing[0];

							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-table-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-table-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-table-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-table-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-table-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-table-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-table-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-table-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-table-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-table-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-table-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-table-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-table-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-table-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-table-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-table-bt-left"] = map[part].bt[3];
										break;
								}
							}
							break;

						case "header":
							if(map[part].bg)
								cssStyle["--markdown-th-bg"] = map[part].bg[0];
							if(map[part].fg)
								cssStyle["--markdown-th-fg"] = map[part].fg[0];
							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-th-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-th-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-th-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-th-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-th-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-th-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-th-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-th-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-th-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-th-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-th-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-th-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-th-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-th-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-th-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-th-bt-left"] = map[part].bt[3];
										break;
								}
							}
							break;

						case "cell":
							if(map[part].bg)
								cssStyle["--markdown-td-bg"] = map[part].bg[0];
							if(map[part].fg)
								cssStyle["--markdown-td-fg"] = map[part].fg[0];
							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-td-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-td-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-td-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-td-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-td-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-td-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-td-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-td-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-td-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-td-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-td-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-td-bt-left"] = map[part].bt[3];
										break;
								}
							}
							break;

						case "first-col":
							if(map[part].bg)
								cssStyle["--markdown-first-col-bg"] = map[part].bg[0];
							if(map[part].fg)
								cssStyle["--markdown-first-col-fg"] = map[part].fg[0];
							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-first-col-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-first-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-col-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-first-col-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-first-col-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-first-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-col-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-first-col-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-first-col-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-first-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-col-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-first-col-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-first-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-col-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-first-col-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-first-col-bt-left"] = map[part].bt[3];
										break;
								}
							} 
							break;

						case "odd-cell":
							if(map[part].bg)
								cssStyle["--markdown-odd-td-bg"] = map[part].bg[0];
							if(map[part].fg)
								cssStyle["--markdown-odd-td-fg"] = map[part].fg[0];
							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-odd-td-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-odd-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-odd-td-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-odd-td-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-odd-td-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-odd-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-odd-td-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-odd-td-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-odd-td-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-odd-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-odd-td-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-odd-td-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-odd-td-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-odd-td-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-odd-td-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-odd-td-bt-left"] = map[part].bt[3];
										break;
								}
							}
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