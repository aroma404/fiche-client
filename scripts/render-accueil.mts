import { writeFile } from "node:fs/promises";
import { createIndividualExcelArchives } from "../client/src/features/transfers/excel-archive";

const archive = createIndividualExcelArchives({
  schemaVersion: 1,
  exportedAt: "2026-08-25T12:31:27.000Z",
  clients: [{
    client: { fullName: "Dossier de vérification" },
    documents: [],
    compliance: [],
    cases: [],
    payments: [],
    cashEntries: [],
  }],
});

const output = "/tmp/fiche-accueil-verification.xlsx";
await writeFile(output, Buffer.from(await archive[0].blob.arrayBuffer()));
console.log(output);
