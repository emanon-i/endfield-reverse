# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arknights Endfield factory optimizer - 「鉱石の採取レートから何が作れるか」を逆算するWebツール。既存ツールの「目標→必要素材」とは逆方向のアプローチを提供する。

## Commands

```bash
pnpm dev      # 開発サーバー起動
pnpm build    # TypeScriptコンパイル + Viteビルド
pnpm lint     # ESLint実行
pnpm preview  # プロダクションビルドのプレビュー
```

## Tech Stack

- **Runtime**: Node.js 20.x（.nvmrcで固定）
- **Framework**: React 19 + TypeScript 5.9
- **Build**: Vite 7
- **State**: Zustand
- **Styling**: Tailwind CSS 4 + shadcn/ui (new-york style)
- **Icons**: lucide-react
- **Package Manager**: pnpm

## Architecture

```
src/
├── data/          # ゲームデータ（endfield-calcから流用予定）
│   ├── recipes.ts
│   ├── items.ts
│   └── facilities.ts
├── types/         # 型定義
├── lib/           # 計算ロジック
│   └── utils.ts   # shadcn/ui用cn()関数
├── components/    # UIコンポーネント（フラット構成）
│   └── ui/        # shadcn/uiコンポーネント
├── hooks/         # カスタムフック
├── store/         # Zustand store
└── App.tsx
```

**データフロー**: 鉱石レート入力 → Calculator Engine → 作成可能アイテム表示 → ユーザー選択 → 残りリソース再計算 → 生産計画出力

## Path Alias

`@/*` → `./src/*`（tsconfig.json + vite.config.tsで設定済み）

## Styling Conventions

- shadcn/uiコンポーネントは `npx shadcn@latest add <component>` で追加
- クラス名結合には `cn()` 関数を使用（`@/lib/utils`）
- CSS変数ベースのテーマ（`index.css`にlight/dark定義）

## Data Source

ゲームデータは [JamboChen/endfield-calc](https://github.com/JamboChen/endfield-calc)（MITライセンス）から流用。流用時はライセンス表記を維持すること。

## Tri-SSD Documentation

仕様書は `docs/` 配下:
- `l1_requirements/vision.md` - 要件定義
- `l2_foundation/foundation.md` - システム構成
- `l3_phases/` - フェーズ別機能仕様
