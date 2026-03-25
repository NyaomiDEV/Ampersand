<script setup lang="ts" generic="T extends UUIDable">
	import { useVirtualizer } from "@tanstack/vue-virtual";
	import { ComponentPublicInstance, computed, shallowRef } from "vue";
	import { UUIDable } from "../lib/db/entities";

	const props = withDefaults(defineProps<{
		entries: T[],
		minSize?: number,
		gap?: number
	}>(), {
		minSize: 64,
		gap: 2
	});

	const scroller = shallowRef<Element | null>(null);

	const rowVirtualizer = useVirtualizer({
		count: props.entries?.length ?? 0,
		gap: props.gap,
		getScrollElement: () => scroller.value,
		estimateSize: () => props.minSize,
		getItemKey: (index: number) => props.entries[index]?.uuid ?? index,
		measureElement: (element: HTMLElement): number => {
			const styles = window.getComputedStyle(element);
			const margin = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
			return element.offsetHeight + margin;
		},
		overscan: 5,
	});
	const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
	const cssGap = computed(() => `${props.gap}px`);
	const totalSize = computed(() => `${rowVirtualizer.value.getTotalSize()}px`);

	async function getRootScroller(e: Element | ComponentPublicInstance | null){
		scroller.value = await (e as Element)?.closest("ion-content")?.getScrollElement() || null;
	}

	function measure(e: Element | ComponentPublicInstance | null) {
		if (e) rowVirtualizer.value.measureElement(e);
	}
</script>

<template>
	<div
		:ref="getRootScroller"
		class="v-root"
	>
		<div
			class="v-container"
			:style="{ transform: `translateY(${virtualRows[0]?.start ?? 0}px)` }"
		>
			<div
				v-for="vrow in virtualRows"
				:key="vrow.key.toString()"
				:ref="measure"
				class="v-row"
				:data-index="vrow.index"
			>
				<slot :index="vrow.index" :entry="props.entries[vrow.index]" />
			</div>
		</div>
	</div>
</template>

<style scoped>
	div.v-root {
		height: v-bind('totalSize');
		position: relative;
		width: 100%;
	}

	div.v-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: v-bind('cssGap');
	}
</style>
