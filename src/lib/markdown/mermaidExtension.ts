import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import mermaid from "mermaid";
import { isDarkMode } from "../mode";
import { getMaterialColors } from "../theme";
import { hexFromArgb } from "@material/material-color-utilities";

const mermaidExtension: MarkedExtension<(VNode | string)[], VNode | string> = {
	renderer: {
		code(token) {
			if(token.lang !== "mermaid")
				return false;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return h("div", { class: "mermaid-render", innerHTML: (token as any).renderResult });
		}
	},
	async: true,
	async walkTokens(token){
		switch(token.type){
			case "code":
				if (token.lang === "mermaid") {
					const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token.text)));
					// @ts-expect-error this is due to number to string conversion on map(); TODO: substitute with toHex()
					const hashHex = hash.map((b) => b.toString(16).padStart(2, "0")).join("");

					const theme = new Map<string, string>(getMaterialColors().entries().map(x => [x[0], hexFromArgb(x[1])]));

					const themeVariables: Record<string, unknown> = {
						darkMode: isDarkMode(),
						background: theme.get("surface"),
						lineColor: theme.get("outline"),
						textColor: theme.get("on_surface"),
						primaryColor: theme.get("surface_container_high"),
						primaryTextColor: theme.get("on_surface"),
						primaryBorderColor: theme.get("outline"),
						secondaryColor: theme.get("surface_container"),
						secondaryTextColor: theme.get("on_surface"),
						secondaryBorderColor: theme.get("outline"),
						tertiaryColor: theme.get("surface_container_low"),
						tertiaryTextColor: theme.get("on_surface"),
						tertiaryBorderColor: theme.get("outline"),
						noteBkgColor: theme.get("surface_container_highest"),
						noteTextColor: theme.get("on_surface"),
						noteBorderColor: theme.get("outline"),
						errorBkgColor: theme.get("error"),
						errorTextColor: theme.get("on_error"),

						activationBkgColor: theme.get("surface_container_highest"),
						activationBorderColor: theme.get("outline"),

						pie1: theme.get("on_primary_container"),
						pie2: theme.get("on_secondary_container"),
						pie3: theme.get("on_tertiary_container"),
						pie4: theme.get("on_error_container"),
						pie5: theme.get("error"),
						pieTitleTextColor: theme.get("on_surface"),
						pieSectionTextColor: theme.get("surface"),
						pieStrokeColor: theme.get("outline"),
						pieOuterStrokeColor: theme.get("outline"),

					};

					mermaid.initialize({
						startOnLoad: false,
						theme: "base",
						darkMode: isDarkMode(),
						fontFamily: "var(--ion-font-family)",
						securityLevel: "strict",
						deterministicIds: true,
						deterministicIDSeed: hashHex,
						themeVariables
					});

					const result = await mermaid.render(`mermaid-render-${hashHex}`, token.text);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(token as any).renderResult = result.svg;
				}
				break;
		}
	}
};

export default mermaidExtension;