import { useBackButton, useIonRouter } from "@ionic/vue";
import { onBackButtonPress } from "@tauri-apps/api/app";
import { platform } from "@tauri-apps/plugin-os";
import { exit } from "@tauri-apps/plugin-process";
import { onMounted } from "vue";

export function useBack(){
	const router = useIonRouter();

	useBackButton(-1, async () => {
		if(!router.canGoBack())
			await exit();
	});

	onMounted(async () => {
		// if on android, set up back button behaviour
		if (platform() === "android") {
			await onBackButtonPress(() => {
				document.dispatchEvent(new Event("backbutton"));
			});
		}
	});
}