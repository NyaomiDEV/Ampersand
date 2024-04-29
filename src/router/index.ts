import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import TestingGrounds from "../views/tabbed/TestingGrounds.vue";
import TabbedHomeView from "../views/TabbedHomeView.vue";
import Dashboard from "../views/tabbed/Dashboard.vue";

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
				path: '/dashboard',
				name: 'Dashboard',
				component: Dashboard,
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