import { RouteRecordRaw } from "vue-router";

const edit: Array<RouteRecordRaw> = [
	{
		path: "/members/edit",
		name: "MemberEdit",
		component: () => import("../views/edit/MemberEdit.vue")
	},
	{
		path: "/options/tagManagement/edit",
		name: "TagEdit",
		component: () => import("../views/edit/TagEdit.vue")
	},
	{
		path: "/options/reminders/edit",
		name: "ReminderEdit",
		component: () => import("../views/edit/ReminderEdit.vue")
	},
	{
		path: '/options/assetManager/edit',
		name: 'AssetEdit',
		component: () => import("../views/edit/AssetEdit.vue"),
	}
];

export default edit;