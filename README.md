# EMD 睡眠實驗室

以黃鍔（Norden E. Huang）等人提出的 EMD 為出發點，面向大學生的繁體中文互動演算法網站。

## 作業主題

**從混合腦波到睡眠研究：EMD 如何拆解不同時間尺度的振盪？**

核心問題：睡眠訊號具有時間變化，僅知道整段有哪些頻率，未必能理解短暫事件與局部振幅變化。網站透過實際篩分計算，說明 EMD 的意義、可用於哪些研究，以及它不能單獨證明什麼。

本頁為文獻導讀與教學，不是假裝重現黃鍔院士演講內容。沒有使用真實病患資料，沒有訓練或部署睡眠分類模型。

## 互動功能

- 6 秒、128 Hz 的模擬訊號，調整慢波振幅、快波振幅與頻率、雜訊、短暫事件出現時間。
- 四種情境：短暫快波、慢波占優勢、持續快波、雜訊干擾。
- Hann 窗 DFT 整段頻譜，說明整段頻譜對事件時間資訊的限制；並明確指出 STFT 和小波也是時頻分析方法。
- 真正計算局部極值、自然三次樣條上下包絡、包絡平均、逐次篩分。
- 顯示每層分量、停止狀態、殘差與重建 RMSE；未收斂分量不標成合格 IMF。
- 振幅調變滑桿，區分載波頻率與包絡起伏頻率，解釋 HHSA 的額外分析層。
- 三篇睡眠應用研究、兩篇方法論文，附 DOI、研究限制與閱讀範圍。

## 本機執行

不需要安裝套件，Node.js 22 或以上：

```sh
npm start
```

開啟 http://localhost:8080 。也可以直接在瀏覽器開啟 `dist/index.html`（所有網頁資源為相對路徑）。

壓縮檔中的 `emd-sleep-lab-offline.html` 是整合 CSS 與 JavaScript 的獨立版本，下載後可直接開啟，無需伺服器。它由 dist 產生；修改時以 dist 原始碼為準。

## GitHub

1. 在自己的 GitHub 建立新 repository，例如 `emd-sleep-lab`，建議公開以供作業審查。
2. 將本專案根目錄內容放入 repository。`Dockerfile`、`package.json`、`server.js` 與 `dist/` 必須保留正確階層，勿只上傳 ZIP。
3. 若使用 Git CLI，建立遠端後執行：

```sh
git remote add origin <GitHub 回傳的 repository clone URL>
git push -u origin main
```

`<...>` 為需替換的值，不是本專案已有的真實網址。

Repository 網址即為 GitHub 作業連結。另附 `.github/workflows/pages.yml`，若也要使用 GitHub Pages，至 Settings → Pages 選 GitHub Actions 作為來源，再推送 main 或手動執行 workflow。Pages 僅提供額外展示，不能取代題目要求的 Zeabur 部署網址。

## Zeabur 部署

1. 登入 Zeabur，選擇現有可用伺服器／專案，或依帳號所提供的流程建立專案。
2. 新增服務，使用 GitHub repository 作為來源，選擇本專案及 `main` 分支。
3. 根目錄保留預設 repository root，Zeabur 會偵測根目錄的 `Dockerfile`。
4. 容器預設 `PORT=8080`，監聽 `0.0.0.0`，`server.js` 也會讀取平台設定的 `PORT`。
5. 等待部署狀態完成，在服務的 Networking / 公開網路設定建立可用網域。
6. 開啟 Zeabur 回傳的 HTTPS 網址，確認訊號、滑桿、篩分按鈕和文獻連結，再複製該網址交作業。

網站不需要資料庫、API 金鑰或付費 AI API。Zeabur 主機與方案是否收费依帳號可用資源而定；建立付費資源前應確認平台顯示的費用。

官方依據（查核日期：2026-09-20）：

