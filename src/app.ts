// Vue and Ionic
import { createApp, watch } from "vue";
import { IonicVue } from "@ionic/vue";

// App configuration
import { accessibilityConfig, appConfig } from "./lib/config";

// Database
import { db } from "./lib/db/tables";

// App Lock
import { getLockedStatus } from "./lib/applock";

// Router
import router from "./router";

// Localizations
import i18n from "./lib/i18n";
import I18NextVue from "i18next-vue";

// Dark mode
import { updateAccessibility, updateDarkMode, updateInsets } from "./lib/mode";

// App
import App from "./App.vue";

// Core CSS required for Ionic components to work properly
import "@ionic/vue/css/core.css";

// Basic CSS for apps built with Ionic
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

// Dark mode CSS class
import "@ionic/vue/css/palettes/dark.class.css";

// Import fonts
import "./styles/fonts/fonts.css";

// Our CSS overrides
import "./styles/override.css";

// Branding theme
import { updateMaterialColors } from "./lib/theme";
import "./lib/theme/style.css";

// Other imports from frontend library
import { clearTempDir } from "./lib/native/cache";
import { slideAnimation } from "./lib/util/misc";
import { dismissSplash, getWebkitVersion, runDbMigrations } from "./lib/native/plugin";
import { platform } from "@tauri-apps/plugin-os";
import { onBackButtonPress } from "@tauri-apps/api/app";
import { maybeExit } from "./lib/util/backbutton";

async function setupAmpersand() {
	const app = createApp(App).use(IonicVue, {
		hardwareBackButton: true,
		mode: "md",
		swipeBackEnabled: platform() === "ios"
	}).use(router).use(I18NextVue, { i18next: i18n });

	window.Ionic.config.set("navAnimation", slideAnimation);

	const maybeSystem = db.systems.index[0]?.uuid || undefined;

	if (!db.systems.index.map(x => x.uuid).includes(appConfig.defaultSystem)) {
		if (maybeSystem)
			appConfig.defaultSystem = maybeSystem;
	}

	await runDbMigrations();

	router.beforeEach((to) => {
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
		if (!db.systems.index.length){
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
			}
		}

		// assume normal navigation
		return true;
	});

	await clearTempDir();

	const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
	await updateDarkMode();

	darkMode.addEventListener("change", () => void updateDarkMode());
	updateMaterialColors();
	updateAccessibility();

	if(platform() === "android"){
		await updateInsets();
		window.addEventListener("orientationchange", () => void updateInsets());
	}

	watch(accessibilityConfig, async () => {
		await updateDarkMode();
		updateMaterialColors();
		updateAccessibility();
	});

	await router.isReady().then(async () => {
		app.mount(document.body);

		if(platform() === "android"){
			await onBackButtonPress(() => {
				document.dispatchEvent(new Event("backbutton"));
				void maybeExit();
			});
		}
	});
}

if (!window.isSecureContext) {
	console.error("Cannot continue, this is not a safe environment!");
	document.body.innerHTML = "<h1 style='text-align: center;'>Ampersand cannot run on non-HTTPS environments! We're sorry for the trouble.<br>If you think this is an issue, report it on Codeberg.</h1>";
	await dismissSplash();
} else if (platform() === "android" && (await getWebkitVersion()).split(".").map(x => parseInt(x, 10))[0] < 131) {
	document.body.innerHTML = "<h1 style='text-align: center;'>Ampersand cannot run on this WebKit version!<br>Please update your phone's OS version and all of your system apps.</h1>";
	await dismissSplash();
} else
	await setupAmpersand();