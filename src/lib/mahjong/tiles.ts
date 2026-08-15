/**
 * 麻雀牌の表現。
 * 実機/ブラウザ環境によって麻雀牌のUnicode文字(🀇🀈..等)が
 * 正しくレンダリングされない(🀄以外は文字化けする)ため、
 * 牌コードから漢数字+種類のラベルを組み立てて独自にタイル表示する。
 */

export type TileCode = string; // "1m".."9m"(萬子) / "1s".."9s"(索子) / "1p".."9p"(筒子) / "東"|"南"|"西"|"北"|"中"|"發"|"白"

const KANJI_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const SUIT_LABEL: Record<string, string> = { m: "萬", s: "索", p: "筒" };

export function tileLabel(code: TileCode): string {
  const m = code.match(/^([1-9])([msp])$/);
  if (m) {
    const [, num, suit] = m;
    return `${KANJI_DIGITS[Number(num)]}${SUIT_LABEL[suit]}`;
  }
  return code;
}

export function tileColorClass(code: TileCode): string {
  if (code === "中") return "text-red-600";
  if (code === "發") return "text-board-700";
  if (code === "白") return "text-ink-400";
  return "text-ink-900";
}

/** 役の例を表す牌グループ(1グループ=1面子/雀頭のまとまり) */
export type TileGroup = TileCode[];
