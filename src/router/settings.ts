import { RouteRecordRaw } from "vue-router";

const settings: Array<RouteRecordRaw> = [
	{
		path: '/options/system',
		name: 'System',
		component: (await import("../views/options/System.vue")).default,
	},
	{
		path: '/options/front_history',
		name: 'Front History',
		component: (await import("../views/options/FrontHistory.vue")).default,
	},
	{
		path: '/options/message_board',
		name: 'Message Board',
		component: (await import("../views/options/MessageBoard.vue")).default,
	},
	{
		path: '/options/tag_management',
		name: 'Message Board',
		component: (await import("../views/options/TagManagement.vue")).default,
	},
	{
		path: '/options/reminders',
		name: 'Reminders',
		component: (await import("../views/options/Reminders.vue")).default,
	},
	{
		path: '/options/accessibility',
		name: 'Accessibility',
		component: (await import("../views/options/Accessibility.vue")).default,
	},
	{
		path: '/options/about',
		name: 'About',
		component: () => import("../views/options/About.vue"),
	},
];

export default settings;