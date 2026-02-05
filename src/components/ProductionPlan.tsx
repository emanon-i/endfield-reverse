import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Factory, ClipboardList } from 'lucide-react'
import { useProductionStore } from '@/store/useProductionStore'
import {
  calculateFacilityRequirements,
  calculateFacilitySummary,
} from '@/lib/calculator'

export function ProductionPlan() {
  const { t } = useTranslation()
  const selectedProductions = useProductionStore(
    (state) => state.selectedProductions
  )

  const facilityRequirements = useMemo(
    () => calculateFacilityRequirements(selectedProductions),
    [selectedProductions]
  )

  const facilitySummary = useMemo(
    () => calculateFacilitySummary(facilityRequirements),
    [facilityRequirements]
  )

  if (selectedProductions.length === 0) {
    return null
  }

  // rate > 0 のアイテムのみ表示
  const activeRequirements = facilityRequirements.filter(
    (req) => req.rate > 0 && req.requiredCount > 0
  )

  if (activeRequirements.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      {/* 生産計画リスト */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          生産計画
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">アイテム</th>
                <th className="text-right py-2 px-3">生産量</th>
                <th className="text-left py-2 px-3">設備</th>
                <th className="text-right py-2 px-3">必要台数</th>
              </tr>
            </thead>
            <tbody>
              {activeRequirements.map((req) => (
                <tr key={req.recipeId} className="border-b last:border-b-0">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/images/items/${req.itemId}.png`}
                        alt={t(`items.${req.itemId}`, req.itemId)}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span>{t(`items.${req.itemId}`, req.itemId)}</span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3">{req.rate} 個/分</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/images/facilities/${req.facilityId}.png`}
                        alt={t(`facilities.${req.facilityId}`, req.facilityId)}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span>
                        {t(`facilities.${req.facilityId}`, req.facilityId)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3 font-medium">
                    {req.requiredCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 設備合計 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Factory className="w-5 h-5" />
          設備合計
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facilitySummary.map((summary) => (
            <div
              key={summary.facilityId}
              className="p-4 rounded-lg border bg-card text-card-foreground"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`/images/facilities/${summary.facilityId}.png`}
                  alt={t(
                    `facilities.${summary.facilityId}`,
                    summary.facilityId
                  )}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {t(`facilities.${summary.facilityId}`, summary.facilityId)}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {summary.totalCount} 台
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
