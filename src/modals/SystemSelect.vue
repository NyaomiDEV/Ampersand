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
	import type { SQLFile, System } from "../lib/db/entities";
	import { getObjectURL } from "../lib/util/blob";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import systemCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import { getFilteredSystems } from "../lib/db/tables/system.ts";
	import { appConfig } from "../lib/config/index.ts";

	const props = defineProps<{
		customTitle?: string,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		modelValue?: System,
		hideCheckboxes?: boolean
	}>();

	const emit = defineEmits<{
		"update:modelValue": [System],
	}>();

	const selectedSystem = shallowRef<System | undefined>(props.modelValue);
	const search = ref("");
	const systems = shallowRef<System[]>();
	const systemImages = reactive(new Map<string, string>());

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "systems")
			void Array.fromAsync(getFilteredSystems(search.value)).then(res => systems.value = res);
	};

	watch(search, async () => {
		await updateSystems();
	});

	watch(appConfig, async () => {
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
			.sort((a, b) => {
				if (a.id === appConfig.defaultSystem) return -1;
				if (b.id === appConfig.defaultSystem) return 1;

				return a.name.localeCompare(b.name);
			});
		systemImages.clear();
		for(const system of systems.value)
			if(system.image) systemImages.set(system.image.id, await getObjectURL(system.image as SQLFile));
	}

	function check(system: System){
		if(selectedSystem.value?.id !== system.id){
			selectedSystem.value = system;

			emit("update:modelValue", toRaw(selectedSystem.value));
		} else {
			if(props.alwaysEmit && selectedSystem.value)
				emit("update:modelValue", toRaw(selectedSystem.value));
		}

		if(props.discardOnSelect)
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
				<IonItem
					v-for="system in systems"
					:key="system.id"
					button
					:class="{ 'default-system': system.id === appConfig.defaultSystem }"
				>
					<IonAvatar slot="start">
						<img v-if="system.image" aria-hidden="true" :src="systemImages.get(system.image.id)" />
						<IonIcon v-else :icon="systemCircle" />
					</IonAvatar>
					<IonCheckbox :value="system.id" :checked="selectedSystem?.id === system.id" @update:model-value="check(system)">
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

	ion-avatar > ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}

	ion-item.default-system {
		--background: var(--ion-background-color-step-150);
	}
</style>