import { get, set } from "idb-keyval";

const EMPLOYEES_STORAGE_KEY = "employees-list";

export interface Employee {
  id: string;
  name: string;
}

export async function addEmployee(name: string): Promise<Employee> {
  const employees = await getEmployees();
  const newEmployee: Employee = {
    id: Date.now().toString(),
    name: name.trim(),
  };

  employees.push(newEmployee);
  await setEmployees(employees);
  return newEmployee;
}

export async function getEmployees(): Promise<Employee[]> {
  try {
    return (await get(EMPLOYEES_STORAGE_KEY)) ?? [];
  } catch (error) {
    console.error("Failed to get employees:", error);
    return [];
  }
}

export async function removeEmployee(id: string): Promise<void> {
  const employees = await getEmployees();
  const filtered = employees.filter((emp) => emp.id !== id);
  await setEmployees(filtered);
}

export async function setEmployees(employees: Employee[]): Promise<void> {
  try {
    await set(EMPLOYEES_STORAGE_KEY, employees);
  } catch (error) {
    console.error("Failed to set employees:", error);
    throw new Error("Failed to save employees");
  }
}

export async function updateEmployee(id: string, name: string): Promise<void> {
  const employees = await getEmployees();
  const index = employees.findIndex((emp) => emp.id === id);

  if (index === -1) return;

  const current = employees[index];
  if (!current) return;
  const updated: Employee = { id: current.id, name: name.trim() };
  employees[index] = updated;
  await setEmployees(employees);
}
