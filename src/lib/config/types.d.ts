import { UUID } from "../db/entities";

export type AppConfig = {
	locale: {
		language?: string
	},
	view: ViewName,
	defaultSystem: UUID,
	showSystemDescriptionInDashboard: boolean,
	showDefaultSystemInMemberList: boolean,
	showMembersApartFromCustomFronts: "off" | "before" | "after",
	hideFrontingTimer: boolean,
	useIPC: boolean,
	defaultFilterQueries: {
		systems?: string,
		members?: string,
		tags?: string,
		frontingHistory?: string,
		messageBoard?: string,
		journal?: string,
		assetManager?: string,
		customFields?: string
	}
};

type ViewName = "members" | "journal" | "dashboard";

export type AccessibilityConfig = {
	highLegibility: boolean,
	highLegibilityType: "atkinson" | "opendyslexic" | "lexend" | "comicrelief" | "system-font",
	theme: "auto" | "dark" | "light",
	colorIndicatorPosition: "avatar" | "list-item",
	themeIsAmoled: boolean,
	themeIsVibrant: boolean,
	useAccentColor: boolean,
	accentColor?: string,
	reducedMotion: boolean,
	disableCovers: boolean,
	contrastLevel: number,
	fontScale: number,
	longPressDuration: number
};

export type SecurityConfig = {
	usePassword: boolean,
	password?: string,
	useBiometrics: boolean,
	allowRemoteContent: boolean
};
