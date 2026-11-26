import { readFile } from "node:fs/promises";
import {
  addExtra,
  addFlash,
  addMisc,
  expect,
  flashDurations,
  lightableRow,
  lightablesSection,
  openConfigurator,
  readXml,
  setLightColor,
  stage,
  stagePattern,
  stageXml,
  stagesSection,
  staticsSection,
  test,
} from "./fixtures";

test.beforeEach(async ({ page }) => {
  await openConfigurator(page);
});

test.describe("lightables", () => {
  test("adds extras and miscs with the next free ID", async ({ page }) => {
    await addExtra(page);
    await addExtra(page);
    await addMisc(page);

    await expect(lightableRow(page, 0).locator("select").nth(1)).toHaveValue(
      "1",
    );
    await expect(lightableRow(page, 1).locator("select").nth(1)).toHaveValue(
      "2",
    );
    await expect(lightableRow(page, 2).locator("select").nth(1)).toHaveValue(
      "a",
    );

    const xml = await readXml(page);
    expect(xml).toContain("<Extra01 />");
    expect(xml).toContain("<Extra02 />");
    expect(xml).toContain("<MiscA />");
  });

  test("only allows a color once env light is allowed", async ({ page }) => {
    await addExtra(page);
    const color = lightableRow(page, 0).locator("select").nth(2);

    await expect(color).toBeDisabled();
    await setLightColor(page, 0, "red");
    await expect(color).toHaveValue("red");

    expect(await readXml(page)).toContain(
      '<Extra01 AllowEnvLight="true" Color="red" />',
    );
  });

  test("disables 'New extra' once all 12 extras are used", async ({ page }) => {
    for (let i = 0; i < 12; i++) await addExtra(page);

    await expect(
      page.getByRole("button", { name: "New extra" }),
    ).toBeDisabled();
  });

  test("removes a lightable", async ({ page }) => {
    await addExtra(page);
    await lightablesSection(page)
      .getByRole("button", { name: "Remove lightable" })
      .click();

    await expect(
      lightablesSection(page).getByText(
        "You have not configured any lightables",
      ),
    ).toBeVisible();
  });
});

test.describe("sounds", () => {
  test("WMServerSirens switches the audio strings and adds soundsets", async ({
    page,
  }) => {
    await page.getByRole("checkbox", { name: /Use WMServerSirens/ }).check();

    const xml = await readXml(page);
    expect(xml).toContain(
      '<SrnTone1 AllowUse="true" AudioString="SIREN_ALPHA" SoundSet="DLC_WMSIRENS_SOUNDSET" />',
    );
    expect(xml).toContain('AudioString="SIREN_DELTA"');
  });
});

test.describe("statics", () => {
  test("a static lightable is badged and left out of stages", async ({
    page,
  }) => {
    await addExtra(page);
    await addExtra(page);
    await staticsSection(page)
      .getByRole("button", { name: "New", exact: true })
      .click();
    await staticsSection(page).getByRole("textbox").fill("Takedown");

    await expect(lightableRow(page, 0).getByText("static")).toBeVisible();
    await addFlash(page);
    await expect(
      stagePattern(page, 1).getByLabel("extra 1 in flash 1"),
    ).toHaveCount(0);
    await expect(
      stagePattern(page, 1).getByLabel("extra 2 in flash 1"),
    ).toBeVisible();

    expect(await readXml(page)).toContain('<Extra1 Name="Takedown" />');
  });
});

