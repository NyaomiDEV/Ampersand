import { h } from "vue";
import { MarkedExtension } from "../../../vendor/marked-vue/marked";
import dayjs from "dayjs";
import { appConfig } from "../config";

const timestampExtension: MarkedExtension = {
	extensions: [
		{
			name: "timestamp",
			level: "inline",
			start(src: string) { return src.match(/</)?.index; },
			tokenizer(src: string) {
				const rule = /^<t:(\d+?):([FfDdTt])>/;
				const match = rule.exec(src);
				if (match) {
					const token = {
						type: 'timestamp',
						raw: match[0],
						timestamp: Number(match[1]),
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