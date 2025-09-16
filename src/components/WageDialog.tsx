import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWage, setWage } from "@/lib/wage";

interface WageDialogProps {
  onOpenChange: (open: boolean) => void;
  onWageUpdate: (wage: number) => void;
  open: boolean;
}

export function WageDialog({
  onOpenChange,
  onWageUpdate,
  open,
}: WageDialogProps) {
  const [wageValue, setWageValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      void loadWage();
    }
  }, [open]);

  const loadWage = async () => {
    try {
      const wage = await getWage();
      setWageValue(wage.toString());
    } catch {
      toast.error("Fehler beim Laden des Lohns");
    }
  };

  const handleSave = async () => {
    const numericWage = Number.parseFloat(wageValue);

    if (Number.isNaN(numericWage) || numericWage < 0) {
      toast.error("Bitte geben Sie einen gültigen Lohnbetrag ein");
      return;
    }

    setIsLoading(true);
    try {
      await setWage(numericWage);
      onWageUpdate(numericWage);
      onOpenChange(false);
      toast.success("Stundenlohn erfolgreich gespeichert");
    } catch {
      toast.error("Fehler beim Speichern des Lohns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSave();
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stundenlohn festlegen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="wage-amount">Stundenlohn</Label>
            <Input
              disabled={isLoading}
              id="wage-amount"
              min="0"
              onChange={(e) => {
                setWageValue(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Stundenlohn eingeben (z.B. 25,50)"
              step="0.01"
              type="number"
              value={wageValue}
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={isLoading || !wageValue.trim()}
              onClick={() => void handleSave()}
            >
              Lohn speichern
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={() => {
                onOpenChange(false);
              }}
              variant="outline"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
