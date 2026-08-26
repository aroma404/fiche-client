import { describe, expect, it } from "vitest";
import { accountOptionKinds, getProgramReference, programReferenceRegistry } from "../shared/reference-registry";

describe("registre central des références", () => {
  it("déclare les listes administrables liées au compte", () => {
    expect(accountOptionKinds).toEqual(expect.arrayContaining(["legalForm", "clientType", "regime", "contactType", "vaultCategory"]));
    expect(getProgramReference("contactType")).toMatchObject({ mode: "administrable", scope: "compte", optionKind: "contactType" });
    expect(getProgramReference("vaultCategory")).toMatchObject({ mode: "administrable", scope: "compte", optionKind: "vaultCategory" });
  });

  it("protège le catalogue Registre de commerce fourni", () => {
    expect(getProgramReference("registreCommerce")).toMatchObject({ source: "catalogue-rc-excel", mode: "lecture-seule", scope: "système" });
    expect(programReferenceRegistry.some(reference => reference.id === "registreCommerce")).toBe(true);
  });
});
