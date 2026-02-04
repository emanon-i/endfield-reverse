import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import itemJa from '@/locales/ja/item.json'
import facilityJa from '@/locales/ja/facility.json'

i18n.use(initReactI18next).init({
  resources: {
    ja: {
      item: itemJa,
      facility: facilityJa,
    },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  ns: ['item', 'facility'],
  defaultNS: 'item',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
