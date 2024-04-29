export type Config = {
	currentSystemUUID?: string,
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
	theme: "auto" | "dark" | "light",
	accentColor?: string,
	reducedMotion: boolean,
	uiScale: number
}

export type SecurityConfig = {
	pinCode?: string,
	useBiometrics: boolean
}
