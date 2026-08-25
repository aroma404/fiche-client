import asyncio
import json
import os
import secrets
import time

from playwright.async_api import Page, async_playwright


BASE_URL = os.environ.get("MEASURE_BASE_URL", "http://127.0.0.1:3000")
EMAIL = f"mesure-login-{int(time.time() * 1000)}-{secrets.token_hex(3)}@invalid.example"
PASSWORD = "MesureTechnique!2026"


async def authenticate_for_cleanup(page: Page) -> None:
    if page.url.endswith("/dashboard"):
        return
    await page.goto(f"{BASE_URL}/connexion", wait_until="networkidle")
    await page.get_by_label("E-mail").fill(EMAIL)
    await page.get_by_label("Mot de passe").fill(PASSWORD)
    await asyncio.gather(
        page.wait_for_url("**/dashboard"),
        page.get_by_role("button", name="Se connecter").click(),
    )


async def delete_technical_account(page: Page) -> None:
    await authenticate_for_cleanup(page)
    await page.goto(f"{BASE_URL}/compte", wait_until="networkidle")
    deletion = page.locator("section").filter(has_text="Supprimer définitivement le compte")
    await deletion.get_by_label("Mot de passe actuel").fill(PASSWORD)
    await deletion.get_by_label("Tapez SUPPRIMER pour confirmer").fill("SUPPRIMER")
    await asyncio.gather(
        page.wait_for_url(f"{BASE_URL}/"),
        deletion.get_by_role("button", name="Supprimer le compte").click(),
    )


async def start_fallback_observer(page: Page) -> None:
    await page.evaluate(
        """() => {
          window.__ficheFallbackSeen = false;
          window.__ficheFallbackObserver?.disconnect();
          window.__ficheFallbackObserver = new MutationObserver(() => {
            if (document.body.innerText.includes('Ouverture de votre espace…')) window.__ficheFallbackSeen = true;
          });
          window.__ficheFallbackObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
        }"""
    )


async def reload_with_boot_shell(page: Page, heading: str) -> dict:
    await page.reload(wait_until="commit")
    boot_shell_seen = await page.locator("#app-boot-shell").is_visible(timeout=1000)
    await page.wait_for_load_state("networkidle")
    await page.get_by_role("heading", name=heading).wait_for(timeout=5000)
    return {"bootShellSeen": boot_shell_seen, "finalHeading": heading}


