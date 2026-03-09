# Stress Bubble QA Test Plan

## Environment

- Chrome stable
- Extension loaded via `chrome://extensions`
- Fresh profile or cleared extension storage for first-run cases

## Smoke Test

- Load unpacked extension successfully
- Extension icon appears in toolbar
- Popup opens without blank screen
- Opening a new tab shows Stress Bubble instead of default new tab

## New Tab Flow

- Home screen renders
- Tutorial appears on first run only
- Start `classic` run successfully
- Start `rage` run successfully
- Start `zen` run successfully
- Result screen appears after timer end or overload
- Replay returns to gameplay
- Home action returns to home screen

## Popup Flow

- Popup opens within acceptable time
- Start game from popup
- Finish run and see result screen
- Copy result action works
- Open fullscreen action opens New Tab game

## Persistence

- Best scores persist after reload
- Coins persist after reload
- Settings persist after reload
- Tutorial state persists after dismissal
- Achievements persist after unlock
- Shop selection persists after reload

## Settings

- Difficulty changes affect gameplay feel
- Reduced motion affects animation intensity
- High contrast changes HUD/readability colors
- Audio settings persist

## Economy And Progression

- Coins are granted after runs
- Daily challenge progress updates
- Daily reward can be claimed once
- Streak updates on valid run completion
- Achievement unlocks appear in results

## Reset

- Reset all data clears progression
- After reset, first-run tutorial can appear again
- After reset, scores and coins return to default state

## Regression Watchlist

- No blocker console errors in popup
- No blocker console errors in new tab
- Rank label and near-miss text are consistent between popup and new tab
- Difficulty behavior is consistent between popup and new tab
- No visual overflow or broken layout in popup size

## Submission Gate

Mark submit-ready only when:

- all smoke tests pass
- no blocker runtime errors remain
- screenshots are captured
- privacy policy host URL is prepared
- store listing copy is finalized
