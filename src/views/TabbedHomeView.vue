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

	import PeopleMD from "@material-symbols/svg-600/rounded/group.svg";
	import JournalMD from "@material-symbols/svg-600/rounded/book.svg";
	import SystemMD from "@material-symbols/svg-600/rounded/groups.svg";
	import FrontHistoryMD from "@material-symbols/svg-600/rounded/show_chart.svg";
	import MessageBoardMD from "@material-symbols/svg-600/rounded/newsmode.svg";
	import TagMD from "@material-symbols/svg-600/rounded/sell.svg";
	import RemindersMD from "@material-symbols/svg-600/rounded/notification_add.svg";
	import AnalyticsMD from "@material-symbols/svg-600/rounded/bar_chart.svg";
	import FolderMD from "@material-symbols/svg-600/rounded/folder_open.svg";
	import CustomFieldsMD from "@material-symbols/svg-600/rounded/format_list_bulleted_add.svg";
	import NotesMD from "@material-symbols/svg-600/rounded/note_stack.svg";
	import FilterMD from "@material-symbols/svg-600/rounded/database_search.svg";

	import PeopleFillMD from "@material-symbols/svg-600/rounded/group-fill.svg";
	import JournalFillMD from "@material-symbols/svg-600/rounded/book-fill.svg";
	import SystemFillMD from "@material-symbols/svg-600/rounded/groups-fill.svg";
	import FrontHistoryFillMD from "@material-symbols/svg-600/rounded/show_chart-fill.svg";
	import MessageBoardFillMD from "@material-symbols/svg-600/rounded/newsmode-fill.svg";
	import TagFillMD from "@material-symbols/svg-600/rounded/sell-fill.svg";
	import RemindersFillMD from "@material-symbols/svg-600/rounded/notification_add-fill.svg";
	import AnalyticsFillMD from "@material-symbols/svg-600/rounded/bar_chart-fill.svg";
	import FolderFillMD from "@material-symbols/svg-600/rounded/folder_open-fill.svg";
	import CustomFieldsFillMD from "@material-symbols/svg-600/rounded/format_list_bulleted_add-fill.svg";
	import NotesFillMD from "@material-symbols/svg-600/rounded/note_stack-fill.svg";
	import FilterFillMD from "@material-symbols/svg-600/rounded/database_search-fill.svg";

	const router = useIonRouter();
	const route = useRoute();

	const allPossibleTabs = {
		dashboard: { icon: HomeMD, iconSelected: HomeFillMD },
		options: { icon: OptionsMD, iconSelected: OptionsFillMD },

		members: { icon: PeopleMD, iconSelected: PeopleFillMD },
		journal: { icon: JournalMD, iconSelected: JournalFillMD },
		frontHistory: { icon: FrontHistoryMD, iconSelected: FrontHistoryFillMD },
		analytics: { icon: AnalyticsMD, iconSelected: AnalyticsFillMD },
		messageBoard: { icon: MessageBoardMD, iconSelected: MessageBoardFillMD },
		systems: { icon: SystemMD, iconSelected: SystemFillMD },
		tagManagement: { icon: TagMD, iconSelected: TagFillMD },
		assetManager: { icon: FolderMD, iconSelected: FolderFillMD },
		notes: { icon: NotesMD, iconSelected: NotesFillMD },
		customFields: { icon: CustomFieldsMD, iconSelected: CustomFieldsFillMD },
		reminders: { icon: RemindersMD, iconSelected: RemindersFillMD },
		filterQueries: { icon: FilterMD, iconSelected: FilterFillMD }
	};

	const tabBar = useTemplateRef("tabBar");
	const currentTab = ref<string>("");

	const AmpersandTabBar: FunctionalComponent<{ currentTab: string, tabOrder: string[] }> = (props) => 
		h(IonTabBar, {
			slot: "bottom",
		}, () => [
			...props.tabOrder.map(x => h(IonTabButton, {
				tab: x,
				href: `/tab/${x}`,
				_onClick: () => clickReplaceHandler(`/tab/${x}`)
			}, () => [
				h(IonIcon, {
					icon: props.currentTab === x ? allPossibleTabs[x].iconSelected : allPossibleTabs[x].icon
				}),
			])),
			h(IonTabButton, {
				tab: "options",
				href: "/tab/options",
				_onClick: () => clickReplaceHandler("/tab/options"),
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

			<AmpersandTabBar
				ref="tabBar"
				:tab-order="appConfig.tabOrder"
				:current-tab
			/>
		</IonTabs>
	</IonPage>
</template>
