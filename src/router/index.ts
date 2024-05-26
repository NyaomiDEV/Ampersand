import { createRouter, createWebHashHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import tabbedRoutes from "./tabbedRoutes";
import settings from "./settings";

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: "TabbedHomeView",
		component: () => import("../views/TabbedHomeView.vue"),
		children: [
			{
				path: "/",
				redirect: "/dashboard"
			},
			...tabbedRoutes
		]
	}, 
	...settings,
];

const router = createRouter({
	history: createWebHashHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;