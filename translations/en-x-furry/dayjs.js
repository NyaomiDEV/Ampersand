// English Furry Speak [en-x-furry]
import dayjs from 'dayjs'

const locale = {
	name: 'en-x-furry',
	weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thuwsday_Fwiday_Satuwday'.split('_'),
	weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fwi_Sat'.split('_'),
	weekdaysMin: 'Su_Mo_Tu_We_Th_Fw_Sa'.split('_'),
	months: 'Januawy_Febwuawy_Mawch_Apwil_May_June_July_August_Septembew_Octobew_Novembew_Decembew'.split('_'),
	monthsShort: 'Jan_Feb_Maw_Apw_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	relativeTime: {
		future: 'in %s',
		past: '%s ago',
		s: 'a few seconds',
		m: 'a minute',
		mm: '%d minutes',
		h: 'an houw',
		hh: '%d houws',
		d: 'a day',
		dd: '%d days',
		M: 'a month',
		MM: '%d months',
		y: 'a yeaw',
		yy: '%d yeaws'
	},
	formats: {
		LTS: 'h:mm:ss A',
		LT: 'h:mm A',
		L: 'MM/DD/YYYY',
		LL: 'MMMM D, YYYY',
		LLL: 'MMMM D, YYYY h:mm A',
		LLLL: 'dddd, MMMM D, YYYY h:mm A'
	},
	ordinal: (n) => {
		const s = ['th', 'st', 'nd', 'wd']
		const v = n % 100
		return `[${n}${(s[(v - 20) % 10] || s[v] || s[0])}]`
	}
}

dayjs.locale(locale, null, true)

export default locale