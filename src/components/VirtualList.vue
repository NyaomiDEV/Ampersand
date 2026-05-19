<script setup lang="ts" generic="T extends object">
	import { useVirtualizer } from "@tanstack/vue-virtual";
	import { ComponentPublicInstance, computed, onMounted, onUpdated, ref, shallowRef, watch } from "vue";

	const props = withDefaults(defineProps<{
		entries: T[],
		minSize?: number,
		gap?: number,
		overscan?: number,
		customItemKeyFn?: (entries: T[], index: number) => string | number
	}>(), {
		minSize: 64,
		gap: 2,
		overscan: 5
	});

	const scroller = shallowRef<HTMLElement | null>(null);
	const virtualItemEls = shallowRef<(HTMLElement | null)[]>([]);

	const defaultGetItemKey = (entries: T[], index: number) => (entries[index] && "uuid" in entries[index]) ? entries[index].uuid as string : index;

	const config = ref({
		count: props.entries.length,
		gap: props.gap,
		getScrollElement: () => scroller.value,
		estimateSize: () => props.minSize,
		getItemKey: (index: number) => props.customItemKeyFn?.(props.entries, index) || defaultGetItemKey(props.entries, index),
		measureElement: (element: HTMLElement): number => {
			const styles = window.getComputedStyle(element);
			const margin = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
			return element.offsetHeight + margin;
		},
		overscan: props.overscan,
	});

	watch(props, () => {
		config.value.count = props.entries.length;
	});

	const rowVirtualizer = useVirtualizer(config);
	const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
	const cssGap = computed(() => `${props.gap}px`);
	const totalSize = computed(() => `${rowVirtualizer.value.getTotalSize()}px`);

	async function getRootScroller(e: Element | ComponentPublicInstance | null){
		scroller.value = await (e as Element)?.closest("ion-content")?.getScrollElement() || null;
	}

	// just in case you wonder why we went back and forth with our implementations
	// it is... that apparently measuring one item at a time makes lists behave weirdly
	// in some browsers... so it is what it is
	function measure() {
		rowVirtualizer.value.measureElement(null);
		virtualItemEls.value.forEach((el) => {
			if (el) rowVirtualizer.value.measureElement(el);
		});
	}

	onMounted(measure);
	onUpdated(measure);

	defineExpose({
		scrollBy: rowVirtualizer.value.scrollBy,
		scrollToIndex: rowVirtualizer.value.scrollToIndex,
		scrollToOffset: rowVirtualizer.value.scrollToOffset,
		scrollToElement: (el: T, options?: ScrollToOptions) => {
			const index = props.entries.indexOf(el);
			if(index >= 0)
				rowVirtualizer.value.scrollToIndex(index, options);
		},
		_virtualizer: rowVirtualizer
	});
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
				ref="virtualItemEls"
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
