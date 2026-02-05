import { Calculator } from 'lucide-react'
import { OreRateInput } from '@/components/OreRateInput'
import { AvailableItemList } from '@/components/AvailableItemList'
import { ProductionPlan } from '@/components/ProductionPlan'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Calculator className="w-8 h-8" />
            Endfield Reverse Calculator
          </h1>
          <p className="text-muted-foreground">
            鉱石の採取レートから生産計画を立てるツール
          </p>
        </header>

        <main className="space-y-8">
          <OreRateInput />
          <AvailableItemList />
          <ProductionPlan />
        </main>
      </div>
    </div>
  )
}

export default App
