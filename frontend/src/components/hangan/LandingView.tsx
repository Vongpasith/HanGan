import { useState } from "react";
import { useTripStore } from "@/lib/hangan-store";
import { getTranslation } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Rocket } from "lucide-react";
import { toast } from "sonner";

export function LandingView({ onCreated }: { onCreated: (tripId: string) => void }) {
  const [tripName, setTripName] = useState("");
  const [members, setMembers] = useState<string[]>(["", ""]);
  const createTrip = useTripStore((s) => s.createTrip);
  const lang = useTripStore((s) => s.lang);

  const t = (key: any) => getTranslation(lang, key);

  const updateMember = (i: number, v: string) =>
    setMembers((m) => m.map((x, idx) => (idx === i ? v : x)));
  const addMemberInput = () => setMembers((m) => [...m, ""]);
  const removeMemberInput = (i: number) =>
    setMembers((m) => (m.length <= 2 ? m : m.filter((_, idx) => idx !== i)));

  const valid =
    tripName.trim().length > 0 && members.filter((m) => m.trim()).length >= 2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error(t("invalidInput"));
      return;
    }
    const id = await createTrip(tripName, members);
    if (!id) {
      toast.error(t("copyFailed")); // or a general fail message
      return;
    }
    toast.success("Trip created! ✈️");
    onCreated(id);
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-5 py-16">
      {/* Top Bar for Language Selector */}
      <div className="w-full flex justify-end mb-8">
        <LanguageSelector />
      </div>

      <header className="mb-12 text-center animate-fade-up">
        <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl glass ring-glow-purple text-5xl animate-float">
          💸
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          <span className="text-gradient">{t("brand")}</span>
          <span className="ml-3 text-2xl font-light text-muted-foreground sm:text-3xl">
            {t("brandSub")}
          </span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("slogan")}
        </p>
      </header>

      <form
        onSubmit={submit}
        className="glass w-full rounded-3xl p-7 sm:p-9 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-6 text-xl font-semibold tracking-tight">{t("startTrip")}</h2>

        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t("tripName")}
        </label>
        <Input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="Chiang Mai weekend, Bali 2026…"
          className="mb-6 h-12 border-white/10 bg-white/5 text-base placeholder:text-muted-foreground/60 focus-visible:ring-[var(--neon-purple)]"
        />

        <label className="mb-3 block text-sm font-medium text-muted-foreground">
          {t("members")}
        </label>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={m}
                onChange={(e) => updateMember(i, e.target.value)}
                placeholder={`${t("friendPlaceholder")} ${i + 1}`}
                className="h-11 border-white/10 bg-white/5 placeholder:text-muted-foreground/60 focus-visible:ring-[var(--neon-purple)]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMemberInput(i)}
                disabled={members.length <= 2}
                className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                aria-label="Remove member"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMemberInput}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-white/10 hover:text-foreground active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> {t("addFriend")}
        </button>

        <button
          type="submit"
          disabled={!valid}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl btn-glow px-6 py-4 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:[&:not(:disabled)]:btn-glow-hover"
        >
          <Rocket className="h-5 w-5" /> {t("createTrip")}
        </button>
      </form>

      <p className="mt-10 text-xs text-muted-foreground/70 text-center">
        {t("noAccountInfo")}
      </p>
    </div>
  );
}
