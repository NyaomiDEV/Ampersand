import { RouteRecordRaw } from "vue-router";

const edit: Array<RouteRecordRaw> = [
	{
		path: "/members/edit",
		name: "Member Edit",
		component: () => import("../views/edit/MemberEdit.vue")
	},
	{
		path: "/options/tagManagement/edit",
		name: "Tag Edit",
		component: () => import("../views/edit/TagEdit.vue")
	},
	{
		path: "/options/reminders/edit",
		name: "Reminder Edit",
		component: () => import("../views/edit/ReminderEdit.vue")
	},
	{
		path: '/options/assetManager/edit',
		name: 'Asset Edit',
		component: () => import("../views/edit/AssetEdit.vue"),
	}
];

export default edit;