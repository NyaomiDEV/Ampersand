import { RouteRecordRaw } from "vue-router";

const edit: Array<RouteRecordRaw> = [
	{
		path: "/options/reminders/edit",
		props: route => {
			console.log({...route});
			return { uuid: route.query.uuid }
		},
		name: "Reminder Edit",
		component: () => import("../views/edit/ReminderEdit.vue")
	}
];

export default edit;