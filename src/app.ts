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
import { updateAccessibility, updateDarkMode, updateFont, updateInsets } from "./lib/mode";

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
import "./styles/fonts/_fonts.css";

// Our CSS overrides
import "./styles/override.css";

// Branding theme
import { updateMaterialColors } from "./lib/theme";
import "./lib/theme/style.css";

// Other imports from frontend library
import { clearTempDir } from "./lib/native/cache";
import { slideAnimation } from "./lib/util/misc";
import { dismissSplash, getWebkitVersion } from "./lib/native/plugin";
import { platform, version } from "@tauri-apps/plugin-os";
import { onBackButtonPress } from "@tauri-apps/api/app";
import { maybeExit } from "./lib/util/backbutton";

// Back button icon
import backMD from "@material-symbols/svg-600/rounded/arrow_back.svg";
import { sendFrontingChangedEvent } from "./lib/db/tables/frontingEntries";
import { unnotify } from "./lib/notifications";
import { NavigationGuardWithThis } from "vue-router";

// In case of webview versions tie-in with the OS, as is with iOS,
// it makes sense to whitelist the OS itself
const minOsVersions = {
	"ios": [18,6]
};

// In all other cases we might get away with more granular, per-webview
// versioning
const minWvVersions = {
	"android": [140],
	"windows": [140],
	"macos": [20621,3,11],
	"linux": [2,50]
};

async function isWebviewSupported(){
	const _platform = platform();
	const _osVer = version().split(".").map(x => parseInt(x, 10));
	const _wvVer = (await getWebkitVersion()).split(".").map(x => parseInt(x, 10));

	const compareFn = (a: number[], b: number[]) => {
		for (let i = 0; i < Math.max(a.length, b.length); i++) {
			if((a[i] || 0) > (b[i] || 0)) return false;
			if((a[i] || 0) < (b[i] || 0)) return true;
		}
		return true;
	};

	if(_platform in minOsVersions && !compareFn(minOsVersions[_platform], _osVer))
		return false;

	if (_platform in minWvVersions && !compareFn(minWvVersions[_platform], _wvVer))
		return false;

	return true;
}

function getSuggestionsForPeopleWithUnsupportedVersions(){
	const _platform = platform();

	switch(_platform){
		case "linux":
			return "Please update your distro packages, or your distro itself, and try again.";
		case "macos":
			return "Please update your macOS version (and all components, especially Safari) by going into System Settings > General > Software Update.";
		case "ios":
			return "Please update your iOS version by going into Settings > General > Software Update.";
		case "freebsd":
		case "dragonfly":
		case "netbsd":
		case "openbsd":
		case "solaris":
			return "You do you, nerd.";
		case "android":
			return "Please search for 'Android System WebView' on Google Play and update that. It has a Chrome-like icon but grey and blue and it is made by Google, don't be scammed!";
		case "windows":
			return "Please update Windows from Windows Update, then also open Microsoft Edge and update that, and finally search for Edge WebView2 and update that also (from the Microsoft website, don't trust third parties!)";
	}
}


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
				return { path: "/tab/members", replace: true };
			case "journal":
				return { path: "/tab/journal", replace: true };
			case "dashboard":
			default:
				return { path: "/tab/dashboard", replace: true };
		}
	}

	// assume normal navigation
	return true;
};

async function setupAmpersand(){
	// first and foremost, put the router guard in place
	router.beforeEach(routerGuard);

	// now we set the class of the current platform
	document.documentElement.classList.add(`sys-${platform()}`);

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

	await updateInsets();
	window.addEventListener("orientationchange", () => void updateInsets());

	// if on android, we need to get window insets and set up back button behaviour
	if (platform() === "android") {
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

	// update our font
	updateFont();

	// here we will apply our accessibility settings
	updateAccessibility();

	// lastly, we watch for our accessibility configuration as to update some stuff that is dependent to it
	watch(accessibilityConfig, async () => {
		await updateDarkMode();
		updateMaterialColors();
		updateAccessibility();
		updateFont();

		if(accessibilityConfig.frontingNotification)
			await sendFrontingChangedEvent();
		else
			await unnotify(1);
	});
	
	// watch the appConfig for font changes
	watch(() => appConfig.fontStyle, () => {
		updateFont();
	});

	// now we just wait for the router to be ready, then we can mount our application
	await router.isReady().then(() => {
		app.mount(document.body);
	});
}

if (!window.isSecureContext) {
	console.error("Cannot continue, this is not a safe environment!");

	const header = document.createElement("h1");
	header.style.textAlign = "center";
	header.textContent = "Ampersand cannot run on non-HTTPS environments! We're sorry for the trouble.";

	const subheader = document.createElement("p");
	subheader.style.textAlign = "center";
	subheader.textContent = "If you think this is an issue, report it on Codeberg.";

	document.body.appendChild(header);
	document.body.appendChild(subheader);
	await dismissSplash();
} else if (!await isWebviewSupported()) {
	console.error("Cannot continue, this Webview version is not supported!");
	const header = document.createElement("h1");
	header.style.textAlign = "center";
	header.textContent = "Ampersand cannot run on this WebView version!";

	const subheader = document.createElement("p");
	subheader.style.textAlign = "center";
	subheader.textContent = getSuggestionsForPeopleWithUnsupportedVersions();

	document.body.appendChild(header);
	document.body.appendChild(subheader);
	await dismissSplash();
} else
	await setupAmpersand();