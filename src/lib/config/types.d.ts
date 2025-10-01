export type AppConfig = {
	locale: {
		language: string,
		firstWeekOfDayIsSunday: boolean,
		twelveHourClock: boolean
	},
	view: ViewName,
	showSystemDescriptionInDashboard: boolean,
	showMembersBeforeCustomFronts: boolean,
	hideFrontingTimer: boolean,
	useIPC: boolean,
	defaultFilterQueries: {
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
	highLegibilityType: "atkinson" | "opendyslexic" | "lexend" | "system-font",
	theme: "auto" | "dark" | "light",
	useAccentColor: boolean,
	accentColor?: string,
	reducedMotion: boolean,
	disableMemberCoversInList: boolean,
	fontScale: number,
	longPressDuration: number
};

export type SecurityConfig = {
	usePassword: boolean,
	password?: string,
	useBiometrics: boolean
};
