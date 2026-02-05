import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import {
  useProductionStore,
  calculateOreConsumption,
  type SelectedProduction,
} from '@/store/useProductionStore'
import { ItemId, RecipeId } from '@/types/constants'

describe('useProductionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useProductionStore.getState().clearAll()
    })
  })

  describe('addProduction', () => {
    it('生産アイテムを追加できる', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions).toHaveLength(1)
      expect(state.selectedProductions[0]).toEqual({
        recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
        itemId: ItemId.ITEM_CRYSTAL_SHELL,
        rate: 5,
      })
    })

    it('同じレシピを追加した場合は更新される', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            10
          )
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions).toHaveLength(1)
      expect(state.selectedProductions[0].rate).toBe(10)
    })

    it('負の値は0に正規化される', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            -5
          )
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions[0].rate).toBe(0)
    })
  })

  describe('updateProductionRate', () => {
    it('生産量を更新できる', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
        useProductionStore
          .getState()
          .updateProductionRate(RecipeId.FURNANCE_CRYSTAL_SHELL_1, 10)
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions[0].rate).toBe(10)
    })

    it('負の値は0に正規化される', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
        useProductionStore
          .getState()
          .updateProductionRate(RecipeId.FURNANCE_CRYSTAL_SHELL_1, -10)
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions[0].rate).toBe(0)
    })
  })

  describe('removeProduction', () => {
    it('生産アイテムを削除できる', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
        useProductionStore
          .getState()
          .removeProduction(RecipeId.FURNANCE_CRYSTAL_SHELL_1)
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions).toHaveLength(0)
    })

    it('存在しないレシピを削除しても何も起こらない', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
        useProductionStore
          .getState()
          .removeProduction(RecipeId.FURNANCE_QUARTZ_GLASS_1)
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions).toHaveLength(1)
    })
  })

  describe('clearAll', () => {
    it('全ての生産アイテムをクリアできる', () => {
      act(() => {
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_CRYSTAL_SHELL_1,
            ItemId.ITEM_CRYSTAL_SHELL,
            5
          )
        useProductionStore
          .getState()
          .addProduction(
            RecipeId.FURNANCE_QUARTZ_GLASS_1,
            ItemId.ITEM_QUARTZ_GLASS,
            10
          )
        useProductionStore.getState().clearAll()
      })

      const state = useProductionStore.getState()
      expect(state.selectedProductions).toHaveLength(0)
    })
  })
})

describe('calculateOreConsumption', () => {
  it('選択された生産から鉱石消費量を計算できる', () => {
    // 結晶殻レシピ: 源石鉱 1個 → 結晶殻 1個
    // 生産量 5個/分 → 源石鉱消費 5個/分
    const productions: SelectedProduction[] = [
      {
        recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
        itemId: ItemId.ITEM_CRYSTAL_SHELL,
        rate: 5,
      },
    ]

    const consumption = calculateOreConsumption(productions)

    expect(consumption[ItemId.ITEM_ORIGINIUM_ORE]).toBe(5)
  })

  it('複数の生産がある場合は合計消費量を計算できる', () => {
    // 結晶殻: 源石鉱 5個/分
    // 源石粉: 源石鉱 3個/分 → 合計 8個/分
    const productions: SelectedProduction[] = [
      {
        recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
        itemId: ItemId.ITEM_CRYSTAL_SHELL,
        rate: 5,
      },
      {
        recipeId: RecipeId.GRINDER_ORIGINIUM_POWDER_1,
        itemId: ItemId.ITEM_ORIGINIUM_POWDER,
        rate: 3,
      },
    ]

    const consumption = calculateOreConsumption(productions)

    expect(consumption[ItemId.ITEM_ORIGINIUM_ORE]).toBe(8)
  })

  it('空配列の場合は空オブジェクトを返す', () => {
    const consumption = calculateOreConsumption([])

    expect(Object.keys(consumption)).toHaveLength(0)
  })
})
