import { RouteRecordRaw } from "vue-router";

const options: Array<RouteRecordRaw> = [
	{
		path: '/options/testingGrounds',
		name: 'Testing grounds',
		component: () => import("../views/options/TestingGrounds.vue"),
	},
	{
		path: '/options/systemSettings',
		name: 'System Settings',
		component: () => import("../views/options/SystemSettings.vue"),
	},
	{
		path: '/options/frontHistory',
		name: 'Front History',
		component: () => import("../views/options/FrontHistory.vue"),
	},
	{
		path: '/options/messageBoard',
		name: 'Message Board',
		component: () => import("../views/options/MessageBoard.vue"),
	},
	{
		path: '/options/tagManagement',
		name: 'Tag Management',
		component: () => import("../views/options/TagManagement.vue"),
	},
	{
		path: '/options/assetManager',
		name: 'Asset Manager',
		component: () => import("../views/options/AssetManager.vue"),
	},
	{
		path: '/options/reminders',
		name: 'Reminders',
		component: () => import("../views/options/Reminders.vue"),
	},
	{
		path: '/options/appSettings',
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
		path: '/options/importExport',
		name: 'Import / Export',
		component: () => import("../views/options/ImportExport.vue"),
	},
	{
		path: '/options/about',
		name: 'About',
		component: () => import("../views/options/About.vue"),
	},
];

export default options;