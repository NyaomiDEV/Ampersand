// toki pona [tok]
import dayjs from 'dayjs'

const locale = {
	name: 'tok',
	weekdays: 'tenpo suno nanpa tu pi pali ala_tenpo suno nanpa wan_tenpo suno nanpa tu_tenpo suno nanpa tu wan_tenpo suno nanpa tu tu_tenpo suno nanpa luka_tenpo suno nanpa wan pi pali ala'.split('_'),
	weekdaysShort: 's7_s1_s2_s3_s4_s5_s6'.split('_'),
	weekdaysMin: 's7_s1_s2_s3_s4_s5_s6'.split('_'),
	months: 'tenpo mun nanpa wan_tenpo mun nanpa tu_tenpo mun nanpa tu wan_tenpo mun nanpa tu tu_tenpo mun nanpa luka_tenpo mun nanpa luka wan_tenpo mun nanpa luka tu_tenpo mun nanpa luka tu wan_tenpo mun nanpa luka tu tu_tenpo mun nanpa luka luka_tenpo mun nanpa luka luka wan_tenpo mun nanpa luka luka tu'.split('_'),
	monthsShort: 'm1_m2_m3_m4_m5_m6_m7_m8_m9_m10_m11_m12'.split('_'),
	weekStart: 1,
	yearStart: 4,
	relativeTime: {
		future: 'tenpo kama la %s',
		past: 'tenpo pini la %s',
		s: 'tenpo pi lili wawa',
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
		LL: 'D MMMM YYYY',
		LLL: 'D MMMM YYYY HH:mm',
		LLLL: 'dddd, D MMMM YYYY HH:mm'
	},
	ordinal: (n) => `nanpa ${n}`
}

dayjs.locale(locale, null, true)

export default locale