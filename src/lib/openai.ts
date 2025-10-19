import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import type { Employee } from "./employees";
import type { TimesheetEntry } from "./timesheet";

// Zod schema for timesheet entries
const timesheetEntrySchema = z.object({
  date: z.string(),
  endTime: z.string(),
  startTime: z.string(),
});

// Zod schema for a single image result
const imageResultSchema = z.object({
  employee: z.string().nullable(),
  entries: z.array(timesheetEntrySchema),
});

// Zod schema for batch processing results
const batchResultSchema = z.object({
  images: z.array(imageResultSchema),
});

export async function processTimesheetImages(
  apiKey: string,
  imageFiles: File[],
  employees: Employee[],
): Promise<{ detectedEmployee: null | string; entries: TimesheetEntry[] }[]> {
  const openai = createOpenAI({
    apiKey,
    compatibility: "strict",
  });

  // Convert all images to base64
  const base64Images = await Promise.all(
    imageFiles.map((file) => fileToBase64(file)),
  );

  const employeeList =
    employees.length > 0
      ? employees.map((emp) => emp.name).join(", ")
      : "keine Mitarbeiterliste verfügbar";

  const exclusionHint =
    employees.length === imageFiles.length && employees.length > 2
      ? `- WICHTIG: Wenn du nur ${employees.length - 1} von ${imageFiles.length} Mitarbeitern klar identifizieren kannst, nutze Ausschlussverfahren für das letzte Bild`
      : "";

  const prompt = `Du bist ein präzises OCR-System. Analysiere ALLE ${imageFiles.length} Zeitnachweis-Bilder und extrahiere die Daten.

Verfügbare Mitarbeiter: ${employeeList}

Für JEDES Bild:
1. Identifiziere den Mitarbeiter (Name, Unterschrift, Mitarbeiter-ID)
   - Gib den EXAKTEN Namen aus der Mitarbeiterliste zurück, falls vorhanden
   - Gib null zurück, falls nicht identifizierbar
   ${exclusionHint}
2. Extrahiere NUR ausgefüllte Zeiteinträge (ignoriere leere Zeilen)
3. Konvertiere Daten zu DD.MM.YY Format
4. Konvertiere Zeiten zu HH:MM Format (24-Stunden)
5. Verwende "00:00" als Platzhalter für unleserliche Zeiten

Gib die Ergebnisse für alle ${imageFiles.length} Bilder in der GLEICHEN Reihenfolge zurück wie sie präsentiert wurden.`;

  try {
    const { object } = await generateObject({
      messages: [
        {
          content: [
            { text: prompt, type: "text" },
            ...imageFiles.map((file, index) => ({
              image: base64Images[index] ?? "",
              type: "image" as const,
            })),
          ],
          role: "user",
        },
      ],
      model: openai("gpt-4o"),
      schema: batchResultSchema,
      schemaDescription: "Analysis results for multiple timesheet images",
      schemaName: "TimesheetBatchAnalysis",
    });

    // Process and match employees
    return object.images.map((imageResult) => {
      let detectedEmployee: null | string = null;

      if (imageResult.employee) {
        const employeeName = imageResult.employee.toLowerCase();
        if (employeeName !== "unknown") {
          // Find matching employee (case-insensitive)
          const matchedEmployee = employees.find(
            (emp) => emp.name.toLowerCase() === employeeName,
          );
          detectedEmployee = matchedEmployee ? matchedEmployee.name : null;
        }
      }

      return {
        detectedEmployee,
        entries: imageResult.entries as TimesheetEntry[],
      };
    });
  } catch (error) {
    console.error("AI API Fehler:", error);
    throw new Error(
      `Fehler beim Verarbeiten der Bilder: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    );
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = reader.result as string;
      resolve(result);
    });
    reader.addEventListener("error", () => {
      reject(new Error("Dateilesefehler"));
    });
    reader.readAsDataURL(file);
  });
}
