import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-washi-100 border border-gold-400/30 shadow-[0_2px_10px_rgba(13,43,34,0.08)] ${className}`}
      {...props}
    />
  );
}
