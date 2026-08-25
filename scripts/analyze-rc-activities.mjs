import fs from "node:fs";
import path from "node:path";

const sourceDir = "/tmp/registre-commerce-csv";
const outputPath = "/tmp/registre-commerce-csv/activity-summary.json";
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith(".csv")).sort();

function parseActivity(line) {
  const match = line.match(/^(\d{6}),(.*)$/);
  return match ? { code: match[1], label: match[2].trim() } : null;
}

const sources = files.map(file => {
  const activities = fs.readFileSync(path.join(sourceDir, file), "utf8").split(/\r?\n/).map(parseActivity).filter(Boolean);
  const families = new Map();
  for (const activity of activities) {
    const family = activity.code.slice(0, 3);
    const list = families.get(family) ?? [];
    list.push(activity);
    families.set(family, list);
  }
  return {
    file,
    count: activities.length,
    firstCode: activities[0]?.code ?? null,
    lastCode: activities.at(-1)?.code ?? null,
    families: [...families.entries()].map(([code, entries]) => ({ code, count: entries.length, first: entries[0]?.label ?? "" })),
    activities,
  };
});

fs.writeFileSync(outputPath, JSON.stringify({ total: sources.reduce((sum, source) => sum + source.count, 0), sources }, null, 2));
console.log(JSON.stringify({ total: sources.reduce((sum, source) => sum + source.count, 0), sources: sources.map(source => ({ file: source.file, count: source.count, firstCode: source.firstCode, lastCode: source.lastCode, families: source.families })) }, null, 2));
