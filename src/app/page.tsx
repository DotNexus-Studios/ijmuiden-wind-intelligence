import { Dashboard, DashboardHeader } from "@/components/dashboard/dashboard";

export default function Home() {
  return (
    <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 min-w-0 w-full">
        <Dashboard />
      </div>
    </main>
  );
}
