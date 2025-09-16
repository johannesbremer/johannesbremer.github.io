import { PlusIcon as Plus, TrashIcon as Trash } from "@phosphor-icons/react";
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

export function EmployeeManagementDialog({
  onOpenChange,
  open,
}: EmployeeManagementDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      void loadEmployees();
    }
  }, [open]);

  const loadEmployees = async () => {
    try {
      const employeeList = await getEmployees();
      setEmployees(employeeList);
    } catch {
      toast.error("Fehler beim Laden der Mitarbeiter");
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) {
      toast.error("Mitarbeitername ist erforderlich");
      return;
    }

    setIsLoading(true);
    try {
      const newEmployee = await addEmployee(newEmployeeName);
      setEmployees((prev) => [...prev, newEmployee]);
      setNewEmployeeName("");
      toast.success("Mitarbeiter erfolgreich hinzugefügt");
    } catch {
      toast.error("Fehler beim Hinzufügen des Mitarbeiters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    setIsLoading(true);
    try {
      await removeEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast.success("Mitarbeiter erfolgreich entfernt");
    } catch {
      toast.error("Fehler beim Entfernen des Mitarbeiters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee?.name.trim()) {
      toast.error("Mitarbeitername ist erforderlich");
      return;
    }

    setIsLoading(true);
    try {
      await updateEmployee(editingEmployee.id, editingEmployee.name);
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id ? editingEmployee : emp
        )
      );
      setEditingEmployee(null);
      toast.success("Mitarbeiter erfolgreich aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren des Mitarbeiters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (editingEmployee) {
        void handleUpdateEmployee();
      } else {
        void handleAddEmployee();
      }
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
            <div className="space-y-2">
              <div>
                <Label htmlFor="employee-name">Name *</Label>
                <Input
                  disabled={isLoading}
                  id="employee-name"
                  onChange={(e) => {
                    setNewEmployeeName(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Mitarbeitername eingeben"
                  value={newEmployeeName}
                />
              </div>
              <Button
                className="w-full"
                disabled={isLoading || !newEmployeeName.trim()}
                onClick={() => void handleAddEmployee()}
              >
                <Plus className="mr-2" size={16} />
                Mitarbeiter hinzufügen
              </Button>
            </div>
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
                      <div className="flex-1 space-y-2">
                        <Input
                          disabled={isLoading}
                          onChange={(e) => {
                            setEditingEmployee({
                              ...editingEmployee,
                              name: e.target.value,
                            });
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Mitarbeitername"
                          value={editingEmployee.name}
                        />
                        <div className="flex gap-2">
                          <Button
                            disabled={isLoading}
                            onClick={() => void handleUpdateEmployee()}
                            size="sm"
                          >
                            Speichern
                          </Button>
                          <Button
                            disabled={isLoading}
                            onClick={() => {
                              setEditingEmployee(null);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
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
                          disabled={isLoading}
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
