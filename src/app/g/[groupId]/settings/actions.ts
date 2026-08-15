"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

function num(formData: FormData, key: string, fallback: number): number {
  const v = formData.get(key);
  if (v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function updateGroupRule(groupId: string, formData: FormData) {
  await requireOwner(groupId);

  const roundingRule = String(formData.get("roundingRule") ?? "round");
  const tieRule = String(formData.get("tieRule") ?? "seat_order");

  await prisma.groupRule.update({
    where: { groupId },
    data: {
      startingPoints: num(formData, "startingPoints", 25000),
      returnPoints: num(formData, "returnPoints", 30000),
      umaFirst: num(formData, "umaFirst", 20),
      umaSecond: num(formData, "umaSecond", 10),
      umaThird: num(formData, "umaThird", -10),
      umaFourth: num(formData, "umaFourth", -20),
      okaEnabled: formData.get("okaEnabled") === "on",
      chipEnabled: formData.get("chipEnabled") === "on",
      chipValue: num(formData, "chipValue", 100),
      redDoraChipEnabled: formData.get("redDoraChipEnabled") === "on",
      ippatsuChipEnabled: formData.get("ippatsuChipEnabled") === "on",
      uraDoraChipEnabled: formData.get("uraDoraChipEnabled") === "on",
      bustPenaltyEnabled: formData.get("bustPenaltyEnabled") === "on",
      bustPenaltyValue: num(formData, "bustPenaltyValue", 0),
      yakitoriEnabled: formData.get("yakitoriEnabled") === "on",
      roundingRule: ["round", "floor", "ceil"].includes(roundingRule) ? roundingRule : "round",
      tieRule: ["seat_order", "shared_rank"].includes(tieRule) ? tieRule : "seat_order",
    },
  });

  revalidatePath(`/g/${groupId}/settings`);
}
