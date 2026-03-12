<script setup lang="ts" generic="T">
	import { useVirtualizer } from "@tanstack/vue-virtual";
	import { computed, nextTick, ref } from "vue";

	const { entries } = defineProps<{
		entries: T[]
	}>();

	const scroller = ref();

	const virtualizerOptions = computed(() => ({
		count: entries?.length ?? 0,
		getScrollElement: () => scroller.value,
		estimateSize: () => 130,
		// @ts-expect-error: use uuid here
		getItemKey: (index) => entries[index]?.uuid ?? index,
		measureElement: (element, _entry, instance) => {
			const direction = instance.scrollDirection;
			if (direction === "forward" || direction === null) {
				// Allow remeasuring when scrolling down or direction is null
				return element.getBoundingClientRect().height;
			} else {
				// When scrolling up, use cached measurement to prevent stuttering
				const indexKey = Number(element.getAttribute("data-index"));
				const cachedMeasurement = instance.measurementsCache[indexKey]?.size;
				return cachedMeasurement || element.getBoundingClientRect().height;
			}
		},
		overscan: 5,
	}));

	const rowVirtualizer = useVirtualizer(virtualizerOptions);
	const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
	const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

	const measureElement = (el) => {
		nextTick(() => {
			if (!el) return;
			rowVirtualizer.value.measureElement(el);
		});
	};
</script>

<template>
	<div ref="scroller" class="virtualList">
		<div
			:style="{
				height: `${totalSize}px`,
				position: 'relative',
				width: '100%',
			}"
		>
			<div
				:style="{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					transform: `translateY(${virtualRows[0]?.start ?? 0}px)`,
				}"
			>
				<div
					v-for="vrow in virtualRows"
					:key="vrow.key.toString()"
					:ref="measureElement"
					class="v-row"
					:data-index="vrow.index"
				>
					<slot :index="vrow.index" :entry="entries[vrow.index]" />
				</div>
			</div>
		</div>
	</div>
</template>
