<script setup lang="ts">
	import { onMounted, shallowRef, useTemplateRef } from "vue";
	import mermaid from "mermaid";
	import { isDarkMode } from "../lib/mode";
	import { argbFromRgb, hexFromArgb } from "@material/material-color-utilities";
	import { sha256 } from "../lib/util/misc";

	const container = useTemplateRef("container");

	const props = defineProps<{
		directives: string
	}>();

	const renderResult = shallowRef<string>();

	function getTheme(isDarkMode: boolean){
		const wantedKey = isDarkMode ? "--md3-dark-" : "--md3-light-";

		if(!container.value) return;
		const styleMap = window.getComputedStyle(container.value);
		const theme = new Map<string, string>();
		for(let i = 0; i < styleMap.length; i++){
			const key = styleMap.item(i);
			if(!key.startsWith(wantedKey)) continue;
			const value = styleMap.getPropertyValue(key);
			const mappedValue = value.split(",").map(x => parseInt(x.trim()));
			if(mappedValue.length < 3) continue;

			theme.set(
				key.replace(wantedKey, "").replaceAll("-", "_"),
				hexFromArgb(argbFromRgb(mappedValue[0], mappedValue[1], mappedValue[2]))
			);
		}

		return theme;
	}

	async function render(directives: string){
		const theme = getTheme(isDarkMode());
		if(!theme?.size) return;

		const themeVariables: Record<string, boolean | string | undefined> = {
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

		const hashHex = await sha256(directives);
		mermaid.initialize({
			startOnLoad: false,
			theme: "base",
			darkMode: isDarkMode(),
			fontFamily: "var(--ion-font-family)",
			securityLevel: "strict",
			deterministicIds: true,
			deterministicIDSeed: hashHex,
			suppressErrorRendering: true,
			themeVariables
		});

		const result = await mermaid.render(`mermaid-render-${hashHex.slice(0, 7)}`, directives);
		return result.svg;
	}

	onMounted(async () => {
		renderResult.value = await render(props.directives);
	});
</script>

<template>
	<!-- eslint-disable-next-line vue/no-v-html -->
	<div ref="container" class="mermaid-render" v-html="renderResult" />
</template>