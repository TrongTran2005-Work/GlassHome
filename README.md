# Glassboard 4.0

Apple-inspired Liquid Glass homepage extension for Chromium browsers (Chrome, Edge, Brave, etc.). Built with Manifest V3 and no build step.

## Features

- Live clock, date, greeting and 12/24-hour option.
- Frosted glass clock panel and adjustable digit spacing.
- Dynamic Island with animated status waveform.
- Google search with live suggestion dropdown (internet required).
- macOS-inspired Dock with add/edit/delete links and favicon, image URL, uploaded image or glyph icons.
- Weather via Open-Meteo (internet required).
- Autosaving private notes.
- Entertainment widget with flying emoji particles and persistent counter.
- Bookmark manager for saved bookmarks and browser bookmarks.
- Custom wallpaper via local image or URL, blur and dim controls.
- Light/dark theme, widget visibility and custom greeting name.
- Adjustable Liquid Glass strength slider.
- Free positioning mode: drag the clock area, Dynamic Island, function rail, search, each right-side widget independently, and the Dock. Positions are saved locally.
- Responsive full-screen layout with no page scrolling.

## Install in Chrome

1. Extract the ZIP archive.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `glassboard-v3` folder (the folder containing `manifest.json`).

## Install in Microsoft Edge

1. Extract the ZIP archive.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `glassboard-v3` folder.

## Free positioning

Open **Tùy chỉnh** → enable **Bật sắp xếp**. Close the settings drawer, then drag the outlined areas. Reopen settings and choose **Hoàn tất** to leave positioning mode. The position is saved automatically.

## Offline and online behavior

The layout, CSS, JavaScript, icons and local settings work offline. Weather, Google search suggestions, remote website favicons and wallpaper URLs require an internet connection. Local wallpapers and uploaded Dock icons are stored locally.

## Data

Preferences, notes, links, custom bookmarks, wallpaper data and layout coordinates are stored in browser local extension storage. Nothing is sent to a Glassboard server.
