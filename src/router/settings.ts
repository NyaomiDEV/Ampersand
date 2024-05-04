import { RouteRecordRaw } from "vue-router";

const settings: Array<RouteRecordRaw> = [
	{
		path: '/options/about',
		name: 'About',
		component: (await import("../views/options/About.vue")).default,
	},
];

export default settings;