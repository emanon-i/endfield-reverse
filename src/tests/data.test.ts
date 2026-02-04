import { describe, it, expect } from 'vitest'
import { items, recipes, facilities } from '@/data'
import { ItemId, FacilityId } from '@/types/constants'
import itemJa from '@/locales/ja/item.json'
import facilityJa from '@/locales/ja/facility.json'

describe('データ整合性', () => {
  describe('items', () => {
    it('全アイテムが有効なItemIdを持つ', () => {
      const validIds = new Set(Object.values(ItemId))
      for (const item of items) {
        expect(validIds.has(item.id)).toBe(true)
      }
    })

    it('アイテムIDに重複がない', () => {
      const ids = items.map((i) => i.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('recipes', () => {
    it('全レシピのinput/outputが有効なItemIdを参照', () => {
      const validIds = new Set(Object.values(ItemId))
      for (const recipe of recipes) {
        for (const input of recipe.inputs) {
          expect(validIds.has(input.itemId)).toBe(true)
        }
        for (const output of recipe.outputs) {
          expect(validIds.has(output.itemId)).toBe(true)
        }
      }
    })

    it('全レシピが有効なFacilityIdを参照', () => {
      const validIds = new Set(Object.values(FacilityId))
      for (const recipe of recipes) {
        expect(validIds.has(recipe.facilityId)).toBe(true)
      }
    })

    it('craftingTimeが正の数', () => {
      for (const recipe of recipes) {
        expect(recipe.craftingTime).toBeGreaterThan(0)
      }
    })
  })

  describe('facilities', () => {
    it('全設備が有効なFacilityIdを持つ', () => {
      const validIds = new Set(Object.values(FacilityId))
      for (const facility of facilities) {
        expect(validIds.has(facility.id)).toBe(true)
      }
    })

    it('設備IDに重複がない', () => {
      const ids = facilities.map((f) => f.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })
})

describe('i18n翻訳データ', () => {
  it('全アイテムに日本語翻訳がある', () => {
    for (const item of items) {
      expect(itemJa[item.id as keyof typeof itemJa]).toBeDefined()
    }
  })

  it('全設備に日本語翻訳がある', () => {
    for (const facility of facilities) {
      expect(facilityJa[facility.id as keyof typeof facilityJa]).toBeDefined()
    }
  })
})
