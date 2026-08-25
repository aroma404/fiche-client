import fs from "node:fs";

const sourcePath = "/tmp/registre-commerce-csv/activity-summary.json";
const outputPath = "/home/ubuntu/fiche-client-impot/shared/registre-commerce-activities.ts";
const summary = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const activities = summary.sources.flatMap(source => source.activities).map(({ code, label }) => ({ code, label: label.replace(/^"|"$/g, "") })).sort((a, b) => a.code.localeCompare(b.code));
const families = [...new Set(activities.map(activity => activity.code.slice(0, 3)))].map(code => ({ code, label: `Catégorie ${code}`, activityCount: activities.filter(activity => activity.code.startsWith(code)).length }));
const contents = `/** Nomenclature importée exclusivement depuis les fichiers Excel fournis par l’utilisateur. */\nexport type RegistreCommerceActivity = { code: string; label: string };\n\nexport const registreCommerceFamilies = ${JSON.stringify(families, null, 2)} as const;\n\nexport const registreCommerceActivities: readonly RegistreCommerceActivity[] = ${JSON.stringify(activities, null, 2)} as const;\n\nexport function activitiesForRegistreCommerceFamily(familyCode: string) {\n  return registreCommerceActivities.filter(activity => activity.code.startsWith(familyCode));\n}\n\nexport function isRegistreCommerceActivity(familyCode: string, activityCode: string) {\n  return activityCode.startsWith(familyCode) && registreCommerceActivities.some(activity => activity.code === activityCode);\n}\n`;
fs.writeFileSync(outputPath, contents);
console.log(JSON.stringify({ activities: activities.length, families: families.length, outputPath }, null, 2));
