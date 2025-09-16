import {
  CloudArrowUpIcon as CloudArrowUp,
  XIcon as X,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  isProcessing: boolean;
  onImagesSelect: (files: File[]) => void;
  onProcess: () => void;
  selectedImages: File[];
}

export function ImageUpload({
  isProcessing,
  onImagesSelect,
  onProcess,
  selectedImages,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = [...e.dataTransfer.files].filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        onImagesSelect([...selectedImages, ...files]);
      }
    },
    [onImagesSelect, selectedImages],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const imageFiles = [...files].filter((file) =>
          file.type.startsWith("image/"),
        );
        onImagesSelect([...selectedImages, ...imageFiles]);
      }
    },
    [onImagesSelect, selectedImages],
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = selectedImages.filter((_, i) => i !== index);
      onImagesSelect(newImages);
    },
    [onImagesSelect, selectedImages],
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-border",
            selectedImages.length > 0
              ? "border-solid border-primary bg-primary/5"
              : "",
          )}
          onDragLeave={() => {
            setIsDragOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDrop={handleDrop}
        >
          {selectedImages.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedImages.map((image, index) => {
                  const objectUrl = URL.createObjectURL(image);
                  return (
                    <div className="relative" key={index}>
                      <img
                        alt={`Timesheet ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm"
                        onLoad={() => {
                          URL.revokeObjectURL(objectUrl);
                        }}
                        src={objectUrl}
                      />
                      <Button
                        className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                        onClick={() => {
                          removeImage(index);
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedImages.length} Bild
                {selectedImages.length === 1 ? "" : "er"} ausgewählt
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <CloudArrowUp
                className="mx-auto text-muted-foreground"
                size={48}
              />
              <div>
                <p className="text-lg font-medium">
                  Zeitnachweis-Bilder hier ablegen
                </p>
                <p className="text-sm text-muted-foreground">
                  oder klicken zum Durchsuchen (Mehrfachauswahl möglich)
                </p>
              </div>
              <input
                accept="image/*"
                className="hidden"
                id="file-input"
                multiple
                onChange={handleFileInput}
                type="file"
              />
              <Button asChild variant="outline">
                <label className="cursor-pointer" htmlFor="file-input">
                  Dateien auswählen
                </label>
              </Button>
            </div>
          )}
        </div>

        {selectedImages.length > 0 && (
          <Button
            className="w-full"
            disabled={isProcessing}
            onClick={onProcess}
            size="lg"
          >
            {isProcessing
              ? "Verarbeitung läuft..."
              : `Daten aus ${selectedImages.length} Bild${selectedImages.length === 1 ? "" : "ern"} extrahieren`}
          </Button>
        )}
      </div>
    </Card>
  );
}
