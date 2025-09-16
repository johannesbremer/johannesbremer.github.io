import {
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  GearIcon as Gear,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyDialogProps {
  onOpenChange: (open: boolean) => void;
  onSave: (apiKey: string) => Promise<void>;
  open: boolean;
}

export function ApiKeyDialog({
  onOpenChange,
  onSave,
  open,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("Bitte geben Sie einen API-Schlüssel ein");
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      setError('OpenAI API-Schlüssel sollten mit "sk-" beginnen');
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onSave(apiKey.trim());
      setApiKey("");
      onOpenChange(false);
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "Fehler beim Speichern des API-Schlüssels"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gear size={20} />
            OpenAI API-Schlüssel Einrichtung
          </DialogTitle>
          <DialogDescription>
            Geben Sie Ihren OpenAI API-Schlüssel ein, um Zeitnachweis-Bilder zu
            verarbeiten. Ihr Schlüssel wird sicher in Ihrem Browser gespeichert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API-Schlüssel</Label>
            <div className="relative">
              <Input
                className="pr-10"
                id="api-key"
                onChange={(e) => {
                  setApiKey(e.target.value);
                }}
                placeholder="sk-..."
                type={showKey ? "text" : "password"}
                value={apiKey}
              />
              <Button
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => {
                  setShowKey(!showKey);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                {showKey ? <EyeSlash size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              Holen Sie sich Ihren API-Schlüssel von der{" "}
              <a
                className="underline hover:no-underline"
                href="https://platform.openai.com/api-keys"
                rel="noopener noreferrer"
                target="_blank"
              >
                OpenAI Platform
              </a>
              . Ihr Schlüssel wird lokal gespeichert und niemals geteilt.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
              }}
              variant="outline"
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={() => void handleSave()}
            >
              {isLoading ? "Speichern..." : "Schlüssel speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
