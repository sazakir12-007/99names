# 99 Names · Asma ul-Husna

A static, offline mobile app showing the 99 Beautiful Names of Allah. It is a Progressive Web App (PWA) with no build step, packaged for Google Play and the App Store with [Capacitor](https://capacitorjs.com).

## Features

- **Arabic, transliteration, meaning and benefits of reciting** for all 99 names.
- **Show modes**: name only, name with meaning, or name with meaning and benefits. Use the pill in the top bar or Settings.
- **Classification**: thematic (Mercy, Majesty, Creation, Knowledge and more) or traditional Jalal / Jamal / Kamal, with filter chips and optional section grouping.
- **Layouts**: List, Grid, Cards (swipe), and a fullscreen Recite mode.
- **Auto scroll**: adjustable speed, auto-advancing cards, loop, and keeping the screen awake.
- **Themes**: Auto (follows the system), Ivory, Night, Sepia, Emerald, Midnight, Rose, Ocean and Black.
- **Fonts**: six Arabic fonts (Amiri, Scheherazade, Noto Naskh, Lateef, Kufi, Ruqaa), three text fonts, and separate size sliders.
- **Extras**: search (English or Arabic, with or without diacritics), favourites, a detail sheet with share, and offline support. Settings are remembered.

## Project layout

```
www/                  the app (deploy this folder as-is)
  index.html
  css/app.css
  js/names.js         data for the 99 names, themes and categories
  js/app.js           app logic
  fonts/              bundled Arabic and Latin fonts (SIL OFL)
  icons/              PWA icons
  sw.js               offline service worker
assets/icon-only.png  1024px source icon for native app icons
capacitor.config.json
```

## Run locally

```sh
npm run serve        # http://localhost:8080
```

Alternatively, serve `www/` with any static server.

> When you change files in `www/`, bump `VERSION` in `www/sw.js` so installed copies update.

## Publish as a website or PWA

`.github/workflows/pages.yml` deploys `www/` to GitHub Pages on every push to `main`. To turn it on, go to **Settings → Pages → Source → GitHub Actions**. On a phone, open the site and choose **Add to Home Screen**.

## Publish to the app stores

```sh
npm install
npm run android      # creates android/ and generates its icons
npm run ios          # creates ios/ (needs a Mac with Xcode)
npm run sync         # after any change in www/
npm run open:android # build or sign in Android Studio and upload to Google Play
npm run open:ios     # archive in Xcode and upload to App Store Connect
```

- Change `appId` in `capacitor.config.json` to your own reverse-domain ID before the first release.
- **Google Play** needs a one-time $25 developer account.
- **App Store** needs an Apple Developer account ($99/year). Apple can reject apps that are "just a website", so the offline content, settings and native icons help here.
- Commit the generated `android/` and `ios/` folders.

## About the content

The benefits of recitation come from traditional devotional literature. Except where a hadith is cited, they are not established by authentic hadith; the app's About sheet says this too. The Jalal / Jamal / Kamal grouping is interpretive, and scholars differ on some names.
