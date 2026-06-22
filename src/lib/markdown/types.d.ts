import { AppConfig } from "../config/types";

export type Frontmatter = {
	color: string,
	font: string,
};

export type FrontmatterHeader = {
	header: string,
	headerColor: string,
	headerFont: string
};

export type FrontmatterEncased = {
	backgroundColor: string,
	background: string;
	colorScheme: AppConfig["themeScheme"],

	borderColor: string,
	borderStyle: string,
	borderWidth: string
};

export type FieldFrontmatter = Frontmatter & FrontmatterHeader & FrontmatterEncased;