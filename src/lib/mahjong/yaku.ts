/**
 * 役一覧の静的データ(仕様18〜19章)。
 * 手牌解析やシャンテン数計算などの高度な機能は今回作らず、
 * 「対局中に分からなくなったらすぐ確認できる」範囲に留める。
 */

export type YakuCategory = "1翻" | "2翻" | "3翻以上" | "役満";

export type Yaku = {
  key: string;
  name: string;
  han: string;
  category: YakuCategory;
  openHand: "ok" | "ng";
  description: string;
  example?: string;
  featured: boolean;
};

export const YAKU_LIST: Yaku[] = [
  {
    key: "riichi",
    name: "リーチ(立直)",
    han: "1翻",
    category: "1翻",
    openHand: "ng",
    description:
      "テンパイ(あと1枚で完成する形)になったら宣言できる役。宣言後は手牌を変えられません。",
    example: "例: 二三四 五六七 八八 二三(索子) + あと1枚待ち",
    featured: true,
  },
  {
    key: "tanyao",
    name: "タンヤオ(断么九)",
    han: "1翻",
    category: "1翻",
    openHand: "ok",
    description: "2〜8の数字の牌だけで手牌を作る役。1・9・字牌を使いません。",
    example: "例: 二三四 五五五 六七八 二三四 五五",
    featured: true,
  },
  {
    key: "yakuhai",
    name: "役牌",
    han: "1翻",
    category: "1翻",
    openHand: "ok",
    description:
      "自分の風・場の風、または白發中(三元牌)のいずれかを3枚集めると成立する役。",
    example: "例: 中中中 + 残りの4面子と雀頭",
    featured: true,
  },
  {
    key: "pinfu",
    name: "平和(ピンフ)",
    han: "1翻",
    category: "1翻",
    openHand: "ng",
    description:
      "すべて順子(連続する3枚)で作り、雀頭は役牌以外、両面(りゃんめん)待ちで上がる役。",
    example: "例: 二三四 五六七 八九 (雀頭) + 両面待ち",
    featured: true,
  },
  {
    key: "menzen_tsumo",
    name: "ツモ(門前清自摸和)",
    han: "1翻",
    category: "1翻",
    openHand: "ng",
    description: "鳴かずに(門前で)、自分でツモって上がる役。",
    featured: true,
  },
  {
    key: "ippatsu",
    name: "一発",
    han: "1翻",
    category: "1翻",
    openHand: "ng",
    description: "リーチ宣言後、1巡以内(他家に鳴かれずに)上がると成立する役。",
    featured: false,
  },
  {
    key: "sanshoku_doujun",
    name: "三色同順",
    han: "2翻(鳴くと1翻)",
    category: "2翻",
    openHand: "ok",
    description: "同じ並びの順子を萬子・筒子・索子の3種類すべてで揃える役。",
    example: "例: 二三四(萬子) 二三四(筒子) 二三四(索子)",
    featured: false,
  },
  {
    key: "ittsuu",
    name: "一気通貫",
    han: "2翻(鳴くと1翻)",
    category: "2翻",
    openHand: "ok",
    description: "同じ種類の牌で1〜9をすべて順子で揃える役。",
    example: "例: 一二三 四五六 七八九(すべて索子)",
    featured: false,
  },
  {
    key: "toitoi",
    name: "対々和(トイトイ)",
    han: "2翻",
    category: "2翻",
    openHand: "ok",
    description: "刻子(同じ牌3枚)だけで手牌を作る役。順子を使いません。",
    featured: false,
  },
  {
    key: "chiitoitsu",
    name: "七対子(チートイツ)",
    han: "2翻",
    category: "2翻",
    openHand: "ng",
    description: "異なる7組のペア(対子)を揃える役。鳴くと成立しません。",
    featured: false,
  },
  {
    key: "honitsu",
    name: "混一色(ホンイツ)",
    han: "3翻(鳴くと2翻)",
    category: "3翻以上",
    openHand: "ok",
    description: "1種類の数牌と字牌だけで手牌を作る役。",
    featured: false,
  },
  {
    key: "chinitsu",
    name: "清一色(チンイツ)",
    han: "6翻(鳴くと5翻)",
    category: "3翻以上",
    openHand: "ok",
    description: "1種類の数牌だけで手牌を作る役。字牌も使いません。",
    featured: false,
  },
  {
    key: "kokushi",
    name: "国士無双",
    han: "役満",
    category: "役満",
    openHand: "ng",
    description: "1・9牌と全種類の字牌を1枚ずつ+そのうち1種類をもう1枚揃える役。",
    featured: false,
  },
  {
    key: "suuankou",
    name: "四暗刻",
    han: "役満",
    category: "役満",
    openHand: "ng",
    description: "鳴かずに刻子(同じ牌3枚)を4組揃える役。",
    featured: false,
  },
  {
    key: "daisangen",
    name: "大三元",
    han: "役満",
    category: "役満",
    openHand: "ok",
    description: "白發中(三元牌)すべてを刻子で揃える役。",
    featured: false,
  },
];

export const FEATURED_YAKU = YAKU_LIST.filter((y) => y.featured);
export const YAKU_CATEGORIES: YakuCategory[] = ["1翻", "2翻", "3翻以上", "役満"];
