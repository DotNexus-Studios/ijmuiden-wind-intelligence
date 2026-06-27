import { Dashboard, DashboardHeader } from "@/components/dashboard/dashboard";

export default function Home() {
  return (
    <main className="flex-1 max-w-lg mx-auto w-full">
      <DashboardHeader />
      <div className="p-4">
        <Dashboard />
      </div>
    </main>
  );
}
