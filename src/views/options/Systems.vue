<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonSearchbar,
		IonTitle,
		IonToolbar,
		IonFab,
		IonFabButton,
		IonIcon,
		IonBackButton,
		IonItemSliding,
		IonItemOptions,
		IonItemOption,
	} from "@ionic/vue";
	import { onBeforeMount, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { appConfig } from "../../lib/config/index.ts";
	import { accessibilityConfig } from "../../lib/config/index.ts";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import copyMD from "@material-symbols/svg-600/outlined/content_copy.svg";

	import type { System } from "../../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events.ts";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useRoute } from "vue-router";
	import { getFilteredSystems } from "../../lib/db/tables/system.ts";
	import SystemItem from "../../components/system/SystemItem.vue";
	import { toast } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";

	const route = useRoute();
	const i18next = useTranslation();

	const list = useTemplateRef("list");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name === "Systems" && route.query.q)
			search.value = route.query.q as string;
	});

	const systems = shallowRef<System[]>();
	const iter = shallowRef(getFilteredSystems(search.value));
	const iterDone = ref(false);

	watch(search, async () => {
		await resetSystems();
	});

	watch(appConfig, async () => {
		await resetSystems();
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "systems")
			void resetSystems();
	};

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

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function copyID(system: System){
		try{
			await window.navigator.clipboard.writeText(`@<s:${system.uuid}>`);
			await toast(i18next.t("systems:edit.systemIDcopiedToClipboard"));
			closeSlidingItems();
		}catch(_e){
			return;
		}
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" default-href="/options/" />
				<IonTitle>
					{{ $t("systems:header") }}
				</IonTitle>
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
			<IonList ref="list">
				<VirtualList :entries="systems" :min-size="72" :gap="2">
					<template #default="{ entry: system }">
						<IonItemSliding>
							<SystemItem

								:system
								show-icons
								show-effects
								button
								:smaller-avatar="accessibilityConfig.compactLists"
								:router-link="`/options/systems/edit?uuid=${system.uuid}`"
							/>
							<IonItemOptions>
								<IonItemOption color="tertiary" @click="copyID(system)">
									<IonIcon slot="icon-only" :icon="copyMD" />
								</IonItemOption>
							</IonItemOptions>
						</IonItemSliding>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollSystems" />

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/systems/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
