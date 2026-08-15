# あつまれ麻雀部

Timewitch社内麻雀サークル向けMVP Webアプリ。「今日麻雀あるんだ、参加してみようかな」が自然に生まれる体験を目指す。

Teamsを置き換えるものではない。役割分担は以下の通り。

- **Teams**: 告知・コミュニケーション(既存の「🀄️麻雀サークル」チャンネル)
- **本アプリ**: 募集・参加・卓成立・履歴・ランキング・対局支援

## 技術構成

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 (`@prisma/adapter-better-sqlite3`) + SQLite
- Vitest(コアロジックのユニットテスト)
- 認証: 簡易ユーザー選択方式(Cookie)。`src/lib/auth.ts` の `getCurrentUser()` を差し替えれば
  Microsoft認証など既存の認証基盤へ移行できる構造にしている。

## セットアップ

```bash
npm install
npx prisma migrate dev
npm run db:seed   # サンプルデータ投入(任意)
npm run dev
```

## テスト

```bash
npm test       # 卓成立・レコメンド・シーズン/クォーターロジックのユニットテスト
npx tsc --noEmit
npm run lint
```

## ディレクトリ構成(抜粋)

```
src/
  app/
    login/               # 簡易ユーザー選択
    (main)/              # 認証必須 + ヘッダー/下部ナビ付きのルートグループ
      page.tsx           # ホーム(募集一覧)
      events/new/        # 卓を立てる
      events/[id]/        # 募集詳細・参加/キャンセル
      events/[id]/adjust/ # 参加者調整(端数/超過時のレコメンド)
      events/[id]/game/   # 対局結果入力
      learn/              # 役一覧
      ranking/            # ランキング(クォーター/年間)
      mypage/             # マイページ
  lib/
    auth.ts               # 認証層(差し替え可能)
    mahjong/
      tableFormation.ts   # 卓成立ロジック + テスト
      recommendation.ts   # 参加者レコメンドロジック + テスト
      season.ts           # 年間シーズン/クォーター算出 + テスト
      ranking.ts          # ランキング集計(期間指定・差し替え可能)
      yaku.ts             # 役一覧の静的データ
prisma/
  schema.prisma
  seed.ts
```

## TODO: ランキング計算ルールについて

社内で既に四半期ごとの麻雀ランキング運用があるとの前提だが、**具体的な点数計算・ranking_pointの
算出ルール(ウマ・オカの有無や配点など)は本リポジトリ内に見つからなかった**。

現状は暫定的に以下の仮ルールを `src/lib/mahjong/ranking.ts` の
`PROVISIONAL_RANKING_POINT_BY_RANK` に定数化して採用している。

```
1位 +30 / 2位 +10 / 3位 -10 / 4位 -30 (オカ・原点調整なし、合計0)
```

既存の社内ルールが判明次第、この定数(または `recordGameResult` 内の算出処理)を差し替えること。
`calculateRanking()` は期間(年間 / クォーター)を指定して集計する形になっているため、
算出ルール自体を差し替えてもUI側の変更は不要な設計にしている。

## 設計上の注意

- **参加者レコメンド(JOIN)とランキング(RANKING)は完全に分離している。**
  `recommendation.ts` は `ranking_point` 等の強さに関する情報を一切参照しない。
  参加機会の公平性(参加率・最終対局日・初参加)のみで判断すること。
- 卓成立ロジックは「4の倍数ちょうどなら参加者選定不要」を前提にしており、
  端数・定員超過のときのみ `events/[id]/adjust` でレコメンドを表示する。
