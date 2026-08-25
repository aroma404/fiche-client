import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { describe, expect, it } from "vitest";
import { createProtectedZip } from "./secure-archive";

describe("archive ZIP protégée", () => {
  it("chiffre le contenu avec le mot de passe fourni", async () => {
    const archive = await createProtectedZip(new Blob(["dossier confidentiel"], { type: "text/plain" }), "fiche.txt", "MotDePasse!2026");
    const reader = new ZipReader(new BlobReader(archive));
    const [entry] = await reader.getEntries();
    expect(entry?.filename).toBe("fiche.txt");
    await expect(entry?.getData(new TextWriter(), { password: "mot-invalide" })).rejects.toBeDefined();
    await expect(entry?.getData(new TextWriter(), { password: "MotDePasse!2026" })).resolves.toBe("dossier confidentiel");
    await reader.close();
  });
});
