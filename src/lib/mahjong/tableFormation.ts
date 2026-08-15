/**
 * 麻雀卓成立ロジック。
 * 4人揃うごとに1卓成立。システムは常時4人を自動選定せず、
 * 4の倍数で自然に成立する場合は選定不要とする(仕様10章)。
 */

const TILE_SEQUENCE = ["東", "南", "西", "北"] as const;

export type Tile = {
  filled: boolean;
  label: string;
};

export type TableFormationResult = {
  /** 最大卓数 x 4 */
  capacity: number;
  /** 有効エントリー数(cancelled/not_selectedを除く) */
  entryCount: number;
  /** 表示上埋まっている人数(capacityで頭打ち) */
  filledCount: number;
  /** 成立している卓数 */
  tablesFormed: number;
  /** 定員ちょうど */
  isExactlyFull: boolean;
  /** 定員超過(参加者調整が必要) */
  isOverCapacity: boolean;
  /** 次の卓成立まであと何人か。既に全卓成立/超過ならnull */
  remainderToNextTable: number | null;
  /** 次に成立する卓の番号。既に全卓成立/超過ならnull */
  nextTableNumber: number | null;
  /** 「N卓成立!」部分。0卓なら null */
  headline: string | null;
  /** 「あとN人でM卓目!」部分。該当なしならnull */
  subMessage: string | null;
  /** 東南西北の牌表示配列(capacity分) */
  tiles: Tile[];
};

export function computeTableFormation(
  entryCount: number,
  maxTables: number
): TableFormationResult {
  const capacity = maxTables * 4;
  const filledCount = Math.min(entryCount, capacity);
  const tablesFormed = Math.floor(filledCount / 4);
  const isExactlyFull = filledCount === capacity && capacity > 0;
  const isOverCapacity = entryCount > capacity;

  const tiles: Tile[] = Array.from({ length: capacity }, (_, i) => ({
    filled: i < filledCount,
    label: i < filledCount ? TILE_SEQUENCE[i % 4] : "○",
  }));

  let remainderToNextTable: number | null = null;
  let nextTableNumber: number | null = null;
  let headline: string | null = null;
  let subMessage: string | null = null;

  if (isOverCapacity) {
    headline = `🎉 ${maxTables}卓成立!`;
    subMessage = null;
  } else if (filledCount % 4 === 0 && filledCount > 0) {
    // ちょうど区切りで卓が成立した直後(次の卓はまだ0人)
    headline = `🎉 ${tablesFormed}卓成立!`;
    subMessage = null;
  } else {
    const remainder = 4 - (filledCount % 4);
    const nextNumber = tablesFormed + 1;
    remainderToNextTable = remainder;
    nextTableNumber = nextNumber;
    const nextLabel = tablesFormed === 0 ? `${nextNumber}卓` : `${nextNumber}卓目`;
    subMessage = `あと${remainder}人で${nextLabel}!`;
    headline = tablesFormed > 0 ? `${tablesFormed}卓成立!` : null;
  }

  return {
    capacity,
    entryCount,
    filledCount,
    tablesFormed,
    isExactlyFull,
    isOverCapacity,
    remainderToNextTable,
    nextTableNumber,
    headline,
    subMessage,
    tiles,
  };
}

/** 4の倍数ぴったりで成立している場合、システムによる参加者選定は不要 */
export function needsParticipantSelection(entryCount: number, maxTables: number): boolean {
  const capacity = maxTables * 4;
  if (entryCount > capacity) return true; // 超過
  if (entryCount === 0) return false;
  return entryCount % 4 !== 0; // 端数
}
