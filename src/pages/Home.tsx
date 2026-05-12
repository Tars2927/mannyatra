import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatusFilters, { type StatusFilter } from "@/components/StatusFilters";
import AddDestinationForm from "@/components/AddDestinationForm";
import DestinationList from "@/components/DestinationList";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const { isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="neu-card p-8">
          <p style={{ color: "var(--on-surface-variant)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        <DashboardHeader />
        <StatusFilters active={activeFilter} onChange={setActiveFilter} />

        {/* Form + Live Preview — only show on "All" tab */}
        {activeFilter === "All" && (
          <AddDestinationForm
            activeFilter={activeFilter}
            onSuccess={() => {}}
          />
        )}

        <DestinationList filter={activeFilter} />
      </main>

      <BottomNav />
    </div>
  );
}

