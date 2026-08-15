import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-washi-200">
      <Header user={user} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
