import { describe, expect, it } from "vitest";
import { z } from "zod";

// Test the Zod schema structure used in openai.ts
describe("processTimesheetImages schema", () => {
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

  it("should validate a valid batch result with multiple images", () => {
    const validData = {
      images: [
        {
          employee: "John Doe",
          entries: [
            { date: "01.01.24", endTime: "17:00", startTime: "09:00" },
            { date: "02.01.24", endTime: "18:00", startTime: "10:00" },
          ],
        },
        {
          employee: null,
          entries: [{ date: "03.01.24", endTime: "16:00", startTime: "08:00" }],
        },
      ],
    };

    const result = batchResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toHaveLength(2);
      expect(result.data.images[0]?.employee).toBe("John Doe");
      expect(result.data.images[1]?.employee).toBeNull();
    }
  });

  it("should reject invalid batch result missing required fields", () => {
    const invalidData = {
      images: [
        {
          employee: "John Doe",
          entries: [
            { date: "01.01.24", startTime: "09:00" }, // missing endTime
          ],
        },
      ],
    };

    const result = batchResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should handle empty entries array", () => {
    const validData = {
      images: [
        {
          employee: "Jane Smith",
          entries: [],
        },
      ],
    };

    const result = batchResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images[0]?.entries).toHaveLength(0);
    }
  });

  it("should validate batch result with multiple images and various employee states", () => {
    const validData = {
      images: [
        {
          employee: "Bob Smith",
          entries: [
            { date: "10.04.24", endTime: "17:00", startTime: "09:00" },
            { date: "11.04.24", endTime: "17:30", startTime: "09:30" },
          ],
        },
        {
          employee: "Carol White",
          entries: [
            { date: "10.04.24", endTime: "16:00", startTime: "08:00" },
          ],
        },
        {
          employee: null,
          entries: [
            { date: "12.04.24", endTime: "15:00", startTime: "07:00" },
          ],
        },
      ],
    };

    const result = batchResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toHaveLength(3);
      expect(result.data.images[0]?.employee).toBe("Bob Smith");
      expect(result.data.images[0]?.entries).toHaveLength(2);
      expect(result.data.images[1]?.employee).toBe("Carol White");
      expect(result.data.images[1]?.entries).toHaveLength(1);
      expect(result.data.images[2]?.employee).toBeNull();
      expect(result.data.images[2]?.entries).toHaveLength(1);
    }
  });

  it("should accept timesheet entries with correct format", () => {
    const validEntry = {
      date: "25.12.24",
      endTime: "18:45",
      startTime: "08:15",
    };

    const result = timesheetEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("should validate image result schema", () => {
    const validImageResult = {
      employee: "Alice Johnson",
      entries: [
        { date: "15.03.24", endTime: "16:30", startTime: "08:30" },
        { date: "16.03.24", endTime: "17:00", startTime: "09:00" },
      ],
    };

    const result = imageResultSchema.safeParse(validImageResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employee).toBe("Alice Johnson");
      expect(result.data.entries).toHaveLength(2);
    }
  });

  it("should allow null employee in image result", () => {
    const validImageResult = {
      employee: null,
      entries: [
        { date: "20.05.24", endTime: "14:00", startTime: "06:00" },
      ],
    };

    const result = imageResultSchema.safeParse(validImageResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employee).toBeNull();
    }
  });
});

