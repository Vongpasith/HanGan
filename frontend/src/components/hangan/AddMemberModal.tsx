import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/lib/hangan-store";
import { getTranslation } from "@/lib/i18n";
import { toast } from "sonner";

export function AddMemberModal({
  tripId,
  open,
  onOpenChange,
}: {
  tripId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState("");
  const addMember = useTripStore((s) => s.addMember);
  const lang = useTripStore((s) => s.lang);

  const t = (key: any) => getTranslation(lang, key);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addMember(tripId, name);
    toast.success(`${name.trim()} added to the trip`);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addMemberTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("memberNamePlaceholder")}
            className="h-11 border-white/10 bg-white/5 focus-visible:ring-[var(--neon-purple)]"
          />
          <Button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-xl btn-glow font-semibold active:scale-[0.98] hover:[&:not(:disabled)]:btn-glow-hover"
          >
            {t("addMemberBtn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
