import { RouteRecordRaw } from "vue-router";

const options: RouteRecordRaw[] = [
	{
		path: "/options/testingGrounds",
		name: "TestingGrounds",
		component: () => import("../views/options/TestingGrounds.vue"),
	},
	{
		path: "/options/appSettings",
		name: "AppSettings",
		component: () => import("../views/options/AppSettings.vue"),
	},
	{
		path: "/options/security",
		name: "Security",
		component: () => import("../views/options/Security.vue"),
	},
	{
		path: "/options/accessibility",
		name: "Accessibility",
		component: () => import("../views/options/Accessibility.vue"),
	},
	{
		path: "/options/importExport",
		name: "ImportExport",
		component: () => import("../views/options/ImportExport.vue"),
	},
	{
		path: "/options/resources",
		name: "Resources",
		component: () => import("../views/options/Resources.vue"),
	},
	{
		path: "/options/about",
		name: "About",
		component: () => import("../views/options/About.vue"),
	},
];

export default options;