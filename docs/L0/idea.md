# アークナイツ エンドフィールド 工場最適化ツール 要件定義書

**プロジェクト名:** endfield-reverse  
**作成日:** 2026-02-03  
**ステータス:** 要件策定完了 / 実装未着手

---

## 1. 概要

### 1.1 背景

アークナイツ エンドフィールドの工場生産（AIC: Automated Industry Complex）システムにおいて、フィールドで採取する鉱石素材がボトルネックとなる。プレイヤーは限られた鉱石供給の中で、売却品・装備素材・消費財など複数の成果物を効率的に生産したい。

### 1.2 既存ツールとの差別化

| 既存ツール | アプローチ | 本ツール |
|------------|------------|----------|
| Endfield Calc 等 | 目標成果物 → 必要素材を逆算 | **採取上限 → 作れるものを順算** |

既存ツールは「これを作りたい、何が必要？」という問いに答える。  
本ツールは「この素材量で何が作れる？」という**逆方向**の問いに答える。

### 1.3 ゴール

鉱石の採取レート（個/分）を入力として、作成可能な成果物の組み合わせをインタラクティブに選択し、最終的な生産計画を出力する。

---

## 2. 機能要件

### 2.1 MVP（Phase 1）

#### 入力

- 鉱石の採取レート（個/分）
  - 源石鉱（Originium Ore）
  - 紫晶鉱（Amethyst Ore）
  - 青鉄鉱（Ferrium Ore）
  - 銅鉱（Cuprium Ore）※後半で解放、水中採掘

#### 処理

1. 入力された鉱石量から「作成可能なアイテム一覧」を算出
2. 各アイテムの「最大生産量（個/分）」を表示
3. ユーザーがアイテムと生産量を選択
4. 選択に応じて鉱石消費を計算し、残りリソースで作れるものを再計算
5. 選択可能なアイテムが減っていくインタラクティブな体験

#### 出力

- 選択した生産リスト（アイテム名 × 生産量/分）
- 必要な設備台数

#### 前提条件（MVP）

- スペース: 無限
- 電力: 無限
- 草系素材（蕎花等）: 工場内栽培により無限供給可能として扱う
- レシピ: 全解放状態

### 2.2 設備・面積算出（Phase 2）

#### 追加出力

- 各設備の必要台数
- 最低必要マス数（設備サイズ × 台数の合計）

#### 備考

- コンベア・分岐・合流のレイアウトは計算対象外
- 実際の配置は既存ツール（EndfieldTools等）のブループリント機能を利用

### 2.3 制約フィルタ（Phase 3 / 将来）

| 制約項目 | 説明 |
|----------|------|
| 電力上限 | 発電面積・フィールド設備（ジップライン・砲台等）の消費を考慮 |
| AICスペース上限 | 利用可能なグリッド数でフィルタ |
| 解放済みレシピ | ゲーム進行度に応じたフィルタ |

---

## 3. 非機能要件

### 3.1 データ管理

| 項目 | 方針 |
|------|------|
| レシピデータ | **Endfield Calc（JamboChen/endfield-calc）から流用** |
| ライセンス | MIT License（著作権表示とライセンス文の記載が必要） |
| 更新頻度 | 上流リポジトリの更新に追従 or 手動対応 |
| データ形式 | TypeScript（そのまま使用 or JSON変換） |

#### データソース詳細

**リポジトリ:** <https://github.com/JamboChen/endfield-calc>

| ファイル | 内容 | 規模 |
|----------|------|------|
| `src/data/recipes.ts` | 全レシピデータ | 1041行 |
| `src/data/items.ts` | アイテムマスタ | - |
| `src/data/facilities.ts` | 設備データ | - |

**ライセンス表記例:**

```
Data derived from endfield-calc by JamboChen
https://github.com/JamboChen/endfield-calc
Licensed under MIT License
```

### 3.2 計算仕様

| 項目 | 仕様 |
|------|------|
| 時間単位 | 分ベース（ゲーム内表記に準拠） |
| 効率の定義 | 鉱石をロスなく使い切るレーン効率 |
| 複数レシピ | 同一素材に複数レシピがある場合は同列表示、ユーザー選択 |

### 3.3 プラットフォーム

- 未定（Web / CLI のいずれか）

---

## 4. データモデル（案）

### 4.1 素材分類

