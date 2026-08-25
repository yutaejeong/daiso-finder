# daiso-finder-cli

Command line client for [Daiso Finder](https://daiso-finder.kr) — find Daiso stores
in South Korea and check in-store product stock, price, and shelf location.

No API key, no sign-up, no configuration.

```bash
npx daiso-finder-cli stores 강남
npx daiso-finder-cli store 11199
npx daiso-finder-cli products 11199 수세미
npx daiso-finder-cli product 1019373 11199
npx daiso-finder-cli nearby 37.4972 127.0279
```

## Options

| Option | Description |
|---|---|
| `--json` | Print the raw JSON response, for scripting |
| `--sandbox` | Call `/api/sandbox` fixture endpoints instead of live data |
| `--base-url <url>` | Point at another deployment (default `https://daiso-finder.kr`) |
| `--page <n>` | Page number (default 1) |
| `--page-size <n>` | Stores per page, max 10 (default 10) |
| `-h, --help` | Usage |
| `-v, --version` | Version |

`DAISO_FINDER_BASE_URL` overrides the default base URL as well.

## Exit codes

`0` on success, `1` on a usage error or a failed request. API errors are printed
with their machine-readable `code` and `hint` fields.

API documentation: <https://daiso-finder.kr/developers>
