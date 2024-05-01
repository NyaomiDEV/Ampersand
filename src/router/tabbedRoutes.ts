import { RouteRecordRaw } from "vue-router";

const tabbedRoutes: Array<RouteRecordRaw> = [
	{
		path: '/members',
		name: 'Members',
		component: await import("../views/tabbed/Members.vue"),
	},
	{
		path: '/journal',
		name: 'Journal',
		component: await import("../views/tabbed/Journal.vue"),
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: await import("../views/tabbed/Dashboard.vue"),
	},
	{
		path: '/chats',
		name: 'Chats',
		component: await import("../views/tabbed/Chats.vue"),
	},
	{
		path: '/options',
		name: 'Options',
		component: await import("../views/tabbed/Options.vue"),
	},
	{
		path: '/testingGrounds',
		name: 'testingGrounds',
		component: await import("../views/tabbed/TestingGrounds.vue"),
	},
];

export default tabbedRoutes;