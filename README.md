# Eye Sky

Point your iPhone at the sky. When motion is detected, Eye Sky scans nearby ADS-B traffic and overlays flight information on the camera feed.

## Features

- Fullscreen rear-camera feed with motion detection (pixel-diff, 500ms interval)
- ADS-B lookup via [adsb.lol](https://api.adsb.lol) (10 NM radius)
- Flight info card anchored to the detected motion region
- 10-second fetch cooldown with on-screen countdown

## Run locally

```bash
npm install
npm run dev
```

Open the dev server URL on your iPhone (same network). Camera access requires HTTPS or localhost.

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
