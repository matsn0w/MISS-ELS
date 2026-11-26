import { expect, openConfigurator, test } from "./fixtures";

const tour = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: /./ });

test("the tour starts on the first visit and walks through every step", async ({
  page,
}) => {
  await openConfigurator(page, { tour: true });

  const dialog = tour(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Welcome to the VCF Configurator");
  await expect(dialog).toContainText("Step 1 of 9");

  await dialog.getByRole("button", { name: "Start the tour" }).click();
  await expect(dialog).toContainText("Start or import");

  // each step highlights its part of the page
  const titles = [
    ["About this VCF", "#general"],
    ["Lightables", "#lightables"],
    ["Statics", "#statics"],
    ["Sounds", "#sounds"],
    ["Light stages", "#stages"],
    ["Patterns and flashes", '[data-tour="stage"]'],
    ["Check and export", '[data-tour="actions"]'],
  ] as const;

  for (const [title, target] of titles) {
    await dialog.getByRole("button", { name: "Next" }).click();
    await expect(dialog.getByRole("heading")).toHaveText(title);
    await expect(page.locator(target).first()).toBeInViewport();
  }

  await dialog.getByRole("button", { name: "Back" }).click();
  await expect(dialog.getByRole("heading")).toHaveText("Patterns and flashes");
  await dialog.getByRole("button", { name: "Next" }).click();

  await dialog.getByRole("button", { name: "Finish" }).click();
  await expect(dialog).toBeHidden();
  // finishing the tour also covers the storage notice
  await expect(
    page.getByText("Your VCF is saved in this browser"),
  ).toBeHidden();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "MISS ELS VCF Configurator" }),
  ).toBeVisible();
  await expect(tour(page)).toBeHidden();
});

test("the tour can be skipped, also with Escape", async ({ page }) => {
  await openConfigurator(page, { tour: true });

  await tour(page).getByRole("button", { name: "Skip tour" }).click();
  await expect(tour(page)).toBeHidden();
  // skipping keeps the storage notice, which the tour would have explained
  await expect(
    page.getByText("Your VCF is saved in this browser"),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "MISS ELS VCF Configurator" }),
  ).toBeVisible();
  await expect(tour(page)).toBeHidden();

  // restart it from the header, then close it with Escape
  await page.getByRole("button", { name: "Tour" }).click();
  await expect(tour(page)).toContainText("Step 1 of 9");
  await page.keyboard.press("ArrowRight");
  await expect(tour(page)).toContainText("Step 2 of 9");
  await page.keyboard.press("Escape");
  await expect(tour(page)).toBeHidden();
});

test("keyboard focus stays in the tour", async ({ page }) => {
  await openConfigurator(page, { tour: true });
  await tour(page).getByRole("button", { name: "Start the tour" }).click();

  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  const focusedInside = await tour(page).evaluate((dialog) =>
    dialog.contains(document.activeElement),
  );
  expect(focusedInside).toBe(true);
});
