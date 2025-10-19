import { PlusIcon as Plus, TrashIcon as Trash } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  addEmployee,
  type Employee,
  getEmployees,
  removeEmployee,
  updateEmployee,
} from "@/lib/employees";

interface EmployeeManagementDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const employeeSchema = z.object({
  name: z
    .string()
    .min(1, "Mitarbeitername ist erforderlich")
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(100, "Name darf maximal 100 Zeichen lang sein"),
});

export function EmployeeManagementDialog({
  onOpenChange,
  open,
}: EmployeeManagementDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form for adding new employees
  const addForm = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const newEmployee = await addEmployee(value.name);
        setEmployees((prev) => [...prev, newEmployee]);
        addForm.reset();
        toast.success("Mitarbeiter erfolgreich hinzugefügt");
      } catch {
        toast.error("Fehler beim Hinzufügen des Mitarbeiters");
      }
    },
    validators: {
      onSubmit: employeeSchema,
    },
  });

  // Form for editing existing employees
  const editForm = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      if (!editingEmployee) {
        return;
      }

      try {
        await updateEmployee(editingEmployee.id, value.name);
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id ? { ...emp, name: value.name } : emp,
          ),
        );
        setEditingEmployee(null);
        toast.success("Mitarbeiter erfolgreich aktualisiert");
      } catch {
        toast.error("Fehler beim Aktualisieren des Mitarbeiters");
      }
    },
    validators: {
      onSubmit: employeeSchema,
    },
  });

  useEffect(() => {
    if (open) {
      void loadEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (editingEmployee) {
      editForm.setFieldValue("name", editingEmployee.name);
    }
  }, [editingEmployee]);

  const loadEmployees = async () => {
    try {
      const employeeList = await getEmployees();
      setEmployees(employeeList);
    } catch {
      toast.error("Fehler beim Laden der Mitarbeiter");
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    try {
      await removeEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast.success("Mitarbeiter erfolgreich entfernt");
    } catch {
      toast.error("Fehler beim Entfernen des Mitarbeiters");
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mitarbeiter verwalten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new employee */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium">Neuen Mitarbeiter hinzufügen</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void addForm.handleSubmit();
              }}
            >
              <div className="space-y-2">
                <addForm.Field name="name">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                          }}
                          placeholder="Mitarbeitername eingeben"
                          value={field.state.value}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </addForm.Field>
                <addForm.Subscribe>
                  {(state) => (
                    <Button
                      className="w-full"
                      disabled={state.isSubmitting || !state.canSubmit}
                      type="submit"
                    >
                      <Plus className="mr-2" size={16} />
                      Mitarbeiter hinzufügen
                    </Button>
                  )}
                </addForm.Subscribe>
              </div>
            </form>
          </div>

          {/* Employee list */}
          <div className="space-y-2">
            <h3 className="font-medium">
              Aktuelle Mitarbeiter ({employees.length})
            </h3>
            {employees.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Noch keine Mitarbeiter hinzugefügt
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {employees.map((employee) => (
                  <div
                    className="flex items-center justify-between p-2 border rounded"
                    key={employee.id}
                  >
                    {editingEmployee?.id === employee.id ? (
                      <form
                        className="flex-1 space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void editForm.handleSubmit();
                        }}
                      >
                        <editForm.Field name="name">
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                            return (
                              <Field data-invalid={isInvalid}>
                                <Input
                                  aria-invalid={isInvalid}
                                  id={field.name}
                                  name={field.name}
                                  onBlur={field.handleBlur}
                                  onChange={(e) => {
                                    field.handleChange(e.target.value);
                                  }}
                                  placeholder="Mitarbeitername"
                                  value={field.state.value}
                                />
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        </editForm.Field>
                        <div className="flex gap-2">
                          <editForm.Subscribe>
                            {(state) => (
                              <Button
                                disabled={
                                  state.isSubmitting || !state.canSubmit
                                }
                                size="sm"
                                type="submit"
                              >
                                Speichern
                              </Button>
                            )}
                          </editForm.Subscribe>
                          <Button
                            onClick={() => {
                              setEditingEmployee(null);
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setEditingEmployee(employee);
                          }}
                        >
                          <div className="font-medium">{employee.name}</div>
                        </div>
                        <Button
                          onClick={() => void handleRemoveEmployee(employee.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Trash size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