async def main() -> None:
    account_created = False
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox"]
        )
        page = await browser.new_page()
        private_calls: list[str] = []
        reload_errors: list[str] = []
        record_private_calls = False
        login_started_at: float | None = None
        session_started_at: float | None = None
        login_response_ms: int | None = None
        session_response_ms: int | None = None

        def record_request(request) -> None:
            if record_private_calls and "/api/trpc/" in request.url:
                private_calls.append(request.url.split("?")[0])

        page.on("request", record_request)
        page.on("console", lambda message: reload_errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: reload_errors.append(str(error)))

        def record_response(response) -> None:
            nonlocal login_response_ms, session_response_ms
            url = response.url
            if "account.login" in url and login_started_at is not None and login_response_ms is None:
                login_response_ms = round((time.perf_counter() - login_started_at) * 1000)
            if "account.me" in url and session_started_at is not None and session_response_ms is None:
                session_response_ms = round((time.perf_counter() - session_started_at) * 1000)

        page.on("response", record_response)
        try:
            await page.goto(f"{BASE_URL}/creer-un-compte", wait_until="networkidle")
            await page.get_by_label("Nom complet").fill("Mesure technique")
            await page.get_by_label("E-mail").fill(EMAIL)
            await page.get_by_label("Mot de passe").fill(PASSWORD)
            await page.get_by_label("J’accepte la convention d’utilisation et de confidentialité.").check()
            await asyncio.gather(
                page.wait_for_url("**/dashboard"),
                page.get_by_role("button", name="Créer mon compte").click(),
            )
            account_created = True

            await page.goto(f"{BASE_URL}/compte", wait_until="networkidle")
            await asyncio.gather(
                page.wait_for_url(f"{BASE_URL}/"),
                page.get_by_role("button", name="Se déconnecter").click(),
            )

            await page.goto(f"{BASE_URL}/connexion", wait_until="networkidle")
            await page.get_by_label("E-mail").fill(EMAIL)
            await page.get_by_label("Mot de passe").fill(PASSWORD)
            record_private_calls = True
            started_at = time.perf_counter()
            login_started_at = started_at
            await asyncio.gather(
                page.wait_for_url("**/dashboard"),
                page.get_by_role("button", name="Se connecter").click(),
            )
            if os.environ.get("MEASURE_DASHBOARD_MARK") == "1":
                await page.wait_for_function(
                    "() => performance.getEntriesByName('fiche:first-dashboard-after-auth').length > 0",
                    timeout=5000,
                )
            else:
                await page.get_by_role("heading", name="Tableau de bord").wait_for(timeout=5000)
            first_dashboard_ms = round((time.perf_counter() - started_at) * 1000)
            dashboard_measure_ms = -1
            if os.environ.get("MEASURE_DASHBOARD_MARK") == "1":
                dashboard_measure_ms = await page.evaluate(
                    "() => Math.round(performance.getEntriesByName('fiche:first-dashboard-after-auth').at(-1)?.duration ?? -1)"
                )
            session_started_at = time.perf_counter()
            dashboard_surface = await reload_with_boot_shell(page, "Tableau de bord")
            dashboard_reload_url = page.url
            await page.wait_for_timeout(1300)
            await start_fallback_observer(page)
            clients_started_at = time.perf_counter()
            await asyncio.gather(
                page.wait_for_url("**/clients"),
                page.locator('aside nav a[href="/clients"]').click(),
            )
            await page.get_by_role("heading", name="Dossiers clients").wait_for(timeout=5000)
            clients_navigation_ms = round((time.perf_counter() - clients_started_at) * 1000)
            clients_fallback_seen = await page.evaluate("() => Boolean(window.__ficheFallbackSeen)")
            clients_surface = await reload_with_boot_shell(page, "Dossiers clients")
            clients_reload_url = page.url
            await page.locator('aside nav a[href="/finances"]').hover()
            await page.wait_for_timeout(300)
            finances_started_at = time.perf_counter()
            await asyncio.gather(
                page.wait_for_url("**/finances"),
                page.locator('aside nav a[href="/finances"]').click(),
            )
            await page.get_by_role("heading", name="Finances du cabinet").wait_for(timeout=5000)
            finances_navigation_ms = round((time.perf_counter() - finances_started_at) * 1000)
            finances_surface = await reload_with_boot_shell(page, "Finances du cabinet")
            finances_reload_url = page.url
            await page.locator('aside nav a[href="/transferts"]').hover()
            await page.wait_for_timeout(300)
            await start_fallback_observer(page)
            transfers_started_at = time.perf_counter()
            await asyncio.gather(
                page.wait_for_url("**/transferts"),
                page.locator('aside nav a[href="/transferts"]').click(),
            )
            await page.get_by_role("heading", name="Importer et exporter").wait_for(timeout=5000)
            transfers_navigation_ms = round((time.perf_counter() - transfers_started_at) * 1000)
            transfers_fallback_seen = await page.evaluate("() => Boolean(window.__ficheFallbackSeen)")
            transfers_surface = await reload_with_boot_shell(page, "Importer et exporter")
            transfers_reload_url = page.url
            await delete_technical_account(page)
            account_created = False
            await page.goto(f"{BASE_URL}/connexion", wait_until="networkidle")
            public_surface = await reload_with_boot_shell(page, "Bienvenue")
            public_reload_url = page.url
            distinct_calls = sorted(set(private_calls))
            print(json.dumps({
                "firstDashboardMs": first_dashboard_ms,
                "dashboardMeasureMs": dashboard_measure_ms,
                "loginResponseMs": login_response_ms,
                "sessionResponseMs": session_response_ms,
                "clientsNavigationMs": clients_navigation_ms,
                "financesNavigationMs": finances_navigation_ms,
                "transfersNavigationMs": transfers_navigation_ms,
                "clientsFallbackSeen": clients_fallback_seen,
                "transfersFallbackSeen": transfers_fallback_seen,
                "reloadUrls": [dashboard_reload_url, clients_reload_url, finances_reload_url, transfers_reload_url],
                "publicReloadUrl": public_reload_url,
                "visualSurface": {"dashboard": dashboard_surface, "clients": clients_surface, "finances": finances_surface, "transfers": transfers_surface, "public": public_surface},
                "reloadErrors": reload_errors,
                "privateCalls": distinct_calls,
                "privateCallCount": len(distinct_calls),
            }))
        finally:
            if account_created:
                await delete_technical_account(page)
            await browser.close()


asyncio.run(main())
