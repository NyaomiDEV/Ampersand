import { appConfigDir, sep } from "@tauri-apps/api/path";
import { readTextFile, remove } from "@tauri-apps/plugin-fs";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";

export async function readOldConfig(){
	try {
		const c = JSON.parse(
			await readTextFile(
				`${await appConfigDir() + sep()}appConfig.json`,
				{ encoding: "utf-8" }
			)
		);

		// migrate old config
		if (c.appConfig.showMembersBeforeCustomFronts) {
			c.appConfig.showMembersApartFromCustomFronts = "before";
			delete c.appConfig.showMembersBeforeCustomFronts;
		}

		if (c.appConfig.locale.firstWeekOfDayIsSunday)
			delete c.appConfig.locale.firstWeekOfDayIsSunday;

		if (c.appConfig.locale.twelveHourClock)
			delete c.appConfig.locale.twelveHourClock;

		if (c.appConfig.showSystemDescriptionInDashboard)
			delete c.appConfig.showSystemDescriptionInDashboard;

		if (c.accessibilityConfig.disableMemberCoversInList) {
			c.accessibilityConfig.disableCovers = c.accessibilityConfig.disableMemberCoversInList;
			delete c.accessibilityConfig.disableMemberCoversInList;
		}

		if (c.accessibilityConfig.useAccentColor) {
			delete c.accessibilityConfig.useAccentColor;
			c.accessibilityConfig.colors = "custom";
		}

		if (c.accessibilityConfig.themeIsVibrant) {
			delete c.accessibilityConfig.themeIsVibrant;
			c.accessibilityConfig.themeScheme = "vibrant";
		}

		if (c.accessibilityConfig.accentColor) {
			c.accessibilityConfig.customColors.accentColor = c.accessibilityConfig.accentColor;
			c.accessibilityConfig.customColors.backgroundColor = c.accessibilityConfig.accentColor;
			delete c.accessibilityConfig.accentColor;
		}

		if (c.securityConfig.usePassword === false) {
			c.securityConfig.password = undefined;
			delete c.securityConfig.usePassword;
		}

		if (c.appConfig.useIPC) {
			c.securityConfig.useIPC = true;
			delete c.appConfig.useIPC;
		}

		return c as {
			appConfig: AppConfig,
			accessibilityConfig: AccessibilityConfig,
			securityConfig: SecurityConfig
		};
	} catch (_e) {
		return undefined;
	}
}

export async function deleteOldConfig(){
	try{
		await remove(`${await appConfigDir() + sep()}appConfig.json`);
		return true;
	} catch(e){
		console.error(e);
		return false;
	}
}