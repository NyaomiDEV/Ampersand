<script setup lang="ts">
	import { IonAccordion, IonItem, IonLabel } from "@ionic/vue";
	import Markdown from "./Markdown.vue";
	import { getCurrentInstance, onMounted, shallowRef } from "vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../lib/theme/index.ts";
	import { FieldFrontmatter } from "../lib/markdown/types";
	import { useBlob } from "../lib/util/blob.ts";
	import { getAsset, getAssetsIndex } from "../lib/db/tables/assets.ts";
	import { fetchImage } from "../lib/util/fetchImage.ts";
	import { newFile } from "../lib/fileref.ts";
	import { getExtension } from "../lib/mime.ts";
	import { securityConfig } from "../lib/config/index.ts";
	import { isBorderStyle, isColor, isLength } from "../lib/markdown/utils.ts";
	import { useAssetFonts } from "../lib/assetFonts.ts";
	import { fontQuickNames } from "../lib/util/misc.ts";

	const self = getCurrentInstance();

	const { getObjectURL } = useBlob();
	const { appendFont, deleteFont } = useAssetFonts();

	const props = defineProps<{
		header: string,
		content: string
	}>();

	const frontmatter = shallowRef<Partial<FieldFrontmatter>>({});
	const background = shallowRef<string>();
	
	// those are just flags, don't reference as actual values
	const font = shallowRef<string>();
	const headerFont = shallowRef<string>();

	async function onFrontmatter(fm: object) {
		frontmatter.value = fm;
		handleColor();
		await handleBackground();
		await handleFont();
		await handleHeaderFont();
	}

	function handleColor(){
		if(frontmatter.value.backgroundColor && isColor(frontmatter.value.backgroundColor)){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(frontmatter.value.backgroundColor), rgbaToArgb(frontmatter.value.backgroundColor), self?.vnode.el as HTMLElement, undefined, frontmatter.value.colorScheme);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
	}

	async function handleBackground(){
		if(frontmatter.value.background){
			if (frontmatter.value.background.startsWith("@")) {
				const friendlyNameMaybe = frontmatter.value.background.slice(1);
				for (const x of getAssetsIndex()) {
					if (x.friendlyName === friendlyNameMaybe) {
						const asset = await getAsset(x.uuid);
						background.value = getObjectURL(asset.file);
						break;
					}
				}
			} else {
				if (securityConfig.allowRemoteContent) {
					const res = await fetchImage(frontmatter.value.background);
					if(!res) return;
					background.value = getObjectURL(await newFile([res.blob], `markdownimg_${Date.now()}.${getExtension(res.blob.type)}`));
				}
			}
		}
	}

	async function handleFont(){
		const fontTypes = [
			"application/font-woff",
			"application/octet-stream"
		];

		if (frontmatter.value.font?.startsWith("@")) {
			const assetIndex = getAssetsIndex().find(x => x.friendlyName === frontmatter.value.font!.slice(1));
			if(!assetIndex) return;

			const asset = await getAsset(assetIndex.uuid);
			if(fontTypes.includes(asset.file.type)){
				appendFont(frontmatter.value.font, asset.file);
				font.value = frontmatter.value.font;
			}
		} else if(font.value) {
			if(headerFont.value !== font.value)
				deleteFont(font.value);
			font.value = undefined;
		}
	}

	async function handleHeaderFont(){
		const fontTypes = [
			"application/font-woff",
			"application/octet-stream"
		];

		if (frontmatter.value.headerFont?.startsWith("@")) {
			const assetIndex = getAssetsIndex().find(x => x.friendlyName === frontmatter.value.headerFont!.slice(1));
			if(!assetIndex) return;

			const asset = await getAsset(assetIndex.uuid);
			if(fontTypes.includes(asset.file.type)){
				appendFont(frontmatter.value.headerFont, asset.file);
				headerFont.value = frontmatter.value.headerFont;
			}
		} else if(headerFont.value) {
			if(headerFont.value !== font.value)
				deleteFont(headerFont.value);
			headerFont.value = undefined;
		}
	}

	onMounted(handleColor);
</script>

<template>
	<IonAccordion
		:style="{
			'--data-background': `url(${background})`,
			'--data-color': frontmatter.color && isColor(frontmatter.color) ? frontmatter.color : undefined,
			'--data-header-color': frontmatter.headerColor && isColor(frontmatter.headerColor) ? frontmatter.headerColor : undefined,
			'--data-header-font': frontmatter.headerFont ? `'${fontQuickNames[frontmatter.headerFont] || frontmatter.headerFont}'` : undefined,
			'--data-font': frontmatter.font ? `'${fontQuickNames[frontmatter.font] || frontmatter.font}'` : undefined,
			'--data-border-style': frontmatter.borderStyle && isBorderStyle(frontmatter.borderStyle) ? frontmatter.borderStyle : undefined,
			'--data-border-color': frontmatter.borderColor && isColor(frontmatter.borderColor) ? frontmatter.borderColor : undefined,
			'--data-border-width': frontmatter.borderWidth && isLength(frontmatter.borderWidth) ? frontmatter.borderWidth : undefined,
		}"
		:class="{
			'with-background': !!background
		}"
	>
		<IonItem slot="header">
			<IonLabel>
				{{ frontmatter.header || props.header }}
			</IonLabel>
		</IonItem>
		<div
			slot="content"
			class="content"
		>
			<Markdown :markdown="props.content" @frontmatter="onFrontmatter" />
		</div>
	</IonAccordion>
</template>

<style scoped>
	ion-accordion {
		color: var(--data-color, inherit);
		font-family: var(--data-font, inherit);

		> ion-item[slot="header"] {
			--color: var(--data-header-color, inherit);

			> ion-label {
				font-family: var(--data-header-font, inherit) !important;
			}
		}
	}

	ion-accordion:is(ion-accordion-group :last-child) [slot=content]{
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
	}

	ion-accordion [slot=content] {
		border-style: var(--data-border-style, inherit);
		border-color: var(--data-border-color, inherit);
		border-width: var(--data-border-width, inherit);	
	}

	ion-accordion.with-background::part(content) {
		position: relative;
	}

	ion-accordion.with-background::part(content)::before {
		content: '\A';
		background-image: var(--data-background);
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;
		display: block;
		position: absolute;
		z-index: 0;
		left: 0;
		top: 0;
		opacity: 0.2;
	}
</style>