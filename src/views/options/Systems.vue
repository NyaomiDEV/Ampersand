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
		IonItem,
		IonLabel,
		IonBackButton,
		IonAvatar,
	} from "@ionic/vue";
	import { onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import { appConfig } from "../../lib/config/index.ts";

	import systemCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import defaultMD from "@material-symbols/svg-600/outlined/bookmark_star.svg";

	import type { System } from "../../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events.ts";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useRoute } from "vue-router";
	import { getFilteredSystems } from "../../lib/db/tables/system.ts";
	import { getObjectURL } from "../../lib/util/blob.ts";

	const route = useRoute();

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.query.q)
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

				return a.name.localeCompare(b.name);
			});
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :icon="backMD" default-href="/options/" />
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
			<IonList>
				<IonItem
					v-for="system in systems"
					:key="system.uuid"
					button
					:class="{ 'default-system': system.uuid === appConfig.defaultSystem }"
					:router-link="`/options/systems/edit?uuid=${system.uuid}`"
				>
					<IonAvatar slot="start">
						<img v-if="system.image" aria-hidden="true" :src="getObjectURL(system.image)" />
						<IonIcon v-else :icon="systemCircle" />
					</IonAvatar>
					<IonLabel>
						{{ system.name }}
					</IonLabel>
					<IonIcon v-if="appConfig.defaultSystem === system.uuid" slot="end" :icon="defaultMD" />
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/systems/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}

	ion-item ion-avatar {
		width: 56px;
		height: 56px;
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