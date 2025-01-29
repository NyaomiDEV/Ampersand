import { createRouter, createWebHashHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import tabbedRoutes from "./tabbedRoutes";
import options from "./options";
import edit from "./edit";

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: "TabbedHomeView",
		component: () => import("../views/TabbedHomeView.vue"),
		children: [
			...tabbedRoutes
		]
	},
	{
		path: "/lock",
		name: "LockView",
		component: () => import("../views/LockView.vue"),
	},
	...options,
	...edit,
];

const router = createRouter({
	history: createWebHashHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;