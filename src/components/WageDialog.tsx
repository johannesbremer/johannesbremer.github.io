import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { getWage, setWage } from "@/lib/wage";

interface WageDialogProps {
  onOpenChange: (open: boolean) => void;
  onWageUpdate: (wage: number) => void;
  open: boolean;
}

const formSchema = z.object({
  wage: z
    .number({ message: "Bitte geben Sie einen gültigen Lohnbetrag ein" })
    .min(0, "Der Lohn muss mindestens 0 sein")
    .nonnegative("Der Lohn kann nicht negativ sein"),
});

export function WageDialog({
  onOpenChange,
  onWageUpdate,
  open,
}: WageDialogProps) {
  const form = useForm({
    defaultValues: {
      wage: 0,
    },
    onSubmit: async ({ value }) => {
      try {
        await setWage(value.wage);
        onWageUpdate(value.wage);
        onOpenChange(false);
        toast.success("Stundenlohn erfolgreich gespeichert");
      } catch {
        toast.error("Fehler beim Speichern des Lohns");
      }
    },
    validators: {
      onSubmit: formSchema,
    },
  });

  useEffect(() => {
    if (open) {
      void loadWage();
    }
  }, [open]);

  const loadWage = async () => {
    try {
      const wage = await getWage();
      form.setFieldValue("wage", wage);
    } catch {
      toast.error("Fehler beim Laden des Lohns");
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stundenlohn festlegen</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.Field name="wage">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Stundenlohn</FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      id={field.name}
                      min="0"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.handleChange(
                          value === "" ? 0 : Number.parseFloat(value),
                        );
                      }}
                      placeholder="Stundenlohn eingeben (z.B. 25,50)"
                      step="0.01"
                      type="number"
                      value={field.state.value}
                    />
                    <FieldDescription>
                      Geben Sie Ihren Stundenlohn in Euro ein.
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <div className="flex gap-2">
              <form.Subscribe>
                {(state) => (
                  <Button
                    className="flex-1"
                    disabled={state.isSubmitting || !state.canSubmit}
                    type="submit"
                  >
                    {state.isSubmitting ? "Speichern..." : "Lohn speichern"}
                  </Button>
                )}
              </form.Subscribe>
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
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
