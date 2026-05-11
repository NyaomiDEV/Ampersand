<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonModal,
		IonSearchbar,
		modalController,
		IonFab,
		IonFabButton,
		IonIcon,
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, ref, shallowRef, toRaw, watch } from "vue";
	import { accessibilityConfig } from "../lib/config/index.ts";
	import type { System } from "../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { getFilteredSystems, isValidSystem } from "../lib/db/tables/system.ts";
	import { appConfig } from "../lib/config/index.ts";
	import SystemItem from "../components/system/SystemItem.vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";

	import checkMD from "@material-symbols/svg-600/outlined/check.svg";

	const props = defineProps<{
		customTitle?: string,
		onlyOne?: boolean,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		hideFab?: boolean,
		modelValue?: System[],
		hideCheckboxes?: boolean,
		systemsToExclude?: System[],
		systemsToInclude?: System[]
	}>();

	const emit = defineEmits<{
		"update:modelValue": [System[]],
	}>();

	const selectedSystems = shallowRef<System[]>([...props.modelValue || []]);
	const search = ref("");
	const systems = shallowRef<System[]>();
	const iter = shallowRef<AsyncGenerator<System>>();
	const iterDone = ref(false);

	watch(props, () => {
		selectedSystems.value = [...props.modelValue || []];
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "systems")
			void resetSystems();
	};

	watch(search, async () => {
		await resetSystems();
	});

	watch(appConfig, async () => {
		await resetSystems();
	});

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetSystems();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	function emitFiltered(systems: System[]){
		return emit("update:modelValue", systems.filter(x => isValidSystem(x)));
	}

	async function resetSystems(){
		systems.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredSystems(search.value);
		await pollSystems();
	}

	async function pollSystems(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _syss: System[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _syss.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!systems.value)
			systems.value = _syss;
		else
			systems.value = [...systems.value, ..._syss];

		if(cb)
			cb();
	}

	function check(system: System, checked: boolean){
		// hideCheckboxes implies onlyOne
		const onlyOne = props.onlyOne || props.hideCheckboxes;
		if(checked){
			if(onlyOne)
				selectedSystems.value.length = 0;
			selectedSystems.value.push(system);
		} else {
			const index = selectedSystems.value.findIndex(x => x.uuid === system.uuid);
			if(index > -1){
				if(selectedSystems.value.length === 1 && onlyOne){
					// selected the one who was already selected since we're in "selection mode"
					// we will just not uncheck it
					// (hideCheckboxes implies onlyOne)
					if(props.discardOnSelect){
						void modalController.dismiss();
						if(props.alwaysEmit)
							emitFiltered([...toRaw(selectedSystems.value)]);
					}
					return;
				}
				selectedSystems.value.splice(index, 1);
			}
		}

		emitFiltered([...toRaw(selectedSystems.value)]);

		if(onlyOne && props.discardOnSelect)
			void modalController.dismiss();
	}
</script>

<template>
	<IonModal class="system-select-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("systems:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('systems:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!systems" />
		<IonContent v-else>
			<IonList>
				<VirtualList :entries="systems" :min-size="72" :gap="2">
					<template #default="{ entry: system }">
						<SystemItem
							:system
							button
							:show-icons="false"
							show-effects
							:smaller-avatar="accessibilityConfig.compactLists"
							:disabled="(props.systemsToInclude && !props.systemsToInclude.find(x => x.uuid === system.uuid)) || !!props.systemsToExclude?.find(x => x.uuid === system.uuid)"
							has-toggle="checkbox"
							:toggle-value="system.uuid"
							:toggle-checked="!!selectedSystems.find(x => x.uuid === system.uuid)"
							@toggle-update="value => check(system, value)"
						/>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollSystems" />

			<IonFab
				v-if="!props.hideFab && !props.discardOnSelect"
				slot="fixed"
				vertical="bottom"
				horizontal="end"
			>
				<IonFabButton @click="modalController.dismiss()">
					<IonIcon :icon="checkMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	:deep(ion-checkbox::part(container)) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>