import { h } from "vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";
import dayjs from "dayjs";
import { appConfig } from "../config";

const timestampExtension: MarkedExtension = {
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
						type: 'timestamp',
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
					F: `LL, ${appConfig.locale.twelveHourClock ? 'hh:mm A' : "HH:mm"}`,
					f: `ll, ${appConfig.locale.twelveHourClock ? 'hh:mm A' : "HH:mm"}`,

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

					T: appConfig.locale.twelveHourClock ? "hh:mm:ss A" : "HH:mm:ss",
					t: appConfig.locale.twelveHourClock ? "hh:mm A" : "HH:mm",
				};

				return h('span', {
					class: "timestamp",
					"data-timestamp": token.timestamp
				}, dayjs(token.timestamp).format(formats[token.format]));
			}
		}
	]
};

export default timestampExtension;