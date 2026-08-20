# Happy Bingo Audit Test Checklist

## Authentication
- Launch fresh install.
- Confirm FIRST-TIME SETUP appears only when no password record exists.
- Confirm wrong default password is rejected.
- Confirm mismatched new passwords are rejected.
- Confirm correct password closes the gate without a renderer reload.
- Close and reopen the application; confirm the created password is required.
- Confirm wrong unlock password never opens the app.

## Startup / offline
- Disconnect internet before launch.
- Confirm no yellow/orange startup screen.
- Confirm no blank/blue startup failure screen on a healthy install.
- Confirm a real startup failure displays an explicit diagnostic instead of silently substituting test data.

## Cartellas
- Card Setup installs the .hbc set.
- Main app loads exactly 100 cards.
- Selection grid shows 001-100.
- Clicking cards toggles selection and the count changes immediately.
- Start Game requires at least one selected card.
- Invalid card sets are rejected.

## Gameplay
- Start voice plays chewatawu.mp3.
- Calls are only 1-15 B, 16-30 I, 31-45 N, 46-60 G, 61-75 O.
- No number repeats.
- Call gap follows Settings.
- Pause stops automatic calls.
- Pause voice plays pause.mp3.
- Resume continues normally without duplicate Resume handlers.
- End Game clears the active game state.

## Bingo verification
- CHECK is available only while paused.
- Manager can inspect an active Cartella.
- Called cells and FREE are marked.
- Rows, columns, either diagonal and four corners are detected.
- Valid Bingo plays Goodbingo.mp3 and shows the full 5x5 winning card.
- Invalid Bingo does not auto-lock the player.
- Manager can explicitly lock the failed player and cartellawu.mp3 plays.
- A locked Cartella cannot win again.

## Audio
- Voice health reports all 79 files.
- Missing files produce an explicit error.
- No CDN, HTTP, or absolute filesystem audio URL is required.

## Settings
- Existing Settings functionality remains unchanged except for bug fixes.
- Black Settings appearance remains in place; no navy Settings redesign is introduced.

## Windows packaging
- `npm run dist` completes.
- Installer `.exe` is produced.
- Packaged app opens normally.
- Packaged app can complete authentication and reach Cartella selection.
