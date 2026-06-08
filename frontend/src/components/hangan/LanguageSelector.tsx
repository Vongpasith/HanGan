import { useTripStore } from "@/lib/hangan-store";
import { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector({ className }: { className?: string }) {
  const currentLang = useTripStore((s) => s.lang);
  const setLanguage = useTripStore((s) => s.setLanguage);

  const langs: { value: Language; label: string; flag: string }[] = [
    { value: "th", label: "ไทย (TH)", flag: "🇹🇭" },
    { value: "lo", label: "ລາວ (LO)", flag: "🇱🇦" },
    { value: "en", label: "English (EN)", flag: "🇺🇸" },
  ];

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1", className)}>
      {langs.map((l) => (
        <button
          key={l.value}
          onClick={() => setLanguage(l.value)}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all",
            currentLang === l.value
              ? "bg-gradient-to-r from-[color:var(--neon-purple)] to-[color:var(--neon-pink)] text-white shadow-md"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
        >
          <span>{l.flag}</span>
          <span className="hidden sm:inline">{l.value.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
