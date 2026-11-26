import {
  addExtra,
  addFlash,
  expect,
  lightablesSection,
  openConfigurator,
  test,
} from "./fixtures";

test.beforeEach(async ({ page }) => {
  await openConfigurator(page);
  await addExtra(page);
  await addFlash(page);
});

test("the page never scrolls sideways", async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("tables become labelled cards", async ({ page }) => {
  await expect(lightablesSection(page).locator("thead")).toBeHidden();
  await expect(
    lightablesSection(page).locator('td[data-label="Lightable ID"]'),
  ).toBeVisible();
});

test("the action bar fits the screen and never hides the footer", async ({
  page,
}) => {
  const bar = page.getByRole("button", { name: "Generate" }).locator("..");
  await expect(page.getByRole("button", { name: "Generate" })).toBeInViewport();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const footer = await page.locator("footer").boundingBox();
  const barBox = await bar.boundingBox();
  const viewport = page.viewportSize();

  expect(barBox!.x + barBox!.width).toBeLessThanOrEqual(viewport!.width);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(
    (await page.locator("form > div.fixed").boundingBox())!.y,
  );
});
