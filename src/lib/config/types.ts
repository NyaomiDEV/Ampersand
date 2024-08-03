export type AppConfig = {
	locale: {
		language: string,
		firstWeekOfDayIsSunday: boolean,
		twelveHourClock: boolean
	},
	view: ViewName,
	filterQueryMembers: string,
	filterQueryJournal: string
}

type ViewName = "members" | "journal" | "dashboard" | "chat";

export type AccessibilityConfig = {
	highLegibility: boolean,
	highLegibilityType: "atkinson" | "opendyslexic" | "lexend",
	theme: "auto" | "dark" | "light",
	useAccentColor: boolean,
	accentColor?: string,
	reducedMotion: boolean,
	fontScale: number,
	chatFontScale: number
}

export type SecurityConfig = {
	usePin: boolean,
	pinCode?: string,
	useBiometrics: boolean
}
