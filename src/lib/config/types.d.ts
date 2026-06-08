import { UUID } from "../db/entities";

export type AppConfig = {
	locale: {
		language?: string
	},
	theme: "auto" | "dark" | "light",
	themeScheme: "neutral" | "tonal-spot" | "vibrant" | "expressive",
	colors: "app" | "system" | "custom",
	customColors: {
		accentColor?: string,
		backgroundColor?: string
	},
	fontStyle: "default" | "modern" | "digital" | "round" | "newspaper" | "mystic" | "classy" | "boring",
	view: string,
	dashboardSettings: DashboardSettings,
	tabOrder: string[],
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

export type DashboardSettings = {
	notesAccordion: DashboardSetting,
	currentFrontersCarousel: CurrentFrontersCarouselSettings,
	messageBoardCarousel: MessageBoardCarouselSettings,
	frontingHistoryCarousel: FrontingHistoryCarouselSettings,
	journalPostCarousel: JournalPostCarouselSettings
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

export interface JournalPostCarouselSettings extends DashboardSetting {
	settings: {
		maxDays: number;
	};
}

export type AccessibilityConfig = {
	highLegibility: boolean,
	highLegibilityType: "atkinson" | "opendyslexic" | "lexend" | "comicrelief" | "system-font",
	colorIndicatorPosition: "avatar" | "list-item",
	themeIsAmoled: boolean,
	tintWithColor: boolean,
	reducedMotion: boolean,
	compactLists: boolean,
	disableCovers: boolean,
	frontingNotification: boolean,
	contrastLevel: number,
	fontScale: number,
	longPressDuration: number
};

export type SecurityConfig = {
	password?: string,
	useBiometrics: boolean,
	useIPC: boolean,
	allowRemoteContent: boolean
};
