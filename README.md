# AI 圖像生成動畫預覽器使用說明書

這是一個以 Vite、React、TypeScript 製作的前端單頁應用。它會自動讀取 `src/assets/scenes` 裡的圖片素材，隨機輪播每張圖片，並套用類似 AI 圖像生成過程的模糊、馬賽克、粒子收束與掃描線動畫。

## 功能概覽

- 自動掃描素材資料夾中的圖片。
- 支援圖片與同名文字檔配對，用來保存 prompt 或圖片描述。
- 根據圖片原始尺寸自動調整預覽框比例。
- 每張圖片播放約 7.4 秒的生成動畫。
- 每張圖完成後停留約 4 到 6 秒，再自動切換下一張。
- 每輪播放會重新隨機排序，並盡量避免連續重複同一張圖片。
- 可直接打包成靜態網站，部署到任何支援靜態檔案的服務。

## 系統需求

請先確認本機已安裝以下工具：

- Node.js `20.19.0` 以上，或 `22.12.0` 以上版本。
- npm。
- 現代瀏覽器，例如 Chrome、Edge、Safari 或 Firefox。

檢查版本：

```bash
node -v
npm -v
```

## 專案結構

```text
aiph
├── index.html
├── package.json
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── assets
│   │   └── scenes
│   ├── components
│   │   ├── ParticleImageReveal.tsx
│   │   └── ScenePreview.tsx
│   └── lib
│       └── scenes.ts
└── vite.config.ts
```

主要檔案用途：

- `src/assets/scenes`：放置要預覽的圖片與同名 prompt 文字檔。
- `src/lib/scenes.ts`：負責掃描圖片與文字檔，建立素材清單。
- `src/App.tsx`：控制播放順序、隨機輪播與圖片切換等待時間。
- `src/components/ScenePreview.tsx`：建立單張圖片的預覽框，並依圖片尺寸設定比例。
- `src/components/ParticleImageReveal.tsx`：負責馬賽克、粒子與顯影動畫。
- `src/styles.css`：全站版面、預覽框、掃描線與動畫樣式。

## 安裝與啟動

第一次使用時，請在專案根目錄執行：

```bash
npm install
```

啟動開發伺服器：

```bash
npm run dev
```

終端機會顯示本機網址，通常是：

```text
http://localhost:5173
```

如果 `5173` 連接埠已被占用，Vite 可能會自動改用其他連接埠，請以終端機顯示的網址為準。

## 使用流程

1. 將圖片素材放入 `src/assets/scenes`。
2. 如需保存 prompt 或描述，建立與圖片同名的 `.txt` 檔。
3. 執行 `npm run dev`。
4. 打開終端機顯示的本機網址。
5. 頁面會自動播放圖片生成動畫，不需要手動操作。
6. 每張圖完成後會短暫停留，再自動切換到下一張。

目前介面沒有上一張、下一張、暫停或手動選圖功能；播放行為是全自動的。

## 素材放置規則

素材資料夾位置：

```text
src/assets/scenes
```

支援圖片格式：

```text
png, jpg, jpeg, webp, gif, svg
```

建議使用「同名圖片 + 同名文字檔」的方式管理素材：

```text
src/assets/scenes/sunset.png
src/assets/scenes/sunset.txt
```

`sunset.txt` 的內容會被讀取為這張圖片的 prompt 或描述。若沒有同名文字檔，系統仍會載入圖片，但 prompt 會使用預設文字 `尚未找到同名文字檔。`。

目前 prompt 內容已經被匯入到素材資料中，但前台畫面尚未顯示 prompt。若之後需要顯示 prompt，可以從 `ScenePreview` 接收的 `scene.prompt` 擴充介面。

## 命名建議

為了讓素材容易維護，建議使用一致的檔名格式：

```text
01.png
01.txt
02.png
02.txt
city-night.png
city-night.txt
```

注意事項：

- 圖片與文字檔必須同名，只有副檔名不同。
- 檔名大小寫要一致。
- 若使用數字排序，建議補零，例如 `01.png`、`02.png`、`10.png`。
- 避免使用空白與特殊符號，建議使用英文、數字、連字號或底線。

## 新增或更新素材

開發中新增圖片後，Vite 通常會自動更新頁面。如果沒有看到新素材，請依序檢查：

1. 素材是否放在 `src/assets/scenes`。
2. 圖片格式是否在支援清單內。
3. 檔名是否正確。
4. 瀏覽器是否已重新整理。
5. 開發伺服器是否需要重新啟動。

