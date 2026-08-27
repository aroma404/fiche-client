export type StructuredActivityInput = {
  activity: string;
  activityKind: "" | "Agriculture" | "Artisanat" | "Auto-entrepreneur" | "Registre de commerce";
  autoEntrepreneurActivity: "" | "Micro-importation" | "Prestation de services";
  rcActivityCode: string;
};

export function canonicalActivityLabel(input: StructuredActivityInput, rcActivityLabel?: string) {
  if (input.activityKind === "Agriculture" || input.activityKind === "Artisanat") return input.activityKind;
  if (input.activityKind === "Auto-entrepreneur") return `Auto-entrepreneur — ${input.autoEntrepreneurActivity}`;
  if (input.activityKind === "Registre de commerce") return `Registre de commerce — ${rcActivityLabel ?? input.rcActivityCode}`.slice(0, 220);
  return input.activity;
}
