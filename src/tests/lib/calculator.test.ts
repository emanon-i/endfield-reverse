import { describe, it, expect } from 'vitest'
import {
  getDirectRecipesFromOre,
  calculateMaxProduction,
  calculateAvailableItems,
  calculateRemainingOreRates,
  calculateAvailableItemsWithConsumption,
  calculateProductionPerFacility,
  calculateRequiredFacilityCount,
  calculateFacilityRequirements,
  calculateFacilitySummary,
} from '@/lib/calculator'
import { ItemId, RecipeId, FacilityId } from '@/types/constants'
import { OreType, type OreRates } from '@/store/useOreRateStore'

describe('calculator', () => {
  describe('getDirectRecipesFromOre', () => {
    it('源石鉱から直接作成できるレシピを取得できる', () => {
      const recipes = getDirectRecipesFromOre(ItemId.ITEM_ORIGINIUM_ORE)
      expect(recipes.length).toBeGreaterThan(0)

      // 源石鉱 → 結晶殻 (FURNANCE_CRYSTAL_SHELL_1)
      const crystalShellRecipe = recipes.find((r) =>
        r.outputs.some((o) => o.itemId === ItemId.ITEM_CRYSTAL_SHELL)
      )
      expect(crystalShellRecipe).toBeDefined()

      // 源石鉱 → 源石粉 (GRINDER_ORIGINIUM_POWDER_1)
      const originiumPowderRecipe = recipes.find((r) =>
        r.outputs.some((o) => o.itemId === ItemId.ITEM_ORIGINIUM_POWDER)
      )
      expect(originiumPowderRecipe).toBeDefined()
    })

    it('紫晶鉱から直接作成できるレシピを取得できる', () => {
      const recipes = getDirectRecipesFromOre(ItemId.ITEM_QUARTZ_SAND)
      expect(recipes.length).toBeGreaterThan(0)

      // 紫晶鉱 → 石英ガラス (FURNANCE_QUARTZ_GLASS_1)
      const quartzGlassRecipe = recipes.find((r) =>
        r.outputs.some((o) => o.itemId === ItemId.ITEM_QUARTZ_GLASS)
      )
      expect(quartzGlassRecipe).toBeDefined()
    })

    it('青鉄鉱から直接作成できるレシピを取得できる', () => {
      const recipes = getDirectRecipesFromOre(ItemId.ITEM_IRON_ORE)
      expect(recipes.length).toBeGreaterThan(0)

      // 青鉄鉱 → 鉄塊 (FURNANCE_IRON_NUGGET_1)
      const ironNuggetRecipe = recipes.find((r) =>
        r.outputs.some((o) => o.itemId === ItemId.ITEM_IRON_NUGGET)
      )
      expect(ironNuggetRecipe).toBeDefined()
    })

    it('存在しないアイテムIDの場合は空配列を返す', () => {
      const recipes = getDirectRecipesFromOre('invalid_item_id' as ItemId)
      expect(recipes).toEqual([])
    })
  })

  describe('calculateMaxProduction', () => {
    it('鉱石レートと素材量からアイテムの最大生産量を計算できる', () => {
      // 例: 源石鉱 10個/分、レシピが1個消費で2秒かかる場合
      // 生産量 = (10 / 1) * (60 / 2) = 10 * 30 = 300 個/分
      // ...ただし実際は入力レートで制限されるので 10個/分が上限

      // 源石鉱 → 結晶殻 (1個消費、2秒、1個出力)
      // oreRate=10 の場合、最大で 10個/分 生産可能
      const result = calculateMaxProduction(10, 1, 2, 1)
      expect(result).toBe(10)
    })

    it('出力量が2個のレシピの場合は生産量が2倍になる', () => {
      // 1個消費、2秒、2個出力
      // oreRate=10 → 10回/分生産可能 → 20個/分出力
      const result = calculateMaxProduction(10, 1, 2, 2)
      expect(result).toBe(20)
    })

    it('消費量が2個のレシピの場合は生産量が半分になる', () => {
      // 2個消費、2秒、1個出力
      // oreRate=10 → 5回/分生産可能 → 5個/分出力
      const result = calculateMaxProduction(10, 2, 2, 1)
      expect(result).toBe(5)
    })

    it('鉱石レートが0の場合は生産量も0', () => {
      const result = calculateMaxProduction(0, 1, 2, 1)
      expect(result).toBe(0)
    })

    it('レシピ速度より鉱石レートが小さい場合は鉱石レートで制限される', () => {
      // 1個消費、2秒（30回/分可能）、1個出力
      // oreRate=5 → 最大5回/分しかできない → 5個/分出力
      const result = calculateMaxProduction(5, 1, 2, 1)
      expect(result).toBe(5)
    })
  })

  describe('calculateAvailableItems', () => {
    it('鉱石レートから作成可能なアイテム一覧を算出できる', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      const items = calculateAvailableItems(oreRates)

      expect(items.length).toBeGreaterThan(0)

      // 結晶殻が含まれている
      const crystalShell = items.find(
        (i) => i.itemId === ItemId.ITEM_CRYSTAL_SHELL
      )
      expect(crystalShell).toBeDefined()
      expect(crystalShell!.maxRate).toBe(10) // 10個/分入力 × 1個出力 / 1個消費

      // 源石粉が含まれている
      const originiumPowder = items.find(
        (i) => i.itemId === ItemId.ITEM_ORIGINIUM_POWDER
      )
      expect(originiumPowder).toBeDefined()
      expect(originiumPowder!.maxRate).toBe(10)
    })

    it('複数の鉱石レートが設定されている場合は全てのアイテムを返す', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 10,
        [OreType.IRON]: 10,
      }

      const items = calculateAvailableItems(oreRates)

      // 源石系
      const crystalShell = items.find(
        (i) => i.itemId === ItemId.ITEM_CRYSTAL_SHELL
      )
      expect(crystalShell).toBeDefined()

      // 紫晶系
      const quartzGlass = items.find(
        (i) => i.itemId === ItemId.ITEM_QUARTZ_GLASS
      )
      expect(quartzGlass).toBeDefined()

      // 青鉄系
      const ironNugget = items.find((i) => i.itemId === ItemId.ITEM_IRON_NUGGET)
      expect(ironNugget).toBeDefined()
    })

    it('全ての鉱石レートが0の場合は空配列を返す', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 0,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      const items = calculateAvailableItems(oreRates)

      expect(items).toEqual([])
    })

    it('各アイテムにrecipeIdが含まれている', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      const items = calculateAvailableItems(oreRates)

      items.forEach((item) => {
        expect(item.recipeId).toBeDefined()
      })
    })
  })

  describe('calculateRemainingOreRates', () => {
    it('消費量を差し引いた残り鉱石レートを計算できる', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 5,
        [OreType.IRON]: 8,
      }

      const consumption = {
        [ItemId.ITEM_ORIGINIUM_ORE]: 3,
        [ItemId.ITEM_QUARTZ_SAND]: 2,
      }

      const remaining = calculateRemainingOreRates(oreRates, consumption)

      expect(remaining[OreType.ORIGINIUM]).toBe(7)
      expect(remaining[OreType.QUARTZ]).toBe(3)
      expect(remaining[OreType.IRON]).toBe(8) // 消費なし
    })

    it('消費量が元のレートを超える場合は0になる', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 5,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      const consumption = {
        [ItemId.ITEM_ORIGINIUM_ORE]: 10,
      }

      const remaining = calculateRemainingOreRates(oreRates, consumption)

      expect(remaining[OreType.ORIGINIUM]).toBe(0)
    })

    it('空の消費量の場合は元のレートがそのまま返る', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 5,
        [OreType.IRON]: 8,
      }

      const remaining = calculateRemainingOreRates(oreRates, {})

      expect(remaining[OreType.ORIGINIUM]).toBe(10)
      expect(remaining[OreType.QUARTZ]).toBe(5)
      expect(remaining[OreType.IRON]).toBe(8)
    })
  })

  describe('calculateAvailableItemsWithConsumption', () => {
    it('消費量を考慮した作成可能アイテム一覧を算出できる', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      // 源石鉱を5個/分消費
      const consumption = {
        [ItemId.ITEM_ORIGINIUM_ORE]: 5,
      }

      const items = calculateAvailableItemsWithConsumption(
        oreRates,
        consumption,
        new Set()
      )

      // 残り5個/分で計算される
      const crystalShell = items.find(
        (i) => i.itemId === ItemId.ITEM_CRYSTAL_SHELL
      )
      expect(crystalShell).toBeDefined()
      expect(crystalShell!.maxRate).toBe(5)
    })

    it('選択済みレシピは除外される', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      const selectedRecipeIds = new Set([RecipeId.FURNANCE_CRYSTAL_SHELL_1])

      const items = calculateAvailableItemsWithConsumption(
        oreRates,
        {},
        selectedRecipeIds
      )

      // 結晶殻のレシピは除外されている
      const crystalShell = items.find(
        (i) => i.recipeId === RecipeId.FURNANCE_CRYSTAL_SHELL_1
      )
      expect(crystalShell).toBeUndefined()

      // 源石粉は含まれている
      const originiumPowder = items.find(
        (i) => i.itemId === ItemId.ITEM_ORIGINIUM_POWDER
      )
      expect(originiumPowder).toBeDefined()
    })

    it('残りリソースが0の場合は空配列を返す', () => {
      const oreRates: OreRates = {
        [OreType.ORIGINIUM]: 10,
        [OreType.QUARTZ]: 0,
        [OreType.IRON]: 0,
      }

      // 全ての源石鉱を消費
      const consumption = {
        [ItemId.ITEM_ORIGINIUM_ORE]: 10,
      }

      const items = calculateAvailableItemsWithConsumption(
        oreRates,
        consumption,
        new Set()
      )

      expect(items).toEqual([])
    })
  })

  describe('calculateProductionPerFacility', () => {
    it('1台の設備が1分間に生産できる量を計算できる', () => {
      // 2秒のクラフト時間、1個出力
      // 60秒 / 2秒 = 30回/分 × 1個 = 30個/分
      const result = calculateProductionPerFacility(2, 1)
      expect(result).toBe(30)
    })

    it('出力量が2個の場合は生産量が2倍になる', () => {
      // 2秒のクラフト時間、2個出力
      // 30回/分 × 2個 = 60個/分
      const result = calculateProductionPerFacility(2, 2)
      expect(result).toBe(60)
    })

    it('クラフト時間が長いほど生産量が減る', () => {
      // 4秒のクラフト時間、1個出力
      // 60秒 / 4秒 = 15回/分 × 1個 = 15個/分
      const result = calculateProductionPerFacility(4, 1)
      expect(result).toBe(15)
    })
  })

  describe('calculateRequiredFacilityCount', () => {
    it('必要な設備台数を計算できる', () => {
      // 希望生産量 30個/分、2秒クラフト、1個出力
      // 1台で30個/分生産可能 → 1台必要
      const result = calculateRequiredFacilityCount(30, 2, 1)
      expect(result).toBe(1)
    })

    it('生産量が1台の能力を超える場合は切り上げ', () => {
      // 希望生産量 31個/分、2秒クラフト、1個出力
      // 1台で30個/分生産可能 → 2台必要
      const result = calculateRequiredFacilityCount(31, 2, 1)
      expect(result).toBe(2)
    })

    it('生産量が0の場合は0台', () => {
      const result = calculateRequiredFacilityCount(0, 2, 1)
      expect(result).toBe(0)
    })

    it('生産量がちょうど2台分の場合は2台', () => {
      // 希望生産量 60個/分、2秒クラフト、1個出力
      // 1台で30個/分生産可能 → 2台必要
      const result = calculateRequiredFacilityCount(60, 2, 1)
      expect(result).toBe(2)
    })
  })

  describe('calculateFacilityRequirements', () => {
    it('選択された生産リストから設備要件を算出できる', () => {
      // 結晶殻: 源石鉱→結晶殻, craftingTime=2, facilityId=ITEM_PORT_FURNANCE_1
      const selectedProductions = [
        {
          recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          itemId: ItemId.ITEM_CRYSTAL_SHELL,
          rate: 30,
        },
      ]

      const requirements = calculateFacilityRequirements(selectedProductions)

      expect(requirements).toHaveLength(1)
      expect(requirements[0].facilityId).toBe(FacilityId.ITEM_PORT_FURNANCE_1)
      expect(requirements[0].itemId).toBe(ItemId.ITEM_CRYSTAL_SHELL)
      expect(requirements[0].rate).toBe(30)
      expect(requirements[0].requiredCount).toBe(1)
    })

    it('rate=0の生産はフィルタされる', () => {
      const selectedProductions = [
        {
          recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          itemId: ItemId.ITEM_CRYSTAL_SHELL,
          rate: 0,
        },
      ]

      const requirements = calculateFacilityRequirements(selectedProductions)

      expect(requirements).toHaveLength(0)
    })

    it('複数の生産がある場合は全て算出される', () => {
      const selectedProductions = [
        {
          recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          itemId: ItemId.ITEM_CRYSTAL_SHELL,
          rate: 30,
        },
        {
          recipeId: RecipeId.FURNANCE_QUARTZ_GLASS_1,
          itemId: ItemId.ITEM_QUARTZ_GLASS,
          rate: 30,
        },
      ]

      const requirements = calculateFacilityRequirements(selectedProductions)

      expect(requirements).toHaveLength(2)
    })
  })

  describe('calculateFacilitySummary', () => {
    it('設備ごとの合計台数を算出できる', () => {
      const requirements = [
        {
          facilityId: FacilityId.ITEM_PORT_FURNANCE_1,
          recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          itemId: ItemId.ITEM_CRYSTAL_SHELL,
          rate: 30,
          requiredCount: 1,
        },
        {
          facilityId: FacilityId.ITEM_PORT_FURNANCE_1,
          recipeId: RecipeId.FURNANCE_QUARTZ_GLASS_1,
          itemId: ItemId.ITEM_QUARTZ_GLASS,
          rate: 30,
          requiredCount: 2,
        },
      ]

      const summary = calculateFacilitySummary(requirements)

      expect(summary).toHaveLength(1)
      expect(summary[0].facilityId).toBe(FacilityId.ITEM_PORT_FURNANCE_1)
      expect(summary[0].totalCount).toBe(3) // 1 + 2
    })

    it('異なる設備は別々に集計される', () => {
      const requirements = [
        {
          facilityId: FacilityId.ITEM_PORT_FURNANCE_1,
          recipeId: RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          itemId: ItemId.ITEM_CRYSTAL_SHELL,
          rate: 30,
          requiredCount: 1,
        },
        {
          facilityId: FacilityId.ITEM_PORT_GRINDER_1,
          recipeId: RecipeId.GRINDER_ORIGINIUM_POWDER_1,
          itemId: ItemId.ITEM_ORIGINIUM_POWDER,
          rate: 30,
          requiredCount: 1,
        },
      ]

      const summary = calculateFacilitySummary(requirements)

      expect(summary).toHaveLength(2)

      const furnace = summary.find(
        (s) => s.facilityId === FacilityId.ITEM_PORT_FURNANCE_1
      )
      const grinder = summary.find(
        (s) => s.facilityId === FacilityId.ITEM_PORT_GRINDER_1
      )

      expect(furnace?.totalCount).toBe(1)
      expect(grinder?.totalCount).toBe(1)
    })

    it('空の配列の場合は空配列を返す', () => {
      const summary = calculateFacilitySummary([])
      expect(summary).toEqual([])
    })
  })
})
