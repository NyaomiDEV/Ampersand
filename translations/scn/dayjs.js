// Sicilian [scn]
import dayjs from 'dayjs'

const locale = {
	name: 'scn',
	weekdays: 'dumìnica_lunedì_martedì_mercurì_jovidì_vinnirì_sàbbatu'.split('_'),
	weekdaysShort: 'dum_lun_mar_mer_jov_vin_sàb'.split('_'),
	weekdaysMin: 'du_lu_ma_me_jo_vi_sà'.split('_'),
	months: 'jinnaru_frivaru_marzu_aprili_maggio_giugnu_lugliu_agustu_sittèmmiru_uttùviru_nuvèmmiru_dicèmmiru'.split('_'),
	weekStart: 1,
	monthsShort: 'jin_fri_mar_apr_mag_giu_lug_agu_sit_utt_nuv_dic'.split('_'),
	formats: {
		LT: 'HH:mm',
		LTS: 'HH:mm:ss',
		L: 'DD/MM/YYYY',
		LL: 'D MMMM YYYY',
		LLL: 'D MMMM YYYY HH:mm',
		LLLL: 'dddd D MMMM YYYY HH:mm'
	},
	relativeTime: {
		future: 'intra %s',
		past: '%s fà',
		s: 'anticchia di sicunni',
		m: 'un minutu',
		mm: '%d minuti',
		h: 'n\'ura',
		hh: '%d uri',
		d: 'un jornu',
		dd: '%d jorna',
		M: 'un misi',
		MM: '%d misi',
		y: 'un annu',
		yy: '%d anni'
	},
	ordinal: n => `${n}º`
}

dayjs.locale(locale, null, true)

export default locale