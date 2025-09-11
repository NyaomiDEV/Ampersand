import { RouteRecordRaw } from "vue-router";

const options: RouteRecordRaw[] = [
	{
		path: '/options/testingGrounds',
		name: 'TestingGrounds',
		component: () => import("../views/options/TestingGrounds.vue"),
	},
	{
		path: '/options/systemSettings',
		name: 'SystemSettings',
		component: () => import("../views/options/SystemSettings.vue"),
	},
	{
		path: '/options/customFields',
		name: 'CustomFields',
		component: () => import("../views/options/CustomFields.vue"),
	},
	{
		path: '/options/frontHistory',
		name: 'FrontHistory',
		component: () => import("../views/options/FrontHistory.vue"),
	},
	{
		path: '/options/messageBoard',
		name: 'MessageBoard',
		component: () => import("../views/options/MessageBoard.vue"),
	},
	{
		path: '/options/tagManagement',
		name: 'TagManagement',
		component: () => import("../views/options/TagManagement.vue"),
	},
	{
		path: '/options/assetManager',
		name: 'AssetManager',
		component: () => import("../views/options/AssetManager.vue"),
	},
	{
		path: '/options/reminders',
		name: 'Reminders',
		component: () => import("../views/options/Reminders.vue"),
	},
	{
		path: '/options/appSettings',
		name: 'AppSettings',
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
		name: 'ImportExport',
		component: () => import("../views/options/ImportExport.vue"),
	},
	{
		path: '/options/about',
		name: 'About',
		component: () => import("../views/options/About.vue"),
	},
];

export default options;