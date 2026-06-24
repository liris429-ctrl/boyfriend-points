# 💕 男友積分本

兩人專用的情侶積分 App。女友（管理員）記錄男友做的好事並給予積分，男友登入後可查看積分、兌換獎勵、一起寫情侶日記。

## 功能

### 女友（管理員）
- 給分：選擇事件類型，幫男友記錄積分
- 扣點：扣分並產生可複製的通知文字
- 審核：審核男友的積分申請、願望清單、兌換紀錄
- 管理積分項目、獎勵項目、紀念日、跑馬燈

### 男友（一般用戶）
- 首頁：查看目前積分、打卡連續天數、今日任務、紀念日倒數
- 獎勵：瀏覽可兌換獎勵，含進度條顯示還差幾分
- 紀錄：查看完整積分與兌換歷史
- 申請積分、提交願望清單

### 共同
- 情侶日記：發布文字 + 照片，互相留言回應
- 跑馬燈：首頁顯示滾動公告

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 14（App Router） |
| 資料庫 + 驗證 | Supabase（PostgreSQL + Auth + Storage） |
| 部署 | Vercel |
| 樣式 | Tailwind CSS v4 |

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local` 並填入 Supabase 專案資訊：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 資料庫 Migration

依序在 Supabase SQL Editor 執行 `supabase/migrations/` 目錄下的 SQL 檔案。

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 部署

推送到 GitHub 後，透過 Vercel import 專案並填入環境變數即可自動部署。
