import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:3001";
const email = `web.flow.${Date.now()}@example.com`;
const password = "Memoire1!";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "light",
  reducedMotion: "reduce",
  locale: "vi-VN",
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

function otpFromEmail(expectedEmail) {
  const mail = JSON.parse(
    readFileSync("C:/Data/Projects/better-memoire/.screens/last-resend.json", "utf8"),
  );
  if (!mail.to?.includes(expectedEmail)) {
    throw new Error(`Last email is for ${mail.to?.join(",")}, expected ${expectedEmail}`);
  }
  const match = mail.html.match(/(?<!\d)(\d{6})(?!\d)/);
  if (!match) throw new Error("No OTP found in email");
  return match[1];
}

await page.goto(BASE, { waitUntil: "load" });
await page.getByRole("heading", { name: "Ngày đẹp, lên kệ." }).waitFor();
console.log("1 vi landing ok");
await page.screenshot({ path: "../.screens/final-vi-landing.png", fullPage: true });

await page.getByRole("button", { name: "Chuyển sang tiếng Anh" }).click();
await page.getByRole("heading", { name: "Keep the days that deserve a shelf." }).waitFor();
console.log("2 locale switch en ok");
await page.reload({ waitUntil: "load" });
await page.getByRole("heading", { name: "Keep the days that deserve a shelf." }).waitFor();
console.log("3 locale persisted after reload");
await page.screenshot({ path: "../.screens/final-en-landing.png", fullPage: true });

await page.getByRole("button", { name: "Switch to Vietnamese" }).click();
await page.getByRole("heading", { name: "Ngày đẹp, lên kệ." }).waitFor();

await page.goto(`${BASE}/auth?mode=register`, { waitUntil: "load" });
await page.getByRole("heading", { name: "Làm cuốn sách đầu tiên." }).waitFor();
await page.locator("#register-name").fill("Nguyễn Minh Anh");
await page.locator("#register-email").fill(email);
await page.locator("#register-password").fill(password);
await page.locator("#register-confirm").fill(password);
await page.screenshot({ path: "../.screens/final-vi-auth-register.png", fullPage: true });
await page.getByRole("button", { name: "Tạo tài khoản" }).last().click();
await page.getByRole("heading", { name: "Nhập mã xác minh." }).waitFor({ timeout: 15000 });
console.log("4 registration advanced to OTP step");
const otp = otpFromEmail(email);
await page.locator("#auth-otp").fill(otp);
await page.getByRole("button", { name: "Xác minh" }).click();
await page.waitForURL(`${BASE}/`, { timeout: 15000 });
await page.getByText(email).first().waitFor();
console.log("5 OTP verified and signed in");
await page.screenshot({ path: "../.screens/final-vi-signed-in.png", fullPage: false });

const refreshResponse = await context.request.post(`${BASE}/api/auth/refresh`, {
  headers: { "content-type": "application/json" },
  data: {},
});
console.log("6 frontend refresh route:", refreshResponse.status());
if (refreshResponse.status() !== 200) throw new Error("Refresh route failed");

await page.getByRole("button", { name: "Đăng xuất" }).first().click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
await page
  .locator("header")
  .getByRole("link", { name: "Đăng nhập" })
  .waitFor({ timeout: 10000 });
console.log("7 logout ok");

await page.goto(`${BASE}/auth`, { waitUntil: "load" });
await page.locator("#login-email").fill(email);
await page.locator("#login-password").fill("wrongpass");
await page.getByRole("button", { name: "Đăng nhập" }).last().click();
await page.getByText("Email hoặc mật khẩu không đúng.").waitFor({ timeout: 15000 });
console.log("8 localized login error ok");
await page.screenshot({ path: "../.screens/final-vi-auth-error.png", fullPage: false });

await page.getByRole("button", { name: "Chuyển sang tiếng Anh" }).click();
await page.getByRole("heading", { name: "Welcome back." }).waitFor();
console.log("9 English auth copy ok");

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: "light",
  reducedMotion: "reduce",
  locale: "vi-VN",
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(BASE, { waitUntil: "load" });
await mobilePage.screenshot({ path: "../.screens/final-vi-landing-mobile.png", fullPage: true });
await mobilePage.goto(`${BASE}/auth?mode=register`, { waitUntil: "load" });
await mobilePage.screenshot({ path: "../.screens/final-vi-auth-mobile.png", fullPage: true });
console.log("10 mobile Vietnamese pages captured");

console.log("page errors:", pageErrors.length ? pageErrors : "none");
await mobile.close();
await context.close();
await browser.close();
