// Vue and Ionic
import { createApp } from "vue";
import { IonicVue } from "@ionic/vue";

// Router
import router from "./router";

// Localizations
import i18n from "./lib/i18n";
import I18NextVue from "i18next-vue";

// Dark mode
import { isAppLocked, updateAccessibility, updateDarkMode } from "./lib/mode";

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

// Capacitor stuff
import { SplashScreen } from "@capacitor/splash-screen";
import { tryPersistStorage } from "./lib/util/storageManager";
import { getSystem, newSystem } from "./lib/db/entities/system";
import { appConfig } from "./lib/config";

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
	updateAccessibility();

	const app = createApp(App).use(IonicVue).use(router).use(I18NextVue, { i18next: i18n });

	router.beforeEach(() => {
		// TODO: Pin lock here
		return true;
	})

	router.isReady().then(async () => {
		app.mount(document.body);
		if (router.currentRoute.value.fullPath === "/") {
			// route to default view
			switch(appConfig.view){
				case "members":
					await router.push("/members");
					break;
				case "journal":
					await router.push("/journal");
					break;
				case "dashboard":
				default:
					await router.push("/dashboard");
					break;
				case "chats":
					await router.push("/chats");
					break;
			}
		}

		await SplashScreen.hide();
	});
}
