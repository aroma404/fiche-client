import { chromium } from "playwright";

const baseUrl = process.env.MEASURE_BASE_URL ?? "http://127.0.0.1:3000";
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `mesure-login-${stamp}@invalid.example`;
const password = "MesureTechnique!2026";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const postLoginCalls = [];
let recordPrivateCalls = false;

page.on("request", request => {
  if (recordPrivateCalls && request.url().includes("/api/trpc/")) postLoginCalls.push(new URL(request.url()).pathname + new URL(request.url()).search);
});

try {
  await page.goto(`${baseUrl}/creer-un-compte`, { waitUntil: "networkidle" });
  await page.getByLabel("Nom complet").fill("Mesure technique");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByLabel("J’accepte la convention d’utilisation et de confidentialité.").check();
  await Promise.all([
    page.waitForURL("**/dashboard"),
    page.getByRole("button", { name: "Créer mon compte" }).click(),
  ]);

  await page.goto(`${baseUrl}/mon-compte`, { waitUntil: "networkidle" });
  await Promise.all([
    page.waitForURL(`${baseUrl}/`),
    page.getByRole("button", { name: "Se déconnecter" }).click(),
  ]);

  await page.goto(`${baseUrl}/connexion`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  recordPrivateCalls = true;
  const startedAt = performance.now();
  await Promise.all([
    page.waitForURL("**/dashboard"),
    page.getByRole("button", { name: "Se connecter" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  const firstDashboardMs = Math.round(performance.now() - startedAt);
  const dashboardMeasureMs = await page.evaluate(() => Math.round(performance.getEntriesByName("fiche:first-dashboard-after-auth").at(-1)?.duration ?? -1));
  const privateCalls = [...new Set(postLoginCalls.map(url => url.replace(/\?.*$/, "")))];

  console.log(JSON.stringify({ firstDashboardMs, dashboardMeasureMs, privateCalls, privateCallCount: privateCalls.length }));

  await page.goto(`${baseUrl}/mon-compte`, { waitUntil: "networkidle" });
  const deletion = page.locator("section").filter({ hasText: "Supprimer définitivement le compte" });
  await deletion.getByLabel("Mot de passe actuel").fill(password);
  await deletion.getByLabel("Tapez SUPPRIMER pour confirmer").fill("SUPPRIMER");
  await Promise.all([
    page.waitForURL(`${baseUrl}/`),
    deletion.getByRole("button", { name: "Supprimer le compte" }).click(),
  ]);
} finally {
  await browser.close();
}
