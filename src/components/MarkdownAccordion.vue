<script setup lang="ts">
	import { IonAccordion, IonItem, IonLabel } from "@ionic/vue";
	import Markdown from "./Markdown.vue";
	import { getCurrentInstance, onMounted, shallowRef } from "vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../lib/theme/index.ts";
	import { AppConfig } from "../lib/config/types";
	import { useBlob } from "../lib/util/blob.ts";
	import { getAsset, getAssetsIndex } from "../lib/db/tables/assets.ts";
	import { fetchImage } from "../lib/util/fetchImage.ts";
	import { newFile } from "../lib/fileref.ts";
	import { getExtension } from "../lib/mime.ts";
	import { securityConfig } from "../lib/config/index.ts";

	type FieldFrontmatter = {
		header: string,
		color: string,
		"color-scheme": AppConfig["themeScheme"],
		background: string
	};

	const self = getCurrentInstance();

	const { getObjectURL } = useBlob();

	const props = defineProps<{
		header: string,
		content: string
	}>();

	const frontmatter = shallowRef<Partial<FieldFrontmatter>>({});
	const background = shallowRef<string>();

	async function onFrontmatter(fm: object) {
		frontmatter.value = fm;
		handleColor();
		await handleBackground();
	}

	function handleColor(){
		if(frontmatter.value.color){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(frontmatter.value.color), rgbaToArgb(frontmatter.value.color), self?.vnode.el as HTMLElement, undefined, frontmatter.value["color-scheme"]);
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

	onMounted(handleColor);
</script>

<template>
	<IonAccordion
		:style="{
			'--data-background': `url(${background})`
		}"
		:class="{
			'with-background': !!background
		}"
	>
		<IonItem slot="header">
			<IonLabel>{{ frontmatter.header || props.header }}</IonLabel>
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