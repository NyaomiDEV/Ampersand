<script setup lang="ts">
	import { IonHeader } from "@ionic/vue";
	import { onMounted, ref, useTemplateRef } from "vue";

	const props = defineProps<{
		scroller?: HTMLElement
	}>();

	const headerbar = useTemplateRef("headerbar");

	const scrollDelta = ref<string>("0");
	const contentOffset = ref(0);

	onMounted(() => {
		if(!headerbar.value) return;
		const headerEl = headerbar.value.$el as HTMLElement;
		const scrollerEl = props.scroller ?? headerEl.parentElement as HTMLElement;

		setTimeout(() => {
			const firstToolbarEl = headerEl.getElementsByTagName("ion-toolbar").item(0);
			const shadow = firstToolbarEl?.shadowRoot;
			contentOffset.value = (
				(shadow?.querySelector<HTMLElement>("[part=content]")?.offsetLeft ?? 0) - 
				parseFloat(shadow?.querySelector<HTMLElement>("[part=container]")?.computedStyleMap().get("padding-left")?.toString().replace("px", "") || "0")
			);
		}, 1);

		if(scrollerEl.tagName.toLowerCase().startsWith("ion")){
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			scrollerEl.addEventListener("ionScroll", (ev: any) => {
				scrollDelta.value = `${ev.detail.scrollTop}`;
			});
		} else {
			scrollerEl.addEventListener("scroll", () => {
				scrollDelta.value = `${scrollerEl.scrollTop}`;
			});
		}
	});
</script>

<template>
	<IonHeader ref="headerbar">
		<slot />
	</IonHeader>
</template>

<style scoped>
	ion-header {
		--toolbar-size: 64px;
		--transition-size: calc(var(--toolbar-size) - 64px);
		--scroll-delta-normalized: clamp(0, calc(v-bind('scrollDelta') / (var(--transition-size) / 1px)), 1);
		--scroll-delta-remapped: calc(-1 + (var(--scroll-delta-normalized) * 2));

		position: sticky;
		top: 0;
		transform: translateY(calc(-1 * var(--scroll-delta-normalized) * var(--transition-size)));

		&.size-medium {
			--toolbar-size: 112px;

			&.with-subtitle {
				--toolbar-size: 136px;
			}
		}

		&.size-large {
			--toolbar-size: 120px;

			&.with-subtitle {
				--toolbar-size: 152px;
			}
		}

		:deep(ion-toolbar:first-child) {
			--min-height: var(--toolbar-size);

			&::part(content) {
				margin-top: var(--transition-size);
				transform: translateX(calc(-1px * v-bind('contentOffset') * (1 - var(--scroll-delta-normalized))));
			}

			ion-title {
				font-size: calc(
					1.375rem * var(--scroll-delta-normalized) +
					2rem * (1 - var(--scroll-delta-normalized))
				);
				line-height: calc(
					1.75rem * var(--scroll-delta-normalized) +
					2.5rem * (1 - var(--scroll-delta-normalized))
				);
			}

			[slot="secondary"],
			[slot="primary"],
			[slot="start"],
			[slot="end"] {
				transform: translateY(calc(var(--transition-size) / 2 * var(--scroll-delta-remapped)));
			}
		}
	}
</style>