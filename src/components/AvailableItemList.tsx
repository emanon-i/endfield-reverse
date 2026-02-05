import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, Plus, X } from 'lucide-react'
import { useOreRateStore } from '@/store/useOreRateStore'
import {
  useProductionStore,
  calculateOreConsumption,
} from '@/store/useProductionStore'
import {
  calculateAvailableItemsWithConsumption,
  calculateMaxRateForSelectedItem,
} from '@/lib/calculator'
import { Input } from '@/components/ui/input'
import type { RecipeId, ItemId } from '@/types'

export function AvailableItemList() {
  const { t } = useTranslation()
  const oreRates = useOreRateStore((state) => state.oreRates)
  const selectedProductions = useProductionStore(
    (state) => state.selectedProductions
  )
  const addProduction = useProductionStore((state) => state.addProduction)
  const updateProductionRate = useProductionStore(
    (state) => state.updateProductionRate
  )
  const removeProduction = useProductionStore((state) => state.removeProduction)

  // 選択済みの生産から鉱石消費量を計算
  const consumption = useMemo(
    () => calculateOreConsumption(selectedProductions),
    [selectedProductions]
  )

  // 各選択済みアイテムの最大生産可能量を計算（他アイテムの消費を考慮）
  const maxRatesForSelected = useMemo(() => {
    const result: Partial<Record<RecipeId, number>> = {}
    for (const production of selectedProductions) {
      // このアイテム以外の消費量を計算
      const othersConsumption = calculateOreConsumption(
        selectedProductions.filter((p) => p.recipeId !== production.recipeId)
      )
      result[production.recipeId] = calculateMaxRateForSelectedItem(
        production.recipeId,
        oreRates,
        othersConsumption
      )
    }
    return result
  }, [selectedProductions, oreRates])

  // 選択済みレシピIDのSet
  const selectedRecipeIds = useMemo(
    () => new Set(selectedProductions.map((p) => p.recipeId)),
    [selectedProductions]
  )

  // 残りリソースで作成可能なアイテム一覧
  const availableItems = useMemo(
    () =>
      calculateAvailableItemsWithConsumption(
        oreRates,
        consumption,
        selectedRecipeIds
      ),
    [oreRates, consumption, selectedRecipeIds]
  )

  const handleSelectItem = (
    recipeId: RecipeId,
    itemId: ItemId,
    maxRate: number
  ) => {
    // デフォルトで最大生産量の半分を設定
    addProduction(recipeId, itemId, Math.floor(maxRate / 2) || 1)
  }

  const handleRateChange = (recipeId: RecipeId, value: string) => {
    const rate = parseInt(value, 10) || 0
    const maxRate = maxRatesForSelected[recipeId] ?? 0
    const clampedRate = Math.min(Math.max(0, rate), Math.floor(maxRate))
    updateProductionRate(recipeId, clampedRate)
  }

  const handleRemove = (recipeId: RecipeId) => {
    removeProduction(recipeId)
  }

  const hasNoInput = Object.values(oreRates).every((rate) => rate <= 0)

  if (hasNoInput) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          作成可能なアイテム
        </h2>
        <p className="text-muted-foreground">
          鉱石の採取レートを入力してください
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* 選択済みアイテム */}
      {selectedProductions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            選択中のアイテム
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedProductions.map((production) => (
              <div
                key={production.recipeId}
                className="p-4 rounded-lg border-2 border-primary bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`/images/items/${production.itemId}.png`}
                    alt={t(`items.${production.itemId}`, production.itemId)}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {t(`items.${production.itemId}`, production.itemId)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        max={Math.floor(
                          maxRatesForSelected[production.recipeId] ?? 0
                        )}
                        step={1}
                        value={production.rate}
                        onChange={(e) =>
                          handleRateChange(production.recipeId, e.target.value)
                        }
                        className="w-20 h-7 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {Math.floor(maxRatesForSelected[production.recipeId] ?? 0)} 個/分
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(production.recipeId)}
                    className="p-1 hover:bg-destructive/10 rounded text-destructive"
                    aria-label="選択解除"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 作成可能なアイテム一覧 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          作成可能なアイテム
          {selectedProductions.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              （残りリソースで）
            </span>
          )}
        </h2>

        {availableItems.length === 0 ? (
          <p className="text-muted-foreground">
            {selectedProductions.length > 0
              ? '残りリソースでは追加のアイテムを作成できません'
              : '作成可能なアイテムがありません'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableItems.map((item) => (
              <div
                key={item.recipeId}
                className="p-4 rounded-lg border bg-card text-card-foreground hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() =>
                  handleSelectItem(item.recipeId, item.itemId, item.maxRate)
                }
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`/images/items/${item.itemId}.png`}
                    alt={t(`items.${item.itemId}`, item.itemId)}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {t(`items.${item.itemId}`, item.itemId)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      最大 {Math.floor(item.maxRate)} 個/分
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
