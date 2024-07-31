export type Config = {
	app: AppConfig,
	accessibility: AccessibilityConfig,
	security: SecurityConfig,
};

export type AppConfig = {
	language: string,
	view: ViewName,
	filterQueryMembers: string,
	filterQueryJournal: string
}

type ViewName = "members" | "journal" | "dashboard" | "chat";

export type AccessibilityConfig = {
	highLegibility: boolean,
	highLegibilityType: "atkinson" | "opendyslexic",
	theme: "auto" | "dark" | "light",
	useAccentColor: boolean,
	accentColor?: string,
	reducedMotion: boolean,
	fontScale: number,
	chatFontScale: number
}

export type SecurityConfig = {
	pinCode?: string,
	useBiometrics: boolean
}
