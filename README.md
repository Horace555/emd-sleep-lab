# EMD 睡眠實驗室

以黃鍔（Norden E. Huang）等人提出的 EMD 為出發點，面向大學生的繁體中文互動演算法網站。

## 作業主題

**從混合腦波到睡眠研究：EMD 如何拆解不同時間尺度的振盪？**

核心問題：睡眠訊號具有時間變化，僅知道整段有哪些頻率，未必能理解短暫事件與局部振幅變化。網站透過實際篩分計算，說明 EMD 的意義、可用於哪些研究，以及它不能單獨證明什麼。

本頁為文獻導讀與教學，不是假裝重現黃鍔院士演講內容。內建資料全為合成訊號；可選擇在本機讀入自己的去識別化單欄訊號。沒有訓練或部署睡眠分類模型。

## 互動功能

- 6 秒、128 Hz 的模擬訊號，調整慢波振幅、快波振幅與頻率、雜訊、短暫事件出現時間。
- 四種情境：短暫快波、慢波占優勢、持續快波、雜訊干擾。
- 四個引導實驗：振幅與頻率、短暫事件、雜訊、篩分停止。每項都有操作步驟、解讀與即時數字。
- 記住波形作為灰色虛線對照，與新訊號共用座標。
- Hann 窗 FFT 整段頻譜，說明整段頻譜對事件時間資訊的限制；並明確指出 STFT 和小波也是時頻分析方法。
- 真正計算局部極值、自然三次樣條上下包絡、包絡平均、逐次篩分。
- 每層皆可檢視逐次篩分；顯示形狀、包絡平均與連續通過次數。可切換 RMS 門檻 0.02 / 0.05 / 0.10。
- 勾選分量做重建，顯示殘差、重建 RMSE；未收斂分量不標成合格 IMF。
- 對選取分量實算 Hilbert 振幅和瞬時頻率，遮蔽端點、低振幅與不合理頻率值，並說明限制。
- 單欄 μV CSV 本機匯入（128–4096 點、1–5000 Hz）；不讀 EDF、不上傳、不濾波、不猜測資料是否 EEG。可匯出目前訊號。
- 振幅調變滑桿，區分載波頻率與包絡起伏頻率，解釋 HHSA 的額外分析層。
- 四篇睡眠應用研究、兩篇方法論文，附 DOI、研究限制與閱讀範圍。

