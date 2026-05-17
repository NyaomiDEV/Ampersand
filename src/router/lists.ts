import { RouteRecordRaw } from "vue-router";

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

type Lists = Omit<RouteRecordRaw, "path"> & {
	icon: string,
	iconSelected: string
};

export const lists: Record<string, Lists> = {
	members: {
		name: "Members",
		component: () => import("../views/lists/Members.vue"),
		icon: PeopleMD,
		iconSelected: PeopleFillMD
	},
	journal: {
		name: "Journal",
		component: () => import("../views/lists/Journal.vue"),
		icon: JournalMD,
		iconSelected: JournalFillMD
	},
	frontHistory: {
		name: "FrontHistory",
		component: () => import("../views/lists/FrontHistory.vue"),
		icon: FrontHistoryMD,
		iconSelected: FrontHistoryFillMD
	},
	analytics: {
		name: "Analytics",
		component: () => import("../views/lists/Analytics.vue"),
		icon: AnalyticsMD,
		iconSelected: AnalyticsFillMD
	},
	messageBoard: {
		name: "MessageBoard",
		component: () => import("../views/lists/MessageBoard.vue"),
		icon: MessageBoardMD,
		iconSelected: MessageBoardFillMD
	},
	systems: {
		name: "Systems",
		component: () => import("../views/lists/Systems.vue"),
		icon: SystemMD,
		iconSelected: SystemFillMD
	},
	tagManagement: {
		name: "TagManagement",
		component: () => import("../views/lists/TagManagement.vue"),
		icon: TagMD,
		iconSelected: TagFillMD
	},
	assetManager: {
		name: "AssetManager",
		component: () => import("../views/lists/AssetManager.vue"),
		icon: FolderMD,
		iconSelected: FolderFillMD
	},
	notes: {
		name: "Notes",
		component: () => import("../views/lists/Notes.vue"),
		icon: NotesMD,
		iconSelected: NotesFillMD
	},
	customFields: {
		name: "CustomFields",
		component: () => import("../views/lists/CustomFields.vue"),
		icon: CustomFieldsMD,
		iconSelected: CustomFieldsFillMD
	},
	reminders: {
		name: "Reminders",
		component: () => import("../views/lists/Reminders.vue"),
		icon: RemindersMD,
		iconSelected: RemindersFillMD
	},
	filterQueries: {
		name: "FilterQueries",
		component: () => import("../views/lists/FilterQueries.vue"),
		icon: FilterMD,
		iconSelected: FilterFillMD
	}
};
