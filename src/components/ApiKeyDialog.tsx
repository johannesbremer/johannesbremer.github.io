import {
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  GearIcon as Gear,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ApiKeyDialogProps {
  onOpenChange: (open: boolean) => void;
  onSave: (apiKey: string) => Promise<void>;
  open: boolean;
}

const formSchema = z.object({
  apiKey: z
    .string()
    .min(1, "Bitte geben Sie einen API-Schlüssel ein")
    .startsWith("sk-", 'OpenAI API-Schlüssel sollten mit "sk-" beginnen'),
});

export function ApiKeyDialog({
  onOpenChange,
  onSave,
  open,
}: ApiKeyDialogProps) {
  const [showKey, setShowKey] = useState(false);

  const form = useForm({
    defaultValues: {
      apiKey: "",
    },
    onSubmit: async ({ value }) => {
      await onSave(value.apiKey.trim());
      form.reset();
      onOpenChange(false);
    },
    validators: {
      onSubmit: formSchema,
    },
  });

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.Field name="apiKey">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>API-Schlüssel</FieldLabel>
                    <div className="relative">
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        className="pr-10"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                        placeholder="sk-..."
                        type={showKey ? "text" : "password"}
                        value={field.state.value}
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
                    <FieldDescription>
                      Ihr API-Schlüssel beginnt mit &quot;sk-&quot; und wird
                      lokal gespeichert.
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

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
                type="button"
                variant="outline"
              >
                Abbrechen
              </Button>
              <form.Subscribe>
                {(state) => (
                  <Button
                    className="flex-1"
                    disabled={state.isSubmitting || !state.canSubmit}
                    type="submit"
                  >
                    {state.isSubmitting
                      ? "Speichern..."
                      : "Schlüssel speichern"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