```
素材
├─ フィールド採取（ボトルネック）
│   ├─ 源石鉱
│   ├─ 紫晶鉱
│   ├─ 青鉄鉱
│   └─ 銅鉱（後半解放・水中採掘）
│
├─ 工場内栽培（実質無限）
│   ├─ 蕎花（Buckflower）
│   └─ サンドリーフ（Sandleaf）
│
└─ 中間生産物
    ├─ 源石粉末
    ├─ 紫晶部品
    ├─ 青鉄ボトル
    └─ ...
```

### 4.2 レシピ構造（Endfield Calc準拠）

```typescript
// 実際のデータ構造（src/data/recipes.ts より）
{
  id: RecipeId.COMPONENT_GLASS_CMPT_1,
  inputs: [{ itemId: ItemId.ITEM_QUARTZ_GLASS, amount: 1 }],
  outputs: [{ itemId: ItemId.ITEM_GLASS_CMPT, amount: 1 }],
  facilityId: FacilityId.ITEM_PORT_CMPT_MC_1,
  craftingTime: 2,  // 秒単位
}
```

#### 型定義

```typescript
interface Recipe {
  id: RecipeId;
  inputs: { itemId: ItemId; amount: number }[];
  outputs: { itemId: ItemId; amount: number }[];
  facilityId: FacilityId;
  craftingTime: number;  // 秒
}
```

### 4.3 設備データ（例）

```json
{
  "id": "filling_unit",
  "name": "充填機",
  "size": { "width": 2, "height": 2 },
  "power_consumption": 50
}
```

---

## 5. 計算アルゴリズム概要

### 5.1 作成可能量の算出

```
For each 最終成果物:
    レシピを再帰的に展開
    各フィールド採取素材の必要量を集計
    ボトルネック素材を特定
    最大生産量 = min(各素材の供給量 / 必要量)
```

### 5.2 選択後の再計算

```
ユーザーが アイテムX を N個/分 選択:
    アイテムX のレシピを展開
    消費する鉱石量を算出
    残り鉱石 = 現在の鉱石 - 消費量
    全アイテムの作成可能量を再計算
```

---

## 6. 開発フェーズ

```
Phase 1: MVP（理想計算）
├─ 前提: スペース無限、電力無限
├─ 入力: 鉱石レート（個/分）
├─ 出力: 作れるものの最大組み合わせ
└─ 機能: 選択→残リソース更新→再計算

Phase 2: 設備数・マス数算出
├─ 必要機械台数
└─ 最低必要マス数（機械サイズ×台数）

Phase 3: 制約フィルタ（将来）
├─ 電力上限
├─ AICスペース上限
└─ 解放済みレシピのみ
```

---

## 7. 未解決事項・今後の検討

| 項目 | 状態 | 備考 |
|------|------|------|
| レシピデータの収集方法 | ✅ **解決** | Endfield Calc（MIT）から流用 |
| プラットフォーム選定 | 未定 | Web推奨？ |
| 面積最適化 | スコープ外 | 2次元グリッド配置は組み合わせ爆発 |
| ゲーム進行度フィルタの実装方式 | 後回し | チェックボックス？プリセット？ |

---

## 8. 参考リンク

### データソース（流用元）

- [JamboChen/endfield-calc (GitHub)](https://github.com/JamboChen/endfield-calc) - **MITライセンス、データ流用元**

### 既存ツール

- [Endfield Calc](https://jambochen.github.io/endfield-calc/) - 数値計算特化
- [EndfieldLab](https://endfield-calc.github.io/) - 機械数・リソース要件
- [EndfieldTools](https://endfieldtools.dev/factory-planner/) - ビジュアルプランナー
- [AKEF-AIC-Calculator](https://micro215.github.io/AKEF-AIC-Calculator/) - 複数レシピ対応

### 攻略サイト

- [Game8 エンドフィールド攻略](https://game8.jp/arknights-endfield)
- [GameWith エンドフィールド攻略](https://gamewith.jp/akendfield/)
- [アルテマ エンドフィールド攻略](https://altema.jp/akendfield/)

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-03 | 初版作成 |
| 2026-02-03 | データソースをEndfield Calc（MIT）に決定、データ構造を実際の形式に更新 |
| 2026-02-03 | プロジェクト名を「endfield-reverse」に決定 |
