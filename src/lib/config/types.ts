export type AppConfig = {
	locale: {
		language: string,
		firstWeekOfDayIsSunday: boolean,
		twelveHourClock: boolean
	},
	view: ViewName,
	defaultFilterQueries: {
		members?: string,
		tags?: string,
		frontingHistory?: string,
		messageBoard?: string,
		journal?: string
	}
}

type ViewName = "members" | "journal" | "dashboard" | "chats";

export type AccessibilityConfig = {
	highLegibility: boolean,
	highLegibilityType: "atkinson" | "opendyslexic" | "lexend",
	theme: "auto" | "dark" | "light",
	useAccentColor: boolean,
	accentColor?: string,
	reducedMotion: boolean,
	fontScale: number,
	chatFontScale: number,
	longPressDuration: number
}

export type SecurityConfig = {
	usePin: boolean,
	pinCode?: string,
	useBiometrics: boolean
}
