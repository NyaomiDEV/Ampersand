import { RouteRecordRaw } from "vue-router";

const standaloneRoutes: Array<RouteRecordRaw> = [
	{
		path: '/s/members',
		name: 'StandaloneMembers',
		component: () => import("../views/Members.vue"),
	},
	{
		path: '/s/journal',
		name: 'StandaloneJournal',
		component: () => import("../views/Journal.vue"),
	},
	{
		path: '/s/chats',
		name: 'StandaloneChats',
		component: () => import("../views/Chats.vue"),
	}
];

export default standaloneRoutes;