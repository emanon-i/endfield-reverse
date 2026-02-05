/**
 * 鉱石レートから作成可能なアイテムを算出する計算ロジック
 */

import type { Recipe, ItemId, RecipeId, FacilityId } from '@/types'
import { recipes } from '@/data/recipes'
import type { OreRates } from '@/store/useOreRateStore'
import type { SelectedProduction } from '@/store/useProductionStore'

/** 作成可能なアイテム情報 */
export type AvailableItem = {
  itemId: ItemId
  recipeId: RecipeId
  maxRate: number // 最大生産量（個/分）
}

/**
 * 指定した鉱石から直接作成できるレシピを取得
 */
export function getDirectRecipesFromOre(oreItemId: ItemId): Recipe[] {
  return recipes.filter(
    (recipe) =>
      recipe.inputs.length === 1 && recipe.inputs[0].itemId === oreItemId
  )
}

/**
 * 最大生産量を計算
 * @param oreRate 鉱石の採取レート（個/分）
 * @param inputAmount レシピの入力素材量
 * @param craftingTime クラフト時間（秒）
 * @param outputAmount レシピの出力量
 * @returns 最大生産量（個/分）
 */
export function calculateMaxProduction(
  oreRate: number,
  inputAmount: number,
  _craftingTime: number, // 将来の設備数計算で使用予定
  outputAmount: number
): number {
  if (oreRate <= 0) return 0

  // 1分間に何回レシピを実行できるか（素材制限）
  const recipeExecutionsPerMinute = oreRate / inputAmount

  // 1回のレシピ実行で得られる出力量 × 実行回数
  return recipeExecutionsPerMinute * outputAmount
}

/**
 * 鉱石レートから作成可能なアイテム一覧を算出
 */
export function calculateAvailableItems(oreRates: OreRates): AvailableItem[] {
  const availableItems: AvailableItem[] = []

  // 各鉱石について直接変換可能なアイテムを算出
  for (const [oreItemId, oreRate] of Object.entries(oreRates)) {
    if (oreRate <= 0) continue

    const directRecipes = getDirectRecipesFromOre(oreItemId as ItemId)

    for (const recipe of directRecipes) {
      const input = recipe.inputs[0]
      const output = recipe.outputs[0] // 直接変換は出力が1つと仮定

      const maxRate = calculateMaxProduction(
        oreRate,
        input.amount,
        recipe.craftingTime,
        output.amount
      )

      availableItems.push({
        itemId: output.itemId,
        recipeId: recipe.id,
        maxRate,
      })
    }
  }

  return availableItems
}

/**
 * 残り鉱石レートを計算（元のレートから消費分を引く）
 * @param oreRates 元の鉱石レート
 * @param consumption 鉱石消費量（個/分）
 * @returns 残り鉱石レート
 */
export function calculateRemainingOreRates(
  oreRates: OreRates,
  consumption: Partial<Record<ItemId, number>>
): OreRates {
  const remaining = { ...oreRates }

  for (const [itemId, consumedRate] of Object.entries(consumption)) {
    const oreType = itemId as keyof OreRates
    if (oreType in remaining) {
      remaining[oreType] = Math.max(0, remaining[oreType] - (consumedRate ?? 0))
    }
  }

  return remaining
}

/**
 * 残り鉱石レートから作成可能なアイテム一覧を算出（選択中のアイテムを考慮）
 * @param oreRates 元の鉱石レート
 * @param consumption 既に選択された生産による鉱石消費量
 * @param selectedRecipeIds 既に選択されているレシピID（除外用）
 */
export function calculateAvailableItemsWithConsumption(
  oreRates: OreRates,
  consumption: Partial<Record<ItemId, number>>,
  selectedRecipeIds: Set<RecipeId>
): AvailableItem[] {
  const remainingOreRates = calculateRemainingOreRates(oreRates, consumption)
  const availableItems = calculateAvailableItems(remainingOreRates)

  // 既に選択されているレシピは除外
  return availableItems.filter((item) => !selectedRecipeIds.has(item.recipeId))
}

