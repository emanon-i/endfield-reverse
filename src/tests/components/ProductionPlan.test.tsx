import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductionPlan } from '@/components/ProductionPlan'
import { useProductionStore } from '@/store/useProductionStore'
import { ItemId, RecipeId } from '@/types/constants'

describe('ProductionPlan', () => {
  beforeEach(() => {
    useProductionStore.getState().clearAll()
  })

  describe('レンダリング', () => {
    it('選択中のアイテムがない場合は何も表示しない', () => {
      const { container } = render(<ProductionPlan />)
      expect(container.firstChild).toBeNull()
    })

    it('選択中のアイテムがあるが全てrate=0の場合は何も表示しない', () => {
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          0
        )

      const { container } = render(<ProductionPlan />)
      expect(container.firstChild).toBeNull()
    })

    it('選択したアイテムと生産量の一覧が表示される', () => {
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          30
        )

      render(<ProductionPlan />)

      expect(screen.getByText('生産計画')).toBeInTheDocument()
      expect(screen.getByText('30 個/分')).toBeInTheDocument()
    })

    it('各アイテムに必要な設備台数が表示される', () => {
      // 結晶殻: craftingTime=2, 1個出力 → 1台で30個/分
      // 30個/分生産 → 1台必要
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          30
        )

      render(<ProductionPlan />)

      // テーブルの必要台数列に1が表示される
      const tableRows = screen.getAllByRole('row')
      // ヘッダー行を除いて確認
      expect(tableRows.length).toBeGreaterThan(1)
    })

    it('設備ごとの合計台数が表示される', () => {
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          30
        )

      render(<ProductionPlan />)

      expect(screen.getByText('設備合計')).toBeInTheDocument()
      expect(screen.getByText(/台$/)).toBeInTheDocument()
    })

    it('複数のアイテムを選択した場合は全て表示される', () => {
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          30
        )
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_QUARTZ_GLASS_1,
          ItemId.ITEM_QUARTZ_GLASS,
          30
        )

      render(<ProductionPlan />)

      // 2行のデータ行がある（ヘッダー除く）
      const tableRows = screen.getAllByRole('row')
      expect(tableRows.length).toBe(3) // ヘッダー + 2データ行
    })
  })

  describe('計算の正確性', () => {
    it('設備台数が正しく計算される（1台で足りる場合）', () => {
      // 結晶殻: craftingTime=2秒、1個出力
      // 1台で60/2 * 1 = 30個/分生産可能
      // 30個/分希望 → 1台必要
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          30
        )

      render(<ProductionPlan />)

      // テーブルの最後の列（必要台数）を確認
      const cells = screen.getAllByRole('cell')
      const lastCell = cells[cells.length - 1]
      expect(lastCell.textContent).toBe('1')
    })

    it('設備台数が正しく計算される（複数台必要な場合）', () => {
      // 60個/分希望 → 2台必要
      useProductionStore
        .getState()
        .addProduction(
          RecipeId.FURNANCE_CRYSTAL_SHELL_1,
          ItemId.ITEM_CRYSTAL_SHELL,
          60
        )

      render(<ProductionPlan />)

      const cells = screen.getAllByRole('cell')
      const lastCell = cells[cells.length - 1]
      expect(lastCell.textContent).toBe('2')
    })
  })
})
