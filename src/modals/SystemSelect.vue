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
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, ref, shallowRef, toRaw, watch } from "vue";
	import { accessibilityConfig } from "../lib/config/index.ts";
	import type { System } from "../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { getFilteredSystems, getSystem } from "../lib/db/tables/system.ts";
	import { appConfig } from "../lib/config/index.ts";
	import { PartialBy } from "../lib/types";
	import SystemItem from "../components/system/SystemItem.vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";

	const props = defineProps<{
		customTitle?: string,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		modelValue?: System,
		hideCheckboxes?: boolean,
		childSystem?: PartialBy<System, "uuid">
	}>();

	const emit = defineEmits<{
		"update:modelValue": [System],
	}>();

	const selectedSystem = shallowRef<System | undefined>(props.modelValue);
	const search = ref("");
	const systems = shallowRef<System[]>();
	const iter = shallowRef<AsyncGenerator<System>>();
	const iterDone = ref(false);

	watch(props, () => {
		selectedSystem.value = props.modelValue;
	});

	const disallowedSystems = shallowRef<System[]>([]);

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

	function check(system: System){
		if(selectedSystem.value?.uuid !== system.uuid){
			selectedSystem.value = system;

			emit("update:modelValue", toRaw(selectedSystem.value));
		} else {
			if(props.alwaysEmit && selectedSystem.value)
				emit("update:modelValue", toRaw(selectedSystem.value));
		}

		if(props.discardOnSelect)
			void modalController.dismiss();
	}

	async function updateParents(){
		const parents: System[] = [];

		let _system = props.childSystem;
		// for our purpose (disallowing systems to pick themselves or their parents) a system is also its own parent
		if(_system?.uuid) parents.push(_system as System);

		while(_system){
			if(_system.parent){
				const parent = await getSystem(_system.parent);
				if(parent) parents.push(parent);
				_system = parent;
			} else 
				_system = undefined;
		}

		disallowedSystems.value = parents;
	}

	watch(props, async () => {
		await updateParents();
	}, { immediate: true });
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
							has-toggle="checkbox"
							:toggle-value="system.uuid"
							:toggle-checked="selectedSystem?.uuid === system.uuid"
							:disabled="!!disallowedSystems.find(x => x.uuid === system.uuid)"
							@toggle-update="check(system)"
						/>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollSystems" />
		</IonContent>
	</IonModal>
</template>

<style scoped>
	:deep(ion-checkbox::part(container)) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>