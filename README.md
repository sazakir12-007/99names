# Asma ul Husna

A static, offline mobile app showing the 99 Beautiful Names of Allah. It is a Progressive Web App (PWA) with no build step, packaged for Google Play and the App Store with [Capacitor](https://capacitorjs.com).

## Features

- **Arabic, transliteration and meaning** for all 99 names, each with an explanation, Qur'an references (linked to quran.com), benefits backed by hadith or Qur'an with their sources, and notes on where each name is established.
- **Show modes** (in Settings): name only, name with meaning, or name with meaning and details.
- **Classification**: thematic (Mercy, Majesty, Creation, Knowledge and more) or traditional Jalal / Jamal / Kamal, with filter chips and optional section grouping.
- **Layouts**: List, Grid and Cards (swipe), plus an About page.
- **Auto scroll**: adjustable speed, auto-advancing cards, loop, and keeping the screen awake.
- **Themes**: Auto (follows the system), Ivory, Night, Sepia, Emerald, Midnight, Rose, Ocean and Black.
- **Fonts**: six Arabic fonts (Amiri, Scheherazade, Noto Naskh, Lateef, Kufi, Ruqaa), three text fonts, and separate size sliders.
- **Extras**: search (English or Arabic, with or without diacritics), favourites, a detail sheet with share, and offline support. Settings are remembered.

## Project layout

```
www/                  the app (deploy this folder as-is)
  index.html
  css/app.css
  js/names.js         generated data (do not edit; see below)
  js/app.js           app logic
  fonts/              bundled Arabic and Latin fonts (SIL OFL)
  icons/              PWA icons
  sw.js               offline service worker
assets/icon-only.png  1024px source icon for native app icons
data/asma_ul_husna.json  names, explanations, references and benefits
data/categories.json     thematic and Jalal/Jamal/Kamal categories per name
scripts/build-data.py    builds www/js/names.js from the data files
capacitor.config.json
```

## Editing the content

Edit `data/asma_ul_husna.json` or `data/categories.json`, then run:

```sh
python3 scripts/build-data.py
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

Benefits are given only where an authentic text (Qur'an or hadith) supports them, with the source shown; popular "recite X times for Y" claims are left out because they lack authentic sources. The list follows Sunan at-Tirmidhi 3507. Have a scholar proofread the content before a store release. The Jalal / Jamal / Kamal grouping is interpretive, and scholars differ on some names.
