# Yohei Furukawa | Coder Portfolio

古川洋平のポートフォリオサイトです。  
コーダー歴 3 年半の実績と作品を掲載しています。

## デモ

[https://yohei0819.github.io/portfolio/](https://yohei0819.github.io/portfolio/)

## 主な機能

- **ローディングアニメーション** — GSAP によるプログレスバー付きローダー
- **パーティクル背景** — Canvas で描画するインタラクティブパーティクル（マウス追従・タッチ対応）
- **タイピングエフェクト** — Hero セクションの肩書きを 1 文字ずつ打ち出す演出
- **スクロール連動アニメーション** — ScrollTrigger によるフェードイン・スプリットテキスト
- **Works フィルター** — 技術タグによる作品のフィルタリング（GSAP トランジション付き）
- **Works モーダル** — 各作品の詳細情報をモーダルで表示（フォーカストラップ対応）
- **フォームバリデーション** — リアルタイム＆blur 時のクライアントサイドバリデーション
- **カスタムカーソル** — PC ホバー環境でのカスタムカーソル演出
- **レスポンシブ対応** — モバイル / タブレット / デスクトップの 3 ブレイクポイント
- **アクセシビリティ** — `prefers-reduced-motion` 対応、WAI-ARIA 属性、フォーカス管理

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| マークアップ | HTML5（セマンティクス・WAI-ARIA） |
| スタイル | CSS3（カスタムプロパティ・Grid・Flexbox） |
| スクリプト | JavaScript（ES5+）、jQuery 3.7 |
| アニメーション | GSAP 3.12（ScrollTrigger・ScrollToPlugin） |
| フォント | Google Fonts（Inter・Noto Sans JP） |

## ディレクトリ構成

```
├── index.html          # メインページ
├── css/
│   └── style.css       # すべてのスタイル
├── js/
│   └── main.js         # すべてのスクリプト
└── images/             # 作品サムネイル・favicon
```

## セットアップ

静的サイトのため、ビルド不要で動作します。

```bash
# ローカルで確認する場合
git clone https://github.com/yohei0819/portfolio.git
cd portfolio
# 任意のローカルサーバーで開く（例: VS Code Live Server）
```

## ブラウザ対応

- Chrome / Edge（最新 2 バージョン）
- Firefox（最新 2 バージョン）
- Safari（最新 2 バージョン）
- iOS Safari / Android Chrome

## ライセンス

&copy; 2026 Yohei Furukawa. All Rights Reserved.
