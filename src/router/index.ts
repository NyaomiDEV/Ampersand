import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import options from "./options";
import edit from "./edit";
import lists from "./lists";
import onboarding from "./onboarding";

const routes: RouteRecordRaw[] = [
	{
		path: "/",
		name: "TabbedHomeView",
		component: () => import("../views/TabbedHomeView.vue"),
		children: [
			{
				path: "/tab/dashboard",
				name: "DashboardTab",
				component: () => import("../views/lists/Dashboard.vue"),
			},
			{
				path: "/tab/options",
				name: "OptionsTab",
				component: () => import("../views/Options.vue"),
			},
			...lists.map(x => ({ ...x, path: x.path.replace("lists", "tab"), name: `${x.name?.toString()}Tab` })),
		]
	},
	{
		path: "/lock",
		name: "LockView",
		component: () => import("../views/LockView.vue"),
	},
	{
		path: "/dbIsLoading",
		name: "DatabaseIsLoading",
		component: () => import("../views/DatabaseIsLoading.vue"),
	},
	...onboarding,
	...lists,
	...options,
	...edit,
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;