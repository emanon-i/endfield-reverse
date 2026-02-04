# endfield-reverse

**アークナイツ エンドフィールド** 工場生産（AIC）逆算ツール

「この鉱石量で何が作れる？」を計算するWebアプリケーション。

## コンセプト

既存の工場計算ツールは「目標アイテム → 必要素材」を計算しますが、本ツールは**逆方向**のアプローチを提供します。

| 既存ツール | 本ツール |
|-----------|---------|
| 「これを作りたい、何が必要？」 | 「この素材量で何が作れる？」 |

鉱石の採取レートを入力し、作成可能なアイテムをインタラクティブに選択して、最終的な生産計画を出力します。

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# Lint
pnpm lint
```

## 技術スタック

- React 19 + TypeScript 5.9
- Vite 7
- Zustand（状態管理）
- Tailwind CSS 4 + shadcn/ui

## Special Thanks

### [JamboChen/endfield-calc](https://github.com/JamboChen/endfield-calc)

ゲームデータお借りしてます！！マジ感謝！！！怒られたら消します！！！

> **License**: MIT License - Copyright (c) 2026 JamboChen

詳細は [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) を参照してください。

## 関連リンク

- [Endfield Calc](https://jambochen.github.io/endfield-calc/) - 本ツールのデータソース
- [EndfieldLab](https://endfield-calc.github.io/)
- [EndfieldTools](https://endfieldtools.dev/factory-planner/)
- [AKEF-AIC-Calculator](https://micro215.github.io/AKEF-AIC-Calculator/)

## Disclaimer

本ツールは非公式のファンメイドツール（二次創作）です。

**アークナイツ：エンドフィールド** © Hypergryph / Gryphline

- [公式サイト](https://endfield.hypergryph.com/)
- [公式X（Twitter）](https://twitter.com/ArknightsEF)

## License

MIT
