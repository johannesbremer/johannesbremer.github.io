import {
  CurrencyEurIcon as CurrencyEur,
  GearIcon as Gear,
  UsersIcon as Users,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { EmployeeManagementDialog } from "@/components/EmployeeManagementDialog";
import { ImageUpload } from "@/components/ImageUpload";
import { ResultsTable } from "@/components/ResultsTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WageDialog } from "@/components/WageDialog";
import { getApiKey, setApiKey } from "@/lib/api-key";
import { getEmployees } from "@/lib/employees";
import { processTimesheetImage } from "@/lib/openai";
import { processTimesheetEntries, type TimesheetEntry } from "@/lib/timesheet";
import { getWage } from "@/lib/wage";

// Group entries by employee
interface EmployeeData {
  employee: null | string;
  entries: TimesheetEntry[];
}

function App() {
  const [apiKey, setApiKeyState] = useState<null | string>(null);
  const [hourlyWage, setHourlyWageState] = useState<number>(0);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showWageDialog, setShowWageDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    void loadApiKey();
    void loadWage();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await getApiKey();
      setApiKeyState(key);
    } catch (error_) {
      console.error("Failed to load API key:", error_);
    }
  };

  const loadWage = async () => {
    try {
      const wage = await getWage();
      setHourlyWageState(wage);
    } catch (error_) {
      console.error("Failed to load wage:", error_);
    }
  };

  const handleSaveApiKey = async (key: string) => {
    await setApiKey(key);
    setApiKeyState(key);
    toast.success("API-Schlüssel erfolgreich gespeichert");
  };

  const handleWageUpdate = (wage: number) => {
    setHourlyWageState(wage);
  };

  const handleProcessImages = async () => {
    if (selectedImages.length === 0) {
      toast.error("Bitte wählen Sie mindestens ein Bild aus");
      return;
    }

    if (!apiKey) {
      toast.error("Bitte richten Sie zuerst Ihren OpenAI API-Schlüssel ein");
      setShowApiDialog(true);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setEmployeeData([]);

    try {
      const employees = await getEmployees();
      const employeeResults: EmployeeData[] = [];
      let processedCount = 0;

      for (const image of selectedImages) {
        try {
          const result = await processTimesheetImage(apiKey, image, employees);

          const processedEntries = processTimesheetEntries(result.entries);

          // Find existing employee data or create new one
          let employeeDataEntry = employeeResults.find(
            (data) =>
              data.employee === result.detectedEmployee ||
              (!data.employee && !result.detectedEmployee),
          );

          if (!employeeDataEntry) {
            employeeDataEntry = {
              employee: result.detectedEmployee,
              entries: [],
            };
            employeeResults.push(employeeDataEntry);
          }

          employeeDataEntry.entries.push(...processedEntries);
          processedCount++;

          toast.success(
            `${processedCount}/${selectedImages.length} Bilder verarbeitet`,
          );
        } catch (error_) {
          console.error(`Failed to process image ${image.name}:`, error_);
          toast.error(`Fehler beim Verarbeiten von ${image.name}`);
        }
      }

      setEmployeeData(employeeResults);

      const totalEntries = employeeResults.reduce(
        (sum, data) => sum + data.entries.length,
        0,
      );
      toast.success(
        `${processedCount} Bilder erfolgreich verarbeitet mit ${totalEntries} Einträgen insgesamt`,
      );
    } catch (error_) {
      const errorMessage =
        error_ instanceof Error
          ? error_.message
          : "Fehler beim Verarbeiten der Bilder";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateEmployeeEntries = (
    employeeIndex: number,
    entries: TimesheetEntry[],
  ) => {
    setEmployeeData((prev) =>
      prev.map((data, index) =>
        index === employeeIndex ? { ...data, entries } : data,
      ),
    );
  };

  const updateEmployeeName = (employeeIndex: number, employeeName: string) => {
    setEmployeeData((prev) =>
      prev.map((data, index) =>
        index === employeeIndex ? { ...data, employee: employeeName } : data,
      ),
    );
  };

  const needsApiKey = !apiKey;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Arbeitszeit OCR Verarbeitung
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Extrahiere Arbeitszeiten aus Zeitnachweis-Bildern mit KI-Vision
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Button
              onClick={() => {
                setShowApiDialog(true);
              }}
              variant="outline"
            >
              <Gear className="mr-2" size={16} />
              {apiKey
                ? "API-Schlüssel aktualisieren"
                : "API-Schlüssel einrichten"}
            </Button>
            <Button
              onClick={() => {
                setShowEmployeeDialog(true);
              }}
              variant="outline"
            >
              <Users className="mr-2" size={16} />
              Mitarbeiter verwalten
            </Button>
            <Button
              onClick={() => {
                setShowWageDialog(true);
              }}
              variant="outline"
            >
              <CurrencyEur className="mr-2" size={16} />
              Lohn: €{hourlyWage.toFixed(2)}/Std
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          {needsApiKey && (
            <Alert>
              <AlertDescription>
                Bitte richten Sie Ihren OpenAI API-Schlüssel ein, um mit der
                Verarbeitung von Zeitnachweis-Bildern zu beginnen.
              </AlertDescription>
            </Alert>
          )}

          <ImageUpload
            isProcessing={isProcessing}
            onImagesSelect={setSelectedImages}
            onProcess={() => {
              void handleProcessImages();
            }}
            selectedImages={selectedImages}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {employeeData.map((data, index) => (
            <ResultsTable
              employee={data.employee}
              entries={data.entries}
              hourlyWage={hourlyWage}
              key={index}
              onEmployeeUpdate={(employee) => {
                updateEmployeeName(index, employee);
              }}
              onEntriesUpdate={(entries) => {
                updateEmployeeEntries(index, entries);
              }}
            />
          ))}
        </div>

        <ApiKeyDialog
          onOpenChange={setShowApiDialog}
          onSave={handleSaveApiKey}
          open={showApiDialog}
        />

        <EmployeeManagementDialog
          onOpenChange={setShowEmployeeDialog}
          open={showEmployeeDialog}
        />

        <WageDialog
          onOpenChange={setShowWageDialog}
          onWageUpdate={handleWageUpdate}
          open={showWageDialog}
        />
      </div>
    </div>
  );
}

export default App;
