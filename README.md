# Happy Bingo

Offline Windows Bingo caller and management software for printed paper Bingo cards.

## Product rules

- 75-number Bingo: B 1–15, I 16–30, N 31–45, G 46–60, O 61–75.
- Main caller board has five rows with 15 fixed number boxes per letter.
- Called numbers are highlighted and marked with a check.
- Automatic calling every 5 seconds.
- Manager can pause/resume the caller.
- Up to 100 active physical cards per game.
- Cards are identified as 001–100 and can be selected manually from a 10×10 manager grid.
- Winning patterns: horizontal row, vertical column, either diagonal, or four corners.
- Manager verifies a shouted Bingo by entering the physical card number.
- A valid Bingo ends the game and displays GOOD BINGO with the prize.
- Default entry fee is 10 Birr and can be changed before starting a game.
- Manager share is fixed at 20%; prize pool is fixed at 80%.
- Demo cards are included. Customers can replace them with their existing 100 cards using the standard CSV template.
- Replacing the card set requires the administrator password.
- Cards can be printed/reprinted from the application.
- The application is designed to work offline.

## Current implementation

The repository contains the Electron + React + TypeScript desktop foundation, Bingo caller, automatic timer, card manager, card validation/import, Bingo verification, money calculations, and Windows NSIS packaging configuration.

## Card CSV format

The standard header is:

`Card ID,B1,B2,B3,B4,B5,I1,I2,I3,I4,I5,N1,N2,N3,N4,N5,G1,G2,G3,G4,G5,O1,O2,O3,O4,O5`

Use `FREE` at the N3 position. Exactly 100 cards (001–100) are required for an import.

## Development

```bash
npm install
npm run dev
```

## Windows installer

```bash
npm run dist
```

The installer is produced as `Happy-Bingo-Setup-<version>.exe`.

## Important next production tasks

1. Test the complete game on Windows with real paper cards.
2. Add offline Amharic voice audio files and voice controls.
3. Add persistent game history/financial reports.
4. Add secure first-run license/customer activation if required for commercial sales.
5. Add backup/restore for customer card sets and settings.
6. Finalize print layouts for the customer's actual printer/paper.
7. Run a production build and installer test before selling.
