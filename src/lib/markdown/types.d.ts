import { AppConfig } from "../config/types";

export type FieldFrontmatter = {
	header: string,
	headerColor: string,
	headerFont: string,
	color: string,
	font: string,
	backgroundColor: string,
	colorScheme: AppConfig["themeScheme"],
	background: string
};