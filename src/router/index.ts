import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import TabbedHomeView from "../views/TabbedHomeView.vue";
import tabbedRoutes from "./tabbedRoutes";

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
			...tabbedRoutes
		]
	}
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;