// toki pona [tok]
import dayjs from 'dayjs'

const locale = {
	name: 'tok',
	weekdays: 'tenpo suno pi pali ala_tenpo suno nanpa wan_tenpo suno nanpa tu_tenpo suno nanpa tu wan_tenpo suno nanpa tu tu_tenpo suno nanpa luka_tenpo suno pi pali ala'.split('_'),
	weekdaysShort: 'suno ala_suno wan_suno tu_suno tu wan_suno tu tu_suno luka_suno ala'.split('_'),
	weekdaysMin: 'sa_s1_s2_s3_s4_s5_sa'.split('_'),
	months: 'tenpo mun nanpa wan_tenpo mun nanpa tu_tenpo mun nanpa tu wan_tenpo mun nanpa tu tu_tenpo mun nanpa luka_tenpo mun nanpa luka wan_tenpo mun nanpa luka tu_tenpo mun nanpa luka tu wan_tenpo mun nanpa luka tu tu_tenpo mun nanpa luka luka_tenpo mun nanpa luka luka wan_tenpo mun nanpa luka luka tu'.split('_'),
	monthsShort: 'm1_m2_m3_m4_m5_m6_m7_m8_m9_m10_m11_m12'.split('_'),
	weekStart: 1,
	yearStart: 4,
	relativeTime: {
		future: 'tenpo kama la %s',
		past: 'tenpo pini la %s',
		s: 'tenpo lili mute',
		m: 'tenpo lili',
		mm: 'tenpo lili %d',
		h: 'tenpo suli lili',
		hh: 'tenpo suli lili %d',
		d: 'tenpo suno',
		dd: 'tenpo suno %d',
		M: 'tenpo mun',
		MM: 'tenpo mun %d',
		y: 'tenpo suli',
		yy: 'tenpo suli %d'
	},
	formats: {
		LT: 'HH:mm',
		LTS: 'HH:mm:ss',
		L: 'YYYY-MM-DD',
		LL: 'tenpo suno D pi tenpo mun MMMM pi tenpo suli YYYY',
		LLL: 'tenpo suno D pi tenpo mun MMMM pi tenpo suli YYYY HH:mm',
		LLLL: 'dddd, tenpo suno D pi tenpo mun MMMM pi tenpo suli YYYY HH:mm'
	},
	ordinal: (n) => `nanpa ${n}`
}

dayjs.locale(locale, null, true)

export default locale