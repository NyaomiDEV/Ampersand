// Neapolitan [nap]
import dayjs from 'dayjs'

const locale = {
	name: 'nap',
	weekdays: 'dummeneca_lunedì_martedì_miercurdì_giove_viernarì_sàbbato'.split('_'),
	weekdaysShort: 'dum_lun_mar_mie_gio_vie_sàb'.split('_'),
	weekdaysMin: 'du_lu_ma_me_gi_ve_sa'.split('_'),
	months: 'jennaro_frevaro_marzo_abbrile_maggio_giùgno_luglio_austu_settembre_ottovre_nuvembre_dicembre'.split('_'),
	weekStart: 1,
	monthsShort: 'jen_fre_mar_abb_mag_giù_lug_aus_set_ott_nuv_dic'.split('_'),
	formats: {
		LT: 'HH:mm',
		LTS: 'HH:mm:ss',
		L: 'DD/MM/YYYY',
		LL: 'D MMMM YYYY',
		LLL: 'D MMMM YYYY HH:mm',
		LLLL: 'dddd D MMMM YYYY HH:mm'
	},
	relativeTime: {
		future: 'nfra %s',
		past: '%s fa',
		s: 'cocche sicondo',
		m: 'nu minuto',
		mm: '%d minute',
		h: 'n\'ora',
		hh: '%d ore',
		d: 'nu juorno',
		dd: '%d juorne',
		M: 'nu mese',
		MM: '%d mise',
		y: 'n\'anno',
		yy: '%d anne'
	},
	ordinal: n => `${n}º`
}

dayjs.locale(locale, null, true)

export default locale