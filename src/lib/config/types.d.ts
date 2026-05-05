import { UUID } from "../db/entities";

export type AppConfig = {
	locale: {
		language?: string
	},
	view: ViewName,
	dashboardSettings: DashboardSettings,
	defaultSystem: UUID,
	showMembersApartFromCustomFronts: "off" | "before" | "after",
	hideFrontingTimer: boolean,
	isDeveloperMode: boolean,
	defaultFilterQueries: {
		systems?: string,
		members?: string,
		tags?: string,
		frontingHistory?: string,
		messageBoard?: string,
		journal?: string,
		assetManager?: string,
		customFields?: string,
		notes?: string
	}
};

type ViewName = "members" | "journal" | "dashboard";

export type DashboardSettings = {
	notesAccordion: DashboardSetting,
	currentFrontersCarousel: CurrentFrontersCarouselSettings,
	messageBoardCarousel: MessageBoardCarouselSettings,
	frontingHistoryCarousel: FrontingHistoryCarouselSettings
};

export interface DashboardSetting {
	active: boolean,
	priority: number
}

export interface CurrentFrontersCarouselSettings extends DashboardSetting {
	settings: {
		type: "cards" | "list"
	}
}

export interface MessageBoardCarouselSettings extends DashboardSetting {
	settings: {
		maxDays: number
	}
}

export interface FrontingHistoryCarouselSettings extends DashboardSetting {
	settings: {
		maxDays: number
	}
}

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
	compactLists: boolean,
	disableCovers: boolean,
	frontingNotification: boolean,
	contrastLevel: number,
	fontScale: number,
	longPressDuration: number
};

export type SecurityConfig = {
	usePassword: boolean,
	password?: string,
	useBiometrics: boolean,
	useIPC: boolean,
	allowRemoteContent: boolean
};
