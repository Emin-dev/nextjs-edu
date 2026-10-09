import { test, expect } from "@playwright/test";

// No credentials, production data, or outbound actions. Remote task artwork is
// fulfilled locally so synthetic todo IDs never reach the image provider.
const imageFixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=",
  "base64",
);
let runtimeErrors: string[];
let unexpectedRequests: string[];

test.beforeEach(async ({ page }) => {
  runtimeErrors = [];
  unexpectedRequests = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const imageSource = url.searchParams.get("url");
    if (
      url.hostname === "picsum.photos" ||
      (url.pathname === "/_next/image" && imageSource?.startsWith("https://picsum.photos/"))
    ) {
      await route.fulfill({ status: 200, contentType: "image/png", body: imageFixture });
    } else if (url.origin === "http://127.0.0.1:4173") {
      await route.continue();
    } else {
      unexpectedRequests.push(`${route.request().method()} ${url.origin}${url.pathname}`);
      await route.abort();
    }
  });
});

test.afterEach(() => {
  expect(runtimeErrors, "browser runtime and hydration errors").toEqual([]);
  expect(unexpectedRequests, "unexpected external requests").toEqual([]);
});

test("unknown routes return 404", async ({ request }) => {
  const response = await request.get("/ci-smoke-missing-route");
  expect(response.status()).toBe(404);
});

test("starter page hydrates and renders local artwork", async ({ page }, testInfo) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Save and see your changes instantly.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Next.js logo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read our docs" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true, animations: "disabled" });
  await page.reload();
  await expect(page.getByText("Save and see your changes instantly.")).toBeVisible();
});
