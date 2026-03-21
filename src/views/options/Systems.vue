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
	} from "@ionic/vue";
	import { onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import { appConfig, accessibilityConfig } from "../../lib/config/index.ts";
	import Avatar from "../../components/Avatar.vue";

	import systemCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import defaultMD from "@material-symbols/svg-600/outlined/bookmark_star.svg";
	import pinMD from "@material-symbols/svg-600/outlined/keep.svg";
	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";

	import type { System } from "../../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events.ts";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { useRoute } from "vue-router";
	import { getFilteredSystems } from "../../lib/db/tables/system.ts";
	import { useBlob } from "../../lib/util/blob.ts";

	const { getObjectURL } = useBlob();
	const route = useRoute();

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

	function getStyle(system: System){
		const style: Record<string, string> = {};

		if(system.cover)
			style["--data-cover"] = `url(${getObjectURL(system.cover)})`;

		return style;
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
			<IonList :class="{ compact: accessibilityConfig.disableCovers }">
				<IonItem
					v-for="system in systems"
					:key="system.uuid"
					button
					:class="{ 'default-system': system.uuid === appConfig.defaultSystem, archived: system.isArchived }"
					:style="getStyle(system)"
					:router-link="`/options/systems/edit?uuid=${system.uuid}`"
				>
					<Avatar
						slot="start"
						:image="system.image"
						:clip-shape="system.imageClip"
						:color="system.color"
						:icon="systemCircle"
					/>
					<IonLabel>
						{{ system.name }}
					</IonLabel>
					<IonIcon v-if="appConfig.defaultSystem === system.uuid" slot="end" :icon="defaultMD" />
					<IonIcon v-if="system.isPinned" slot="end" :icon="pinMD" />
					<IonIcon v-if="system.isArchived" slot="end" :icon="archivedMD" />
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

	ion-list:not(.compact) ion-item::part(native)::before {
		content: '\A';
		background-image: var(--data-cover);
		background-position: center;
		background-size: cover;
		width: calc(100% + 16px);
		height: 100%;
		display: block;
		position: absolute;
		z-index: -1;
		left: -16px;
		opacity: .25;
		mask-image: radial-gradient(circle at 10% 100%, black, transparent 100%);
	}
</style>