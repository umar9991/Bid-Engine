import { test, expect } from "@playwright/test";
import path from "path";

const SAMPLE_RFP = path.join(__dirname, "fixtures", "sample_rfp_it_services.pdf");

test.describe("Bid & Proposal Engine — end to end", () => {
  test("dashboard loads with an upload zone", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Read every tender in minutes/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Upload RFP/i })).toBeVisible();
  });

  test("upload an RFP → run the AI pipeline → see the win-probability dashboard", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/");

    // Upload the sample tender. The input is hidden but present in the DOM,
    // so setInputFiles drives it directly — this kicks off the REAL pipeline
    // (extract → RAG match → score), not a mock.
    await page.setInputFiles('input[type="file"]', SAMPLE_RFP);

    // Processing stages should appear while the pipeline runs.
    await expect(page.getByText(/Extracting requirements/i)).toBeVisible({ timeout: 15000 });

    // The pipeline calls Groq + Gemini, so allow generous time, then it routes
    // to the per-RFP workspace.
    await page.waitForURL(/\/rfp\/.+/, { timeout: 90000 });

    // The win-probability gauge is the signature element — assert it rendered.
    await expect(page.getByText("win probability")).toBeVisible();

    // A GO / REVIEW / NO-GO recommendation must be present.
    await expect(
      page.getByText(/^(GO|REVIEW|NO-GO)$/).first()
    ).toBeVisible();

    // The audit trail (score breakdown) must render its factors.
    await expect(page.getByText(/How this score was reached/i)).toBeVisible();
    await expect(page.getByText(/Capability \/ Compliance fit/i)).toBeVisible();

    // The compliance tab should reflect extracted requirements.
    await page.getByRole("tab", { name: /Compliance/i }).click();
    await expect(page.getByText(/met/i).first()).toBeVisible();
  });
});