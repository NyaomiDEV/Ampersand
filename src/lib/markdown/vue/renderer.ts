import { Fragment, h, Text, type VNode } from "vue";
import { MarkedOptions, Renderer, Parser, Tokens } from "marked";

const other = {
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,

	percentDecode: /%25/g,

	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
};

const escapeReplacements: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

function escape(html: string, encode?: boolean) {
	if (encode) {
		if (other.escapeTest.test(html)) 
			return html.replace(other.escapeReplace, getEscapeReplacement);
	} else {
		if (other.escapeTestNoEncode.test(html)) 
			return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
	}

	return html;
}

function cleanUrl(href: string){
	try {
		href = encodeURI(href).replace(other.percentDecode, "%");
	} catch {
		return null;
	}
	return href;
}

export const renderer: Renderer<(VNode | string)[], VNode | string> = {
	options: null as unknown as MarkedOptions<(VNode | string)[], VNode | string>,
	parser: null as unknown as Parser<(VNode | string)[], VNode | string>,

	space(_token: Tokens.Space): VNode {
		return h(Text, "");
	},

	code({ text, lang, escaped }: Tokens.Code): VNode {
		const langString = (lang || "").match(other.notSpaceStart)?.[0];

		const code = `${text.replace(other.endingNewline, "")}\n`;

		if (!langString) {
			return h("pre", {},
				h("code", { innerHTML: escaped ? code : escape(code, true) }),
			);
		}

		return h("pre", { class: `code--${escape(langString, true)}` },
			h("code", {
				class: `code--${escape(langString, true)}`,
				innerHTML: escaped ? code : escape(code, true),
			}),
		);
	},

	blockquote({ tokens }: Tokens.Blockquote): VNode {
		const body = this.parser.parse(tokens);
		return h("blockquote", {}, body);
	},

	html(token: Tokens.HTML | Tokens.Tag): VNode {
		return h(Text, token.text);
	},

	def(_token) {
		return h(Text, "");
	},

	heading({ tokens, depth }: Tokens.Heading): VNode {
		return h(`h${depth}`, this.parser.parseInline(tokens));
	},

	hr(_token: Tokens.Hr): VNode {
		return h("hr");
	},

	list(token: Tokens.List): VNode {
		const ordered = token.ordered;
		const start = token.start;

		const type = ordered ? "ol" : "ul";
		return h(type, { start: ordered && start !== 1 ? start : undefined }, token.items.map(x => this.listitem(x)));
	},

	listitem(item: Tokens.ListItem): VNode {
		return h("li", h("span", {}, this.parser.parse(item.tokens)));
	},

	checkbox({ checked }: Tokens.Checkbox): VNode {
		return h("input", { type: "checkbox", checked, disabled: true });
	},

	paragraph({ tokens }: Tokens.Paragraph): VNode {
		return h("p", this.parser.parseInline(tokens));
	},

	table(token: Tokens.Table): VNode {
		const header = renderer.tablerow({ text: token.header.map(x => renderer.tablecell.bind(this)(x)) });
		const body = token.rows.map(row =>
			renderer.tablerow({ text: row.map(cell => renderer.tablecell.bind(this)(cell)) }),
		);

		return h("table", {}, [header, body]);
	},

	tablerow({ text }) {
		return h("tr", text);
	},

	tablecell(token: Tokens.TableCell): VNode {
		const type = token.header ? "th" : "td";
		return h(type, { align: token.align }, this.parser.parseInline(token.tokens));
	},

	/**
	 * span level renderer
	 */
	strong({ tokens }: Tokens.Strong): VNode {
		return h("strong", this.parser.parseInline(tokens));
	},

	em({ tokens }: Tokens.Em): VNode {
		return h("em", this.parser.parseInline(tokens));
	},

	codespan({ text }: Tokens.Codespan): VNode {
		return h("code", text);
	},

	br(_token: Tokens.Br): VNode {
		return h("br");
	},

	del({ tokens }: Tokens.Del): VNode {
		return h("del", this.parser.parseInline(tokens));
	},

	link({ href, title, tokens }: Tokens.Link): VNode {
		const inlineParsed = this.parser.parseInline(tokens);
		const cleanHref = cleanUrl(href);
		if (cleanHref === null) 
			return h(Fragment, inlineParsed);
		
		href = cleanHref;
		return h("a", { href, title }, inlineParsed);
	},

	image({ href, title, text, tokens }: Tokens.Image): VNode {
		if (tokens) 
			text = (this.parser.parseInline(tokens, this.parser.textRenderer) as string[]).join("");
		const cleanHref = cleanUrl(href);
		if (cleanHref === null) 
			return h(Text, text);
		
		href = cleanHref;

		return h("img", { src: href, alt: text, title });
	},

	text(token: Tokens.Text | Tokens.Escape): VNode {
		return "tokens" in token && token.tokens
			? h(Fragment, this.parser.parseInline(token.tokens))
			: h(Text, token.text);
	},
};
