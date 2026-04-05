/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, h, type VNode } from "vue";
import { Marked } from "marked";
import vueExtension from "./vue/vue";
import { IonCheckbox } from "@ionic/vue";

import mentionExtension from "./mentionExtension";
import spoilerExtension from "./spoilerExtension";
import timestampExtension from "./timestampExtension";
import colorExtension from "./colorExtension";
import superscriptExtension from "./superscriptExtension";
import subscriptExtension from "./subscriptExtension";
import underlineExtension from "./underlineExtension";
import highlightExtension from "./highlightExtension";
import centerExtension from "./centerExtension";
import linebreakExtension from "./linebreakExtension";
import textColorFgExtension from "./textColorFgExtension";
import textColorBgExtension from "./textColorBgExtension";
import textShadowExtension from "./textShadowExtension";
import textBorderExtension from "./textBorderExtension";
import blurExtension from "./blurExtension";
import marqueeExtension from "./marqueeExtension";
import fontSizeExtension from "./fontSizeExtension";
import calloutExtension from "./calloutExtension";
import svgExtension from "./svgExtension";
import mermaidExtension from "./mermaidExtension";
import textDecorationExtension from "./textDecoration";
import startExtension from "./startExtension";
import endExtension from "./endExtension";
import fontFamilyExtension from "./fontFamilyExtension";
import emojiExtension from "./emojiExtension";
import MarkdownImage from "../../components/MarkdownImage.vue";
import MarkdownLink from "../../components/MarkdownLink.vue";
import animationExtension from "./animationExtension";
import positionExtension from "./positionExtension";
import rotationExtension from "./rotationExtension";
import customTableExtension from "./customTableExtension";

export function useMarked(){
	const marked = new Marked<(VNode | string)[], VNode | string>();

	// Our configuration
	marked.use({
		async: true,
		gfm: true,
		breaks: true,
	});

	// Use Vue3
	marked.use(vueExtension);

	// Override default tokenizers/renderers
	marked.use({
		tokenizer: {
			del(src: string) {
				const regex = /^(~~)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/;
				const cap = regex.exec(src);
				if (cap) {
					return {
						type: "del",
						raw: cap[0],
						text: cap[2],
						tokens: this.lexer.inlineTokens(cap[2]),
					};
				}
				return;
			}
		},
		renderer: {
			image(token) {
				// checking for lone surrogates the shitty way
				try {
					const href = encodeURI(token.href).replace(/%25/g, "%");
					return h(MarkdownImage, {
						src: href,
						alt: token.text,
						title: token.title || undefined,
						width: (token as any).width,
						height: (token as any).height,
					});
				} catch (_e) {
					return h(Text, token.text);
				}
			},
			link(token) {
				const inlineParsed = this.parser.parseInline(token.tokens);
				// checking for lone surrogates the shitty way
				try {
					const href = encodeURI(token.href).replace(/%25/g, "%");
					return h(MarkdownLink, { href, title: token.title || undefined }, () => inlineParsed);
				} catch (_e) {
					return h(Fragment, inlineParsed);
				}
			},
			checkbox({ checked }) {
				return h(IonCheckbox, { checked, disabled: true });
			}
		},
		walkTokens(token) {
			switch (token.type) {
				case "image": {
					// let's match the size tokens
					const matches = /#(-?\d+?x-?\d+?)$/.exec(token.href);
					if (matches) {
						const [w, h] = matches[1].split("x").map(x => Number(x));
						if (w >= 0) (token as any).width = w;
						if (h >= 0) (token as any).height = h;
						token.href = token.href.replace(/#(-?\d+?x-?\d+?)$/, "");
					}
					break;
				}
			}
		},
	});

	// Start injecting our extensions
	marked.use(
		svgExtension,
		mentionExtension,
		spoilerExtension,
		timestampExtension,
		colorExtension,
		textColorFgExtension,
		textColorBgExtension,
		textShadowExtension,
		textBorderExtension,
		textDecorationExtension,
		fontSizeExtension,
		superscriptExtension,
		subscriptExtension,
		underlineExtension,
		highlightExtension,
		centerExtension,
		startExtension,
		endExtension,
		blurExtension,
		linebreakExtension,
		marqueeExtension,
		calloutExtension,
		fontFamilyExtension,
		mermaidExtension,
		emojiExtension,
		animationExtension,
		positionExtension,
		rotationExtension,
		customTableExtension
	);

	return marked;
}
