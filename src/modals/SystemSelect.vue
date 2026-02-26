<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonSearchbar,
		IonCheckbox,
		modalController,
		IonLabel,
		IonAvatar,
		IonIcon
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import type { System } from "../lib/db/entities";
	import { getObjectURL } from "../lib/util/blob";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import { getFilteredSystems } from "../lib/db/tables/system.ts";

	const props = defineProps<{
		customTitle?: string,
		onlyOne?: boolean,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		modelValue?: System[],
		hideCheckboxes?: boolean
	}>();

	const emit = defineEmits<{
		"update:modelValue": [System[]],
	}>();

	const selectedSystems = reactive<System[]>([...props.modelValue || []]);
	const search = ref("");
	const systems = shallowRef<System[]>();

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "systems")
			void Array.fromAsync(getFilteredSystems(search.value)).then(res => systems.value = res);
	};

	watch(search, async () => {
		await updateSystems();
	});

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await updateSystems();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function updateSystems(){
		systems.value = (await Array.fromAsync(getFilteredSystems(search.value)))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	function check(system: System, checked: boolean){
		// hideCheckboxes implies onlyOne
		const onlyOne = props.onlyOne || props.hideCheckboxes;
		if(checked){
			if(onlyOne)
				selectedSystems.length = 0;
			selectedSystems.push(system);
		} else {
			const index = selectedSystems.findIndex(x => x.uuid === system.uuid);
			if(index > -1){
				if(selectedSystems.length === 1 && onlyOne){
					// selected the one who was already selected since we're in "selection mode"
					// we will just not uncheck it
					// (hideCheckboxes implies onlyOne)
					if(props.discardOnSelect){
						void modalController.dismiss();
						if(props.alwaysEmit)
							emit("update:modelValue", [...toRaw(selectedSystems)]);
					}
					return;
				}
				selectedSystems.splice(index, 1);
			}
		}

		emit("update:modelValue", [...toRaw(selectedSystems)]);

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
				<IonItem v-for="system in systems" :key="system.uuid" button>
					<IonAvatar slot="start">
						<img v-if="system?.image" aria-hidden="true" :src="getObjectURL(system.image)" />
						<IonIcon v-else :icon="accountCircle" />
					</IonAvatar>
					<IonCheckbox :value="system.uuid" :checked="!!selectedSystems.find(x => x.uuid === system.uuid)" @update:model-value="value => check(system, value)">
						<IonLabel>{{ system.name }}</IonLabel>
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-checkbox::part(container) {
		visibility: v-bind("!props.hideCheckboxes ? 'visible' : 'hidden'")
	}
</style>