若要產生正式版本，新增或更新素材後請重新執行：

```bash
npm run build
```

## 可用指令

安裝依賴：

```bash
npm install
```

啟動開發伺服器：

```bash
npm run dev
```

建立正式打包檔案：

```bash
npm run build
```

在本機預覽正式打包結果：

```bash
npm run preview
```

目前專案尚未設定 `lint` 或 `test` 指令。

## 打包與部署

建立正式版本：

```bash
npm run build
```

成功後會產生 `dist` 資料夾。`dist` 內的內容就是可部署的靜態網站檔案。

本機預覽打包結果：

```bash
npm run preview
```

部署時，將 `dist` 資料夾內容上傳到靜態網站服務即可，例如：

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Nginx 或其他靜態檔案伺服器

## 動畫行為說明

單張圖片的播放效果包含：

- 圖片先以模糊狀態出現。
- 馬賽克區塊逐漸縮小並消失。
- 粒子從畫面外圍收束到圖片位置。
- 掃描線持續垂直掃過畫面。
- 最後圖片變清晰並停留一小段時間。

主要動畫時間設定在 `src/components/ParticleImageReveal.tsx`：

```ts
const DURATION = 7400;
```

圖片完成後的停留時間設定在 `src/App.tsx`：

```ts
const PAUSE_AFTER_ANIMATION_MIN_MS = 4000;
const PAUSE_AFTER_ANIMATION_MAX_MS = 6000;
```

## 常見客製化方式

調整動畫總長度：

- 修改 `src/components/ParticleImageReveal.tsx` 的 `DURATION`。
- 單位是毫秒，`7400` 代表 7.4 秒。

調整每張圖完成後的停留時間：

- 修改 `src/App.tsx` 的 `PAUSE_AFTER_ANIMATION_MIN_MS` 與 `PAUSE_AFTER_ANIMATION_MAX_MS`。

調整畫面尺寸、圓角、背景、掃描線樣式：

- 修改 `src/styles.css`。

新增 prompt 顯示區：

- `src/lib/scenes.ts` 已經將 `.txt` 內容讀進 `scene.prompt`。
- 可在 `src/components/ScenePreview.tsx` 內加入文字區塊顯示 `scene.prompt`。

改變素材標題規則：

- 修改 `src/lib/scenes.ts` 的 `formatTitle`。

## 疑難排解

畫面是空的：

- 確認 `src/assets/scenes` 內至少有一張支援格式的圖片。
- 確認開發伺服器仍在執行。
- 打開瀏覽器開發者工具，檢查 Console 是否有錯誤。

新增圖片後沒有出現：

- 確認圖片放在 `src/assets/scenes`，不是其他資料夾。
- 確認副檔名是 `png`、`jpg`、`jpeg`、`webp`、`gif` 或 `svg`。
- 重新整理瀏覽器。
- 必要時停止並重新執行 `npm run dev`。

同名文字檔沒有被讀到：

- 確認圖片與文字檔的主檔名完全一致。
- 範例：`forest.webp` 必須搭配 `forest.txt`。
- 注意大小寫差異，例如 `Forest.png` 與 `forest.txt` 不是同名。

打包失敗：

- 確認 Node.js 版本符合需求。
- 重新執行 `npm install`。
- 檢查最近修改的 TypeScript 檔案是否有語法錯誤。

播放不順或瀏覽器變慢：

- 優先壓縮大型圖片。
- 避免一次放入過多超高解析度素材。
- 若要展示大量素材，建議將圖片寬度控制在實際展示需求內。

## 目前限制

- 目前沒有後端服務，也沒有真正呼叫 AI 圖像生成 API。
- 圖片必須先放進專案資料夾，尚未提供網頁上傳功能。
- prompt 已被讀取，但尚未顯示在目前介面。
- 播放目前是自動輪播，尚未提供手動控制按鈕。
- 尚未設定自動化測試或 lint 指令。

## 維護建議

- 新增素材時同步加入同名 `.txt`，方便日後追蹤 prompt 來源。
- 正式展示前先執行 `npm run build`，確認 TypeScript 與打包流程正常。
- 若素材很多，定期清理不使用的圖片，避免專案與打包體積過大。
- 若要交付給非開發使用者，建議之後新增「上傳素材」、「切換圖片」、「暫停播放」與「顯示 prompt」等介面功能。
