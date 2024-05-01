import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import TestingGrounds from "./views/tabbed/TestingGrounds.vue";
import TabbedHomeView from "./views/TabbedHomeView.vue";
import Dashboard from "./views/tabbed/Dashboard.vue";
import Members from "./views/tabbed/Members.vue";
import Journal from "./views/tabbed/Journal.vue";
import Chats from "./views/tabbed/Chats.vue";
import Options from "./views/tabbed/Options.vue";

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: "TabbedHomeView",
		component: TabbedHomeView,
		children: [
			{
				path: "/",
				redirect: "/dashboard"
			},
			{
				path: '/members',
				name: 'Members',
				component: Members,
			},
			{
				path: '/journal',
				name: 'Journal',
				component: Journal,
			},
			{
				path: '/dashboard',
				name: 'Dashboard',
				component: Dashboard,
			},
			{
				path: '/chats',
				name: 'Chats',
				component: Chats,
			},
			{
				path: '/options',
				name: 'Options',
				component: Options,
			},
			{
				path: '/testingGrounds',
				name: 'testingGrounds',
				component: TestingGrounds,
			},
		]
	}
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;