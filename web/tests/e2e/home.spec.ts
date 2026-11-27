import { expect, test } from "./fixtures";

test("shows the latest release and the total download count", async ({
  page,
}) => {
  await page.goto("");

  await expect(
    page.getByRole("button", { name: "Download v2.2.1" }),
  ).toBeVisible();
  await expect(page.getByText("Total downloads: 1234")).toBeVisible();
});

test("links to the VCF configurator", async ({ page }) => {
  await page.goto("");
  await page.getByRole("link", { name: "VCF Configurator" }).click();

  await expect(page).toHaveURL(/\/MISS-ELS\/configurator/);
  await expect(
    page.getByRole("heading", { name: "MISS ELS VCF Configurator" }),
  ).toBeVisible();
});

test("the backdrop fills the screen without scrolling", async ({ page }) => {
  await page.goto("");
  await expect(page.getByText("Total downloads: 1234")).toBeVisible();

  // an inline element after the app, like the one Nuxt DevTools adds in dev,
  // must not push the page past the backdrop
  await page.evaluate(() =>
    document.body.append(document.createElement("span"), "stray text"),
  );

  await page.mouse.wheel(0, 500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("the configurator scrolls again after the home page", async ({ page }) => {
  await page.goto("");
  await page.getByRole("link", { name: "VCF Configurator" }).click();
  await expect(
    page.getByRole("heading", { name: "MISS ELS VCF Configurator" }),
  ).toBeVisible();

  await expect(page.locator("html")).not.toHaveClass(/overflow-hidden/);
  await expect(page.locator("body")).not.toHaveClass(/overflow-hidden/);
});
