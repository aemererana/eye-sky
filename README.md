# Eye Sky

Point your iPhone at the sky. When motion is detected, Eye Sky scans nearby ADS-B traffic and overlays flight information on the camera feed.

## Features

- Fullscreen rear-camera feed with motion detection (pixel-diff, 500ms interval)
- ADS-B lookup via [adsb.lol](https://api.adsb.lol) (25 NM radius)
- Flight info card anchored to the detected motion region
- 10-second fetch cooldown with on-screen countdown

## Run locally

```bash
npm install
npm run dev
```

The dev server runs over **HTTPS** and listens on your local network. API requests are proxied through the dev server to avoid CORS (`/api/adsb` → `api.adsb.lol`). On your iPhone:

1. Connect to the same Wi‑Fi as your Mac
2. Open the **`https://192.168.x.x:5173`** URL from the terminal — use the **Wi‑Fi / Network** address, **not** the Tailscale `100.x.x.x` address (iOS often refuses those self-signed certificates)
3. In Safari: when warned about the certificate, tap **Show Details** → **visit this website** (or Advanced → Proceed in Chrome)
4. Tap **Start** — camera and GPS prompts appear when you tap that button

### Manual coordinates on iPhone

The numeric keypad has no minus key. Enter positive numbers and tap **W** for west longitude or **S** for south latitude (defaults: N + W).

### iPhone Chrome camera permissions

If Chrome never asks for camera access or the site is missing from the permissions list:

1. **Use HTTPS, not HTTP** — `http://192.168.x.x` will block the camera entirely (no prompt, no permissions entry)
2. **Enable Chrome at the iOS level**: Settings → **Chrome** → **Camera** → **On**
3. **Reload the page** after changing settings, then tap **Start** again (iOS requires a tap to show the prompt)
4. If you previously denied access: Settings → **Chrome** → **Camera** (or reset site data in Chrome settings)

Safari is also supported and often easier for first-time camera permission on iOS.

## Build

```bash
npm run build
npm run preview
```

## Usage

1. Enter your latitude and longitude, then tap **Start**
2. Allow camera access
3. Point at moving aircraft in the sky — motion triggers a scan
4. The overlay follows the motion region and hides after 5 seconds without motion
