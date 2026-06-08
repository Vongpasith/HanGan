import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LandingView } from "@/components/hangan/LandingView";
import { TripDashboard } from "@/components/hangan/TripDashboard";
import { useTripStore } from "@/lib/hangan-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HanGan (หารกัน) — Split trip expenses instantly" },
      {
        name: "description",
        content:
          "Zero-auth trip expense splitter. Add bills, split equally or unequally, and see the minimum transfers to settle up.",
      },
      { property: "og:title", content: "HanGan (หารกัน)" },
      {
        property: "og:description",
        content: "Zero-auth, production-ready trip expense manager.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const trips = useTripStore((s) => s.trips);

  // Sync from ?trip= param on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("trip");
    if (p) setActiveTripId(p);
  }, []);

  // Reflect in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeTripId) url.searchParams.set("trip", activeTripId);
    else url.searchParams.delete("trip");
    window.history.replaceState(null, "", url.toString());
  }, [activeTripId]);

  const trip = activeTripId ? trips[activeTripId] : null;

  if (activeTripId && trip) {
    return (
      <TripDashboard tripId={activeTripId} onBack={() => setActiveTripId(null)} />
    );
  }

  return <LandingView onCreated={(id) => setActiveTripId(id)} />;
}
