import { MarkedOptions, MarkedToken, Token, Renderer, Parser as MarkedParser, TextRenderer } from "marked";
import { renderer } from "./renderer.ts";
import { textRenderer } from "./textRenderer.ts";
import { h, isVNode, type VNode } from "vue";

/**
 * Parsing & Compiling
 */
export class Parser {
	options: MarkedOptions<(VNode | string)[], VNode | string>;
	renderer: Renderer<(VNode | string)[], VNode | string>;
	textRenderer: TextRenderer<string>;

	constructor(options?: MarkedOptions<(VNode | string)[], VNode | string>) {
		this.options = options ?? { renderer };
		this.textRenderer = textRenderer;
		this.renderer = this.options.renderer!;
		this.renderer.parser = this as unknown as MarkedParser<(VNode | string)[], VNode | string>;
	}

	/**
   * Static Parse Method
   */
	static parse(tokens: Token[], options?: MarkedOptions<(VNode | string)[], VNode | string>) {
		const parser = new Parser(options);
		return parser.parse(tokens);
	}

	/**
   * Static Parse Inline Method
   */
	static parseInline(tokens: Token[], options?: MarkedOptions<(VNode | string)[], VNode | string>) {
		const parser = new Parser(options);
		return parser.parseInline(tokens);
	}

	/**
   * Parse Loop
   */
	parse(tokens: Token[], _top = true) {
		const out: (VNode | string)[] = [];

		for (const anyToken of tokens) {
			const token = anyToken as MarkedToken;
			switch (token.type) {
				case "space": {
					out.push(this.renderer.space(token));
					break;
				}
				case "hr": {
					out.push(this.renderer.hr(token));
					break;
				}
				case "heading": {
					out.push(this.renderer.heading(token));
					break;
				}
				case "code": {
					out.push(this.renderer.code(token));
					break;
				}
				case "table": {
					out.push(this.renderer.table(token));
					break;
				}
				case "blockquote": {
					out.push(this.renderer.blockquote(token));
					break;
				}
				case "list": {
					out.push(this.renderer.list(token));
					break;
				}
				case "checkbox": {
					out.push(this.renderer.checkbox(token));
					break;
				}
				case "html": {
					out.push(this.renderer.html(token));
					break;
				}
				case "def": {
					out.push(this.renderer.def(token));
					break;
				}
				case "paragraph": {
					out.push(this.renderer.paragraph(token));
					break;
				}
				case "text": {
					out.push(this.renderer.text(token));
					break;
				}

				default: {
					// Run any renderer extensions for generic tokens
					if (this.options.extensions?.renderers?.[anyToken.type]) {
						const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this as unknown as MarkedParser<(VNode | string)[], VNode | string> }, anyToken);
						if (ret) {
							if (isVNode(ret)) out.push(ret);
							else out.push(h("span", { innerHTML: ret }));
							break;
						}
					}

					// if we didn't find anything to parse the token, return an error
					const errMsg = `Token with "${anyToken.type}" type was not found.`;
					if (this.options.silent) {
						console.error(errMsg);
						return [];
					} else 
						throw new Error(errMsg);
          
				}
			}
		}

		return out;
	}

	/**
   * Parse Inline Tokens
   */
	parseInline(tokens: Token[], renderer = this.renderer) {
		const out: (VNode | string)[] = [];

		for (const anyToken of tokens) {
			const token = anyToken as MarkedToken;

			switch (token.type) {
				case "escape": {
					out.push(renderer.text(token));
					break;
				}

				case "html": {
					out.push(renderer.html(token));
					break;
				}

				case "link": {
					out.push(renderer.link(token));
					break;
				}

				case "image": {
					out.push(renderer.image(token));
					break;
				}

				case "checkbox": {
					out.push(renderer.checkbox(token));
					break;
				}

				case "strong": {
					out.push(renderer.strong(token));
					break;
				}

				case "em": {
					out.push(renderer.em(token));
					break;
				}

				case "codespan": {
					out.push(renderer.codespan(token));
					break;
				}

				case "br": {
					out.push(renderer.br(token));
					break;
				}

				case "del": {
					out.push(renderer.del(token));
					break;
				}

				case "text": {
					out.push(renderer.text(token));
					break;
				}

				default: {
					// Run any renderer extensions
					if (this.options.extensions?.renderers?.[anyToken.type]) {
						const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this as unknown as MarkedParser<(VNode | string)[], VNode | string> }, anyToken);
						if (ret) {
							if (isVNode(ret)) out.push(ret);
							else out.push(h("span", { innerHTML: ret }));
							break;
						}
					}

					// if we didn't find anything to parse the token, return an error
					const errMsg = `Token with "${token.type}" type was not found.`;
					if (this.options.silent) {
						console.error(errMsg);
						return [];
					} else 
						throw new Error(errMsg);
          
				}
			}
		}

		return out;
	}
}
