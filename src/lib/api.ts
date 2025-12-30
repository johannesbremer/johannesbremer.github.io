import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output, TypeValidationError } from "ai";
import { z } from "zod";

import type { Employee } from "./employees";
import type { TimesheetEntry } from "./timesheet";

// 1. ZOD SCHEMA DEFINITION
const timesheetEntrySchema = z.object({
  date: z.string().describe("Datum im DD.MM.YY Format"),
  endTime: z.string().describe("Endzeit im HH:MM Format (24h) oder 00:00"),
  startTime: z.string().describe("Startzeit im HH:MM Format (24h) oder 00:00"),
});

const imageResultSchema = z.object({
  employee: z
    .string()
    .nullable()
    .describe(
      "Der exakte Mitarbeitername aus der bereitgestellten Liste, oder null falls unbekannt",
    ),
  entries: z.array(timesheetEntrySchema),
});

const batchResultSchema = z.object({
  images: z.array(imageResultSchema),
});

export async function processTimesheetImages(
  apiKey: string,
  imageFiles: File[],
  employees: Employee[],
): Promise<{ detectedEmployee: null | string; entries: TimesheetEntry[] }[]> {
  if (imageFiles.length === 0) {
    return [];
  }

  const openai = createOpenAI({
    apiKey,
  });

  // Safe Buffer Conversion: Ensure no empty files pass through
  const imageBuffers = await Promise.all(
    imageFiles.map(async (file) => {
      const buffer = await file.arrayBuffer();
      if (buffer.byteLength === 0) {
        throw new Error(`Datei ${file.name} ist leer (0 bytes).`);
      }
      return buffer;
    }),
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
    const { output: object } = await generateText({
      model: openai("gpt-5.2"),

      // Deterministic output
      messages: [
        {
          content: [
            { text: prompt, type: "text" },
            ...imageBuffers.map((buffer) => ({
              image: buffer,
              type: "image" as const,
            })),
          ],
          role: "user",
        },
      ],

      output: Output.object({
        description: "Analyseergebnisse für mehrere Zeitnachweis-Bilder",
        name: "TimesheetBatchAnalysis",
        schema: batchResultSchema,
      }),
    });

    // Validate array length alignment
    if (object.images.length !== imageFiles.length) {
      throw new Error(
        `Ergebnis-Inkonsistenz: ${object.images.length} Ergebnisse für ${imageFiles.length} Bilder. Verarbeitung abgebrochen.`,
      );
    }

    // Map results safely
    return object.images.map((imageResult) => {
      let detectedEmployee: null | string = null;

      if (imageResult.employee) {
        const employeeName = imageResult.employee.toLowerCase();
        if (employeeName !== "unknown") {
          const matchedEmployee = employees.find(
            (emp) => emp.name.toLowerCase() === employeeName,
          );
          detectedEmployee = matchedEmployee ? matchedEmployee.name : null;
        }
      }

      // Explicit mapping ensures type safety between the Zod schema and your internal Types
      const entries: TimesheetEntry[] = imageResult.entries.map((entry) => ({
        date: entry.date,
        endTime: entry.endTime,
        startTime: entry.startTime,
      }));

      return {
        detectedEmployee,
        entries,
      };
    });
  } catch (error) {
    if (error instanceof TypeValidationError) {
      console.error(
        "Struktur-Validierungsfehler (KI Output ungültig):",
        error.value,
      );
      throw new Error(
        "Die KI konnte die Daten nicht im korrekten Format extrahieren. Bitte bessere Bildqualität sicherstellen.",
      );
    }

    console.error("Generischer Fehler bei der Bildverarbeitung:", error);
    throw new Error(
      `Fehler beim Verarbeiten der Bilder: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    );
  }
}
