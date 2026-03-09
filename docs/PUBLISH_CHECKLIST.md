# Stress Bubble Publish Checklist

## Extension package

- `manifest.json` includes `action`, `icons`, `chrome_url_overrides`, and `storage`
- icon files exist and match manifest paths
- popup loads from `src/popup/popup.html`
- new tab loads from `src/newtab/newtab.html`

## QA

- new tab flow: home -> play -> result -> replay
- popup flow: open -> play -> result
- score, coins, streak, achievements, and settings persist after reload
- reset data clears stored progress
- no blocker console errors in popup or new tab
- rank label and near-miss text match between popup and new tab
- difficulty and accessibility settings affect both entry points consistently

## Store metadata

- short description
- full description
- extension icon
- popup screenshot
- new tab screenshot
- result screen screenshot
- settings screenshot
- privacy policy URL or hosted page
- reviewer notes for new tab override behavior

## Policy review

- only `storage` permission requested
- no remote code
- no unnecessary host permissions
- privacy form matches actual local data usage
- privacy policy contact section is finalized
