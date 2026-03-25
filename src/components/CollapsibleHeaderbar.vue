<script setup lang="ts">
	import { IonHeader } from "@ionic/vue";
	import { onMounted, ref, useTemplateRef } from "vue";

	const props = withDefaults(defineProps<{
		scroller?: HTMLElement,
		isCssAnim?: boolean
	}>(), {
		isCssAnim: window.CSS.supports("scroll-timeline: --scroller y")
	});

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
				parseFloat(
					shadow?.querySelector<HTMLElement>("[part=container]")?.computedStyleMap()
						.get("padding-left")?.toString().replace("px", "") || "0"
				)
			);
		}, 1);

		if(props.isCssAnim){
			if(scrollerEl.tagName.toLowerCase() === "ion-content") {
				void (scrollerEl as globalThis.HTMLIonContentElement).getScrollElement()
					.then(el => el.style.setProperty("scroll-timeline", "--scroller y"));
			} else 
				scrollerEl.style.setProperty("scroll-timeline", "--scroller y");
		} else {
			if(scrollerEl.tagName.toLowerCase() === "ion-content"){
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				scrollerEl.addEventListener("ionScroll", (ev: any) => {
					scrollDelta.value = `${ev.detail.scrollTop}`;
				});
			} else {
				scrollerEl.addEventListener("scroll", () => {
					scrollDelta.value = `${scrollerEl.scrollTop}`;
				});
			}
		}
	});
</script>

<template>
	<IonHeader
		ref="headerbar"
		:class="{
			'css-anim': props.isCssAnim,
			'js-anim': !props.isCssAnim
		}"
	>
		<slot />
	</IonHeader>
</template>

<style scoped>
	ion-header {
		--toolbar-size: 64px;
		--transition-size: calc(var(--toolbar-size) - 64px);

		position: sticky;
		top: 0;

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
			}
		}

		&.js-anim {
			--scroll-delta-normalized: clamp(0, calc(v-bind('scrollDelta') / (var(--transition-size) / 1px)), 1);
			--scroll-delta-remapped: calc(-1 + (var(--scroll-delta-normalized) * 2));
			transform: translateY(calc(-1 * var(--scroll-delta-normalized) * var(--transition-size)));

			:deep(ion-toolbar:first-child) {
				&::part(content) {
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

		&.css-anim {
			animation-range-start: 0px;
			animation-range-end: var(--transition-size);
			animation-timeline: --scroller;
			animation-fill-mode: forwards;
			animation-name: header_anim;
			animation-timing-function: linear;


			:deep(ion-toolbar:first-child) {
				&::part(content) {
					animation-range-start: 0px;
					animation-range-end: var(--transition-size);
					animation-timeline: --scroller;
					animation-fill-mode: forwards;
					animation-name: content_anim;
					animation-timing-function: linear;
				}

				ion-title {
					animation-range-start: 0px;
					animation-range-end: var(--transition-size);
					animation-timeline: --scroller;
					animation-fill-mode: forwards;
					animation-name: title_anim;
					animation-timing-function: linear;

					font-size: 2rem;
					line-height: 2.5rem;
				}

				[slot="secondary"],
				[slot="primary"],
				[slot="start"],
				[slot="end"] {
					animation-range-start: 0px;
					animation-range-end: var(--transition-size);
					animation-timeline: --scroller;
					animation-fill-mode: forwards;
					animation-name: slots_anim;
					animation-timing-function: linear;
				}
			}
		}
	}

	@keyframes header_anim {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(calc(-1 * var(--transition-size)));
		}
	}

	@keyframes content_anim {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(calc(-1 * v-bind('contentOffset')));
		}
	}

	@keyframes title_anim {
		0% {
			font-size: 2rem;
			line-height: 2.5rem;
		}
		100% {
			font-size: 1.375rem;
			line-height: 1.75rem;
		}
	}

	@keyframes slots_anim {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(calc(var(--transition-size) / 2));
		}
	}
</style>