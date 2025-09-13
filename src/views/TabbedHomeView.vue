<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon, useIonRouter } from "@ionic/vue";

	import PeopleMD from "@material-symbols/svg-600/outlined/group.svg";
	import JournalMD from "@material-symbols/svg-600/outlined/book.svg";
	import HomeMD from "@material-symbols/svg-600/outlined/home.svg";
	import OptionsMD from "@material-symbols/svg-600/outlined/menu.svg";
	import { slideAnimation } from "../lib/util/misc";
	import { useRoute } from "vue-router";
	import { ref, useTemplateRef } from "vue";

	const router = useIonRouter();
	const route = useRoute();

	const tabBar = useTemplateRef("tabBar");

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
		<IonTabs>
			<IonRouterOutlet />

			<IonTabBar slot="bottom" ref="tabBar">
				<IonTabButton tab="members" href="/members" @click="clickReplaceHandler('/members')">
					<IonIcon :icon="PeopleMD" />
					{{ $t("members:header") }}
				</IonTabButton>

				<IonTabButton tab="journal" href="/journal" @click="clickReplaceHandler('/journal')">
					<IonIcon :icon="JournalMD" />
					{{ $t("journal:header") }}
				</IonTabButton>

				<IonTabButton tab="dashboard" href="/dashboard" @click="clickReplaceHandler('/dashboard')">
					<IonIcon :icon="HomeMD" />
					{{ $t("dashboard:header") }}
				</IonTabButton>

				<IonTabButton tab="options" href="/options" @click="clickReplaceHandler('/options')">
					<IonIcon :icon="OptionsMD" />
					{{ $t("options:header") }}
				</IonTabButton>
			</IonTabBar>
		</IonTabs>
	</IonPage>
</template>
