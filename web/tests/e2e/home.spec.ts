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
