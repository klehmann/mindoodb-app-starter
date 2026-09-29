# MindooDB Haven app

A web app that runs inside [MindooDB Haven](https://mindoodb.com/haven) and reaches the
user's data through the MindooDB App SDK. Static files only — there is no backend.

## Run it

```bash
pnpm install
pnpm dev          # http://127.0.0.1:4300
```

Opening that URL directly shows the app's landing page: what the app is, taken from
`listing` in `public/haven-app.json`, and a button that opens Haven with this app ready
to install. That is also what anyone sees who gets the deployed URL in a message. The
app itself only runs when Haven launches it, because it talks to Haven over a
postMessage bridge.

To run the app without Haven, open the test URL <http://127.0.0.1:4300/__haven-test/>.
It frames the app with a mock Haven: seeded data from `src/testHost/seed.ts`, toggles
for theme and host focus, a picker for what the next document scan returns, and a log of
notifications, previews and requests. Point Playwright at the same URL. The test URL is
never part of a production build; set `HAVEN_TEST_HOST=1` to include it in a preview
deployment.

## Deploy it

```bash
pnpm deploy       # wrangler deploy to Cloudflare Workers
```

If this repository was created by the MindooDB app builder, pushes to `main` already
deploy themselves through Cloudflare Workers Builds and you can skip this.

## Install it in Haven

Haven installs an app from a single URL. It reads `haven-app.json` from the deployed
origin, shows the user which databases and permissions the app asks for, and registers
it once they confirm.

That makes `public/haven-app.json` the contract. It has to match what the app actually
does:

```json
{
  "format": "mindoodb.haven.app",
  "formatVersion": 1,
  "appId": "mindoodb-app-starter",
  "label": "MindooDB App Starter",
  "databases": [{ "logicalDatabaseId": "main", "label": "Main", "permissions": ["write"] }]
}
```

`src/havenAppDefinition.test.ts` fails if the file drifts from the code. Every
permission listed here is one the user has to approve, so ask for the minimum.

## Layout

| Path | What it is |
| --- | --- |
| `src/useHavenApp.ts` | The entire Haven integration: connect, launch context, databases, theme |
| `src/App.vue` | Welcome screen — replace this with the actual app |
| `public/haven-app.json` | The install contract Haven reads from the deployed origin, plus the `listing` shown on the landing page and in Haven's setup wizard |
| `src/main.ts` | Runs the app when Haven launched it, otherwise shows the landing page |
| `__haven-test/`, `src/testHost/` | The test URL: the app framed by a mock Haven, with seed data |
| `public/_headers` | CORS for the files Haven fetches cross-origin |
| `wrangler.jsonc` | Cloudflare Workers static-asset config |
| `AGENTS.md` | Ground rules and doc pointers for coding agents |
| `TASK.md` | What this app is supposed to become |

## What the builder filled in

If the MindooDB app builder created this repository, it rewrote the app's identity in
four places at creation time. They must stay consistent with each other:

| File | Field |
| --- | --- |
| `package.json` | `name` |
| `wrangler.jsonc` | `name` (the Worker, and therefore the URL) |
| `public/haven-app.json` | `appId`, `label`, `description`, `listing.summary` |
| `TASK.md` | the description you typed |

## Docs

- <https://mindoodb.com/llms-full.txt> — the platform, condensed
- <https://github.com/klehmann/MindooDB/blob/main/docs/best-practices.md> — how to design data, queries, and Haven apps
- `node_modules/mindoodb-app-sdk/README.md` — full SDK reference
- <https://github.com/klehmann/mindoodb-app-example> — working code for every SDK feature

## License

Not set. This repository is yours; add the license you want before publishing it.
