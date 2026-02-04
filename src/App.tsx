import { Calculator } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-4">
          <Calculator className="w-8 h-8" />
          Endfield Reverse Calculator
        </h1>
        <p className="text-muted-foreground">
          鉱石の採取レートから生産計画を立てるツール
        </p>
      </div>
    </div>
  )
}

export default App
