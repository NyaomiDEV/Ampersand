// Vue and Ionic
import { createApp } from "vue";
import { IonicVue } from "@ionic/vue";

// Router
import router from "./router";

// Localizations
import i18n from "./lib/i18n";
import I18NextVue from "i18next-vue";

// Dark mode
import { updateAccessibility, updateDarkMode, updateInsets, updatePWATitlebarColor } from "./lib/mode";

// App
import App from "./App.vue";

// Core CSS required for Ionic components to work properly
import '@ionic/vue/css/core.css';

// Basic CSS for apps built with Ionic
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

// Optional CSS utils that can be commented out
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

// Dark mode CSS class
import '@ionic/vue/css/palettes/dark.class.css';

// Import fonts
import "./styles/fonts/fonts.css";

// Our CSS overrides
import "./styles/override.css";

// Branding theme
import { activateMaterialTheme, updateMaterialColors } from "./lib/theme";
import "./lib/theme/style.css";

import { tryPersistStorage } from "./lib/util/storageManager";
import { getSystem, newSystem } from "./lib/db/tables/system";
import { appConfig } from "./lib/config";
import { getLockedStatus } from "./lib/applock";
import { RouteLocationNormalizedGeneric } from "vue-router";

const app = createApp(App).use(IonicVue, {
	hardwareBackButton: true
}).use(router).use(I18NextVue, { i18next: i18n });

let wantedRoute: RouteLocationNormalizedGeneric | undefined;
router.beforeEach((to) => {
	if (getLockedStatus()) {
		if (to.path === "/lock")
			return true;

		wantedRoute = to;

		return { path: "/lock" };
	}

	if (to.fullPath === "/" || to.path === "/lock") {

		if (wantedRoute) {
			const _r = wantedRoute;
			wantedRoute = undefined;
			return _r;
		}

		// route to default view
		switch (appConfig.view) {
			case "members":
				return { path: "/members", replace: true };
			case "journal":
				return { path: "/journal", replace: true };
			case "dashboard":
			default:
				return { path: "/dashboard", replace: true };
			case "chats":
				return { path: "/chats", replace: true };
		}
	}

	return true;
});

if(!window.isSecureContext){
	console.error("Cannot continue, this is not a safe environment!");
	document.documentElement.classList.add("hydrated");
	document.body.innerHTML = "<h1 style='text-align: center;'>Ampersand cannot run on non-HTTPS environments! We're sorry for the trouble.<br>If you think this is an issue, report it on GitHub.</h1>";
} else {
	await tryPersistStorage();

	if(!await getSystem()){
		await newSystem({
			name: ""
		});
	}

	const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
	darkMode.addEventListener("change", updateDarkMode);

	updateDarkMode();
	activateMaterialTheme();
	updateMaterialColors();
	updatePWATitlebarColor(window.getComputedStyle(document.body).getPropertyValue("--ion-toolbar-background"));
	updateAccessibility();
	updateInsets();
	window.addEventListener("orientationchange", () => {
		updateInsets();
	})

	router.isReady().then(async () => {
		app.mount(document.body);
	});
}
