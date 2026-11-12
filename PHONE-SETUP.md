# Connect an Android phone to the PC over Wi-Fi (adb wireless debugging)

> **Just want to run the test?** Jump to [RUN THE AUTOMATED TEST](#run-the-automated-test-mobilewright).

Replace these placeholders with your own values in every command below:

| Placeholder | Meaning | Where to find it |
|---|---|---|
| `<phone-ip>` | Phone's IP address on your Wi-Fi | Phone: Settings > System > Developer options > Wireless debugging > "IP address & Port" |
| `<pairing-port>` | Port used only for pairing | Wireless debugging > "Pair device with pairing code" |
| `<pairing-code>` | 6-digit pairing code | Same pairing dialog |
| `<connect-port>` | Port on the main Wireless debugging screen | "IP address & Port" (the number after the colon) |
| `<fixed-port>` | Fixed port you choose so it stops changing | Use `5555` unless something else is using it |
| `<device-id>` | Device id adb uses: `<phone-ip>:<fixed-port>` (Wi-Fi) or the serial number (USB) | `adb devices -l` |

- adb path (Windows, Android SDK default): `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`
- Requirements: Android 11+ (for wireless debugging), phone and PC on the same Wi-Fi.

To make the commands shorter, run this once in each PowerShell window:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
```

---

## ONE-TIME SETUP

### Step 1 - Enable Developer options on the phone
Settings > About phone > tap "Build number" 7 times

### Step 2 - Turn on Wireless debugging
Settings > System > Developer options > Wireless debugging > ON
(Phone and PC must be on the same Wi-Fi)

### Step 3 - Pair the phone with the PC
On phone: Wireless debugging > "Pair device with pairing code".
It shows a pairing IP:port and a 6-digit code. In PowerShell:

```powershell
& $adb pair <phone-ip>:<pairing-port> <pairing-code>
```
Expected: `Successfully paired to <phone-ip>:<pairing-port>`

### Step 4 - Connect using the port on the main Wireless debugging screen
(Under "IP address & Port" - this is different from the pairing port)

```powershell
& $adb connect <phone-ip>:<connect-port>
```
Expected: `connected to <phone-ip>:<connect-port>`

### Step 5 - Switch the phone to a fixed port (so the port stops changing)

```powershell
& $adb -s <phone-ip>:<connect-port> tcpip <fixed-port>
& $adb disconnect <phone-ip>:<connect-port>
& $adb connect <phone-ip>:<fixed-port>
```

### Step 6 - Verify

```powershell
& $adb devices -l
```
Expected: `<phone-ip>:<fixed-port>   device   model:<your-phone-model>`

---

## EVERY TIME (daily use)

From the project folder:

```powershell
.\connect-phone.ps1 -PhoneIp <phone-ip>
.\connect-phone.ps1 -PhoneIp <phone-ip> -FixedPort <fixed-port>   # if not using 5555
```

- Normally it connects straight to `<phone-ip>:<fixed-port>`.
- After a phone restart the fixed port is reset: the script asks for the port shown on
  the Wireless debugging screen, connects, and switches back to the fixed port.

Manual alternative (no script):

```powershell
& $adb connect <phone-ip>:<fixed-port>
```

---

## INSTALL THE TEST APP (app-debug.apk)

### Option A - Let Claude do it (mobile-mcp)
Ask Claude Code: "Install app-debug.apk on the connected Android device using mobile-mcp".
Claude calls `mobile_list_available_devices` to get the device id, then
`mobile_install_app` with the apk path (this runs `adb install` behind the scenes).

### Option B - Install manually with adb
From the project folder (where `app-debug.apk` is):

```powershell
# 1. Find the device id
& $adb devices -l

# 2. Install (-r = reinstall/update if already installed, keeps app data)
& $adb -s <device-id> install -r app-debug.apk
```
Expected: `Performing Streamed Install` then `Success`

If only one device is connected you can leave out `-s <device-id>`.

```powershell
# Check it is installed
& $adb -s <device-id> shell pm list packages com.qademo.qashop

# Launch the app
& $adb -s <device-id> shell monkey -p com.qademo.qashop -c android.intent.category.LAUNCHER 1

# Uninstall (for a clean install)
& $adb -s <device-id> uninstall com.qademo.qashop
```

Install errors:
- `INSTALL_FAILED_UPDATE_INCOMPATIBLE` - a version signed with a different key is installed:
  uninstall it first, then install again.
- `INSTALL_FAILED_USER_RESTRICTED` / install blocked - on the phone allow
  "Install via USB" / confirm the prompt on the phone screen.
- `INSTALL_FAILED_VERSION_DOWNGRADE` - add `-d`: `install -r -d app-debug.apk`

---

## USEFUL COMMANDS

```powershell
# List connected devices
& $adb devices -l

# Disconnect
& $adb disconnect <phone-ip>:<fixed-port>

# Restart adb if something gets stuck (then reconnect)
& $adb kill-server
& $adb start-server

# Mirror the phone screen on the PC (install once: winget install Genymobile.scrcpy)
scrcpy -s <device-id>
```

---

## TROUBLESHOOTING

- **Failed to connect**: check same Wi-Fi, Wireless debugging ON, phone unlocked.
- **"offline" device**: disconnect that entry, then connect again.
- **PC no longer under "Paired devices" on the phone**: repeat Step 3.
- **USB instead of Wi-Fi**: plug in the phone, turn on USB debugging in Developer options,
  accept the "Allow USB debugging" prompt, then use the serial number from
  `adb devices -l` as `<device-id>`. On Windows this may need the phone maker's USB driver.
- **Optional**: reserve the phone's IP in your router (DHCP reservation) so it never changes.
- **Inside Claude Code**: put `!` in front of a command to run it, e.g. `! .\connect-phone.ps1 -PhoneIp <phone-ip>`

---

## RUN THE AUTOMATED TEST (Mobilewright)

The happy-path order test lives in `tests/order.spec.ts`, with one page object per app
screen in `tests/pages/` (ProfilePage, ProductsPage, CartPage, CheckoutPage, ConfirmationPage).

Before running:
1. Install dependencies once: `npm install` (needs Node.js 22.12+).
2. Connect the phone (see above) and install the app (see INSTALL THE TEST APP).
3. **Unlock the phone and keep the screen on.** If the phone locks during the run, the app
   opens behind the lock screen and the test fails with "no matching element found".
   Either plug the phone in and turn on Developer options > "Stay awake", or set a longer
   screen timeout (Settings > Display > Screen timeout) while testing.

### Quick run (step by step)

Open PowerShell in the project folder and run:

```powershell
# 1. Install dependencies (first time only)
npm install

# 2. Connect the phone over Wi-Fi
.\connect-phone.ps1 -PhoneIp <phone-ip>

# 3. Check that Mobilewright can see the phone
npm run devices

# 4. Install the app (first time, or after a new build)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s <device-id> install -r app-debug.apk

# 5. Unlock the phone, then run the test
npm run test:order
```

Expected result:

```
Running 1 test using 1 worker
  ✓  1 tests\order.spec.ts › place an order with a coupon (3.0m)
  1 passed
```

### More run commands

npm scripts (defined in `package.json`):

```powershell
npm test                    # run all tests
npm run test:order          # run the order test, results in the terminal
npm run test:list           # list tests without running them
npm run typecheck           # check the TypeScript compiles (no phone needed)
npm run report              # open the HTML report of the last run
npm run devices             # list devices Mobilewright can see
npm run doctor              # check Node, Android SDK and adb setup
```

Or call Mobilewright directly for other options:

```powershell
npx mobilewright test tests/order.spec.ts           # one test file
npx mobilewright test --grep "coupon"               # tests whose name contains "coupon"
npx mobilewright test --list                        # list tests without running them
npx mobilewright test --reporter list               # show results in the terminal
npx mobilewright test --retries 1                   # retry a failed test once
npx mobilewright show-report                        # open the HTML report of the last run
npx mobilewright doctor                             # check Node, Android SDK and adb setup
```

- Results and screenshots of failures go to `test-results/`; the HTML report goes to
  `mobilewright-report/` (both are ignored by git).
- If more than one device is connected, set `deviceId: '<device-id>'` in `mobilewright.config.ts`.
- Over Wi-Fi each step reads the screen from the phone, so the test takes about 3 minutes.
- Inside Claude Code, prefix with `!`, e.g. `! npx mobilewright test tests/order.spec.ts --reporter list`

---

## TEST PROMPT - Happy path: place an order with a coupon (QA Shop)

Copy everything inside the box below and paste it into Claude Code.

```text
Use mobile-mcp. Call mobile_list_available_devices and use the connected Android device
(if more than one is listed, ask me which one to use).
If the phone is on the lock screen, swipe up to unlock it first.
Install app-debug.apk from the project folder and launch package com.qademo.qashop.

Happy path: place an order with a coupon (QA Shop)

Test data: Name - Michael, Email - michaelqa@mailinator.com, Country - India,
Interest - Electronics, Address - 221B MG Road, Coupon - QA20

1. Fill the profile form.
   - Enter the name in et_full_name and the email in et_email.
   - Pick India in spinner_country and check cb_electronics.
   - Tap btn_submit.
   - Expect the toast "Profile saved successfully!" and btn_shop_now visible.

2. Open Products.
   - Tap btn_shop_now.
   - Expect tv_products_greeting = "Hi Michael, happy shopping!"

3. Add two products.
   - Tap btn_add_to_cart on Wireless Headphones, then on Smart Watch.
   - Expect tv_cart_badge = "2".

4. Open the cart.
   - Tap layout_cart_icon.
   - Expect tv_cart_total = "Total: $208.99" (79.99 + 129.00).

5. Go to checkout.
   - Tap btn_checkout.
   - Expect tv_grand_total = "Grand Total: $208.99".

6. Apply the coupon and fill the address.
   - Enter QA20 in et_coupon, close the keyboard (BACK), then tap btn_apply_coupon.
   - Expect tv_discount_label = "Coupon applied: 20% off".
   - Expect tv_grand_total = "Grand Total: $167.19" (208.99 x 0.8 = 167.192).
   - Enter 221B MG Road in et_address, then close the keyboard.

7. Place the order.
   - Tap btn_place_order.
   - Expect tv_confirmation_title = "Order Placed Successfully!".
   - Expect tv_confirmation_id to match QA-[A-Z0-9]{8}.
   - Expect tv_paid_total = "Amount Paid: $167.19  (after 20% off)"
     (note: the app puts TWO spaces before "(after").
   - Save a screenshot as order-confirmation.png in the project folder.

Report each step as PASS/FAIL in a table with the expected vs actual text.
```
