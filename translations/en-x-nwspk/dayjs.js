// Newspeak [en-x-nwspk]
import dayjs from 'dayjs'

const locale = {
	name: 'en-x-nwspk',
	weekdays: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
	weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
	weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
	months: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	relativeTime: {
		future: 'plus-time %s',
		past: 'minus-time %s',
		s: 'few-second',
		m: 'minute',
		mm: '%d minute',
		h: 'hour',
		hh: '%d hour',
		d: 'day',
		dd: '%d day',
		M: 'month',
		MM: '%d month',
		y: 'year',
		yy: '%d year'
	},
	formats: {
		LTS: 'h:mm:ss A',
		LT: 'h:mm A',
		L: 'MM/DD/YYYY',
		LL: 'MMMM D, YYYY',
		LLL: 'MMMM D, YYYY h:mm A',
		LLLL: 'dddd, MMMM D, YYYY h:mm A'
	},
	ordinal: (n) => n
}

dayjs.locale(locale, null, true)

export default locale