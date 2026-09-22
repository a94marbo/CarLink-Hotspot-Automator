# CarLink Hotspot Automator

**CarLink Hotspot Automator** is an intelligent vehicle-tethering management application that automatically turns on your smartphone's Wi-Fi hotspot when your car's Bluetooth connects, and turns it off after a safe delay when you leave the vehicle.

---

## Visual Identifiers

The application features a dynamic visual indicator that updates in real time:

| State | Visual Badge | Description |
| :--- | :--- | :--- |
| **Active (Broadcasting)** | Cyan Wi-Fi waves, white car, green cycle arrows & green gear | Hotspot is actively enabled and broadcasting your Wi-Fi SSID to in-car head units and passenger devices. |
| **Inactive (Standby / Off)** | Slate car, muted grey signal waves, red **X** over gear | Hotspot is disabled. The app is in standby mode monitoring Bluetooth connections. |

*Note: The browser tab favicon and mobile bookmark icon automatically sync to reflect whether the hotspot is actively broadcasting or on standby.*

---

## Key Features

1. **Intelligent Connection Delay**
   - Configurable connection timer (default: **10 seconds**).
   - Prevents premature hotspot broadcasting while your car's infotainment system, Android Auto, or Apple CarPlay boots and stabilizes.

2. **Smart Disconnect Grace Period**
   - Configurable disconnect grace timer (default: **5 minutes**).
   - Keeps your hotspot alive during quick stops (e.g., refueling at gas stations, running into a convenience store, or engine stop-start stalls).
   - If your car's Bluetooth reconnects during this countdown, the shutdown timer is automatically cancelled and continuous connectivity is preserved.

3. **Bluetooth Device Filtering**
   - Scan for nearby Bluetooth devices via Web Bluetooth or select from configured vehicle profiles.
   - Mark specific devices (e.g., your car's Bluetooth or OBD-II adapter) as automation triggers while ignoring wireless headphones or smartwatches.

4. **Live Connected Client Monitoring**
   - View connected devices, assigned IP addresses, MAC addresses, connection duration, and simulated data usage (MB).

5. **Battery & Power Protection**
   - Set a minimum battery percentage threshold (e.g., 20%) to prevent discharging your phone if it is not plugged into an in-car charger.

6. **Interactive Car Trip Simulator**
   - Test your configured timings in a safe sandbox:
     - Turn on ignition and connect to car Bluetooth.
     - Observe the countdown timer.
     - Verify hotspot activation and client connection.
     - Turn off engine and verify the graceful 5-minute disconnect buffer.
     - Fast-forward countdowns with a single click.

7. **Audit & Activity Log**
   - Complete historical log of Bluetooth handshakes, timer start/cancel events, hotspot activations, and configuration changes with export capabilities.

8. **Exportable Native Profiles**
   - Ready-to-use profiles and configuration guides for **Android Tasker**, **Samsung Modes & Routines**, **MacroDroid**, and **Apple iOS Shortcuts**.

---

## User Manual

### 1. Initial Setup & Pairing

1. **Open the Dashboard**: Navigate to the application.
2. **Review Paired Devices**:
   - In the **Bluetooth Devices** section, look for your vehicle (e.g., *BMW iDrive*, *Tesla Model 3*, *Ford SYNC*, or *Audi MMI*).
   - Toggle the **Hotspot Trigger** switch to **ON** for your vehicle.
   - To add a real Bluetooth device from your computer or phone, click **Scan Nearby Bluetooth** and grant browser Bluetooth permissions.

### 2. Configuring Timers & Delays

1. Click the **Settings** button (gear icon) in the top-right header.
2. **Connect Trigger Delay**:
   - Set how many seconds to wait after Bluetooth connects before activating the hotspot (Recommended: `10`–`15` seconds).
3. **Disconnect Delay (Grace Period)**:
   - Set how many minutes to keep the hotspot active after leaving the car (Recommended: `5` minutes).
4. **Auto-Cancel If Reconnected**:
   - Keep this enabled so that returning to the car before the 5-minute timer expires seamlessly keeps your hotspot running without restarting the sequence.
5. **Battery Protection**:
   - Set a battery shutoff threshold (e.g. `20%`) to preserve phone power.
6. Click **Save Settings**.

### 3. Testing with the Trip Simulator

1. Click **Trip Simulator** in the header to expand the simulator banner.
2. Select your car from the dropdown.
3. Click **Turn On Ignition (Connect)**:
   - Notice the amber badge: `Triggering in 10s`.
   - Wait 10 seconds (or click **Skip / Fast-Forward Timer**).
   - The status transitions to **Broadcasting (ON)** and displays the glowing cyan **Active Icon**.
4. Click **Turn Off Car (Disconnect)**:
   - Notice the orange countdown badge: `Disconnecting in 5m 00s`.
   - If you click **Turn On Ignition (Reconnect)** during the countdown, the shutdown timer aborts and the hotspot stays active.
   - If the countdown reaches 0s, the hotspot turns off and the badge switches to the **Inactive Icon** with the red X gear.

### 4. Manual Overrides

- **Force Start Hotspot**: Click the **Turn On Hotspot** button in the main card at any time to bypass Bluetooth detection.
- **Abort Countdown**: Click the **Cancel Timer** button during a connect or disconnect countdown to immediately stop the timer.
- **Force Stop**: Click **Turn Off Hotspot** to immediately disable broadcasting.

---

## Native Phone Automation Setup

Web applications run in browser sandboxes. To enable native, zero-interaction background automation on your phone:

### Android Tasker (Recommended)
1. Click **Phone Guide** in the top navigation bar.
2. In the **Android Tasker** tab, click **Download Tasker Profile (.xml)**.
3. Open the **Tasker** app on your phone.
4. Long-press the **PROFILES** tab and select **Import Profile**.
5. Select the downloaded `carlink_hotspot_profile.prf.xml`.
6. Ensure Tasker is granted the *Write Secure Settings* or *Tethering* permission.

### Samsung Modes & Routines
1. Open **Settings** > **Modes and Routines** on your Samsung Galaxy device.
2. Tap **+** to create a new routine.
3. **If (Condition)**: Tap *Bluetooth device* > Select your car's Bluetooth > Choose *Connected*.
4. **Then (Action)**:
   - Add action: *Wait* > set to `10 seconds`.
   - Add action: *Connections* > *Mobile Hotspot* > set to `On`.
5. **When routine ends**:
   - Add action: *Wait* > set to `300 seconds` (5 minutes).
   - Add action: *Mobile Hotspot* > set to `Off`.

### Apple iOS Shortcuts
1. Open the **Shortcuts** app on your iPhone.
2. Tap the **Automation** tab > **Create Personal Automation**.
3. Select **Bluetooth** > choose your car's Bluetooth device > check **Is Connected** > select **Run Immediately**.
4. Add action: **Wait** `10 seconds`.
5. Add action: **Set Personal Hotspot** > **On**.
6. Create a second automation for **When Bluetooth Disconnects**:
   - Add action: **Wait** `300 seconds`.
   - Add action: **Set Personal Hotspot** > **Off**.

---

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Bluetooth**: Web Bluetooth API integration
- **Build Tool**: Vite

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Sync web build to native Android project
npm run cap:sync
```

---

## GitHub Actions APK Testing & Build Workflow

The repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/apk-build-test.yml`) that automatically tests and builds installable Android APKs.

