import { RouteRecordRaw } from "vue-router";

const tabbedRoutes: RouteRecordRaw[] = [
	{
		path: '/members',
		name: 'Members',
		component: () => import("../views/Members.vue"),
	},
	{
		path: '/journal',
		name: 'Journal',
		component: () => import("../views/Journal.vue"),
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: () => import("../views/Dashboard.vue"),
	},
	{
		path: '/chats',
		name: 'Chats',
		component: () => import("../views/Chats.vue"),
	},
	{
		path: '/options',
		name: 'Options',
		component: () => import("../views/Options.vue"),
	}
];

export default tabbedRoutes;