import { RouteRecordRaw } from "vue-router";

const settings: Array<RouteRecordRaw> = [
	{
		path: '/options/system',
		name: 'System',
		component: () => import("../views/options/System.vue"),
	},
	{
		path: '/options/front_history',
		name: 'Front History',
		component: () => import("../views/options/FrontHistory.vue"),
	},
	{
		path: '/options/message_board',
		name: 'Message Board',
		component: () => import("../views/options/MessageBoard.vue"),
	},
	{
		path: '/options/tag_management',
		name: 'Message Board',
		component: () => import("../views/options/TagManagement.vue"),
	},
	{
		path: '/options/reminders',
		name: 'Reminders',
		component: () => import("../views/options/Reminders.vue"),
	},
	{
		path: '/options/app_settings',
		name: 'App Settings',
		component: () => import("../views/options/AppSettings.vue"),
	},
	{
		path: '/options/security',
		name: 'Security',
		component: () => import("../views/options/Security.vue"),
	},
	{
		path: '/options/accessibility',
		name: 'Accessibility',
		component: () => import("../views/options/Accessibility.vue"),
	},
	{
		path: '/options/about',
		name: 'About',
		component: () => import("../views/options/About.vue"),
	},
];

export default settings;