import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTripStore } from "@/lib/hangan-store";
import { getTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SplitMode = "equal" | "unequal";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AddExpenseModal({
  tripId,
  open,
  onOpenChange,
}: {
  tripId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const trip = useTripStore((s) => s.trips[tripId]);
  const addExpense = useTripStore((s) => s.addExpense);
  const lang = useTripStore((s) => s.lang);

  const t = (key: any) => getTranslation(lang, key);

  const [payerId, setPayerId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [unequal, setUnequal] = useState<Record<string, string>>({});

  const amount = Number(amountStr) || 0;

  useEffect(() => {
    if (!open) return;
    setPayerId(trip?.members[0]?.id ?? "");
    setDescription("");
    setAmountStr("");
    setMode("equal");
    setUnequal({});
  }, [open, trip?.id]);

  const equalShares = useMemo(() => {
    if (!trip || trip.members.length === 0 || amount <= 0) return [];
    const each = Math.floor((amount / trip.members.length) * 100) / 100;
    const shares = trip.members.map((m) => ({ memberId: m.id, amount: each }));
    const diff = Math.round((amount - each * trip.members.length) * 100) / 100;
    if (shares.length) {
      shares[shares.length - 1] = {
        ...shares[shares.length - 1],
        amount: Math.round((each + diff) * 100) / 100,
      };
    }
    return shares;
  }, [trip, amount]);

  const unequalShares = useMemo(() => {
    if (!trip) return [];
    return trip.members.map((m) => ({
      memberId: m.id,
      amount: Math.round((Number(unequal[m.id]) || 0) * 100) / 100,
    }));
  }, [trip, unequal]);

  const splitTotal =
    mode === "equal"
      ? equalShares.reduce((s, x) => s + x.amount, 0)
      : unequalShares.reduce((s, x) => s + x.amount, 0);

  const matches = Math.abs(splitTotal - amount) < 0.01 && amount > 0;
  const canSubmit =
    !!trip &&
    !!payerId &&
    description.trim().length > 0 &&
    amount > 0 &&
    matches;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !trip) return;

    // Validate no negative custom amounts
    if (mode === "unequal") {
      for (const m of trip.members) {
        const val = Number(unequal[m.id]) || 0;
        if (val < 0) {
          toast.error(t("negativeError"));
          return;
        }
      }
    }

    await addExpense(trip.id, {
      payerId,
      description: description.trim(),
      amount: Math.round(amount * 100) / 100,
      shares: mode === "equal" ? equalShares : unequalShares,
    });
    toast.success("Expense added");
    onOpenChange(false);
  };

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[92vh] overflow-y-auto border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("addExpenseTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("payer")}
              </label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger className="h-11 border-white/10 bg-white/5">
                  <SelectValue placeholder="Who paid?" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {trip.members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("totalAmount")}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="h-11 border-white/10 bg-white/5 focus-visible:ring-[var(--neon-purple)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("billDescription")}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner at the night market…"
              className="h-11 border-white/10 bg-white/5 focus-visible:ring-[var(--neon-purple)]"
            />
          </div>

          {/* Split tabs */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
            <div className="grid grid-cols-2 gap-1">
              {(["equal", "unequal"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                    mode === m
                      ? "bg-gradient-to-r from-[color:var(--neon-purple)] to-[color:var(--neon-pink)] text-white shadow-lg"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {m === "equal" ? t("equalSplit") : t("unequalSplit")}
                </button>
              ))}
            </div>
          </div>

          {mode === "equal" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                {t("equalSplit")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {equalShares.map((s) => {
                  const m = trip.members.find((x) => x.id === s.memberId);
                  return (
                    <span
                      key={s.memberId}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
                    >
                      {m?.name}{" "}
                      <span className="ml-1 font-mono text-muted-foreground">
                        ฿{fmt(s.amount)}
                      </span>
                    </span>
                  );
                })}
                {amount <= 0 && (
                  <p className="text-sm text-muted-foreground">Enter a total above.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground px-1 mb-2">
                {t("customSplitHeader")}
              </p>
              {trip.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[color:var(--neon-purple)] to-[color:var(--neon-pink)] text-xs font-bold">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 text-sm font-medium">{m.name}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={unequal[m.id] ?? ""}
                    onChange={(e) =>
                      setUnequal((u) => ({ ...u, [m.id]: e.target.value }))
                    }
                    className="h-9 w-28 border-white/10 bg-white/5 text-right focus-visible:ring-[var(--neon-purple)]"
                  />
                  <span className="w-6 text-xs text-muted-foreground">฿</span>
                </div>
              ))}
            </div>
          )}

          {/* Validation */}
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition",
              matches
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : amount > 0
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground",
            )}
          >
            <span>{t("customSplitTotal")}</span>
            <span className="font-mono">
              ฿{fmt(splitTotal)} / ฿{fmt(amount)}
            </span>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl btn-glow py-5 text-base font-semibold active:scale-[0.98] hover:[&:not(:disabled)]:btn-glow-hover disabled:opacity-50"
          >
            {t("saveBillBtn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
