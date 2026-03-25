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

	const route = useRoute();
	const i18next = useTranslation();

	const list = useTemplateRef("list");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name === "Systems" && route.query.q)
			search.value = route.query.q as string;
	});

	const systems = shallowRef<System[]>();

	watch(search, async () => {
		await updateSystems();
	});

	watch(appConfig, async () => {
		await updateSystems();
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "systems")
			void updateSystems();
	};

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
				if (a.uuid === appConfig.defaultSystem) return -1;
				if (b.uuid === appConfig.defaultSystem) return 1;

				if (a.isPinned && !b.isPinned) return -1;
				if (!a.isPinned && b.isPinned) return 1;

				return a.name.localeCompare(b.name);
			});
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
				<IonItemSliding
					v-for="system in systems"
					:key="system.uuid"
				>
					<SystemItem

						:system
						show-icons
						show-effects
						button
						:router-link="`/options/systems/edit?uuid=${system.uuid}`"
					/>
					<IonItemOptions>
						<IonItemOption color="tertiary" @click="copyID(system)">
							<IonIcon slot="icon-only" :icon="copyMD" />
						</IonItemOption>
					</IonItemOptions>
				</IonItemSliding>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/systems/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
