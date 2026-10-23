import { describe, it, expect } from "vitest";
import { sanitizeCsvCell, generateSafeCsv } from "./csv";

describe("CSV Formula Injection Defense (CWE-1236)", () => {
  it("should prepend dangerous formula trigger characters with a single quote", () => {
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(sanitizeCsvCell("-2+3*cmd")).toBe("'-2+3*cmd");
    expect(sanitizeCsvCell("@SUM(1+1)")).toBe("'@SUM(1+1)");
    expect(sanitizeCsvCell("\tTAB_INJECT")).toBe("'\tTAB_INJECT");
    expect(sanitizeCsvCell("\rCR_INJECT")).toBe("'\rCR_INJECT");
  });

  it("should leave normal safe text untouched", () => {
    expect(sanitizeCsvCell("Town Square")).toBe("Town Square");
    expect(sanitizeCsvCell("CCTV Camera 12")).toBe("CCTV Camera 12");
    expect(sanitizeCsvCell("Zone 1")).toBe("Zone 1");
  });

  it("should escape commas and quotes according to RFC 4180", () => {
    expect(sanitizeCsvCell('Gate "A", Main Entrance')).toBe('"Gate ""A"", Main Entrance"');
  });

  it("should generate a complete safe CSV file buffer", () => {
    const headers = ["Ticket", "Priority", "Formula Test"];
    const rows = [
      ["TS-20261023-0001", "high", "=cmd|' /C calc'!A0"],
      ["TS-20261023-0002", "low", "Normal Location"],
    ];
    const csv = generateSafeCsv(headers, rows);
    expect(csv).toContain("Ticket,Priority,Formula Test");
    expect(csv).toContain("TS-20261023-0001,high,'=cmd|' /C calc'!A0");
    expect(csv).toContain("TS-20261023-0002,low,Normal Location");
  });
});
