import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import tabbedRoutes from "./tabbedRoutes";

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
	}
];

console.log(routes);

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;