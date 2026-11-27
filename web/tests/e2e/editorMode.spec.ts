import {
  addExtra,
  addFlash,
  addMisc,
  expect,
  flashDurations,
  openConfigurator,
  readXml,
  stage,
  stagePattern,
  test,
} from "./fixtures";

const mode = (page: import("@playwright/test").Page, name: string) =>
  page
    .getByRole("radiogroup", { name: "Editor mode" })
    .getByRole("radio", { name });

test("new visitors start in easy mode", async ({ page }) => {
  await openConfigurator(page, { tour: true, mode: null });
  await page.getByRole("button", { name: "Skip tour" }).click();

  await expect(mode(page, "Easy")).toHaveAttribute("aria-checked", "true");
});

test("returning visitors keep the full editor", async ({ page }) => {
  await openConfigurator(page, { mode: null });

  await expect(mode(page, "Advanced")).toHaveAttribute("aria-checked", "true");
});

test("easy mode hides the advanced settings, and remembers the choice", async ({
  page,
}) => {
  await openConfigurator(page);
  await addExtra(page);
  await addFlash(page);

  const advancedOnly = [
    page.getByLabel("Output format"),
    page.getByText("VCF schema version"),
    page.getByRole("checkbox", { name: /WMServerSirens/ }),
    page.locator("#sounds").getByRole("columnheader", { name: "Audio string" }),
    page.getByRole("button", { name: "Preview XML" }),
    stage(page, 1).getByRole("button", { name: "Add pattern" }),
    stage(page, 1).getByRole("button", { name: "Move stage 1 down" }),
    stage(page, 1).getByLabel("Copy from"),
    stagePattern(page, 1).getByRole("button", { name: "Remove pattern" }),
  ];

  for (const element of advancedOnly) await expect(element).toBeVisible();

  await mode(page, "Easy").click();
  for (const element of advancedOnly) await expect(element).toBeHidden();

  await page.reload();
  await expect(mode(page, "Easy")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("Output format")).toBeHidden();

  // hidden settings keep their values
  await mode(page, "Advanced").click();
  expect(await readXml(page)).toContain("VEHICLES_HORNS_SIREN_1");
});

test("easy mode still shows the output format when it's the old one", async ({
  page,
}) => {
  await openConfigurator(page);
  await page.getByLabel("Output format").selectOption("legacy");
  await mode(page, "Easy").click();

  await expect(page.getByLabel("Output format")).toHaveValue("legacy");
});

test("presets build a pattern from the stage's lights", async ({ page }) => {
  await openConfigurator(page, { mode: "easy" });
  await addExtra(page);

  // a single light is not enough for a preset
  const presets = stagePattern(page, 1).getByRole("group", {
    name: "Presets for pattern 1",
  });
  await expect(presets).toBeHidden();

  await addExtra(page);
  await addMisc(page);
  await presets.getByRole("button", { name: "Alternate", exact: true }).click();

  const pattern = stagePattern(page, 1);
  await expect(pattern.getByLabel("extra 1 in flash 1")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(pattern.getByLabel("extra 2 in flash 1")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(pattern.getByLabel("misc a in flash 2")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // the XML preview is an advanced feature
  await mode(page, "Advanced").click();
  expect(flashDurations(await readXml(page), 1)).toEqual([300, 300]);

  // replacing an existing pattern asks first
  page.once("dialog", (dialog) => dialog.accept());
  await pattern
    .getByLabel("Replace pattern 1 with a preset")
    .selectOption("chase");
  expect(flashDurations(await readXml(page), 1)).toEqual([120, 120, 120]);
});

test("presets skip lights that stay on for the whole stage", async ({
  page,
}) => {
  await openConfigurator(page);
  await addExtra(page);
  await addExtra(page);
  await addExtra(page);
  await stage(page, 1)
    .getByRole("button", { name: "Keep extra 3 on for stage 1" })
    .click();

  await stagePattern(page, 1).getByRole("button", { name: "Chase" }).click();
  expect(flashDurations(await readXml(page), 1)).toEqual([120, 120]);
});
