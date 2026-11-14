# Glassboard 3.0 — Liquid Dashboard

Homepage / New Tab extension for Google Chrome and Microsoft Edge. Built with Manifest V3, plain HTML, CSS and JavaScript. The interface assets and styles are local; only weather, remote wallpapers/icons and automatic website favicons need an internet connection.

## Included features
- Apple-inspired Liquid Glass dashboard with responsive single-screen layout.
- Live clock, Vietnamese date and time-based greeting; optional 12-hour clock and display name.
- Centered Dynamic Island with animated status indicator.
- Google search.
- macOS-style dock with add, edit and delete; automatic favicon, image URL, uploaded image, or text/emoji glyph.
- Weather by city using Open-Meteo.
- Quick notes saved locally.
- Little Joy counter with a full-screen burst of flying emoji and sparkles.
- Settings drawer: theme, widget visibility, Dynamic Island highlight, custom emoji, wallpaper upload/URL, blur and dim controls.
- Bookmark manager: search native browser bookmarks and add/delete local custom bookmarks.
- Local browser storage; no account or backend required.

## Install in Chrome
1. Extract `glassboard-v3.zip` to a folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted `glassboard-v3` folder.
5. Open a new tab.

## Install in Edge
1. Extract the ZIP.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted folder.
5. Open a new tab.

## Notes
- Weather data comes from Open-Meteo and requires internet access.
- Website favicons and remote icon/wallpaper URLs require internet access.
- Uploaded wallpaper and uploaded Dock icons are stored in extension local storage. Very large images are limited to 5 MB for wallpaper and 1 MB for Dock icons.
- Notes, preferences, custom links, and custom bookmarks remain on this browser profile.
- CSS, JavaScript, interface icons, and layout do not load external fonts or stylesheets.
