# App prototype

An interactive English language prototype for account creation and onboarding.

## Run locally

Open `index.html` directly in a browser, or run a local web server in this folder.

The prototype stores one demo account in the browser using local storage. Verification codes are displayed in a temporary message on screen instead of being sent by email.

## Test on iPhone

Keep the local server running, connect the Mac and iPhone to the same Wi-Fi, then open `http://172.16.11.216:4174/` in Safari on the iPhone. Use Share > Add to Home Screen to install the web app icon.

Apple Health and Apple Watch data are not available to this browser version. Pages show `No data source available` until the future native iOS version receives HealthKit permission; manual records continue to work locally.
