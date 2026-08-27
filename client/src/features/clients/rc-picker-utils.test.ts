import { describe, expect, it } from "vitest";
import { chooseRcListboxSide, filterRcPickerEntries } from "./rc-picker-utils";

describe("sélecteurs Registre de commerce", () => {
  const entries = [{ code: "101", label: "Catégorie commerce" }, { code: "201", label: "Services" }, { code: "301", label: "Industrie" }];

  it("retrouve une catégorie à partir de son code saisi au clavier", () => {
    expect(filterRcPickerEntries(entries, "101", 20)).toEqual([{ code: "101", label: "Catégorie commerce" }]);
  });

  it("ouvre la liste au-dessus du champ quand l’espace inférieur est insuffisant", () => {
    expect(chooseRcListboxSide({ anchorTop: 510, anchorBottom: 554, viewportHeight: 620, desiredHeight: 260 })).toBe("top");
    expect(chooseRcListboxSide({ anchorTop: 140, anchorBottom: 184, viewportHeight: 760, desiredHeight: 260 })).toBe("bottom");
  });
});
