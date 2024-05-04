// Vue and Ionic
import { createApp } from "vue";
import { IonicVue } from "@ionic/vue";

// Router
import router from "./router";

// Localizations
import i18n from "./lib/i18n";
import I18NextVue from "i18next-vue";

// Dark mode
import { updateDarkMode } from "./lib/darkMode";

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

// Our CSS overrides
import "./styles/override.css";

// Storage Manager
if (!await navigator.storage.persisted()) {
	console.log("Storage is not persisted, trying to persist now");
	if (!await navigator.storage.persist()) {
		console.error("Storage cannot be made persistent, data will be lost!");
	}
}

const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
darkMode.addEventListener("change", updateDarkMode);

const app = createApp(App).use(IonicVue).use(router).use(I18NextVue, { i18next: i18n });

await router.isReady();
app.mount(document.body);
