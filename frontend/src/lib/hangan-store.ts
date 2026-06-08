import { create } from "zustand";
import { Language } from "./i18n";

export type Member = { id: string; name: string };
export type Share = { memberId: string; amount: number };
export type Expense = {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  shares: Share[];
  createdAt: number;
};
export type Trip = {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  createdAt: number;
};

export type Transfer = { from: string; to: string; amount: number };

// Helper to determine API Host depending on client or SSR context
const getApiHost = () => {
  if (typeof window !== "undefined") {
    // Browser client calls backend at host port 8081
    return `${window.location.protocol}//${window.location.hostname}:8081`;
  }
  // Server-side calls Docker container service 'backend' directly at internal port 8080
  return "http://backend:8080";
};

// Determine default language from localStorage
const getDefaultLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("hangan-lang") as Language;
    if (saved === "th" || saved === "lo" || saved === "en") return saved;
  }
  return "th";
};

type State = {
  trips: Record<string, Trip>;
  lang: Language;
  setLanguage: (lang: Language) => void;
  fetchTrip: (tripId: string) => Promise<void>;
  createTrip: (name: string, memberNames: string[]) => Promise<string>;
  addMember: (tripId: string, name: string) => Promise<void>;
  removeMember: (tripId: string, memberId: string) => void;
  addExpense: (tripId: string, e: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  removeExpense: (tripId: string, expenseId: string) => void;
};

export const useTripStore = create<State>((set, get) => ({
  trips: {},
  lang: getDefaultLanguage(),

  setLanguage: (lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hangan-lang", lang);
    }
    set({ lang });
  },

  // Fetch full trip data from GORM database
  fetchTrip: async (tripId) => {
    try {
      const host = getApiHost();
      const res = await fetch(`${host}/api/trips/${tripId}`);
      if (!res.ok) return;
      const data = await res.json();

      // Normalize backend GORM models to frontend state structures
      const normalizedTrip: Trip = {
        id: data.id,
        name: data.title,
        createdAt: new Date(data.created_at).getTime(),
        members: (data.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
        })),
        expenses: (data.expenses || []).map((e: any) => ({
          id: e.id,
          description: e.description,
          amount: parseFloat(e.amount),
          payerId: e.paid_by_id,
          createdAt: new Date(e.created_at).getTime(),
          shares: (e.splits || []).map((s: any) => ({
            memberId: s.member_id,
            amount: parseFloat(s.amount),
          })),
        })),
      };

      set((s) => ({
        trips: { ...s.trips, [tripId]: normalizedTrip },
      }));
    } catch (err) {
      console.error("Failed to fetch trip from API", err);
    }
  },

  // POST trip creation to backend
  createTrip: async (name, memberNames) => {
    try {
      const host = getApiHost();
      const activeMembers = memberNames.map((n) => n.trim()).filter(Boolean);

      const res = await fetch(`${host}/api/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name.trim() || "Untitled Trip",
          members: activeMembers,
        }),
      });

      if (!res.ok) throw new Error("Failed to create trip");
      const data = await res.json();

      // Set inside store
      const trip: Trip = {
        id: data.id,
        name: data.title,
        createdAt: new Date(data.created_at).getTime(),
        members: (data.members || []).map((m: any) => ({ id: m.id, name: m.name })),
        expenses: [],
      };

      set((s) => ({ trips: { ...s.trips, [data.id]: trip } }));
      return data.id;
    } catch (err) {
      console.error("Failed to create trip via API", err);
      return "";
    }
  },

  // POST new member to database
  addMember: async (tripId, name) => {
    try {
      const host = getApiHost();
      const res = await fetch(`${host}/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) return;

      // Refresh trip state to sync database preloads
      await get().fetchTrip(tripId);
    } catch (err) {
      console.error("Failed to add member via API", err);
    }
  },

  removeMember: (tripId, memberId) => {
    set((s) => {
      const t = s.trips[tripId];
      if (!t) return s;
      const updated = {
        ...t,
        members: t.members.filter((m) => m.id !== memberId),
        expenses: t.expenses.filter(
          (e) => e.payerId !== memberId && !e.shares.some((sh) => sh.memberId === memberId),
        ),
      };
      return { trips: { ...s.trips, [tripId]: updated } };
    });
  },

  // POST new expense to GORM database
  addExpense: async (tripId, e) => {
    try {
      const host = getApiHost();
      const splitsPayload = e.shares.map((s) => ({
        member_id: s.memberId,
        amount: s.amount,
      }));

      const res = await fetch(`${host}/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid_by_id: e.payerId,
          amount: e.amount,
          description: e.description,
          splits: splitsPayload,
        }),
      });

      if (!res.ok) return;

      // Refresh trip state to sync database preloads
      await get().fetchTrip(tripId);
    } catch (err) {
      console.error("Failed to add expense via API", err);
    }
  },

  removeExpense: (tripId, expenseId) => {
    set((s) => {
      const t = s.trips[tripId];
      if (!t) return s;
      return {
        trips: {
          ...s.trips,
          [tripId]: { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) },
        },
      };
    });
  },
}));

export function computeBalances(trip: Trip): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const m of trip.members) bal[m.id] = 0;
  for (const e of trip.expenses) {
    if (bal[e.payerId] !== undefined) bal[e.payerId] += e.amount;
    for (const s of e.shares) {
      if (bal[s.memberId] !== undefined) bal[s.memberId] -= s.amount;
    }
  }
  for (const k of Object.keys(bal)) bal[k] = Math.round(bal[k] * 100) / 100;
  return bal;
}

export function simplifyDebts(balances: Record<string, number>): Transfer[] {
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.009)
    .map(([id, v]) => ({ id, v }));
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.009)
    .map(([id, v]) => ({ id, v: -v }));

  const transfers: Transfer[] = [];
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.v - a.v);
    debtors.sort((a, b) => b.v - a.v);
    const c = creditors[0];
    const d = debtors[0];
    const amt = Math.min(c.v, d.v);
    transfers.push({ from: d.id, to: c.id, amount: Math.round(amt * 100) / 100 });
    c.v -= amt;
    d.v -= amt;
    if (c.v < 0.01) creditors.shift();
    if (d.v < 0.01) debtors.shift();
  }
  return transfers;
}
