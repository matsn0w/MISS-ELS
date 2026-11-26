import { test as base, expect, type Page } from "@playwright/test";

/** Fake GitHub releases, so the tests never depend on the real API. */
const releases = [
  {
    tag_name: "2.2.1",
    assets: [
      {
        download_count: 1200,
        browser_download_url: "https://example.com/miss-els.zip",
      },
    ],
  },
  { tag_name: "2.2.0", assets: [{ download_count: 34 }] },
];

export const test = base.extend<{ mockGitHub: undefined }>({
  mockGitHub: [
    async ({ page }, use) => {
      await page.route("https://api.github.com/**", (route) => {
        const latest = route.request().url().endsWith("/latest");
        return route.fulfill({ json: latest ? releases[0] : releases });
      });
      await use(undefined);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Opens the configurator with a clean browser storage. The onboarding tour
 * is marked as seen unless `tour` is true, so it doesn't cover the page.
 */
export const openConfigurator = async (page: Page, { tour = false } = {}) => {
  if (!tour) {
    await page.addInitScript(() => localStorage.setItem("onboardingDone", "1"));
  }
  await page.goto("configurator");
  await expect(
    page.getByRole("heading", { name: "MISS ELS VCF Configurator" }),
  ).toBeVisible();
};

export const lightablesSection = (page: Page) => page.locator("#lightables");
export const staticsSection = (page: Page) => page.locator("#statics");
export const stagesSection = (page: Page) => page.locator("#stages");

export const addExtra = (page: Page) =>
  page.getByRole("button", { name: "New extra" }).click();

export const addMisc = (page: Page) =>
  page.getByRole("button", { name: "New misc" }).click();

/** The `n`th (0-based) row of the lightables table. */
export const lightableRow = (page: Page, n: number) =>
  lightablesSection(page).locator("tbody tr").nth(n);

export const setLightColor = async (page: Page, row: number, color: string) => {
  const r = lightableRow(page, row);
  await r.getByRole("checkbox").check();
  await r.locator("select").nth(2).selectOption(color);
};

/** The editor of a stage (1-based). */
export const stage = (page: Page, number: number) =>
  page.getByRole("group", { name: `Stage ${number}`, exact: true });

/** The timeline of a pattern (1-based) in a stage. */
export const stagePattern = (page: Page, stageNumber: number, number = 1) =>
  stage(page, stageNumber).getByRole("group", {
    name: `Pattern ${number}`,
    exact: true,
  });

export const addFlash = (page: Page, stageNumber = 1, patternNumber = 1) =>
  stagePattern(page, stageNumber, patternNumber)
    .getByRole("button", { name: "Add flash", exact: true })
    .click();

/** Opens the XML preview, returns the XML and closes the preview again. */
export const readXml = async (page: Page) => {
  await page.getByRole("button", { name: "Preview XML" }).click();
  const code = page.getByRole("complementary", { name: "XML preview" });
  const xml = (await code.locator("code").textContent()) ?? "";
  await page.keyboard.press("Escape");
  await expect(code).toBeHidden();
  return xml;
};

/** The XML of one <Stage> (1-based) of a VCF. */
export const stageXml = (xml: string, number: number) =>
  xml.match(
    new RegExp(
      `<Stage Number="${number}"[^>]*/>|<Stage Number="${number}"[^>]*[^/]>[\\s\\S]*?</Stage>`,
    ),
  )?.[0] ?? "";

/** Durations of the flashes of a pattern (1-based) in a stage's XML. */
export const flashDurations = (
  xml: string,
  stageNumber: number,
  pattern = 1,
) => {
  const patterns = stageXml(xml, stageNumber).split("<Pattern>").slice(1);
  return [...(patterns[pattern - 1] ?? "").matchAll(/Duration="(\d+)"/g)].map(
    (m) => Number(m[1]),
  );
};
