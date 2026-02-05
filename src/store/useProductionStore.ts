import { create } from 'zustand'
import type { RecipeId, ItemId } from '@/types'
import { recipes } from '@/data/recipes'

/** 選択された生産アイテム */
export type SelectedProduction = {
  recipeId: RecipeId
  itemId: ItemId
  rate: number // 生産量（個/分）
}

interface ProductionState {
  selectedProductions: SelectedProduction[]
  addProduction: (recipeId: RecipeId, itemId: ItemId, rate: number) => void
  updateProductionRate: (recipeId: RecipeId, rate: number) => void
  removeProduction: (recipeId: RecipeId) => void
  clearAll: () => void
}

export const useProductionStore = create<ProductionState>((set) => ({
  selectedProductions: [],

  addProduction: (recipeId, itemId, rate) => {
    const normalizedRate = Math.max(0, rate)
    set((state) => {
      // 既に選択済みの場合は更新
      const existing = state.selectedProductions.find(
        (p) => p.recipeId === recipeId
      )
      if (existing) {
        return {
          selectedProductions: state.selectedProductions.map((p) =>
            p.recipeId === recipeId ? { ...p, rate: normalizedRate } : p
          ),
        }
      }
      // 新規追加
      return {
        selectedProductions: [
          ...state.selectedProductions,
          { recipeId, itemId, rate: normalizedRate },
        ],
      }
    })
  },

  updateProductionRate: (recipeId, rate) => {
    const normalizedRate = Math.max(0, rate)
    set((state) => ({
      selectedProductions: state.selectedProductions.map((p) =>
        p.recipeId === recipeId ? { ...p, rate: normalizedRate } : p
      ),
    }))
  },

  removeProduction: (recipeId) => {
    set((state) => ({
      selectedProductions: state.selectedProductions.filter(
        (p) => p.recipeId !== recipeId
      ),
    }))
  },

  clearAll: () => {
    set({ selectedProductions: [] })
  },
}))

/**
 * 選択された生産から鉱石消費量を計算
 * @returns 鉱石IDごとの消費量（個/分）
 */
export function calculateOreConsumption(
  selectedProductions: SelectedProduction[]
): Record<ItemId, number> {
  const consumption: Partial<Record<ItemId, number>> = {}

  for (const production of selectedProductions) {
    const recipe = recipes.find((r) => r.id === production.recipeId)
    if (!recipe) continue

    // レシピの入力素材の消費量を計算
    for (const input of recipe.inputs) {
      // 1分間の生産量に対する素材消費量
      // production.rate = 出力量/分
      // 1回のレシピ実行で output.amount 個生産
      // よって実行回数 = production.rate / output.amount
      const output = recipe.outputs[0]
      const executionsPerMinute = production.rate / output.amount
      const inputConsumptionPerMinute = executionsPerMinute * input.amount

      const current = consumption[input.itemId] ?? 0
      consumption[input.itemId] = current + inputConsumptionPerMinute
    }
  }

  return consumption as Record<ItemId, number>
}
