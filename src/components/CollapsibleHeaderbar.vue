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

	onMounted(async () => {
		if(!headerbar.value) return;
		const headerEl = headerbar.value.$el as HTMLElement;
		const scrollerEl = props.scroller ?? headerEl.parentElement as HTMLElement;
		const firstToolbarEl = headerEl.getElementsByTagName("ion-toolbar").item(0);
		if(!firstToolbarEl) return;

		const rtl = window.getComputedStyle(firstToolbarEl, null).getPropertyValue("direction") === "rtl";

		const observer = new MutationObserver((mutations) => {
			console.log(mutations);
		});

		observer.observe(firstToolbarEl, { childList: true, subtree: true });

		const shadow = await new Promise<ShadowRoot>((res, rej) => {
			const timeoutId = setTimeout(() => rej(new Error("timed out")), 5000);
			const cb = () => {
				if(firstToolbarEl?.shadowRoot && firstToolbarEl.shadowRoot.children.length){
					clearTimeout(timeoutId);
					res(firstToolbarEl.shadowRoot);
				} else
					setTimeout(cb, 1);
			};
			cb();
		});

		const content = shadow.querySelector<HTMLElement>("[part=content]");
		const container = shadow.querySelector<HTMLElement>("[part=container]");
		if(!content || !container) return;

		const paddingInline = parseFloat(container.computedStyleMap().get("padding-inline-start")?.toString().replace("px", "") || "0");

		contentOffset.value = Math.max(0, rtl ? ((container.offsetWidth - content.offsetWidth - content.offsetLeft) - paddingInline) : (content.offsetLeft - paddingInline));

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
			collapsible: true,
			'css-anim': props.isCssAnim,
			'js-anim': !props.isCssAnim
		}"
		:style="{
			'--content-offset': contentOffset,
			'--scroll-delta': scrollDelta
		}"
	>
		<slot />
	</IonHeader>
</template>

<style scoped>
	ion-header.collapsible {
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
			--scroll-delta-normalized: clamp(0, calc(var(--scroll-delta) / (var(--transition-size) / 1px)), 1);
			--scroll-delta-remapped: calc(-1 + (var(--scroll-delta-normalized) * 2));
			transform: translateY(calc(-1 * var(--scroll-delta-normalized) * var(--transition-size)));

			:deep(ion-toolbar:first-child) {
				&::part(content) {
					transform: translateX(calc(-1px * var(--content-offset) * (1 - var(--scroll-delta-normalized))));
					&:dir(rtl){
						transform: translateX(calc(var(--content-offset) * (1 - var(--scroll-delta-normalized))));
					}
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

			transform: translateY(0);

			:deep(ion-toolbar:first-child) {
				:not([slot]) {
					animation-range-start: 0px;
					animation-range-end: var(--transition-size);
					animation-timeline: --scroller;
					animation-fill-mode: forwards;
					animation-name: content_anim_ltr;
					animation-timing-function: linear;

					transform: translateX(calc(-1px * var(--content-offset)));
				}

				ion-title:not([slot]) {
					animation-range-start: 0px;
					animation-range-end: var(--transition-size);
					animation-timeline: --scroller;
					animation-fill-mode: forwards;
					animation-name: content_anim_ltr, title_anim;
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

					transform: translateY(calc(var(--transition-size) / 2 * -1));
				}
			}

			&:dir(rtl) :deep(ion-toolbar:first-child) {
				:not([slot]) {
					animation-name: content_anim_rtl;
					transform: translateX(calc(1px * var(--content-offset)));
				}
				
				ion-title:not([slot]) {
					animation-name: content_anim_rtl, title_anim;
					transform: translateX(calc(1px * var(--content-offset)));
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

	@keyframes content_anim_ltr {
		0% {
			transform: translateX(calc(-1px * var(--content-offset)));
		}
		100% {
			transform: translateX(0);
		}
	}

	@keyframes content_anim_rtl {
		0% {
			transform: translateX(calc(1px * var(--content-offset)));
		}
		100% {
			transform: translateX(0);
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
			transform: translateY(calc(var(--transition-size) / 2 * -1));
		}
		100% {
			transform: translateY(calc(var(--transition-size) / 2));
		}
	}
</style>