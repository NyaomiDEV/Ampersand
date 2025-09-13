import { RouteRecordRaw } from "vue-router";

const standaloneRoutes: RouteRecordRaw[] = [
	{
		path: "/s/members",
		name: "StandaloneMembers",
		component: () => import("../views/Members.vue"),
	},
	{
		path: "/s/journal",
		name: "StandaloneJournal",
		component: () => import("../views/Journal.vue"),
	}
];

export default standaloneRoutes;