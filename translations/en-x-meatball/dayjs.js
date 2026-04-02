// Meatball English [en-x-meatball]
import dayjs from 'dayjs'

const locale = {
	name: 'en-x-meatball',
	weekdays: 'Sunday-a_Monday-a_Tuesday-a_Wednesday-a_Thursday-a_Friday-a_Saturday-a'.split('_'),
	weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
	weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
	months: 'January-a_February-a_March-a_April-a_May-a_June-a_July-a_August-a_September-a_October-a_November-a_December-a'.split('_'),
	monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	relativeTime: {
		future: 'in %s',
		past: '%s ago',
		s: 'a few-a seconds',
		m: 'a minute-a',
		mm: '%d minutes-a',
		h: 'an hour-a',
		hh: '%d hours-a',
		d: 'a day-a',
		dd: '%d days-a',
		M: 'a month-a',
		MM: '%d months-a',
		y: 'a year-a',
		yy: '%d years-a'
	},
	ordinal: (n) => {
		return `[${n}-a]`
	}
}

dayjs.locale(locale, null, true)

export default locale