import { h, type VNode } from "vue";
import { MarkedExtension } from "marked";
import mermaid from "mermaid";
import { isDarkMode } from "../mode";

const themeCSS = `
.error-icon {
	fill: rgb(var(--md3-on-error));
}

.error-text {
	fill: rgb(var(--md3-on-error));
	stroke: rgb(var(--md3-on-error));
}

.marker {
	fill: rgb(var(--md3-on-surface));
	stroke: rgb(var(--md3-on-surface));

	.cross, &.aggregation, &.extension, &.composition {
		stroke: rgb(var(--md3-on-surface)) !important;
	}

	&.composition {
		fill: rgb(var(--md3-on-surface)) !important;
	}
}

span {
	color: rgb(var(--md3-on-surface));
}

.chart-title text, .left-axis .title text {
	fill: rgb(var(--md3-on-surface));
}

.label {
	color: rgb(var(--md3-on-surface));

	text {
		fill: rgb(var(--md3-on-surface));
		color: rgb(var(--md3-on-surface));
	}
}

.cluster-label {
	text {
		fill: rgb(var(--md3-on-surface));
	}

	span {
		color: rgb(var(--md3-on-surface));
	}
}

.node :is(rect, circle, ellipse, polygon, path) {
	fill: rgb(var(--md3-surface-container-highest));
	stroke: rgb(var(--md3-on-surface-variant));
}

.node .label-container path {
	fill: rgb(var(--md3-surface-container-highest)) !important;
	stroke: rgb(var(--md3-on-surface-variant)) !important;
}

.node .katex path {
  fill: rgb(var(--md3-on-surface));
  stroke: rgb(var(--md3-on-surface));
}

.root .anchor path {
  fill: rgb(var(--md3-on-surface)) !important;
  stroke: rgb(var(--md3-on-surface));
}

.arrowheadPath {
  fill: rgb(var(--md3-on-surface));
}

.edgePath .path, .edgePaths path {
  stroke: rgb(var(--md3-on-surface));
}

.flowchart-link {
  stroke: rgb(var(--md3-on-surface));
}

.edgeLabel {
  background-color: rgb(var(--md3-surface-container));

  p, rect {
	background-color: rgb(var(--md3-surface-container));
  }
}

.labelBkg {
  background-color: rgba(var(--md3-surface-container), 0.5);
}

.cluster {
	rect {
		fill: rgb(var(--md3-surface-container)) !important;
		stroke: rgb(var(--md3-on-surface)) !important;
	}

	text {
		fill: rgb(var(--md3-on-surface));
	}

	span {
		color: rgb(var(--md3-on-surface));
	}
}

.flowchartTitleText {
	fill: rgb(var(--md3-on-surface));
}

.icon-shape, .image-shape {
	background-color: rgb(var(--md3-surface-container));

	p, rect {
		background-color: rgb(var(--md3-surface-container));
	}

	rect {
		fill: rgb(var(--md3-surface-container));
	}
}

.background {
	fill: transparent;
}

.plot {
	rect {
		fill: rgb(var(--md3-surface-container-highest));
	}

	path {
		stroke: rgb(var(--md3-primary));
	}
}

.axis-line path, .axisl-line path, .ticks path {
	stroke: rgb(var(--md3-on-surface));
}
`;

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

					mermaid.initialize({
						startOnLoad: false,
						theme: "base",
						darkMode: isDarkMode(),
						fontFamily: "var(--ion-font-family)",
						securityLevel: "strict",
						deterministicIds: true,
						deterministicIDSeed: hashHex,
						themeCSS
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