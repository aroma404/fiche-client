import * as XLSXStyle from "xlsx-js-style";
import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createIndividualExcelArchives } from "./excel-archive";

describe("feuille Accueil Excel", () => {
  it("aligne les informations d’archive et place les raccourcis de navigation à droite", async () => {
    const [archive] = await createIndividualExcelArchives({
      schemaVersion: 1,
      exportedAt: "2026-08-25T12:31:27.000Z",
      clients: [{ client: { fullName: "Dossier de vérification", cnasAffiliated: true, casnosAffiliated: false }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] }],
    });
    const bytes = await archive.blob.arrayBuffer();
    if (process.env.RENDER_ACCUEIL_XLSX) await writeFile(process.env.RENDER_ACCUEIL_XLSX, Buffer.from(bytes));
    const workbook = XLSXStyle.read(bytes, { type: "array" });
    const accueil = workbook.Sheets.Accueil;
    const merges = (accueil["!merges"] ?? []).map(merge => XLSXStyle.utils.encode_range(merge));

    expect(merges).toEqual(expect.arrayContaining(["A5:E5", "G5:J5", "A6:B6", "C6:E6", "G6:J6"]));
    expect(accueil.A5.v).toBe("INFORMATIONS D’ARCHIVE");
    expect(accueil.G5.v).toBe("NAVIGATION RAPIDE");
    expect(accueil.A6.v).toBe("Date de préparation");
    expect(accueil.C6.v).toContain("25/08/2026");
    expect(accueil.G6.l?.Target).toBe("#'Fiche 1'!A1");
    expect(accueil["!ref"]).toBe("A1:J10");
    const clientsSheet = workbook.Sheets.Clients;
    expect(clientsSheet.U5.v).toBe("Oui");
    expect(clientsSheet.V5.v).toBe("Non");
    expect(clientsSheet.W5.v).toBe("Non");
    const { BlobReader, TextWriter, ZipReader } = await import("@zip.js/zip.js");
    const zip = new ZipReader(new BlobReader(archive.blob));
    const sheet = (await zip.getEntries()).find(entry => entry.filename === "xl/worksheets/sheet1.xml");
    const sheetXml = await (sheet as unknown as { getData: (writer: InstanceType<typeof TextWriter>) => Promise<string> } | undefined)?.getData(new TextWriter());
    await zip.close();
    expect(sheetXml).toContain('orientation="landscape"');
    expect(sheetXml).toContain('fitToWidth="1"');
    expect(sheetXml).toContain('fitToHeight="1"');
  });
});
