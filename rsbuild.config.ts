import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginBasicSsl } from "@rsbuild/plugin-basic-ssl";

const host = process.env.TAURI_DEV_HOST;
const debug = process.env.NODE_ENV === 'development';

const { publicVars } = loadEnv({ prefixes: ['TAURI_ENV_', 'AMPERSAND_'] });

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
		template: './index.html',
	},
	source: {
		entry: {
			index: './src/app.ts',
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
		polyfill: "usage",
		copy: [
			{
				from: "resources/icon/180.png",
				to: "static/images/favicon-180x.png"
			},
			{
				from: "resources/icon/192.png",
				to: "static/images/favicon-192x.png"
			},
			{
				from: "resources/icon/512.png",
				to: "static/images/favicon-512x.png"
			},
			{
				from: "resources/icon/1024.png",
				to: "static/images/favicon-1024x.png"
			}
		]
	},
});