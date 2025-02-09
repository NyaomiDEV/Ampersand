// Vue and Ionic
import { createApp } from "vue";
import { IonicVue } from "@ionic/vue";

// Router
import router from "./router";

// Localizations
import i18n from "./lib/i18n";
import I18NextVue from "i18next-vue";

// Dark mode
import { isIOSIonicMode, updateAccessibility, updateDarkMode, updateInsets, updatePWATitlebarColor } from "./lib/mode";

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
import { getSystem } from "./lib/db/tables/system";
import { appConfig } from "./lib/config";
import { getLockedStatus } from "./lib/applock";
import { clearTempDir } from "./lib/native/cache";
import { slideAnimation } from "./lib/util/misc";

const app = createApp(App).use(IonicVue, {
	hardwareBackButton: true,
}).use(router).use(I18NextVue, { i18next: i18n });

const _navAnimation = window.Ionic.config.get("navAnimation");
window.Ionic.config.set("navAnimation", isIOSIonicMode() ? _navAnimation : slideAnimation);

router.beforeEach(async (to) => {
	// lock flow
	if (getLockedStatus()) {
		if (to.path === "/lock")
			return true;

		return { path: "/lock", query: { wantedPath: to.fullPath } };
	} else {
		if (to.path === "/lock") // for the two people who get stuck in this
			return { fullPath: "/" }; // just reset
	}

	// first time???
	if (!(await getSystem())){
		if (to.path.startsWith("/onboarding/") || to.path.startsWith("/options/accessibility"))
			return true;

		return { path: "/onboarding/start", replace: true };
	}

	// app just started???
	if (to.fullPath === "/") {
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

	// assume normal navigation
	return true;
});

await clearTempDir();
await tryPersistStorage();

const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
darkMode.addEventListener("change", updateDarkMode);

await updateDarkMode();
activateMaterialTheme();
updateMaterialColors();
updatePWATitlebarColor(window.getComputedStyle(document.body).getPropertyValue("--ion-toolbar-background"));
updateAccessibility();
await updateInsets();
window.addEventListener("orientationchange",  () => updateInsets());

router.isReady().then(async () => {
	app.mount(document.body);
});
