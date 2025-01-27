import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginBasicSsl } from "@rsbuild/plugin-basic-ssl";

const host = process.env.TAURI_DEV_HOST;

const { publicVars } = loadEnv({ prefixes: ['TAURI_ENV_', 'AMPERSAND_'] });

export default defineConfig({
	plugins: [
		pluginVue(),
		pluginBasicSsl({
			filename: "self-signed.pem",
			outputPath: __dirname
		})
	],
	html: {
		template: './index.html',
	},
	source: {
		entry: {
			index: './src/main.ts',
		},
		define: publicVars
	},
	server: {
		strictPort: true,
		host: host || undefined,
		port: 5173,
	},
	output: {
		sourceMap: true,
		distPath: {
			root: "dist",
			assets: "assets"
		},
		minify: false,
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