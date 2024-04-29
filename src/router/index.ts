import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import TestingGrounds from "../views/TestingGrounds.vue";

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		redirect: '/testingGrounds', // TODO: make it home
	},
	{
		path: '/testingGrounds',
		name: 'testingGrounds',
		component: TestingGrounds,
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;