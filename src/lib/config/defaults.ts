import type { AccessibilityConfig, AppConfig, SecurityConfig } from "./types";

import { nilUid } from "../util/consts";

export const defaultAppConfig: AppConfig = {
	locale: {},
	defaultSystem: nilUid,
	showMembersApartFromCustomFronts: "after",
	hideFrontingTimer: false,
	view: "dashboard",
	fontStyle: "default",
	dashboardSettings: {
		notesAccordion: {
			active: true,
			priority: 0,
		},
		currentFrontersCarousel: {
			active: true,
			priority: 1,
			settings: {
				type: "cards"
			}
		},
		messageBoardCarousel: {
			active: true,
			priority: 2,
			settings: {
				maxDays: 3
			}
		},
		journalPostCarousel: {
			active: false,
			priority: 3,
			settings: {
				maxDays: 2
			}
		},
		frontingHistoryCarousel: {
			active: true,
			priority: 4,
			settings: {
				maxDays: 2
			}
		}
	},
	tabOrder: [
		"members",
		"journal",
		"dashboard"
	],
	isDeveloperMode: false,
	defaultFilterQueries: {
		members: "@archived:no",
		messageBoard: "@archived:no",
		systems: "@archived:no",
		tags: "@archived:no",
		notes: "@archived:no"
	}
};

export const defaultAccessibilityConfig: AccessibilityConfig = {
	highLegibility: false,
	highLegibilityType: "atkinson",
	theme: "auto",
	colorIndicatorPosition: "avatar",
	themeIsAmoled: false,
	themeScheme: "tonal-spot",
	colors: "app",
	customColors: {
		accentColor: "#30628C",
		backgroundColor: "#308C88",
	},
	tintWithColor: true,
	reducedMotion: false,
	compactLists: false,
	disableCovers: false,
	frontingNotification: false,
	contrastLevel: 0,
	fontScale: 1,
	longPressDuration: 750
};

export const defaultSecurityConfig: SecurityConfig = {
	password: undefined,
	useBiometrics: false,
	useIPC: false,
	allowRemoteContent: false
};