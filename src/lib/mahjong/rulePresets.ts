/**
 * GroupRule設定画面用のプリセット定義。
 * 生の数値を直接入力させるのではなく、よく使われる組み合わせから選べるようにする
 * (仕様17章「Ownerが意味を理解できるように」)。
 *
 * 「日本プロ麻雀連盟公式ルール」等の特定団体の正式な数値は本リポジトリ内で
 * 確認できないため、団体名を冠したプリセットは用意せず、一般的な組み合わせのみ
 * 用意している。値が判明すればプリセットとして追加できる。
 */

export type UmaPreset = {
  key: string;
  label: string;
  first: number;
  second: number;
  third: number;
  fourth: number;
};

export const UMA_PRESETS: UmaPreset[] = [
  { key: "5-10", label: "5-10", first: 10, second: 5, third: -5, fourth: -10 },
  { key: "5-15", label: "5-15", first: 15, second: 5, third: -5, fourth: -15 },
  { key: "10-20", label: "10-20", first: 20, second: 10, third: -10, fourth: -20 },
  { key: "10-30", label: "10-30", first: 30, second: 10, third: -10, fourth: -30 },
  { key: "20-30", label: "20-30", first: 30, second: 20, third: -20, fourth: -30 },
  { key: "20-50", label: "20-50", first: 50, second: 20, third: -20, fourth: -50 },
];

export const UMA_CUSTOM_KEY = "custom";

export function findUmaPresetKey(rule: {
  umaFirst: number;
  umaSecond: number;
  umaThird: number;
  umaFourth: number;
}): string {
  const match = UMA_PRESETS.find(
    (p) =>
      p.first === rule.umaFirst &&
      p.second === rule.umaSecond &&
      p.third === rule.umaThird &&
      p.fourth === rule.umaFourth
  );
  return match?.key ?? UMA_CUSTOM_KEY;
}

export const OKA_PRESETS = [
  { key: "5000", label: "5000点", enabled: true, points: 5000 },
  { key: "none", label: "オカ無し", enabled: false, points: 0 },
] as const;

export function findOkaPresetKey(rule: { okaEnabled: boolean; okaPoints: number }): string {
  if (!rule.okaEnabled) return "none";
  const match = OKA_PRESETS.find((p) => p.enabled && p.points === rule.okaPoints);
  return match?.key ?? "5000";
}

export const STARTING_POINTS_PRESETS = [25000, 30000] as const;

export const CHIP_PRESETS = [
  { key: "none", label: "チップなし", enabled: false, value: 0 },
  { key: "1000", label: "1枚 1000点", enabled: true, value: 1000 },
  { key: "2000", label: "1枚 2000点", enabled: true, value: 2000 },
  { key: "3000", label: "1枚 3000点", enabled: true, value: 3000 },
  { key: "4000", label: "1枚 4000点", enabled: true, value: 4000 },
  { key: "5000", label: "1枚 5000点", enabled: true, value: 5000 },
  { key: "10000", label: "1枚 10000点", enabled: true, value: 10000 },
] as const;

export function findChipPresetKey(rule: { chipEnabled: boolean; chipValue: number }): string {
  if (!rule.chipEnabled) return "none";
  const match = CHIP_PRESETS.find((p) => p.enabled && p.value === rule.chipValue);
  return match?.key ?? "1000";
}

export const ROUNDING_OPTIONS = [
  { key: "asis", label: "そのまま(小数点第一位)" },
  { key: "gosha_rokunyu", label: "五捨六入" },
] as const;

export const PENALTY_OPTIONS = [
  { key: "off", label: "利用しない", enabled: false },
  { key: "on", label: "利用する", enabled: true },
] as const;

export const RESULT_ENTRY_PERMISSION_OPTIONS = [
  { key: "all_members", label: "グループ参加者は誰でも編集可能" },
  { key: "owner_only", label: "管理者のみ編集可能" },
] as const;
