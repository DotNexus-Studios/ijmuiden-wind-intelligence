import { Dashboard, DashboardHeader } from "@/components/dashboard/dashboard";

export default function Home() {
  return (
    <main className="flex-1 w-full">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <Dashboard />
      </div>
    </main>
  );
}
