import { AppConfig } from "../config/types";

export type Frontmatter = {
	color?: string,
	font?: string,
};

export type FrontmatterHeader = {
	header?: string,
	headerColor?: string,
	headerFont?: string,
	headerBold?: boolean,
	headerItalic?: boolean,
	headerDecoration?: string
};

export type FrontmatterEncased = {
	backgroundColor?: string,
	background?: string;
	colorScheme?: AppConfig["themeScheme"],

	borderColor?: string,
	borderStyle?: string,
	borderWidth?: string
};

export type FieldFrontmatter = Frontmatter & FrontmatterHeader & FrontmatterEncased;

export type FrontmatterSystemOrMemberDescription = FieldFrontmatter & {
	customName?: string;
};

export type FrontmatterFrontingSummary = FieldFrontmatter & {
	customStatus?: string;
};