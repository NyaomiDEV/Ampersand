import { RouteRecordRaw } from "vue-router";

const tabbedRoutes: Array<RouteRecordRaw> = [
	{
		path: '/members',
		name: 'Members',
		component: () => import("../views/tabbed/Members.vue"),
	},
	{
		path: '/journal',
		name: 'Journal',
		component: () => import("../views/tabbed/Journal.vue"),
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: () => import("../views/tabbed/Dashboard.vue"),
	},
	{
		path: '/chats',
		name: 'Chats',
		component: () => import("../views/tabbed/Chats.vue"),
	},
	{
		path: '/options',
		name: 'Options',
		component: () => import("../views/tabbed/Options.vue"),
	},
	{
		path: '/testingGrounds',
		name: 'testingGrounds',
		component: () => import("../views/tabbed/TestingGrounds.vue"),
	},
];

export default tabbedRoutes;