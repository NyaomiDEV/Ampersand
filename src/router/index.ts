import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import tabbedRoutes from "./tabbedRoutes";
import options from "./options";
import edit from "./edit";
import standaloneRoutes from "./standaloneRoutes";
import onboarding from "./onboarding";

const routes: RouteRecordRaw[] = [
	{
		path: "/",
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
	...onboarding,
	...standaloneRoutes,
	...options,
	...edit,
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;