export type AppConfig = {
	locale: {
		language?: string,
		firstWeekOfDayIsSunday: boolean,
		twelveHourClock: boolean
	},
	view: ViewName,
	showSystemDescriptionInDashboard: boolean,
	defaultFilterQueries: {
		members?: string,
		tags?: string,
		frontingHistory?: string,
		messageBoard?: string,
		journal?: string,
		assetManager?: string,
		customFields?: string
	}
}

type ViewName = "members" | "journal" | "dashboard" | "chats";

export type AccessibilityConfig = {
	highLegibility: boolean,
	highLegibilityType: "atkinson" | "opendyslexic" | "lexend",
	theme: "auto" | "dark" | "light",
	useMaterialTheming: boolean,
	useAccentColor: boolean,
	accentColor?: string,
	reducedMotion: boolean,
	fontScale: number,
	chatFontScale: number,
	longPressDuration: number
}

export type SecurityConfig = {
	usePassword: boolean,
	password?: string,
	useBiometrics: boolean
}
