# DMM Download Helper

<p align="center">
<img src="public/logo-128.png" alt="Logo" width="128">
</p>

<p align="center">
  <strong>シンプルで効率的な DMM 動画ダウンロード補助ツール</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | 日本語 | <a href="README-CN.md">简体中文</a>
</p>

---

## 📖 プロジェクト概要

**DMM Download Helper** は、DMM (dmm.com / dmm.co.jp) プラットフォーム向けに設計されたブラウザ拡張機能です。動画再生時に MPD 清单アドレスと対応する解密キー（Widevine/ClearKey）を自動的に捕捉し、一つで `N_m3u8DL-RE` のダウンロードコマンドラインを生成することができます。

> [!NOTE]
> 本プロジェクトは学習および研究の目的のみに使用され、関連する法律や規制を遵守してください。

## ✨ 核心機能

- 🎯 **MPD 自動キャプチャ**：再生プレイヤーのリクエストをリアルタイムで監視し、正確にビデオリストURLを抽出。
- 🔑 **暗号化キーの抽出**：Licenseリクエストを自動的に拦截し解析し、暗号化に必要なKIDとKeyを取得。
- 🚀 **一括でコマンド生成**：`N_m3u8DL-RE`に適合する完全なダウンロードコマンドを直接生成。
- 🛠️ **多会話管理**：複数回の再生やクリアネスの切り替えによって生じる異なるセッション（Session）の記録をサポートします。
- 🎨 **清爽 UI**：React を基に構築されたモダンなポップアップ（Popup）で、情報の表示が一目瞭然です。

## 🚀 如何使用

このプロジェクトは複数の使用方法を提供しており、必要に応じて選択できます：

### 1. Chrome 插件商店 (推奨)
Chrome ウェブストアから直接インストールする（推奨：自動更新対応）
[審査中](https://github.com/ianho7/dmm-download-helper)

### 2. GitHub Release
仓库の [Releases](https://github.com/ianho7/dmm-download-helper/releases) ページから、パッケージ化された `zip` ファイルをダウンロードできます。
ダウンロードしたら解凍し、Chrome で「既存の拡張機能を読み込む」を選択してインストールします。

### 3. 油猴スクリプト (Tampermonkey)
スクリプト管理器の使用に慣れている場合は、拡張版とは機能が若干異なる油猴版も提供しています：
[GreasyFork に進んでダウンロードするにはクリック](https://greasyfork.org/scripts/563249-dmm-download-helper)

### 4. 自分で構築する
1. このプロジェクトをクローンする：
   ```bash
git clone https://github.com/ianho7/dmm-download-helper.git
```
2. 依存関係をインストールし、ビルド：
```bash
```
bun install
   bun run build
   ```
3. Chromeで`dist`ディレクトリを開く。

---

## ⚠️ 注意事項

> [!IMPORTANT]
> ダウンロードを開始する前に、必ず以下の内容をお読みになり、ツールが正常に作動することを確認してください。

### 1. 解密エンジンの設定
このツールが生成するコマンドは、デフォルトで **SHAKA_PACKAGER** を使用します。
- **設定手順**：
  1. [shaka-packager releases](https://github.com/shaka-project/shaka-packager/releases) から `packager-win-x64.exe` をダウンロードします。
2. `N_m3u8DL-RE.exe` と同じディレクトリに配置します。
  3. **リネーム** して `shaka-packager.exe` にします。
- **トラブルシューティング**：ダウンロード後の動画が再生できない場合は、コマンド内のエンジンサフィックスを `MP4DECRYPT` に変更してみてください。

### 2. プロキシ設定
DMM の地域制限があるため、ご利用の端末環境（CMD/PowerShell/Terminal）で DMM 資源にアクセスできるようにプロキシを設定してください（例えば `HTTP_PROXY` と `HTTPS_PROXY` 環境変数を設定するなど）。

### 3. 合法性声明
本ツールは学習交流の目的のみで使用され、Web ビデオの暗号化と転送技術の研究を目的としています。いかなる違法配布や商用利用も禁じられています。著作権を尊重し、正規品を支援してください。

## 🛠️ 技術スタック

- **前端フレームワーク**: React
- **開発ツール**: Vite + CRXJS
- **スタイル**: CSS (Vanilla)
- **スクリプト拦截**: 原生 JavaScript 注入

## ⚖️ オープンソースライセンス

本项目は [MIT License](LICENSE) ライセンスを採用しています。