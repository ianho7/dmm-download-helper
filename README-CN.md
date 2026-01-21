# DMM Download Helper

<p align="center">
  <img src="public/logo-128.png" alt="Logo" width="128">
</p>

<p align="center">
  <strong>一款简单高效的 DMM 视频下载辅助工具</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README-JP.md">日本語</a> | 简体中文
</p>


---

## 📖 项目简介

**DMM Download Helper** 是一款专为 DMM (dmm.com / dmm.co.jp) 平台设计的浏览器扩展。它能够自动捕捉视频播放时的 MPD 清单地址以及对应的解密密钥（Widevine/ClearKey），并一键生成 `N_m3u8DL-RE` 的下载命令行。

> [!NOTE]
> 本项目仅供学习和研究目的使用，请遵守相关法律法规。

## ✨ 核心功能

- 🎯 **自动捕获 MPD**：实时监控播放器请求，精准提取视频清单 URL。
- 🔑 **解密密钥提取**：自动拦截并解析 License 请求，获取解密所需的 KID 和 Key。
- 🚀 **一键生成命令**：直接生成适配 `N_m3u8DL-RE` 的完整下载命令。
- 🛠️ **多会话管理**：支持记录多次播放或切换清晰度产生的不同会话（Session）。
- 🎨 **清爽 UI**：基于 React 构建的现代化弹出窗口（Popup），信息展示一目了然。

## 🚀 如何使用

本项目提供多种使用方式，您可以根据需求选择：

### 1. Chrome 插件商店 (推荐)
直接通过 Chrome Web Store 安装正式版本（最便捷，支持自动更新）：
[审核中](https://github.com/ianho7/dmm-download-helper)

### 2. GitHub Release
您可以从仓库的 [Releases](https://github.com/ianho7/dmm-download-helper/releases) 页面下载已打包好的 `zip` 文件。
下载后解压，在 Chrome 中通过“加载已解压的扩展程序”进行安装。

### 3. 油猴脚本 (Tampermonkey)
如果您更习惯使用脚本管理器，我们也提供了油猴版（功能可能与扩展版略有差异）：
[点击前往 GreasyFork 下载](https://greasyfork.org/scripts/563249-dmm-download-helper)

### 4. 自行构建
1. 克隆本项目：
```bash
git clone https://github.com/ianho7/dmm-download-helper.git
```
2. 安装依赖并构建：
```bash
bun install
bun run build
```
3. 在 Chrome 中加载 `dist` 目录。

---

## ⚠️ 注意事项

> [!IMPORTANT]
> 在开始下载前，请务必阅读以下内容以确保工具正常运行。

### 1. 解密引擎配置
本工具生成的命令默认使用 **SHAKA_PACKAGER**。
- **配置步骤**：
  1. 前往 [shaka-packager releases](https://github.com/shaka-project/shaka-packager/releases) 下载 `packager-win-x64.exe`。
  2. 将其放置在 `N_m3u8DL-RE.exe` 同一目录下。
  3. **重命名** 为 `shaka-packager.exe`。
- **故障排除**：若下载后的视频无法播放，请尝试将命令中的引擎后缀更换为 `MP4DECRYPT`。

### 2. 代理设置
由于 DMM 的地区限制，请确保您的终端环境（CMD/PowerShell/Terminal）已配置好能够访问 DMM 资源的代理（如设置 `HTTP_PROXY` 和 `HTTPS_PROXY` 环境变量）。

### 3. 合法性声明
本工具仅供学习交流使用，旨在研究 Web 视频加密与传输技术。请勿将其用于任何非法传播或商业用途。请尊重版权，支持正版内容。

## 🛠️ 技术栈

- **前端框架**: React
- **开发工具**: Vite + CRXJS
- **样式**: CSS (Vanilla)
- **脚本拦截**: 原生 JavaScript 注入

## ⚖️ 开源协议

本项目采用 [MIT License](LICENSE) 许可。