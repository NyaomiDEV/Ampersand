<script setup lang="ts">
	import { IonHeader } from "@ionic/vue";
	import { onMounted, ref, useTemplateRef } from "vue";

	const headerbar = useTemplateRef("headerbar");

	const scrollDeltaNormalized = ref(0);
	const scrollDelta = ref(0);
	const contentOffset = ref(0);
	let maxScroll: number;

	onMounted(async () => {
		if(!headerbar.value) return;
		const headerEl = headerbar.value.$el as HTMLElement;
		const scrollerEl = headerEl.parentElement as HTMLElement;

		setTimeout(() => {
			const firstToolbarEl = headerEl.getElementsByTagName("ion-toolbar").item(0);
			const shadow = firstToolbarEl?.shadowRoot;
			contentOffset.value = (
				(shadow?.querySelector<HTMLElement>("[part=content]")?.offsetLeft ?? 0) - 
				parseFloat(shadow?.querySelector<HTMLElement>("[part=container]")?.computedStyleMap().get("padding-left")?.toString().replace("px", "") || "0")
			);
			maxScroll = firstToolbarEl?.clientHeight || 0;

			console.log(firstToolbarEl, contentOffset.value);
		}, 1);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		scrollerEl.addEventListener("ionScroll", (ev: any) => {
			scrollDelta.value = Math.min(ev.detail.scrollTop, maxScroll);
			scrollDeltaNormalized.value = scrollDelta.value / maxScroll;
		});
	});
</script>

<template>
	<IonHeader ref="headerbar">
		<slot />
	</IonHeader>
</template>

<style scoped>
	ion-header {
		--scroll-delta: calc(v-bind('scrollDeltaNormalized') * 100%);
		position: sticky;
		top: 0;
		transform: translateY(max(calc(v-bind('scrollDelta') * -1px), -64px));
	}

	ion-header.with-opacity :deep(ion-toolbar) {
		--opacity-delta: calc(-50% + calc(var(--scroll-delta) * 2));
		--background: color-mix(in srgb,
			rgb(var(--md3-surface-container)) var(--opacity-delta),
			transparent	calc(100% - var(--opacity-delta)));
	}

	ion-header :deep(ion-toolbar:first-child) {
		--min-height: calc(64px + 64px);

		&::part(content) {
			margin-top: 64px;
			transform: translateX(
				calc(
					v-bind('contentOffset') * clamp(0,
						calc(1 - v-bind('scrollDeltaNormalized') * 2)
					, 1)
				* -1px)
			);
		}

		ion-title {
			font-size: max(1em, calc(1.5em * calc(1 - v-bind('scrollDeltaNormalized'))));
			line-height: max(28px, calc(36px * calc(1 - v-bind('scrollDeltaNormalized'))));
		}

		[slot="secondary"],
		[slot="primary"],
		[slot="start"],
		[slot="end"] {
			margin-bottom: clamp(0px, calc(64px * calc(1 - v-bind('scrollDeltaNormalized') * 2)), 64px);
			margin-top: clamp(0px, calc(64px * calc(v-bind('scrollDeltaNormalized') * 2)), 64px);
		}
	}
</style>