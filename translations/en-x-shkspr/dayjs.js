// Shakespearean English [en-x-shkspr]
import dayjs from 'dayjs'

const locale = {
	name: 'en-x-shkspr',
	weekdays: 'Sabbath_Lunday_Tiwesday_Wodnesday_Thorsday_Frigday_Saterday'.split('_'),
	weekdaysShort: 'Sab_Lun_Tiw_Wod_Tho_Fri_Sat'.split('_'),
	weekdaysMin: 'Sb_Lu_Ti_Wo_Th_Fr_Sa'.split('_'),
	months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
	monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	relativeTime: {
		future: 'anon %s',
		past: '%s since',
		s: 'a few moments',
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
	},
}

dayjs.locale(locale, null, true)

export default locale