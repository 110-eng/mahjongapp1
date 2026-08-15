import type { ExperienceLevel } from "@/generated/prisma/client";

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  inexperienced: "未経験",
  beginner: "初心者",
  experienced: "経験者",
};

export const EXPERIENCE_LEVELS: ExperienceLevel[] = ["inexperienced", "beginner", "experienced"];