2026-09-22 改版採原創「訊號觀察筆記」教學路線。參考同學 [EMD 與睡眠](https://chiayumd15.github.io/emd-sleep/) 將互動、證據與限制串聯的方向；沒有複製其版面、文字、程式或 EEG 資料。本站不宣稱已內建 Sleep-EDF 真實 EEG 或完整 HHSA。

## 本機執行

不需要安裝套件，Node.js 22 或以上：

```sh
npm start
```

開啟 http://localhost:8080 。也可以直接在瀏覽器開啟 `dist/index.html`（所有網頁資源為相對路徑）。

舊版曾提供單檔離線 HTML，但不代表這次改版。要使用最新版離線功能，請下載本 repository ZIP、解壓縮後開啟 `dist/index.html`，並保留同資料夾的 CSS 與 JavaScript。

## GitHub

1. 在自己的 GitHub 建立新 repository，例如 `emd-sleep-lab`，建議公開以供作業審查。
2. 將本專案根目錄內容放入 repository。`Dockerfile`、`package.json`、`server.js` 與 `dist/` 必須保留正確階層，勿只上傳 ZIP。
3. 若使用 Git CLI，建立遠端後執行：

```sh
git remote add origin <GitHub 回傳的 repository clone URL>
git push -u origin main
```

`<...>` 為需替換的值，不是本專案已有的真實網址。

本專案已部署至 GitHub Pages，Settings → Pages 的來源為 GitHub Actions。`.github/workflows/pages.yml` 會在推送 main 時先執行 `npm test`，測試通過後發布 `dist/`。也可手動執行 workflow。

依課程更新補充，本次以 GitHub Pages 作為 Zeabur 的替代展示平台。未購買 Zeabur 伺服器，也未部署 Cloudflare；老師範例的網站及 repository 並非本專案。

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

已於 2026-09-21 實際開啟並驗證：

- 網站網址：https://horace555.github.io/emd-sleep-lab/
- GitHub 原始碼：https://github.com/Horace555/emd-sleep-lab

網站可直接用瀏覽器操作，不需安裝 Node.js、下載檔案或讓自己的電腦保持開機。上方 Zeabur 步驟保留為未來選用的部署方式，不代表已部署至 Zeabur。

## 演算法與限制

- `dist/emd.js` 為獨立 JavaScript 數值模組，不讀取生成器的真實低頻／高頻成分來充當 IMF。
- 真實低頻成分只作為原始圖的對照線；EMD 僅接收混合波形。
- 邊界採極值鏡射，自然三次樣條插值。
- 每分量最多篩分 30 次，最多取出 6 層。
- 教學停止條件：極值數和過零數最多差 1，且新候選分量的包絡平均 RMS / 分量 RMS < 所選門檻（預設 0.05），連續兩次成立。這不是原始論文的 SD 門檻。
- RMS 條件不是逐點零包絡平均的充分保證，因此本網站是有明示容差的教學實作。
- 達到迭代上限或不能繼續形成包絡時，若未符合停止條件則標成候選分量。
- 重建接近零誤差是加總恆等式，不是生理有效性或成分獨立性的證據。
- 不實作 EEMD、CEEMDAN、完整 Hilbert 頻譜或完整 HHSA；HHSA 面板是已知公式的 AM 概念示意。
- `dist/learning.js` 使用 radix-2 FFT 建立解析訊號，補零至下一個 2 的次方，由展開相位中央差分估計頻率。兩端各遮蔽至多 0.25 秒（不超過總點數 10%）、低於最大振幅 10% 及非 (0, Nyquist) 頻率；這些是顯示規則，不是臨床品質判定。振幅圖未遮蔽端點，仍可能有端點效應。
- 不將 IMF 編號對應固定頻帶或睡眠階段；不以模擬振幅判定臨床 N3。
- 固定 seed=42 的可重現雜訊，為四個均勻亂數加總後標準化的近似雜訊，非精確高斯白雜訊。
- 跨人泛化、雜訊敏感度、端點效應與參考標註仍是實際研究必須處理的問題。

## 驗證

```sh
npm test
```

測試包括：單一正弦波保留、相隔尺度成分分離、各情境重建 RMSE、退化訊號、有限值與上限、固定亂數、所有分量逐步停止條件、選取分量重建、已知正弦瞬時頻率與 AM 包絡回復、Hilbert 零訊號與雜訊、CSV 格式/範圍防護、頁內連結與資源檔案。

改版已通過本機數值測試，GitHub Actions 亦會先測試再部署。桌面正式網址的互動以部署後瀏覽器檢查為準；手機實機尚未測試。所有測試均不是臨床驗證。

## 文獻

1. Huang NE et al. (1998). The empirical mode decomposition and the Hilbert spectrum for nonlinear and non-stationary time series analysis. Proceedings of the Royal Society A, 454, 903–995. https://doi.org/10.1098/rspa.1998.0193
2. Hassan AR, Bhuiyan MIH. (2017). Automated identification of sleep states from EEG signals by means of ensemble empirical mode decomposition and random under sampling boosting. Computer Methods and Programs in Biomedicine, 140, 201–210. https://doi.org/10.1016/j.cmpb.2016.12.015 （依公開摘要，五類分類 83.49%；不宣稱已重現或確認全部切分細節。）
3. Hou F et al. (2018). Complexity of Wake Electroencephalography Correlates With Slow Wave Activity After Sleep Onset. Frontiers in Neuroscience, 12, 809. https://doi.org/10.3389/fnins.2018.00809 （查閱開放全文方法、受試者條件與摘要。）
4. Guo D et al. (2022). Slow wave synchronization and sleep state transitions. Scientific Reports. https://doi.org/10.1038/s41598-022-11513-0 （研究概念與摘要。）
5. Huang NE et al. (2016). On Holo-Hilbert spectral analysis: a full informational spectral representation for nonlinear and non-stationary data. Philosophical Transactions of the Royal Society A, 374, 20150206. https://doi.org/10.1098/rsta.2015.0206 （方法脈絡，非睡眠分期成效。）
6. Yeh JR et al. (2013). Investigating the interaction between heart rate variability and sleep EEG using nonlinear algorithms. Journal of Neuroscience Methods, 219(2), 233–239. https://doi.org/10.1016/j.jneumeth.2013.08.008 （依 PubMed 與原期刊公開摘要；19 位健康女性，不宣稱分類準確率或跨族群驗證。）

睡眠論文並非全部由黃鍔院士共同署名。沒有演講稿，故不宣稱這些論文就是演講指定文獻。

## 目錄

```text
dist/index.html    網站結構、繁體中文內容與引用
dist/style.css     響應式視覺樣式
dist/workshop.css  原創訊號觀察筆記版面
dist/emd.js        EMD 數值演算法
dist/learning.js   Hilbert、FFT、CSV、重建工具
dist/app.js        互動與 Canvas 圖表
dist/favicon.svg  圖示
server.js         無套件相依的 HTTP server
Dockerfile        Zeabur 容器部署
tests/emd.test.js  數值驗證
```
