<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon, useIonRouter } from "@ionic/vue";

	import PeopleMD from "@material-symbols/svg-600/rounded/group.svg";
	import JournalMD from "@material-symbols/svg-600/rounded/book.svg";
	import HomeMD from "@material-symbols/svg-600/rounded/home.svg";
	import OptionsMD from "@material-symbols/svg-600/rounded/menu.svg";
	import PeopleFillMD from "@material-symbols/svg-600/rounded/group-fill.svg";
	import JournalFillMD from "@material-symbols/svg-600/rounded/book-fill.svg";
	import HomeFillMD from "@material-symbols/svg-600/rounded/home-fill.svg";
	import OptionsFillMD from "@material-symbols/svg-600/rounded/menu-fill.svg";

	import { slideAnimation } from "../lib/util/misc";
	import { useRoute } from "vue-router";
	import { ref, useTemplateRef } from "vue";

	const router = useIonRouter();
	const route = useRoute();

	const tabBar = useTemplateRef("tabBar");
	const currentTab = ref();

	// store a value to pass by ref to the cached animation
	const directionOverride = ref("forward");

	function clickReplaceHandler(location){
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const prevIndex = tabBar.value!.tabVnodes.findIndex(x => x.props?.href === route.path);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const curIndex = tabBar.value!.tabVnodes.findIndex(x => x.props?.href === location);

		// we control the value here so we can update it
		directionOverride.value = prevIndex > curIndex ? "back" : "forward";

		router.replace(
			location,
			// THIS ARROW FUNCTION GETS CACHED!
			(el, opts) => 
				// pass directionOverride here so that we have a ref to a value we can control
				slideAnimation(el, opts, directionOverride)
				// and just like this the direction is under our control
			
		);
	}

</script>

<template>
	<IonPage>
		<IonTabs @ion-tabs-did-change="currentTab = $event.tab">
			<IonRouterOutlet />

			<IonTabBar slot="bottom" ref="tabBar">
				<IonTabButton tab="members" href="/tab/members" @click="clickReplaceHandler('/tab/members')">
					<IonIcon :icon="currentTab === 'members' ? PeopleFillMD : PeopleMD" />
					{{ $t("members:header") }}
				</IonTabButton>

				<IonTabButton tab="journal" href="/tab/journal" @click="clickReplaceHandler('/tab/journal')">
					<IonIcon :icon="currentTab === 'journal' ? JournalFillMD : JournalMD" />
					{{ $t("journal:header") }}
				</IonTabButton>

				<IonTabButton tab="dashboard" href="/tab/dashboard" @click="clickReplaceHandler('/tab/dashboard')">
					<IonIcon :icon="currentTab === 'dashboard' ? HomeFillMD : HomeMD" />
					{{ $t("dashboard:header") }}
				</IonTabButton>

				<IonTabButton tab="options" href="/tab/options" @click="clickReplaceHandler('/tab/options')">
					<IonIcon :icon="currentTab === 'options' ? OptionsFillMD : OptionsMD" />
					{{ $t("options:header") }}
				</IonTabButton>
			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>
