// Pirate Speak [en-x-pirate]
import dayjs from 'dayjs'

const locale = {
	name: 'en-x-pirate',
	weekdays: 'Sabbath_Moonday_Tide-day_Winds-day_Thunder-day_Free-day_Star-day'.split('_'),
	weekdaysShort: 'Sab_Moo_Tid_Win_Thu_Fre_Sta'.split('_'),
	weekdaysMin: 'Sa_Mo_Ti_Wi_Th_Fr_St'.split('_'),
	months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
	monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	relativeTime: {
		future: 'in %s',
		past: '%s ago',
		s: 'a few heartbeats',
		m: 'a minute',
		mm: '%d minutes',
		h: 'an hour',
		hh: '%d hours',
		d: 'a day',
		dd: '%d days',
		M: 'a month',
		MM: '%d months',
		y: 'a year',
		yy: '%d years'
	},
	formats: {
		LTS: 'h:mm:ss A',
		LT: 'h:mm A',
		L: 'MM/DD/YYYY',
		LL: 'MMMM D, YYYY',
		LLL: 'MMMM D, YYYY h:mm A',
		LLLL: 'dddd, MMMM D, YYYY h:mm A'
	}
}

dayjs.locale(locale, null, true)

export default locale