test.describe("stages", () => {
  test.beforeEach(async ({ page }) => {
    await addExtra(page);
    await addExtra(page);
    await setLightColor(page, 0, "red");
  });

  test("starts with three stages on Q, K and L", async ({ page }) => {
    await expect(stage(page, 1).getByText("Key Q")).toBeVisible();
    await expect(stage(page, 2).getByText("Key K")).toBeVisible();
    await expect(stage(page, 3).getByText("Key L")).toBeVisible();
    await expect(stage(page, 2).getByLabel("Name of stage 2")).toHaveValue(
      "Secondary",
    );

    const xml = await readXml(page);
    expect(xml).toContain(
      '<Stage Number="1" Name="Primary" IsEmergency="true" FlashHighBeam="false" EnableWarningBeep="false">',
    );
    expect(xml).not.toContain("<PATTERN>");
  });

  test("adds up to ten stages; 4-10 have no default key", async ({ page }) => {
    const add = stagesSection(page).getByRole("button", { name: "Add stage" });
    for (let i = 0; i < 7; i++) await add.click();

    await expect(add).toBeDisabled();
    await expect(stagesSection(page).getByText("10 / 10")).toBeVisible();
    await expect(stage(page, 4).getByText("No default key")).toBeVisible();
    await expect(stage(page, 10).getByText("No default key")).toBeVisible();
    expect(await readXml(page)).toContain('<Stage Number="10" Name="Stage 10"');
  });

  test("moves, copies and removes stages", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await addFlash(page, 1);
    await stagePattern(page, 1).getByLabel("extra 1 in flash 1").click();

    await stage(page, 3)
      .locator("select")
      .selectOption({ label: "1 · Primary" });
    await expect(
      stagePattern(page, 3).getByLabel("extra 1 in flash 1"),
    ).toHaveAttribute("aria-pressed", "true");

    await stage(page, 1)
      .getByRole("button", { name: "Move stage 1 down" })
      .click();
    await expect(stage(page, 1).getByLabel("Name of stage 1")).toHaveValue(
      "Secondary",
    );

    await stage(page, 1)
      .getByRole("button", { name: "Remove stage 1" })
      .click();
    await expect(stage(page, 1).getByLabel("Name of stage 1")).toHaveValue(
      "Primary",
    );
    await expect(stage(page, 3)).toHaveCount(0);
  });

  test("runs several patterns in one stage", async ({ page }) => {
    await addFlash(page, 1);
    await stage(page, 1).getByRole("button", { name: "Add pattern" }).click();
    await addFlash(page, 1, 2);
    await stagePattern(page, 1, 1).getByLabel("extra 1 in flash 1").click();
    await stagePattern(page, 1, 2).getByLabel("extra 2 in flash 1").click();
    await stagePattern(page, 1, 2)
      .getByLabel("Duration of flash 1 in ms")
      .fill("700");

    const xml = stageXml(await readXml(page), 1);
    expect(xml.match(/<Pattern>/g)).toHaveLength(2);
    expect(flashDurations(await readXml(page), 1, 2)).toEqual([700]);

    // both patterns light up together in the preview
    await stage(page, 1).getByRole("button", { name: "Preview" }).click();
    await expect(stage(page, 1).getByText("Flash 1 / 1")).toHaveCount(2);
    await stage(page, 1).getByRole("button", { name: "Stop" }).click();
  });

  test("keeps lights on for the whole stage", async ({ page }) => {
    await addFlash(page, 1);
    await stage(page, 1)
      .getByRole("button", { name: "Keep extra 2 on for stage 1" })
      .click();

    await expect(
      stagePattern(page, 1).getByLabel(
        "extra 2 in flash 1 (on for the whole stage)",
      ),
    ).toBeDisabled();
    expect(stageXml(await readXml(page), 1)).toMatch(
      /<Stage Number="1"[^>]* Extras="2">/,
    );
  });

  test("a long pattern scrolls inside its timeline, not the page", async ({
    page,
  }) => {
    for (let i = 0; i < 12; i++) await addFlash(page);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("toggles lights per flash", async ({ page }) => {
    await addFlash(page);
    await addFlash(page);
    const primary = stagePattern(page, 1);

    await primary.getByLabel("extra 1 in flash 1").click();
    await primary.getByLabel("extra 2 in flash 2").click();
    await expect(primary.getByLabel("extra 1 in flash 1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const xml = stageXml(await readXml(page), 1);
    expect(xml).toContain('<Flash Duration="100" Extras="1" />');
    expect(xml).toContain('<Flash Duration="100" Extras="2" />');
  });

  test("duplicates, moves and drags flashes", async ({ page }) => {
    const primary = stagePattern(page, 1);
    await addFlash(page);
    await addFlash(page);
    await addFlash(page);
    await primary.getByLabel("Duration of flash 1 in ms").fill("111");
    await primary.getByLabel("Duration of flash 2 in ms").fill("222");
    await primary.getByLabel("Duration of flash 3 in ms").fill("333");

    await primary.getByRole("button", { name: "Duplicate flash 1" }).click();
    expect(flashDurations(await readXml(page), 1)).toEqual([
      111, 111, 222, 333,
    ]);

    await primary.getByRole("button", { name: "Move flash 4 left" }).click();
    expect(flashDurations(await readXml(page), 1)).toEqual([
      111, 111, 333, 222,
    ]);

    const handles = primary.getByTitle("Drag to reorder");
    await handles.nth(3).dragTo(handles.nth(0));
    expect(flashDurations(await readXml(page), 1)).toEqual([
      222, 111, 111, 333,
    ]);

    await primary.getByRole("button", { name: "Remove flash 1" }).click();
    expect(flashDurations(await readXml(page), 1)).toEqual([111, 111, 333]);
  });

  test("plays and stops the preview", async ({ page }) => {
    const primary = stagePattern(page, 1);
    await addFlash(page);
    await addFlash(page);
    await primary.getByLabel("Duration of flash 1 in ms").fill("5000");
    await primary.getByLabel("extra 1 in flash 1").click();

    await stage(page, 1).getByRole("button", { name: "Preview" }).click();
    await expect(primary.getByText("Flash 1 / 2")).toBeVisible();

    await stage(page, 1).getByRole("button", { name: "Stop" }).click();
    await expect(
      stage(page, 1).getByRole("button", { name: "Preview" }),
    ).toBeVisible();
    await expect(primary.getByText("2 flashes")).toBeVisible();
  });

  test("without loop the preview plays once", async ({ page }) => {
    await addFlash(page);
    await stage(page, 1).getByRole("switch", { name: "Loop" }).click();

    await stage(page, 1).getByRole("button", { name: "Preview" }).click();
    // a single 100 ms flash, then it stops by itself
    await expect(
      stage(page, 1).getByRole("button", { name: "Preview" }),
    ).toBeVisible();
  });
});

test.describe("warnings", () => {
  test("lists problems and links to the section", async ({ page }) => {
    await page.getByRole("button", { name: /warnings?$/ }).click();

    const warnings = page.getByRole("listitem");
    await expect(warnings.filter({ hasText: "no description" })).toBeVisible();
    await expect(warnings.filter({ hasText: "No lightables" })).toBeVisible();
    await expect(
      warnings.filter({ hasText: "Stage 3 (Warning) has no flashes" }),
    ).toBeVisible();

    await warnings.filter({ hasText: "No lightables" }).click();
    await expect(lightablesSection(page)).toBeInViewport();
  });

  test("warns about flashes that use a removed light", async ({ page }) => {
    await addExtra(page);
    await addFlash(page);
    await stagePattern(page, 1).getByLabel("extra 1 in flash 1").click();
    await lightablesSection(page)
      .getByRole("button", { name: "Remove lightable" })
      .click();

    await page.getByRole("button", { name: /warnings?$/ }).click();
    await expect(
      page.getByText("Stage 1 (Primary) flash 1 uses extra 1, which no longer"),
    ).toBeVisible();
  });

  test("shows no warnings for a complete VCF", async ({ page }) => {
    await page.getByLabel("Description").fill("police-car");
    await addExtra(page);
    await addFlash(page);
    await stagePattern(page, 1).getByLabel("extra 1 in flash 1").click();

    page.on("dialog", (dialog) => dialog.accept());
    await stage(page, 2)
      .locator("select")
      .selectOption({ label: "1 · Primary" });
    await stage(page, 3)
      .locator("select")
      .selectOption({ label: "1 · Primary" });

    await expect(
      page.getByRole("button", { name: "No warnings" }),
    ).toBeDisabled();
  });
});

test.describe("XML preview", () => {
  test("highlights the XML and escapes user input", async ({ page }) => {
    await page.getByLabel("Description").fill('<b>"bold" & co</b>');
    await page.getByRole("button", { name: "Preview XML" }).click();

    const preview = page.getByRole("complementary", { name: "XML preview" });
    await expect(preview.locator("code")).toContainText(
      'Description="&lt;b&gt;&quot;bold&quot; &amp; co&lt;/b&gt;"',
    );
    // user input must never become markup
    await expect(preview.locator("code b")).toHaveCount(0);
    // tags, attributes and values are colored separately
    await expect(
      preview.locator("code span", { hasText: /^vcfroot$/ }).first(),
    ).toHaveClass(/text-blue/);
  });

  test("copies the XML to the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Preview XML" }).click();
    await page.getByRole("button", { name: "Copy" }).click();

    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toMatch(/^<\?xml version="1.0"/);
  });
});

