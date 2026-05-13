import { RouteRecordRaw } from "vue-router";

const edit: RouteRecordRaw[] = [
	{
		path: "/edit/member",
		name: "MemberEdit",
		component: () => import("../views/edit/MemberEdit.vue")
	},
	{
		path: "/edit/journal",
		name: "JournalEdit",
		component: () => import("../views/edit/JournalEdit.vue")
	},
	{
		path: "/edit/system",
		name: "SystemEdit",
		component: () => import("../views/edit/SystemEdit.vue"),
	},
	{
		path: "/edit/tags",
		name: "TagEdit",
		component: () => import("../views/edit/TagEdit.vue")
	},
	{
		path: "/edit/reminder",
		name: "ReminderEdit",
		component: () => import("../views/edit/ReminderEdit.vue")
	},
	{
		path: "/edit/asset",
		name: "AssetEdit",
		component: () => import("../views/edit/AssetEdit.vue"),
	}
];

export default edit;