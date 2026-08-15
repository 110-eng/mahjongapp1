# あつまれ麻雀部

社内麻雀コミュニティ向けMVP Webアプリ。「今日麻雀あるんだ、参加してみようかな」が自然に生まれる体験を目指す。

構造は Account → Group → JOIN → PLAY & LEARN → RANKING。すべてのデータはGroup単位で分離されている。

Teamsを置き換えるものではない。役割分担は以下の通り。

- **Teams**: 告知・コミュニケーション
- **本アプリ**: Group管理・募集・参加・卓成立・対局記録・ランキング・対局支援

## 技術構成

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 (`@prisma/adapter-better-sqlite3`) + SQLite
- Vitest(コアロジックのユニットテスト + Prisma統合テスト)
- 認証: 簡易ユーザー選択方式(Cookie)。`src/lib/auth.ts` の `getCurrentUser()` を差し替えれば
  Microsoft認証など既存の認証基盤へ移行できる構造にしている。

## セットアップ

```bash
npm install
npx prisma migrate dev
npm run db:seed   # サンプルデータ投入(Group「Timewitch麻雀部」+ 対局履歴 + 募集中の卓)
npm run dev
```

## テスト

```bash
npm test       # 卓成立・レコメンド・シーズン/クォーター・スコア計算・Group分離の各ロジックテスト
npx tsc --noEmit
npm run lint
```

`groupScope.integration.test.ts` は実SQLiteに対する統合テストで、実行時に
`prisma/test-integration.db` を作成し完了後に自動削除する(開発用DBは汚さない)。

## ディレクトリ構成(抜粋)

```
src/
  app/
    login/                        # 簡易ユーザー選択
    groups/                       # 所属Group一覧・作成
    invite/[token]/               # 招待リンクからの参加
    g/[groupId]/                  # 認証+Groupメンバーシップ必須のルート
      page.tsx                    # Groupホーム(募集一覧)
      events/new/                 # 卓を立てる
      events/[id]/                # 募集詳細・参加/キャンセル
      events/[id]/adjust/         # 参加者調整(端数/超過時のレコメンド)
      games/new/                  # 対局作成(4人選択→持ち点/チップ入力)
      games/[gameId]/             # 対局結果確認・確定・修正・無効化
      learn/                      # 役一覧
      ranking/                    # ランキング(クォーター/年間)
      mypage/                     # マイページ(個人戦績)
      members/                    # メンバー一覧・招待リンク
      settings/                   # 麻雀ルール設定(Owner限定)
  lib/
    auth.ts                       # 認証・Groupメンバーシップ層(差し替え可能)
    mahjong/
      tableFormation.ts           # 卓成立ロジック + テスト
      recommendation.ts           # 参加者レコメンドロジック + テスト
      season.ts                   # 年間シーズン/クォーター算出(seasonStartMonth可変) + テスト
      ranking.ts                  # ランキング集計(期間指定・差し替え可能)
      scoreEngine.ts              # 対局スコア計算エンジン(UIから独立) + テスト
      yaku.ts                     # 役一覧の静的データ
      tiles.ts                    # 麻雀牌タイル表示ロジック
prisma/
  schema.prisma
  seed.ts
```

## データモデル

```
User → GroupMembership → Group ├ Event(募集) → Entry(参加希望)
                                ├ Game(対局) → GameResult(対局結果の内訳)
                                └ GroupRule(麻雀ルール設定, 1:1)
```

- `Game.ruleSnapshot` にGame作成時点の`GroupRule`をJSONで複製して保存する。
  GroupRuleを後で変更しても、過去のGameResultの計算結果は変わらない(仕様18章)。
- `Event`(募集)と`Game`(実際に打った対局)は別概念。`Game.eventId`はnullableで、
  募集を経由しない対局も将来登録できる。

## TODO: 未確定の麻雀ルールについて

具体的な点数計算ルール(ウマ・オカの配点、チップ価値、飛びペナルティ値、同点時の扱いなど)は
社内/Group固有の運用に依存し、本リポジトリ内に正式な仕様が見つからなかった。

そのため `GroupRule` としてOwnerが設定できる構造にし、`src/lib/mahjong/scoreEngine.ts` の
`DEFAULT_RULE_SNAPSHOT` を暫定デフォルト値としている。

```
持ち点25,000 / 返し点30,000 / ウマ +20,+10,-10,-20 / オカあり / チップなし
端数処理: 四捨五入 / 同点時: 起家(seatOrder)順で決定
```

とくに以下は仕様上「今回作らない/決め打ちしない」対象として、値の自動算出はせず
設定・記録の枠組みのみ用意している。

- **赤ドラ/一発/裏ドラチップ**: どの状況でチップが発生するかを示すGroup設定の
  トグルのみ実装。対局ごとのチップ枚数自体は毎回手入力する(自動判定はしない)。
- **焼き鳥**: `GroupRule.yakitoriEnabled` のトグルのみ実装。精算方法(誰が誰に何pt払うか)
  が不明なため、スコア計算エンジンには反映していない。将来、精算ルールが判明次第
  `scoreEngine.ts` に組み込むこと。
- **飛びペナルティ**: `bustPenaltyValue`(素点と同じ「1000点=1.0pt」換算)を設定できるが、
  実際の運用値は未確認のためデフォルト0(無効)。

既存の社内ルールが判明次第、`GroupRule`のデフォルト値と`scoreEngine.ts`の算出ロジックを
差し替えること。`calculateRanking()` / `calculateGameResults()` はどちらもUIから独立した
純粋関数のため、算出ルールを差し替えてもUI側の変更は不要な設計にしている。

## 設計上の注意

- **参加者レコメンド(JOIN)とランキング(RANKING)は完全に分離している。**
  `recommendation.ts` は `totalRankingPoint` 等の強さに関する情報を一切参照しない。
  参加機会の公平性(参加率・最終対局日・初参加)のみで判断すること。
- 卓成立ロジックは「4の倍数ちょうどなら参加者選定不要」を前提にしており、
  端数・定員超過のときのみ `events/[id]/adjust` でレコメンドを表示する。
- Game確定(`confirmGame`)時に、対局参加者のEntryを`played`へ更新し、Event全参加者が
  `played`になれば`Event.status`を`completed`にする。これによりJOINの参加履歴・
  レコメンド統計とRANKINGが自動的につながる(仕様34章)。
- すべてのGroupスコープ付きクエリ(`queries.ts`)はgroupIdを明示的な引数に取り、
  他Groupのデータを一切参照しない。`g/[groupId]/layout.tsx`で`requireMembership()`により
  非メンバーのアクセスをブロックする。

## 今後追加候補(今回のMVPでは実装していない)

- 焼き鳥の自動精算・チップ条件(赤ドラ/一発/裏ドラ)の自動検出
- Teams Bot / 自動投稿、メール招待、Push通知
- 手牌解析・シャンテン計算・AI打牌支援などの高度なLEARN機能
- 複数半荘の席割り最適化、細かな卓成立アニメーション
