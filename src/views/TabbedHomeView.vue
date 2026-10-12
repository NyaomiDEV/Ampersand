<script setup lang="ts">
	import { IonPage, IonTabs, IonTabBar, IonRouterOutlet, IonTabButton, IonIcon, useIonRouter } from "@ionic/vue";
	import { slideAnimation } from "../lib/util/misc";
	import { useRoute } from "vue-router";
	import { h, ref, useTemplateRef, FunctionalComponent } from "vue";
	import { appConfig } from "../lib/config";

	import HomeMD from "@material-symbols/svg-600/rounded/home.svg";
	import OptionsMD from "@material-symbols/svg-600/rounded/menu.svg";

	import HomeFillMD from "@material-symbols/svg-600/rounded/home-fill.svg";
	import OptionsFillMD from "@material-symbols/svg-600/rounded/menu-fill.svg";
	import { lists } from "../router/lists";
	import { useTranslation } from "i18next-vue";

	const router = useIonRouter();
	const route = useRoute();
	const i18next = useTranslation();

	const allPossibleTabs = {
		dashboard: { icon: HomeMD, iconSelected: HomeFillMD },
		options: { icon: OptionsMD, iconSelected: OptionsFillMD },

		...lists
	};

	const tabBar = useTemplateRef("tabBar");
	const currentTab = ref<string>("");

	const AmpersandTabBar: FunctionalComponent<{ currentTab: string, tabOrder: string[] }> = (props) => 
		h(IonTabBar, {
			slot: "bottom",
		}, () => [
			...props.tabOrder.map(x => h(IonTabButton, {
				tab: x,
				ariaLabel: i18next.t(`${x}:header`),
				href: `/tab/${x}`,
				onClick: () => navigateTo(`/tab/${x}`)
			}, () => [
				h(IonIcon, {
					icon: props.currentTab === x ? allPossibleTabs[x].iconSelected : allPossibleTabs[x].icon
				}),
			])),
			h(IonTabButton, {
				tab: "options",
				ariaLabel: i18next.t("options:header"),
				href: "/tab/options",
				onClick: () => navigateTo("/tab/options"),
			}, () => [
				h(IonIcon, {
					icon: props.currentTab === "options" ? OptionsFillMD : OptionsMD
				}),
			])
		]);

	AmpersandTabBar.props = {
		currentTab: {
			type: String
		},
		tabOrder: {
			type: Array
		}
	};

	function navigateTo(location: string){
		const children: globalThis.HTMLIonTabButtonElement[] = Array.from(tabBar.value.children);
		const prevIndex = children.findIndex(x => x.href === route.path);
		const curIndex = children.findIndex(x => x.href === location);

		return router.navigate(location, prevIndex > curIndex ? "back" : "forward", "replace", slideAnimation);
	}
</script>

<template>
	<IonPage>
		<IonTabs @ion-tabs-did-change="currentTab = $event.tab">
			<IonRouterOutlet />

			<AmpersandTabBar
				ref="tabBar"
				:tab-order="appConfig.tabOrder"
				:current-tab
			/>
		</IonTabs>
	</IonPage>
</template>
