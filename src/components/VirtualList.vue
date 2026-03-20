<script setup lang="ts" generic="T extends UUIDable">
	import { useVirtualizer, Virtualizer } from "@tanstack/vue-virtual";
	import { computed, ref } from "vue";
	import { UUIDable } from "../lib/db/entities";

	const { entries } = defineProps<{
		entries: T[]
	}>();

	const scroller = ref<Element>();

	const virtualizerOptions = computed(() => ({
		count: entries?.length ?? 0,
		getScrollElement: () => scroller.value || null,
		estimateSize: () => 90,
		getItemKey: (index: number) => entries[index]?.uuid ?? index,
		measureElement: (element: Element, _entry: ResizeObserverEntry | undefined, instance: Virtualizer<Element, Element>): number => {
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
					class="v-row"
					:data-index="vrow.index"
				>
					<slot :index="vrow.index" :entry="entries[vrow.index]" />
				</div>
			</div>
		</div>
	</div>
</template>
