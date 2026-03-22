export type CompleteWeekInfo = [number, number[]];
export type PartialWeekInfo = [number, number[]?];
export type RegionData = Record<string, PartialWeekInfo>;

export type WeekInfo = {
	firstDay: number;
	weekend: number[];
};

export const worldDefaults: CompleteWeekInfo = [1, [6, 7]];
export const regionData: RegionData = {
	AF: [6, [4, 5]],
	AG: [7],
	AS: [7],
	BD: [7],
	BH: [6, [5, 6]],
	BR: [7],
	BS: [7],
	BT: [7],
	BW: [7],
	BZ: [7],
	CA: [7],
	CO: [7],
	DJ: [6],
	DM: [7],
	DO: [7],
	DZ: [6, [5, 6]],
	EG: [6, [5, 6]],
	ET: [7],
	GT: [7],
	GU: [7],
	HK: [7],
	HN: [7],
	ID: [7],
	IL: [7, [5, 6]],
	IN: [7, [7]],
	IQ: [6, [5, 6]],
	IR: [6, [5]],
	JM: [7],
	JO: [6, [5, 6]],
	JP: [7],
	KE: [7],
	KH: [7],
	KR: [7],
	KW: [6, [5, 6]],
	LA: [7],
	LY: [6, [5, 6]],
	MH: [7],
	MM: [7],
	MO: [7],
	MT: [7],
	MV: [5],
	MX: [7],
	MZ: [7],
	NI: [7],
	NP: [7],
	OM: [6, [5, 6]],
	PA: [7],
	PE: [7],
	PH: [7],
	PK: [7],
	PR: [7],
	PT: [7],
	PY: [7],
	QA: [6, [5, 6]],
	SA: [7, [5, 6]],
	SD: [6, [5, 6]],
	SG: [7],
	SV: [7],
	SY: [6, [5, 6]],
	TH: [7],
	TT: [7],
	TW: [7],
	UG: [1, [7]],
	UM: [7],
	US: [7],
	VE: [7],
	VI: [7],
	WS: [7],
	YE: [7, [5, 6]],
	ZA: [7],
	ZW: [7],
};

const expandWeekInfo = (weekInfo: PartialWeekInfo): WeekInfo => ({
	firstDay: weekInfo[0],
	weekend: weekInfo[1] ?? worldDefaults[1],
});
export function getWeekInfo(locale: Intl.Locale) {
	const region = locale.maximize().region;

	if (!(region && region in regionData)) return expandWeekInfo(worldDefaults);
	
	return expandWeekInfo(regionData[region]);
}