import { registreCommerceActivities } from "../shared/registre-commerce-activities";

export type StructuredActivityInput = {
  activity: string;
  activityKind: "" | "Agriculture" | "Artisanat" | "Auto-entrepreneur" | "Registre de commerce";
  autoEntrepreneurActivity: "" | "Micro-importation" | "Prestation de services";
  rcActivityCode: string;
};

export function canonicalActivityLabel(input: StructuredActivityInput) {
  if (input.activityKind === "Agriculture" || input.activityKind === "Artisanat") return input.activityKind;
  if (input.activityKind === "Auto-entrepreneur") return `Auto-entrepreneur — ${input.autoEntrepreneurActivity}`;
  if (input.activityKind === "Registre de commerce") return `Registre de commerce — ${registreCommerceActivities.find(activity => activity.code === input.rcActivityCode)?.label ?? input.rcActivityCode}`.slice(0, 220);
  return input.activity;
}
