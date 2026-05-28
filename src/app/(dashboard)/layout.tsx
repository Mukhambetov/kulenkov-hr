import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  KanbanSquare,
  BarChart3,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/vacancies", label: "Вакансии", icon: FileText },
  { href: "/pipeline", label: "Воронка найма", icon: KanbanSquare },
  { href: "/analytics", label: "Аналитика рынка", icon: BarChart3 },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-muted/20">
        <div className="flex h-14 items-center border-b px-5">
          <span className="font-bold tracking-tight">Kulenkov HR</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 px-3 text-xs text-muted-foreground">
            {session.user.name}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
