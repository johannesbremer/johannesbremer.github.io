import OpenAI from "openai";

import type { Employee } from "./employees";
import type { TimesheetEntry } from "./timesheet";

export async function processTimesheetImage(
  apiKey: string,
  imageFile: File,
  employees: Employee[]
): Promise<{ detectedEmployee: null | string; entries: TimesheetEntry[] }> {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

  const prompt = `Du bist ein präzises OCR-System. Analysiere dieses Zeitnachweis-Bild und extrahiere NUR die ausgefüllten Datenzeilen.

Gib ein JSON-Objekt mit dieser exakten Struktur zurück:
{
  "entries": [
    {
      "date": "DD.MM.YY",
      "startTime": "HH:MM", 
      "endTime": "HH:MM"
    }
  ]
}

Regeln:
1. Extrahiere nur Zeilen mit tatsächlichen Zeiteinträgen (ignoriere leere Zeilen)
2. Konvertiere alle Daten ins Format DD.MM.YY
3. Konvertiere alle Uhrzeiten ins Format HH:MM (24-Stunden)
4. Gib NUR gültiges JSON zurück, keine Erklärungen
5. Falls du eine Zeit nicht klar lesen kannst, verwende "00:00" als Platzhalter`;

  try {
    const response = await openai.chat.completions.create({
      max_tokens: 1000,
      messages: [
        {
          content: [
            { text: prompt, type: "text" },
            {
              image_url: {
                detail: "high",
                url: `data:${imageFile.type};base64,${base64Image}`,
              },
              type: "image_url",
            },
          ],
          role: "user",
        },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const firstChoice = response.choices[0];
    const result = firstChoice?.message ? firstChoice.message.content : null;
    if (!result) {
      throw new Error("Keine Antwort von OpenAI");
    }

    const parsed: unknown = JSON.parse(result);
    if (!parsed || typeof parsed !== "object" || !("entries" in parsed)) {
      throw new Error("Ungültiges Antwortformat von OpenAI");
    }
    const entries = (parsed as { entries: unknown }).entries;
    if (!Array.isArray(entries)) {
      throw new TypeError("Ungültiges Antwortformat von OpenAI");
    }

    // Get employee identification
    const detectedEmployee = await identifyEmployee(
      openai,
      base64Image,
      imageFile.type,
      employees
    );

    return {
      detectedEmployee,
      entries: entries as TimesheetEntry[],
    };
  } catch (error) {
    console.error("OpenAI API Fehler:", error);
    throw new Error(
      `Fehler beim Verarbeiten des Bildes: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
    );
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = reader.result as string;
      const parts = result.split(",");
      const base64 = parts[1] ?? "";
      resolve(base64);
    });
    reader.addEventListener("error", () => {
      reject(new Error("Dateilesefehler"));
    });
    reader.readAsDataURL(file);
  });
}

async function identifyEmployee(
  openai: OpenAI,
  base64Image: string,
  imageType: string,
  employees: Employee[]
): Promise<null | string> {
  if (employees.length === 0) {
    return null;
  }

  const employeeList = employees.map((emp) => emp.name).join(", ");

  const prompt = `Schaue dir dieses Zeitnachweis-Bild an und identifiziere, welchem Mitarbeiter es gehört.

Verfügbare Mitarbeiter: ${employeeList}

Gib ein JSON-Objekt mit dieser exakten Struktur zurück:
{
  "employee": "exakter_mitarbeiter_name_aus_liste_oder_unknown"
}

Regeln:
1. Suche nach Namen, Unterschriften, Mitarbeiter-IDs oder anderen identifizierenden Texten
2. Gib den EXAKTEN Namen aus der Mitarbeiterliste zurück, falls du eine Übereinstimmung findest
3. Gib "unknown" zurück, falls du den Mitarbeiter nicht identifizieren kannst oder unsicher bist
4. Gib NUR gültiges JSON zurück, keine Erklärungen`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        max_tokens: 300,
        messages: [
          {
            content: [
              { text: prompt, type: "text" },
              {
                image_url: {
                  detail: "high",
                  url: `data:${imageType};base64,${base64Image}`,
                },
                type: "image_url",
              },
            ],
            role: "user",
          },
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" },
      });

      const firstChoice = response.choices[0];
      const result = firstChoice?.message ? firstChoice.message.content : null;
      if (!result) {
        throw new Error("Keine Antwort von OpenAI");
      }

      const parsed: unknown = JSON.parse(result);
      if (!parsed || typeof parsed !== "object" || !("employee" in parsed)) {
        throw new Error("Ungültige Mitarbeiter-Identifikationsantwort");
      }
      const employeeProp = (parsed as { employee: unknown }).employee;
      if (typeof employeeProp !== "string") {
        throw new TypeError("Ungültige Mitarbeiter-Identifikationsantwort");
      }

      const employeeName = employeeProp.toLowerCase();
      if (employeeName === "unknown") {
        return null;
      }

      // Find matching employee (case-insensitive)
      const matchedEmployee = employees.find(
        (emp) => emp.name.toLowerCase() === employeeName
      );
      return matchedEmployee ? matchedEmployee.name : null;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unbekannter Fehler");
      console.warn(
        `Mitarbeiter-Identifikationsversuch ${attempt} fehlgeschlagen:`,
        lastError.message
      );

      if (attempt === maxRetries) {
        console.error(
          "Alle Mitarbeiter-Identifikationsversuche fehlgeschlagen"
        );
        return null;
      }

      // Warten vor erneutem Versuch
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return null;
}
