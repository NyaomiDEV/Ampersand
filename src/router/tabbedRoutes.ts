import { RouteRecordRaw } from "vue-router";

const tabbedRoutes: Array<RouteRecordRaw> = [
	{
		path: '/members',
		name: 'Members',
		component: () => import("../views/tabbed/Members.vue"),
		props: route => ({ q: route.query.q })
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
	}
];

export default tabbedRoutes;