const legacyVcf = `<?xml version="1.0" encoding="utf-8"?>
<vcfroot Description="old-car" Author="someone" Version="1.1.0">
  <EOVERRIDE>
    <Extra01 AllowEnvLight="true" Color="red" />
    <Extra02 />
    <MiscA />
  </EOVERRIDE>
  <STATIC />
  <SOUNDS>
    <MainHorn AllowUse="true" AudioString="SIRENS_AIRHORN" />
  </SOUNDS>
  <PATTERN>
    <PRIMARY IsEmergency="true" FlashHighBeam="true" EnableWarningBeep="false">
      <Flash Duration="100" Extras="1" />
      <Flash Duration="200" />
    </PRIMARY>
    <SECONDARY IsEmergency="false" FlashHighBeam="false" EnableWarningBeep="false">
      <Flash Duration="300" Miscs="a" />
    </SECONDARY>
    <REARREDS IsEmergency="true" FlashHighBeam="false" EnableWarningBeep="true">
      <Flash Duration="400" Extras="2" />
    </REARREDS>
  </PATTERN>
</vcfroot>`;

const uploadVcf = (page: import("@playwright/test").Page, xml: string) =>
  page.locator("input[type=file]").setInputFiles({
    name: "vehicle.xml",
    mimeType: "application/xml",
    buffer: Buffer.from(xml),
  });

