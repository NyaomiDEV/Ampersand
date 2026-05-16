<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonToolbar,
		IonTitle,
		IonModal,
		IonSearchbar,
		modalController,
		IonItem,
		IonLabel
	} from "@ionic/vue";

	import { onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
	import { FilterQuery, FilterQueryType } from "../lib/db/entities";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";
	import { DatabaseEvent, DatabaseEvents } from "../lib/db/events";
	import TheresNothingHere from "../components/TheresNothingHere.vue";
	import { getFilteredFilterQueries } from "../lib/db/tables/filterQueries";

	const props = defineProps<{
		customTitle?: string,
		type: FilterQueryType
	}>();

	const emit = defineEmits<{
		"selected": [FilterQuery],
	}>();

	const search = ref("");
	const filterQueries = shallowRef<FilterQuery[]>();
	const iter = shallowRef<AsyncGenerator<FilterQuery>>();
	const iterDone = ref(false);

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "filterQueries")
			void resetFilterQueries();
	};

	watch(search, async () => {
		await resetFilterQueries();
	});

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetFilterQueries();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function resetFilterQueries(){
		filterQueries.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredFilterQueries(props.type, search.value);
		await pollFilterQueries();
	}

	async function pollFilterQueries(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _filterQueries: FilterQuery[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _filterQueries.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!filterQueries.value)
			filterQueries.value = _filterQueries;
		else
			filterQueries.value = [...filterQueries.value, ..._filterQueries];

		if(cb)
			cb();
	}

	async function check(filterQuery: FilterQuery){
		emit("selected", structuredClone(filterQuery));
		try{
			await modalController.dismiss("confirm");
		}catch(_){
			// nothin
		}
	}
</script>

<template>
	<IonModal class="filter-query-select-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("filterQueries:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('filterQueries:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!filterQueries" />
		<IonContent v-else>
			<TheresNothingHere v-if="!filterQueries.length" />
			<IonList v-else>
				<VirtualList :entries="filterQueries" :min-size="56" :gap="2">
					<template #default="{ entry: filterQuery }">
						<IonItem
							button
							@click="check(filterQuery)"
						>
							<IonLabel>
								{{ filterQuery.name }}
							</IonLabel>
						</IonItem>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollFilterQueries" />
		</IonContent>
	</IonModal>
</template>