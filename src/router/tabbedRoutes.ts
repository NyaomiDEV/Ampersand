import { RouteRecordRaw } from "vue-router";

const tabbedRoutes: Array<RouteRecordRaw> = [
	{
		path: '/members',
		name: 'Members',
		component: (await import("../views/tabbed/Members.vue")).default,
	},
	{
		path: '/journal',
		name: 'Journal',
		component: (await import("../views/tabbed/Journal.vue")).default,
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: (await import("../views/tabbed/Dashboard.vue")).default,
	},
	{
		path: '/chats',
		name: 'Chats',
		component: (await import("../views/tabbed/Chats.vue")).default,
	},
	{
		path: '/options',
		name: 'Options',
		component: (await import("../views/tabbed/Options.vue")).default,
	},
	{
		path: '/testingGrounds',
		name: 'testingGrounds',
		component: (await import("../views/tabbed/TestingGrounds.vue")).default,
	},
];

export default tabbedRoutes;