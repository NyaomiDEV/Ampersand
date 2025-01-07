import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginVue } from "@rsbuild/plugin-vue";

const host = process.env.TAURI_DEV_HOST;

const { publicVars } = loadEnv({ prefixes: ['TAURI_ENV_'] });

export default defineConfig({
	plugins: [
		pluginVue()
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
		minify: false
	},
});