### How It Works:
1. **Validation & Test**: Compiles TypeScript, runs project linters, and verifies the web application build.
2. **Android Setup**: Provisions JDK 21 and the Android SDK on an `ubuntu-latest` runner.
3. **Unit Testing**: Executes Android unit tests via `./gradlew testDebugUnitTest`.
4. **APK Compilation**: Assembles `CarLink-Hotspot-Automator-debug.apk` (and unsigned/signed release APKs).
5. **Artifact Publishing**: Uploads the finished APK and SHA-256 checksums to the GitHub Actions run page with a 30-day retention.

### Triggering the Workflow:
- **Automatic**: Every `git push` or `pull request` to `main` or `master`, or when a version tag (`v1.0.0`) is pushed.
- **Manual (Dispatch)**:
  1. Go to the **Actions** tab in your GitHub repository.
  2. Select **Test & Build Android APK** from the left sidebar.
  3. Click **Run workflow**, choose your branch, select your preferred build type (`debug`, `release`, or `both`), and click **Run workflow**.
  4. Once complete, scroll to the **Artifacts** section at the bottom of the summary page to download `carlink-hotspot-automator-apk.zip`.

---

## GitHub CodeQL Security Scanning

The repository includes `.github/workflows/codeql.yml` configured with **CodeQL Action v4** and **Advanced Setup**:
- **JavaScript / TypeScript**: Analyzed with fast static parsing (`build-mode: none`).
- **Java / Android**: Analyzed with full compiler tracking (`build-mode: manual`) via Gradle and the Android SDK. This ensures 100% type and symbol resolution without missing JAR warnings.

> **Important — If you see "CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled"**:
> 1. In your GitHub repository, open **Settings** > **Code security and analysis**.
> 2. Under the **Code scanning** section, look for **CodeQL analysis**.
> 3. Click the three dots (`...`) next to CodeQL / Default Setup and select **Disable** (or switch to **Advanced**).
> 4. Once Default Setup is disabled, GitHub will accept and display the results from `.github/workflows/codeql.yml` without rejecting the SARIF file.