/** 設備ごとの必要台数情報 */
export type FacilityRequirement = {
  facilityId: FacilityId
  recipeId: RecipeId
  itemId: ItemId
  rate: number // 生産量（個/分）
  requiredCount: number // 必要台数（切り上げ）
}

/** 設備ごとの合計台数 */
export type FacilitySummary = {
  facilityId: FacilityId
  totalCount: number
}

/**
 * 1台の設備が1分間に生産できる量を計算
 * @param craftingTime クラフト時間（秒）
 * @param outputAmount 1回のクラフトで得られる出力量
 * @returns 1台の生産量（個/分）
 */
export function calculateProductionPerFacility(
  craftingTime: number,
  outputAmount: number
): number {
  // 1分間のクラフト回数 × 出力量
  return (60 / craftingTime) * outputAmount
}

/**
 * 指定した生産量に必要な設備台数を計算
 * @param rate 希望生産量（個/分）
 * @param craftingTime クラフト時間（秒）
 * @param outputAmount 1回のクラフトで得られる出力量
 * @returns 必要台数（切り上げ）
 */
export function calculateRequiredFacilityCount(
  rate: number,
  craftingTime: number,
  outputAmount: number
): number {
  if (rate <= 0) return 0

  const productionPerFacility = calculateProductionPerFacility(
    craftingTime,
    outputAmount
  )
  return Math.ceil(rate / productionPerFacility)
}

/**
 * 選択された生産リストから設備要件を算出
 */
export function calculateFacilityRequirements(
  selectedProductions: SelectedProduction[]
): FacilityRequirement[] {
  return selectedProductions
    .filter((production) => production.rate > 0)
    .map((production) => {
      const recipe = recipes.find((r) => r.id === production.recipeId)
      if (!recipe) {
        return null
      }

      const output = recipe.outputs[0]
      const requiredCount = calculateRequiredFacilityCount(
        production.rate,
        recipe.craftingTime,
        output.amount
      )

      return {
        facilityId: recipe.facilityId,
        recipeId: production.recipeId,
        itemId: production.itemId,
        rate: production.rate,
        requiredCount,
      }
    })
    .filter((req): req is FacilityRequirement => req !== null)
}

/**
 * 設備ごとの合計台数を算出
 */
export function calculateFacilitySummary(
  requirements: FacilityRequirement[]
): FacilitySummary[] {
  const summaryMap = new Map<FacilityId, number>()

  for (const req of requirements) {
    const current = summaryMap.get(req.facilityId) ?? 0
    summaryMap.set(req.facilityId, current + req.requiredCount)
  }

  return Array.from(summaryMap.entries()).map(([facilityId, totalCount]) => ({
    facilityId,
    totalCount,
  }))
}

/**
 * 選択済みアイテムの現在の最大生産可能量を計算
 * 他のアイテムの消費を考慮した上での、このアイテムが使える最大量
 * @param recipeId 対象レシピID
 * @param oreRates 元の鉱石レート
 * @param consumptionExcludingThis このアイテム以外の消費量
 */
export function calculateMaxRateForSelectedItem(
  recipeId: RecipeId,
  oreRates: OreRates,
  consumptionExcludingThis: Partial<Record<ItemId, number>>
): number {
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return 0

  // このアイテムが使える残り鉱石を計算
  const remainingOreRates = calculateRemainingOreRates(
    oreRates,
    consumptionExcludingThis
  )

  // このレシピの入力素材（鉱石）を確認
  const input = recipe.inputs[0]
  if (!input) return 0

  const availableOre = remainingOreRates[input.itemId as keyof OreRates] ?? 0
  if (availableOre <= 0) return 0

  const output = recipe.outputs[0]
  return calculateMaxProduction(
    availableOre,
    input.amount,
    recipe.craftingTime,
    output.amount
  )
}
