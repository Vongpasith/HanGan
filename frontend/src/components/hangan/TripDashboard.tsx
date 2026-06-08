import { useEffect, useMemo, useState } from "react";
import { useTripStore, computeBalances, simplifyDebts } from "@/lib/hangan-store";
import { getTranslation } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Share2,
  Plus,
  Trash2,
  ArrowRight,
  Receipt,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AddExpenseModal } from "./AddExpenseModal";
import { AddMemberModal } from "./AddMemberModal";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TripDashboard({
  tripId,
  onBack,
}: {
  tripId: string;
  onBack: () => void;
}) {
  const trip = useTripStore((s) => s.trips[tripId]);
  const fetchTrip = useTripStore((s) => s.fetchTrip);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const removeMember = useTripStore((s) => s.removeMember);
  const lang = useTripStore((s) => s.lang);

  const t = (key: any) => getTranslation(lang, key);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  // Sync trip data with database on mount and whenever tripId changes
  useEffect(() => {
    fetchTrip(tripId);
  }, [tripId, fetchTrip]);

  const settlements = useMemo(() => {
    if (!trip) return [];
    return simplifyDebts(computeBalances(trip));
  }, [trip]);

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Trip not found.
      </div>
    );
  }

  const memberName = (id: string) =>
    trip.members.find((m) => m.id === id)?.name ?? "—";

  const totalSpent = trip.expenses.reduce((s, e) => s + e.amount, 0);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?trip=${trip.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Top bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("tripTitle")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-gradient">{trip.name}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium transition hover:bg-white/10 active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4" /> {t("shareLink")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Settlement */}
          <section
            className="glass ring-glow-purple rounded-3xl p-6 sm:p-8 animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("simplifiedDebts")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Minimum transfers to settle the trip.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("totalSpent")}</p>
                <p className="text-lg font-bold text-gradient">฿ {fmt(totalSpent)}</p>
              </div>
            </div>

            {settlements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="text-2xl">🎉</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("allSettled")}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {settlements.map((tItem, i) => (
                  <li
                    key={i}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <span className="rounded-full bg-destructive/15 px-3 py-1 text-sm font-medium text-destructive">
                        {memberName(tItem.from)}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-300">
                        {memberName(tItem.to)}
                      </span>
                    </div>
                    <span className="text-base font-bold sm:text-lg">
                      ฿ {fmt(tItem.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Expenses list */}
          <section
            className="glass rounded-3xl p-6 sm:p-8 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Receipt className="h-5 w-5 text-[color:var(--neon-pink)]" />
                {t("expensesTitle")}
                <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {trip.expenses.length}
                </span>
              </h2>
            </div>

            {trip.expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("noExpenses")}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {trip.expenses.map((e) => (
                  <li
                    key={e.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{e.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("paidBy")}{" "}
                          <span className="text-foreground/90">
                            {memberName(e.payerId)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-right text-base font-bold sm:text-lg">
                          ฿ {fmt(e.amount)}
                        </p>
                        <button
                          onClick={() => {
                            removeExpense(trip.id, e.id);
                            toast("Expense removed");
                          }}
                          className="rounded-full p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                          aria-label="Remove expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.shares.map((s) => (
                        <span
                          key={s.memberId}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs"
                        >
                          {memberName(s.memberId)}
                          <span className="ml-1.5 font-mono text-muted-foreground">
                            ฿{fmt(s.amount)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <button
            onClick={() => setExpenseOpen(true)}
            disabled={trip.members.length < 1}
            className="w-full rounded-2xl btn-glow px-5 py-4 text-base font-semibold transition active:scale-[0.98] hover:[&:not(:disabled)]:btn-glow-hover disabled:opacity-50 animate-fade-up"
          >
            {t("addExpense")}
          </button>

          <section
            className="glass rounded-3xl p-5 animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Users className="h-4 w-4" /> {t("memberCount")}
              </h3>
              <button
                onClick={() => setMemberOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium transition hover:bg-white/10 active:scale-95"
              >
                <Plus className="h-3 w-3" /> {t("addMemberBtn")}
              </button>
            </div>
            <ul className="space-y-1.5">
              {trip.members.map((m) => (
                <li
                  key={m.id}
                  className="group flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[color:var(--neon-purple)] to-[color:var(--neon-pink)] text-xs font-bold">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{m.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t("removeMemberConfirm"))) {
                        removeMember(trip.id, m.id);
                      }
                    }}
                    className="rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <AddExpenseModal
        tripId={trip.id}
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
      />
      <AddMemberModal
        tripId={trip.id}
        open={memberOpen}
        onOpenChange={setMemberOpen}
      />
    </div>
  );
}