test.describe("export and import", () => {
  test("downloads the VCF named after its description", async ({ page }) => {
    await page.getByLabel("Description").fill("police-car");
    await addExtra(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Generate VCF" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("police-car.xml");
    const xml = await readFile(await download.path(), "utf8");
    expect(xml).toContain('<vcfroot Description="police-car"');
    expect(xml).toContain("<Extra01 />");
    expect(xml).toContain("<STAGES>");
  });

  test("imports a downloaded VCF again", async ({ page }) => {
    await page.getByLabel("Description").fill("round-trip");
    await page.getByLabel("Author").fill("tester");
    await addExtra(page);
    await addMisc(page);
    await setLightColor(page, 0, "blue");
    await addFlash(page);
    await stagePattern(page, 1)
      .getByLabel("Duration of flash 1 in ms")
      .fill("250");
    await stagePattern(page, 1).getByLabel("misc a in flash 1").click();
    await stage(page, 2).getByRole("button", { name: "Add pattern" }).click();
    await addFlash(page, 2, 2);
    await stage(page, 3)
      .getByRole("button", { name: "Keep extra 1 on for stage 3" })
      .click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Generate VCF" }).click(),
    ]);
    const exported = await readFile(await download.path(), "utf8");

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByLabel("Description")).toHaveValue("");

    await uploadVcf(page, exported);

    await expect(page.getByLabel("Description")).toHaveValue("round-trip");
    await expect(page.getByLabel("Author")).toHaveValue("tester");
    await expect(page.getByText("Converted from the MISS-ELS 2")).toBeHidden();
    await expect(
      stagePattern(page, 1).getByLabel("Duration of flash 1 in ms"),
    ).toHaveValue("250");
    expect(await readXml(page)).toBe(exported);
  });

  test("converts a MISS-ELS 2 VCF into stages", async ({ page }) => {
    await uploadVcf(page, legacyVcf);

    await expect(page.getByText("Converted from the MISS-ELS 2")).toBeVisible();
    // PRIMARY (Q) -> 1, REARREDS (K) -> 2, SECONDARY (L) -> 3, named like
    // the resource names them
    await expect(stage(page, 2).getByLabel("Name of stage 2")).toHaveValue(
      "Secondary",
    );
    await expect(stage(page, 3).getByLabel("Name of stage 3")).toHaveValue(
      "Warning",
    );

    const xml = await readXml(page);
    expect(flashDurations(xml, 1)).toEqual([100, 200]);
    expect(flashDurations(xml, 2)).toEqual([400]);
    expect(flashDurations(xml, 3)).toEqual([300]);
    expect(stageXml(xml, 1)).toContain('FlashHighBeam="true"');
    expect(stageXml(xml, 2)).toContain('EnableWarningBeep="true"');
    expect(stageXml(xml, 3)).toContain('<Flash Duration="300" Miscs="a" />');
  });

  test("keeps stage numbers and defaults like the resource", async ({
    page,
  }) => {
    await uploadVcf(
      page,
      `<vcfroot Description="gaps" Version="2.0.0">
        <EOVERRIDE><Extra01 /><Extra09 /><Extra10 /></EOVERRIDE>
        <SOUNDS><MainHorn AllowUse="true" AudioString="SIRENS_AIRHORN" InterruptSiren="true" /></SOUNDS>
        <STAGES>
          <Stage Number="1" Name="Front"><Pattern><Flash Duration="100" Extras="1" /></Pattern></Stage>
          <Stage Number="4" Name="Scene lights" IsEmergency="false" Extras="9,10" />
        </STAGES>
      </vcfroot>`,
    );

    // stage 4 stays stage 4, so its key binding doesn't move
    await expect(stage(page, 4).getByLabel("Name of stage 4")).toHaveValue(
      "Scene lights",
    );
    await expect(stage(page, 2).getByLabel("Name of stage 2")).toHaveValue(
      "Stage 2",
    );

    const xml = await readXml(page);
    // a missing IsEmergency means true, like in the resource
    expect(stageXml(xml, 1)).toContain('IsEmergency="true"');
    expect(stageXml(xml, 4)).toMatch(
      /<Stage Number="4" Name="Scene lights" IsEmergency="false"[^>]* Extras="9,10" \/>/,
    );
    expect(xml).toContain('InterruptSiren="true"');
  });

  test("writes the MISS-ELS 2 format when the VCF fits in it", async ({
    page,
  }) => {
    await uploadVcf(page, legacyVcf);
    await page.getByLabel("Output format").selectOption("legacy");

    const xml = await readXml(page);
    expect(xml).not.toContain("<STAGES>");
    expect(xml).toContain('<PRIMARY IsEmergency="true" FlashHighBeam="true"');
    expect(xml).toContain('<Flash Duration="400" Extras="2" />');
    expect(xml).toMatch(
      /<SECONDARY[^>]*>\s*<Flash Duration="300" Miscs="a" \/>/,
    );
  });

  test("blocks the MISS-ELS 2 format for stage-only features", async ({
    page,
  }) => {
    await addExtra(page);
    await page.getByLabel("Output format").selectOption("legacy");
    await stage(page, 1).getByRole("button", { name: "Add pattern" }).click();

    await expect(
      page.getByText("runs 2 patterns at once; the old format supports 1"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Generate VCF" }).click();
    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Can't use the MISS-ELS 2" }),
    ).toBeVisible();
  });

  test("rejects a file that is not a VCF", async ({ page }) => {
    const message = new Promise<string>((resolve) =>
      page.once("dialog", async (dialog) => {
        resolve(dialog.message());
        await dialog.dismiss();
      }),
    );

    await uploadVcf(page, "just some text");

    expect(await message).toBe("This file is not a valid VCF.");
  });
});

