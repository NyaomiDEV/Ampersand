import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import mermaid from "mermaid";
import { isDarkMode } from "../mode";

const mermaidExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	renderer: {
		code(token) {
			if(token.lang !== "mermaid")
				return false;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return h("div", { class: "mermaid-render", innerHTML: (token as any).renderResult.svg });
		}
	},
	async: true,
	async walkTokens(token){
		switch(token.type){
			case "code":
				if (token.lang === "mermaid") {
					mermaid.initialize({
						startOnLoad: false,
						theme: isDarkMode() ? "dark" : "neutral",
						darkMode: isDarkMode()
					});
					const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token.text)));
					// @ts-expect-error this is due to number to string conversion on map(); TODO: substitute with toHex()
					const hashHex = hash.map((b) => b.toString(16).padStart(2, "0")).join("");
					const result = await mermaid.render(`mermaid-render-${hashHex}`, token.text);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(token as any).renderResult = result;
				}
				break;
		}
	}
};

export default mermaidExtension;