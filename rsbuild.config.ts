import { spawn } from "node:child_process";

import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginBasicSsl } from "@rsbuild/plugin-basic-ssl";

const host = process.env.TAURI_DEV_HOST;
const debug = process.env.NODE_ENV === "development" || process.env.AMPERSAND_BUILD_TYPE === "unstable";

const { publicVars } = loadEnv({
	processEnv: {
		...process.env,
		AMPERSAND_REVCOUNT: process.env.AMPERSAND_REVCOUNT || await revcount()
	},
	prefixes: ["TAURI_ENV_", "AMPERSAND_"]
});

function revcount() {
	return new Promise(resolve => {
		const _process = spawn("git", ["rev-list", "--count", "HEAD"], { stdio: "pipe" });
		let stdout = "";
		_process.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		_process.on("exit", (code) => {
			resolve(stdout.trim());
		});
	});
}

export default defineConfig({
	dev: {
		watchFiles: [{
			paths: "vendor",
			type: "reload-page"
		}],
		lazyCompilation: false
	},
	plugins: [
		pluginVue(),
		process.env.TAURI_ENV_DEBUG ? undefined : pluginBasicSsl({
			filename: "self-signed.pem",
			outputPath: __dirname
		})
	],
	html: {
		template: "./index.html",
	},
	source: {
		entry: {
			index: "./src/app.ts",
		},
		define: publicVars
	},
	server: {
		strictPort: true,
		host: host || undefined,
		port: 5173,
	},
	output: {
		sourceMap: {
			js: debug ? "cheap-module-source-map" : false,
			css: debug ? true : false
		},
		distPath: {
			root: "dist",
			assets: "static/assets",
			font: "static/assets",
			image: "static/images",
			svg: "static/images",
			media: "static/media",
			js: "js",
			css: "styles",
			jsAsync: "js",
			cssAsync: "styles",
			wasm: "wasm"
		},
		minify: true,
		polyfill: "usage"
	},
	tools: {
		rspack(config, { addRules }) {
			addRules([
				{
					test: /\.md$/,
					type: "asset/source",
				},
			]);
		},
	},
});