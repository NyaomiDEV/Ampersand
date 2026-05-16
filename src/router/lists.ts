import { RouteRecordRaw } from "vue-router";

const lists: RouteRecordRaw[] = [
	{
		path: "/lists/members",
		name: "Members",
		component: () => import("../views/lists/Members.vue"),
	},
	{
		path: "/lists/journal",
		name: "Journal",
		component: () => import("../views/lists/Journal.vue"),
	},
	{
		path: "/lists/systems",
		name: "Systems",
		component: () => import("../views/lists/Systems.vue"),
	},
	{
		path: "/lists/customFields",
		name: "CustomFields",
		component: () => import("../views/lists/CustomFields.vue"),
	},
	{
		path: "/lists/notes",
		name: "Notes",
		component: () => import("../views/lists/Notes.vue"),
	},
	{
		path: "/lists/frontHistory",
		name: "FrontHistory",
		component: () => import("../views/lists/FrontHistory.vue"),
	},
	{
		path: "/lists/messageBoard",
		name: "MessageBoard",
		component: () => import("../views/lists/MessageBoard.vue"),
	},
	{
		path: "/lists/tagManagement",
		name: "TagManagement",
		component: () => import("../views/lists/TagManagement.vue"),
	},
	{
		path: "/lists/assetManager",
		name: "AssetManager",
		component: () => import("../views/lists/AssetManager.vue"),
	},
	{
		path: "/lists/reminders",
		name: "Reminders",
		component: () => import("../views/lists/Reminders.vue"),
	},
	{
		path: "/lists/analytics",
		name: "Analytics",
		component: () => import("../views/lists/Analytics.vue"),
	},
	{
		path: "/lists/filterQueries",
		name: "FilterQueries",
		component: () => import("../views/lists/FilterQueries.vue"),
	}
];

export default lists;