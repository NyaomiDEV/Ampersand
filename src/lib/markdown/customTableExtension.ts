import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import { isLength, isPercentage, isBorder, isImage, isColor, splitBlockArguments, splitList } from "./utils";

const commonArgs = {
	bg: (values: string[]) => values.length === 1 && (isColor(values[0]) || isImage(values[0])),
	fg: (values: string[]) => values.length === 1 && isColor(values[0]),
	bt: (values: string[]) => !!values.length && values.length <= 4 && values.every(x => isBorder(x)),
	radius: (values: string[]) => !!values.length && values.join(":").split("/").length <= 2 && values.join(":").split("/").every(x => splitList(x).every(y => isLength(y) || isPercentage(y))),
};

const tableArgs = {
	...commonArgs,
	collapse: (values: string[]) => values.length === 1 && (values[0] === "true" || values[0] === "false"),
	spacing: (values: string[]) => !!values.length && values.length <= 2 && values.every(x => isLength(x)),
	empty: (values: string[]) => values.length === 1 && (values[0] === "show" || values[0] === "hide")
};

const tableParts = { "table": tableArgs, "header": commonArgs, "cell": commonArgs, "first-col": commonArgs, "last-col": commonArgs, "odd-cell": commonArgs, "first-row": commonArgs, "last-row": commonArgs };

const customTableExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "customTable",
			level: "block",
			start(src: string) { return src.match(/^\+\+\+/)?.index; },
			tokenizer(src: string) {
				const rule = /^\+\+\+\n(.+?)\n---\n(.+?)\n\+\+\+(?:\n|$)/s;
				const match = rule.exec(src);
				if (match) {
					const tableStyle = splitBlockArguments(match[1]);

					for(const part in tableStyle) {
						if (!Object.keys(tableParts).includes(part)) return;
						for(const key in tableStyle[part]){
							if (!Object.keys(tableParts[part]).includes(key)) return;
							// eslint-disable-next-line @typescript-eslint/no-unsafe-call
							if (!tableParts[part][key](tableStyle[part][key])) return;
						}
					}

					const token = {
						type: "customTable",
						raw: match[0],
						tableStyle,
						table: match[2],
						tokens: this.lexer.blockTokens(match[2])
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const map = token.tableStyle as Record<string, Record<string, string[]>>;
				const cssStyle: Record<string, string> = {};

				for(const part in map){
					switch(part){
						case "table":
							if(map[part].bg)
								cssStyle["--markdown-table-bg"] = map[part].bg[0];

							if (map[part].fg)
								cssStyle["--markdown-table-fg"] = map[part].fg[0];

							if(map[part].collapse?.[0] === "false") 
								cssStyle["--markdown-table-border-collapse"] = "separate";

							if(map[part].empty?.[0] === "hide") 
								cssStyle["--markdown-table-empty-cells"] = "hide";

							if(map[part].spacing?.length)
								cssStyle["--markdown-table-border-spacing"] = map[part].spacing[0];

							if(map[part].radius?.length)
								cssStyle["--markdown-table-border-radius"] = map[part].radius.join(" ");

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

							if(map[part].radius?.length)
								cssStyle["--markdown-th-radius"] = map[part].radius.join(" ");

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

							if(map[part].radius?.length)
								cssStyle["--markdown-td-radius"] = map[part].radius.join(" ");

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

							if(map[part].radius?.length)
								cssStyle["--markdown-first-col-radius"] = map[part].radius.join(" ");

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

						case "last-col":
							if(map[part].bg)
								cssStyle["--markdown-last-col-bg"] = map[part].bg[0];

							if(map[part].fg)
								cssStyle["--markdown-last-col-fg"] = map[part].fg[0];

							if(map[part].radius?.length)
								cssStyle["--markdown-last-col-radius"] = map[part].radius.join(" ");

							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-last-col-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-last-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-col-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-last-col-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-last-col-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-last-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-col-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-last-col-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-last-col-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-last-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-col-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-last-col-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-last-col-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-col-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-last-col-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-last-col-bt-left"] = map[part].bt[3];
										break;
								}
							} 
							break;

						case "odd-cell":
							if(map[part].bg)
								cssStyle["--markdown-odd-td-bg"] = map[part].bg[0];

							if(map[part].fg)
								cssStyle["--markdown-odd-td-fg"] = map[part].fg[0];

							if(map[part].radius?.length)
								cssStyle["--markdown-odd-td-radius"] = map[part].radius.join(" ");

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

						case "first-row":
							if(map[part].bg)
								cssStyle["--markdown-first-row-bg"] = map[part].bg[0];

							if(map[part].fg)
								cssStyle["--markdown-first-row-fg"] = map[part].fg[0];

							if(map[part].radius?.length)
								cssStyle["--markdown-first-row-radius"] = map[part].radius.join(" ");

							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-first-row-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-first-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-row-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-first-row-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-first-row-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-first-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-row-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-first-row-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-first-row-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-first-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-row-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-first-row-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-first-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-first-row-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-first-row-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-first-row-bt-left"] = map[part].bt[3];
										break;
								}
							}
							break;

						case "last-row":
							if(map[part].bg)
								cssStyle["--markdown-last-row-bg"] = map[part].bg[0];

							if(map[part].fg)
								cssStyle["--markdown-last-row-fg"] = map[part].fg[0];

							if(map[part].radius?.length)
								cssStyle["--markdown-last-row-radius"] = map[part].radius.join(" ");

							if(map[part].bt) {
								switch(map[part].bt.length) {
									case 1:
										cssStyle["--markdown-last-row-bt-left"] = map[part].bt[0];
										cssStyle["--markdown-last-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-row-bt-right"] = map[part].bt[0];
										cssStyle["--markdown-last-row-bt-bottom"] = map[part].bt[0];
										break;
									case 2:
										cssStyle["--markdown-last-row-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-last-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-row-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-last-row-bt-bottom"] = map[part].bt[0];
										break;
									case 3:
										cssStyle["--markdown-last-row-bt-left"] = map[part].bt[1];
										cssStyle["--markdown-last-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-row-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-last-row-bt-bottom"] = map[part].bt[2];
										break;
									case 4:
										cssStyle["--markdown-last-row-bt-top"] = map[part].bt[0];
										cssStyle["--markdown-last-row-bt-right"] = map[part].bt[1];
										cssStyle["--markdown-last-row-bt-bottom"] = map[part].bt[2];
										cssStyle["--markdown-last-row-bt-left"] = map[part].bt[3];
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