test.describe("settings", () => {
  test("keeps the VCF after a reload", async ({ page }) => {
    await page.getByLabel("Description").fill("persisted");
    await addExtra(page);
    await expect(page.getByText(/Saved in this browser ·/)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Description")).toHaveValue("persisted");
    await expect(lightableRow(page, 0).locator("select").nth(1)).toHaveValue(
      "1",
    );
  });

  test("starts empty after a reload when saving is off", async ({ page }) => {
    await page.getByRole("switch", { name: "Save in browser" }).click();
    await expect(page.getByText("Not saved.")).toBeVisible();
    await page.getByLabel("Description").fill("forgotten");

    await page.reload();
    await expect(page.getByLabel("Description")).toHaveValue("");
    await expect(
      page.getByRole("switch", { name: "Save in browser" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  test("dark mode is applied and remembered", async ({ page }) => {
    await page.getByRole("switch", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("the storage notice can be dismissed for good", async ({ page }) => {
    const notice = page.getByText("Your VCF is saved in this browser");
    await expect(notice).toBeVisible();

    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(notice).toBeHidden();

    await page.reload();
    await expect(page.getByLabel("Description")).toBeVisible();
    await expect(notice).toBeHidden();
  });
});

test.describe("saved configurations", () => {
  test("converts a configuration saved by the old configurator", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("saveVcfLocal", "1");
      localStorage.setItem(
        "vcfConfiguration",
        JSON.stringify({
          flashID: 3,
          configuration: {
            author: null,
            description: "saved-before",
            version: "1.1.0",
            lightables: [
              {
                type: "extra",
                id: 1,
                enabled: true,
                allowEnv: false,
                color: null,
              },
            ],
            statics: [],
            useServerSirens: false,
            sounds: [],
            patterns: [
              {
                name: "PRIMARY",
                isEmergency: true,
                flashHighBeam: false,
                enableWarningBeep: false,
                loopPreview: true,
              },
              {
                name: "SECONDARY",
                isEmergency: true,
                flashHighBeam: false,
                enableWarningBeep: false,
                loopPreview: true,
              },
              {
                name: "REARREDS",
                isEmergency: false,
                flashHighBeam: false,
                enableWarningBeep: true,
                loopPreview: true,
              },
            ],
            flashes: [
              {
                id: 1,
                pattern: "PRIMARY",
                duration: 150,
                extras: [1],
                miscs: [],
              },
              {
                id: 2,
                pattern: "REARREDS",
                duration: 250,
                extras: [1],
                miscs: [],
              },
            ],
          },
        }),
      );
    });

    await page.reload();
    await expect(page.getByLabel("Description")).toHaveValue("saved-before");

    const xml = await readXml(page);
    expect(flashDurations(xml, 1)).toEqual([150]);
    expect(flashDurations(xml, 2)).toEqual([250]);
    expect(stageXml(xml, 2)).toContain('EnableWarningBeep="true"');
  });
});
