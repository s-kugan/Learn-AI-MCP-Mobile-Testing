# Learn AI + MCP Mobile Testing

Mobile test automation for an Android demo app (**QA Shop**), done two ways:

1. **AI-driven** – Claude Code drives a real phone through [mobile-mcp](https://github.com/mobile-next/mobile-mcp), following a plain-English test prompt.
2. **Scripted** – a [Mobilewright](https://github.com/mobile-next/mobilewright) test in TypeScript, written with the Page Object Model and Playwright-style `getByRole` / `getByText` locators.

Both cover the same happy path: fill a profile, add two products to the cart, apply a 20% coupon and place the order.

## Test flow

| # | Step | Checks |
|---|------|--------|
| 1 | Fill the profile form (name, email, country, interest) and submit | Welcome message and **SHOP NOW** button shown |
| 2 | Open Products | `Hi Michael, happy shopping!` |
| 3 | Add Wireless Headphones and Smart Watch | Cart badge shows `2` |
| 4 | Open the cart | `Total: $208.99` |
| 5 | Go to checkout | `Grand Total: $208.99` |
| 6 | Apply coupon `QA20` and enter the address | `Coupon applied: 20% off`, `Grand Total: $167.19` |
| 7 | Place the order | `Order Placed Successfully!`, ID matches `QA-[A-Z0-9]{8}`, `Amount Paid: $167.19 (after 20% off)` |

## Project structure

```
├── app-debug.apk              # QA Shop demo app (package: com.qademo.qashop)
├── tests/
│   ├── order.spec.ts          # happy-path order test (flow + assertions)
│   └── pages/                 # one page object per app screen
│       ├── ProfilePage.ts
│       ├── ProductsPage.ts
│       ├── CartPage.ts
│       ├── CheckoutPage.ts
│       └── ConfirmationPage.ts
├── mobilewright.config.ts     # Mobilewright config (Android)
├── .mcp.json                  # mobile-mcp server for Claude Code
├── connect-phone.ps1          # connect an Android phone over Wi-Fi (adb)
└── PHONE-SETUP.md             # full guide: phone setup, install, run, test prompt
```

## Prerequisites

- Node.js 22.12 or newer
- Android SDK platform-tools (`adb`), e.g. from Android Studio
- An Android phone (Android 11+ for wireless debugging) or an emulator
- For the AI-driven run: [Claude Code](https://claude.com/claude-code)

## Quick start

```powershell
# 1. Install dependencies
npm install

# 2. Connect the phone over Wi-Fi (first-time pairing: see PHONE-SETUP.md)
.\connect-phone.ps1 -PhoneIp <phone-ip>

# 3. Install the app
adb -s <device-id> install -r app-debug.apk

# 4. Unlock the phone and run the test
npm run test:order
```

> **Keep the phone unlocked and the screen on during the run.** If it locks, the app opens
> behind the lock screen and the test fails with "no matching element found".

Full step-by-step setup (pairing, fixed port, troubleshooting) is in **[PHONE-SETUP.md](PHONE-SETUP.md)**.

## npm scripts

| Command | What it does |
|---|---|
| `npm test` | Run all tests |
| `npm run test:order` | Run the order test, results in the terminal |
| `npm run test:list` | List tests without running them |
| `npm run typecheck` | Check the TypeScript compiles (no phone needed) |
| `npm run report` | Open the HTML report of the last run |
| `npm run devices` | List devices Mobilewright can see |
| `npm run doctor` | Check Node, Android SDK and adb setup |

## Run it with AI (mobile-mcp)

`.mcp.json` registers the mobile-mcp server, so Claude Code can see and control the phone.
Open this folder in Claude Code and paste the test prompt from
[PHONE-SETUP.md → TEST PROMPT](PHONE-SETUP.md#test-prompt---happy-path-place-an-order-with-a-coupon-qa-shop).
Claude installs the app, runs each step on the phone and reports PASS/FAIL per step.

## Page Object Model example

```ts
test('place an order with a coupon', async ({ screen }) => {
  const profile = new ProfilePage(screen);
  const products = new ProductsPage(screen);
  // ...

  await profile.fillProfile(customer);
  await profile.submit();
  await profile.shopNow();

  await products.addToCart('Wireless Headphones', 'Smart Watch');
  await expect(products.cartBadge(2)).toBeVisible();
  // ...
  await expect(confirmation.amountPaid).toHaveText('Amount Paid: $167.19 (after 20% off)');
});
```

## License

[MIT](LICENSE) © s-kugan
