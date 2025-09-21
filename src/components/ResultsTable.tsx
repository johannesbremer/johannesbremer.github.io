import {
  ArrowSquareOutIcon as ArrowSquareOut,
  CheckIcon as Check,
  DownloadIcon as Download,
  PencilSimpleIcon as PencilSimple,
  XIcon as X,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateDuration, type TimesheetEntry } from "@/lib/timesheet";
import { parseDurationToHours } from "@/lib/wage";

interface ResultsTableProps {
  employee?: null | string;
  entries: TimesheetEntry[];
  hourlyWage?: number;
  onEmployeeUpdate?: (employee: string) => void;
  onEntriesUpdate: (entries: TimesheetEntry[]) => void;
  sourceLabel?: string | undefined;
}

export function ResultsTable({
  employee,
  entries,
  hourlyWage = 0,
  onEmployeeUpdate,
  onEntriesUpdate,
  sourceLabel,
}: ResultsTableProps) {
  const [editingRow, setEditingRow] = useState<null | number>(null);
  const [editData, setEditData] = useState<null | TimesheetEntry>(null);
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [employeeValue, setEmployeeValue] = useState(employee || "");

  const startEdit = (index: number) => {
    setEditingRow(index);
    setEditData({ ...entries[index] } as TimesheetEntry);
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (editingRow !== null && editData) {
      const updatedEntry = {
        ...editData,
        duration: calculateDuration(editData.startTime, editData.endTime),
      };

      const newEntries = [...entries];
      newEntries[editingRow] = updatedEntry;
      onEntriesUpdate(newEntries);

      setEditingRow(null);
      setEditData(null);
    }
  };

  const saveEmployeeEdit = () => {
    if (onEmployeeUpdate) {
      onEmployeeUpdate(employeeValue);
    }
    setEditingEmployee(false);
  };

  const cancelEmployeeEdit = () => {
    setEmployeeValue(employee || "");
    setEditingEmployee(false);
  };

  const exportToCSV = () => {
    const headers = ["Datum", "Startzeit", "Endzeit", "Dauer", "Mitarbeiter"];
    const csvContent = [
      headers.join(","),
      ...entries.map((entry) =>
        [
          entry.date,
          entry.startTime,
          entry.endTime,
          entry.duration || "",
          employee || "",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arbeitszeit-${employee || "unbekannt"}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    // Recalculate totals locally to avoid any closure/ordering issues
    let localTotalHours = 0;
    for (const entry of entries) {
      if (entry.duration) {
        localTotalHours += parseDurationToHours(entry.duration);
      }
    }
    const localTotalWage = localTotalHours * hourlyWage;

    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arbeitszeit-Daten - ${employee || "Unbekannt"}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #334155;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 10px;
            color: #1e293b;
        }
        .metadata {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .metadata-item {
            background: #f1f5f9;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
        }
        .metadata-item.primary {
            background: #dbeafe;
            color: #1e40af;
        }
        .metadata-item.accent {
            background: #fef3c7;
            color: #92400e;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        td {
            color: #334155;
        }
        .duration {
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-weight: 500;
        }
        .print-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            margin-top: 20px;
        }
        .print-button:hover {
            background: #2563eb;
        }
        @media print {
            .print-button { display: none; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Arbeitszeit-Daten</h1>
            <div class="metadata">
                <div class="metadata-item primary">
                    <strong>Mitarbeiter:</strong> ${employee || "Unbekannt"}
                </div>
                <div class="metadata-item">
                    <strong>Gesamt:</strong> ${Math.floor(localTotalHours)}:${((localTotalHours % 1) * 60).toFixed(0).padStart(2, "0")} Stunden
                </div>
                ${
                  hourlyWage > 0
                    ? `
                <div class="metadata-item">
                    <strong>Stundenlohn:</strong> €${hourlyWage.toFixed(2)}
                </div>
                <div class="metadata-item accent">
                    <strong>Gesamtlohn:</strong> €${localTotalWage.toFixed(2)}
                </div>
                `
                    : ""
                }
                <div class="metadata-item">
                    <strong>Exportiert am:</strong> ${new Date().toLocaleDateString(
                      "de-DE",
                      {
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      },
                    )}
                </div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Startzeit</th>
                    <th>Endzeit</th>
                    <th>Dauer</th>
                </tr>
            </thead>
            <tbody>
                ${entries
                  .map(
                    (entry) => `
                    <tr>
                        <td>${entry.date}</td>
                        <td>${entry.startTime}</td>
                        <td>${entry.endTime}</td>
                        <td class="duration">${entry.duration || ""}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        
        <button class="print-button" onclick="window.print()">
            Seite drucken
        </button>
    </div>
</body>
</html>`;

    // Prefer Blob URL to avoid DOM writing quirks; no deprecated APIs
    try {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (win) {
        // Revoke after a short delay to ensure the browser has loaded the content
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 10000);
      } else {
        // If popups are blocked, clean up and inform via console.
        URL.revokeObjectURL(url);
        console.warn(
          "Popup was blocked. Please allow popups for this site to open the export in a new tab.",
        );
      }
    } catch (error) {
      console.error("Failed to open export tab:", error);
    }
  };

  let totalHours = 0;
  for (const entry of entries) {
    if (entry.duration) {
      totalHours += parseDurationToHours(entry.duration);
    }
  }

  const totalWage = totalHours * hourlyWage;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Extrahierte Arbeitszeit-Daten</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">
              Gesamt: {Math.floor(totalHours)}:
              {((totalHours % 1) * 60).toFixed(0).padStart(2, "0")} Stunden
            </Badge>
            {hourlyWage > 0 && (
              <Badge variant="outline">Lohn: €{totalWage.toFixed(2)}</Badge>
            )}
            {sourceLabel && (
              <Badge title={sourceLabel} variant="outline">
                {sourceLabel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Mitarbeiter:
              </span>
              {editingEmployee ? (
                <div className="flex items-center gap-1">
                  <Input
                    className="w-32 h-6 text-sm"
                    onChange={(e) => {
                      setEmployeeValue(e.target.value);
                    }}
                    placeholder="Name eingeben..."
                    value={employeeValue}
                  />
                  <Button
                    className="h-6 w-6 p-0"
                    onClick={saveEmployeeEdit}
                    size="sm"
                    variant="ghost"
                  >
                    <Check size={12} />
                  </Button>
                  <Button
                    className="h-6 w-6 p-0"
                    onClick={cancelEmployeeEdit}
                    size="sm"
                    variant="ghost"
                  >
                    <X size={12} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <strong
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingEmployee(true);
                      setEmployeeValue(employee || "");
                    }}
                  >
                    {employee || "Unbekannt"}
                  </strong>
                  <Button
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setEditingEmployee(true);
                      setEmployeeValue(employee || "");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <PencilSimple size={12} />
                  </Button>
                </div>
              )}
            </div>
            <Button onClick={exportToCSV} size="sm" variant="outline">
              <Download className="mr-2" size={16} />
              CSV exportieren
            </Button>
            <Button onClick={openInNewTab} size="sm" variant="outline">
              <ArrowSquareOut className="mr-2" size={16} />
              In neuem Tab öffnen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-muted-foreground">
            Keine Einträge erkannt. Überprüfen Sie das Bild oder passen Sie den
            Mitarbeiter oben an.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Startzeit</TableHead>
                  <TableHead>Endzeit</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          className="w-24"
                          onChange={(e) => {
                            setEditData((prev) =>
                              prev ? { ...prev, date: e.target.value } : null,
                            );
                          }}
                          value={editData?.date || ""}
                        />
                      ) : (
                        entry.date
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          className="w-20"
                          onChange={(e) => {
                            setEditData((prev) =>
                              prev
                                ? { ...prev, startTime: e.target.value }
                                : null,
                            );
                          }}
                          value={editData?.startTime || ""}
                        />
                      ) : (
                        entry.startTime
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          className="w-20"
                          onChange={(e) => {
                            setEditData((prev) =>
                              prev
                                ? { ...prev, endTime: e.target.value }
                                : null,
                            );
                          }}
                          value={editData?.endTime || ""}
                        />
                      ) : (
                        entry.endTime
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {editingRow === index && editData
                        ? calculateDuration(
                            editData.startTime,
                            editData.endTime,
                          )
                        : entry.duration}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <div className="flex gap-1">
                          <Button onClick={saveEdit} size="sm" variant="ghost">
                            <Check size={16} />
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            size="sm"
                            variant="ghost"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            startEdit(index);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <PencilSimple size={16} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
