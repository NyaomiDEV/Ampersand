<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonModal,
		IonSearchbar,
		modalController,
		IonList,
		IonFab,
		IonFabButton,
		IonIcon
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, ref, shallowRef, toRaw, watch } from "vue";
	import type { Asset } from "../lib/db/entities";
	import { getFilteredAssets } from "../lib/db/tables/assets.ts";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";
	import AssetItem from "../components/asset/AssetItem.vue";
	import TheresNothingHere from "../components/TheresNothingHere.vue";

	import checkMD from "@material-symbols/svg-600/rounded/check.svg";

	const props = defineProps<{
		customTitle?: string,
		onlyOne?: boolean,
		alwaysEmit?: boolean,
		discardOnSelect?: boolean,
		hideFab?: boolean,
		modelValue?: Asset[],
		hideCheckboxes?: boolean
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Asset[]],
	}>();

	const selectedAssets = shallowRef<Asset[]>([...props.modelValue || []]);
	const search = ref("");
	const assets = shallowRef<Asset[]>();
	const iter = shallowRef<AsyncGenerator<Asset>>();
	const iterDone = ref(false);

	watch(props, () => {
		selectedAssets.value = [...props.modelValue || []];
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "assets")
			void resetAssets();
	};

	watch(search, async () => {
		await resetAssets();
	});
	
	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetAssets();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	function emitFiltered(assets: Asset[]){
		return emit("update:modelValue", assets);
	}

	async function resetAssets(){
		assets.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredAssets(search.value);
		await pollAssets();
	}

	async function pollAssets(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _ass: Asset[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _ass.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!assets.value)
			assets.value = _ass;
		else
			assets.value = [...assets.value, ..._ass];

		cb?.();
	}

	function check(asset: Asset, checked: boolean){
		// hideCheckboxes implies onlyOne
		const onlyOne = props.onlyOne || props.hideCheckboxes;
		if(checked){
			if(onlyOne)
				selectedAssets.value.length = 0;
			selectedAssets.value.push(asset);
		} else {
			const index = selectedAssets.value.findIndex(x => x.uuid === asset.uuid);
			if(index > -1){
				if(selectedAssets.value.length === 1 && onlyOne){
					// selected the one who was already selected since we're in "selection mode"
					// we will just not uncheck it
					// (hideCheckboxes implies onlyOne)
					if(props.discardOnSelect){
						void modalController.dismiss();
						if(props.alwaysEmit)
							emitFiltered([...toRaw(selectedAssets.value)]);
					}
					return;
				}
				selectedAssets.value.splice(index, 1);
			}
		}

		emitFiltered([...toRaw(selectedAssets.value)]);

		if(onlyOne && props.discardOnSelect)
			void modalController.dismiss();
	}
</script>

<template>
	<IonModal class="asset-select-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("assetManager:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('assetManager:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!assets" />
		<IonContent v-else>
			<TheresNothingHere v-if="!assets.length" />
			<IonList v-else>
				<VirtualList :entries="assets" :min-size="86" :gap="2">
					<template #default="{ entry: asset }">
						<AssetItem
							:key="asset.uuid"
							show-thumbnail
							show-tags
							:asset
							has-toggle="checkbox"
							:toggle-value="asset.uuid"
							:toggle-checked="!!selectedAssets.find(x => x.uuid === asset.uuid)"
							@toggle-update="value => check(asset, value)"
						/>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollAssets" />

			<IonFab
				v-if="!props.hideFab && !props.discardOnSelect"
				slot="fixed"
				vertical="bottom"
				horizontal="end"
			>
				<IonFabButton @click="modalController.dismiss('confirm')">
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