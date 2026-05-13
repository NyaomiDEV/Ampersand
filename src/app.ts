// setup console
import "./lib/console";

// Vue and Ionic
import { createApp, watch } from "vue";
import { IonicVue } from "@ionic/vue";

// App configuration
import { accessibilityConfig, appConfig } from "./lib/config";

// Database
import { db, initDatabase, databaseDidInit } from "./lib/db";

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
import { dismissSplash, getWebkitVersion } from "./lib/native/plugin";
import { platform } from "@tauri-apps/plugin-os";
import { onBackButtonPress } from "@tauri-apps/api/app";
import { maybeExit } from "./lib/util/backbutton";

// Back button icon
import backMD from "@material-symbols/svg-600/rounded/arrow_back.svg";
import { sendFrontingChangedEvent } from "./lib/db/tables/frontingEntries";
import { unnotify } from "./lib/notifications";
import { NavigationGuardWithThis } from "vue-router";

const minWebViewVersions = {
	"android": 139,
};

const routerGuard: NavigationGuardWithThis<undefined> = (to) => {
	// database migration flow
	if (!databaseDidInit()) {
		if (to.path === "/dbIsLoading")
			return true;

		return { path: "/dbIsLoading", query: { wantedPath: to.fullPath } };
	} else {
		if (to.path === "/dbIsLoading") // for the two people who get stuck in this
			return { fullPath: "/" }; // just reset
	}

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
	if (!db.systems.index.length) {
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
};

async function setupAmpersand(){
	// first and foremost, put the router guard in place
	router.beforeEach(routerGuard);

	// let's start initializing the database
	void initDatabase();

	// now clear the temp dir
	await clearTempDir();

	// let's set up ionic here
	const app = createApp(App).use(IonicVue, {
		hardwareBackButton: true,
		mode: "md",
		swipeBackEnabled: platform() === "ios",
		toggleOnOffLabels: true,
		backButtonIcon: backMD
	}).use(router).use(I18NextVue, { i18next: i18n });
	window.Ionic.config.set("navAnimation", slideAnimation);

	// if on android, we need to get window insets and set up back button behaviour
	if (platform() === "android") {
		await updateInsets();
		window.addEventListener("orientationchange", () => void updateInsets());

		await onBackButtonPress(() => {
			document.dispatchEvent(new Event("backbutton"));
			void maybeExit();
		});
	}

	// now we need to set up the dark mode
	const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
	darkMode.addEventListener("change", () => void updateDarkMode());
	await updateDarkMode();

	// and here we can update our color palette
	updateMaterialColors();

	// here we will apply our accessibility settings
	updateAccessibility();

	// lastly, we watch for our accessibility configuration as to update some stuff that is dependent to it
	watch(accessibilityConfig, async () => {
		await updateDarkMode();
		updateMaterialColors();
		updateAccessibility();

		if(accessibilityConfig.frontingNotification)
			await sendFrontingChangedEvent();
		else
			await unnotify(1);
	});

	// now we just wait for the router to be ready, then we can mount our application
	await router.isReady().then(() => {
		app.mount(document.body);
	});
}

if (!window.isSecureContext) {
	console.error("Cannot continue, this is not a safe environment!");
	document.body.innerHTML = "<h1 style='text-align: center;'>Ampersand cannot run on non-HTTPS environments! We're sorry for the trouble.<br>If you think this is an issue, report it on Codeberg.</h1>";
	await dismissSplash();
} else if (minWebViewVersions[platform()] && (await getWebkitVersion()).split(".").map(x => parseInt(x, 10))[0] < minWebViewVersions[platform()]) {
	document.body.innerHTML = "<h1 style='text-align: center;'>Ampersand cannot run on this WebKit/WebView version!<br>Please update your phone's OS version and all of your system apps.</h1>";
	await dismissSplash();
} else
	await setupAmpersand();