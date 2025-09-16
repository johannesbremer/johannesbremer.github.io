import { get, set } from "idb-keyval";

const WAGE_STORAGE_KEY = "hourly-wage";

export function calculateTotalWage(
  totalHours: number,
  hourlyWage: number,
): number {
  return totalHours * hourlyWage;
}

export async function getWage(): Promise<number> {
  try {
    return (await get(WAGE_STORAGE_KEY)) || 0;
  } catch (error) {
    console.error("Failed to get wage:", error);
    return 0;
  }
}

export function parseDurationToHours(duration: string): number {
  const [hours, minutes] = duration.split(":").map(Number);
  return hours + minutes / 60;
}

export async function setWage(wage: number): Promise<void> {
  try {
    await set(WAGE_STORAGE_KEY, wage);
  } catch (error) {
    console.error("Failed to set wage:", error);
    throw new Error("Failed to save wage");
  }
}
