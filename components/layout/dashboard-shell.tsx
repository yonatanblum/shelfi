import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type DashboardShellProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <Header title={title} description={description} actions={actions} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
