import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import dayjs from "dayjs";
import { getLocaleInfo } from "../i18n";

const timestampExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	extensions: [
		{
			name: "timestamp",
			level: "inline",
			start(src: string) { return src.match(/<t/)?.index; },
			tokenizer(src: string) {
				const rule = /^<t:(\d+?):([FfDdMmYyKkGgTt])>/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: "timestamp",
						raw: match[0],
						timestamp: Number(match[1]) * 1000,
						format: match[2],
						tokens: []
					};
					return token;
				}
				return;
			},
			renderer(token) {
				const formats = {
					F: `LL, ${getLocaleInfo().lt}`,
					f: `ll, ${getLocaleInfo().lt}`,

					D: "LL",
					d: "L",

					M: "MMMM",
					m: "MMM",

					Y: "YYYY",
					y: "YY",

					K: "MMMM YYYY",
					k: "MMM YY",

					G: "D MMMM",
					g: "D MMM",

					T: getLocaleInfo().lts,
					t: getLocaleInfo().lt,
				};

				return h("span", {
					class: "timestamp",
					"data-timestamp": token.timestamp
				}, dayjs(token.timestamp).format(formats[token.format]));
			}
		}
	]
};

export default timestampExtension;