- [Zeabur Dockerfile 部署文件](https://zeabur.com/docs/en-US/deploy/methods/dockerfile)

## 交作業網址

只有平台成功建立並驗證後才能填寫：

- 網站網址：待 Zeabur 實際部署完成。
- GitHub 網址：待建立 repository 並推送原始碼。

這些待填欄位不是已完成部署的宣稱，也不應用推測的 `zeabur.app` 或 GitHub 網址代替。

## 演算法與限制

- `dist/emd.js` 為獨立 JavaScript 數值模組，不讀取生成器的真實低頻／高頻成分來充當 IMF。
- 真實低頻成分只作為原始圖的對照線；EMD 僅接收混合波形。
- 邊界採極值鏡射，自然三次樣條插值。
- 每分量最多篩分 30 次，最多取出 6 層。
- 教學停止條件：極值數和過零数最多差 1，且新候選分量的包絡平均 RMS / 分量 RMS < 0.05，連續兩次成立。
- RMS 條件不是逐點零包絡平均的充分保證，因此本網站是有明示容差的教學實作。
- 達到迭代上限或不能繼續形成包絡時，若未符合停止條件則標成候選分量。
- 重建接近零誤差是加總恆等式，不是生理有效性或成分獨立性的證據。
- 不實作 EEMD、CEEMDAN、完整 Hilbert 頻譜或完整 HHSA；HHSA 面板是已知公式的 AM 概念示意。
- 不將 IMF 編號對應固定頻帶或睡眠階段；不以模擬振幅判定臨床 N3。
- 固定 seed=42 的可重現雜訊，為四個均勻亂數加總後標準化的近似雜訊，非精確高斯白雜訊。
- 跨人泛化、雜訊敏感度、端點效應與參考標註仍是實際研究必須處理的問題。

## 驗證

```sh
npm test
```

測試包括：單一正弦波保留、相隔尺度成分分離（排除端點後相關性）、各情境重建 RMSE、單調訊號與常數訊號、有限值與迭代上限、固定亂數重現。

本版通過數值測試和 JavaScript 語法檢查。正式部署後仍需在實際網址確認瀏覽器互動及手機排版。測試不是臨床驗證。

## 文獻

1. Huang NE et al. (1998). The empirical mode decomposition and the Hilbert spectrum for nonlinear and non-stationary time series analysis. Proceedings of the Royal Society A, 454, 903–995. https://doi.org/10.1098/rspa.1998.0193
2. Hassan AR, Bhuiyan MIH. (2017). Automated identification of sleep states from EEG signals by means of ensemble empirical mode decomposition and random under sampling boosting. Computer Methods and Programs in Biomedicine, 140, 201–210. https://doi.org/10.1016/j.cmpb.2016.12.015 （依公開摘要，五類分類 83.49%；不宣稱已重現或確認全部切分細節。）
3. Hou F et al. (2018). Complexity of Wake Electroencephalography Correlates With Slow Wave Activity After Sleep Onset. Frontiers in Neuroscience, 12, 809. https://doi.org/10.3389/fnins.2018.00809 （查閱開放全文方法、受試者條件與摘要。）
4. Guo D et al. (2022). Slow wave synchronization and sleep state transitions. Scientific Reports. https://doi.org/10.1038/s41598-022-11513-0 （研究概念與摘要。）
5. Huang NE et al. (2016). On Holo-Hilbert spectral analysis: a full informational spectral representation for nonlinear and non-stationary data. Philosophical Transactions of the Royal Society A, 374, 20150206. https://doi.org/10.1098/rsta.2015.0206 （方法脈絡，非睡眠分期成效。）

睡眠論文並非全部由黃鍔院士共同署名。沒有演講稿，故不宣稱這些論文就是演講指定文獻。

## 目錄

```text
dist/index.html    網站結構、繁體中文內容與引用
dist/style.css     響應式視覺樣式
dist/emd.js        EMD 數值演算法
dist/app.js        互動與 Canvas 圖表
dist/favicon.svg  圖示
server.js         無套件相依的 HTTP server
Dockerfile        Zeabur 容器部署
tests/emd.test.js  數值驗證
```
