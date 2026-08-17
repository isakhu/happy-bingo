# Happy Bingo seller licensing

Happy Bingo uses an offline signed license. The Windows application contains only the public verification key. The private signing key must never be committed to GitHub.

## Generate a customer license

1. Get the customer's Machine ID from the activation screen.
2. Keep `Happy-Bingo-License-Private-Key.pem` private.
3. Set the environment variable `HAPPY_BINGO_PRIVATE_KEY_FILE` to that file.
4. Run:

```bash
node tools/generate-license.cjs HB-XXXXXXXXXXXXXXX
```

Optional expiry date:

```bash
node tools/generate-license.cjs HB-XXXXXXXXXXXXXXX 2027-12-31
```

Give the resulting `HBG1....` license key to the customer. It works only on the matching Machine ID and, when an expiry is supplied, only until that date.

## Security rule

Never upload the private key to GitHub, GitHub Actions, the installer, or the customer PC. The application verifies the signed key using its embedded public key.
