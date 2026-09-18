# MindooDB Haven app

A web app that runs inside [MindooDB Haven](https://mindoodb.com/haven) and reaches the
user's data through the MindooDB App SDK. Static files only — there is no backend.

## Run it

```bash
pnpm install
pnpm dev          # http://127.0.0.1:4300
```

Opening that URL in a plain browser tab shows "could not reach the Haven host". That is
correct: the app talks to Haven over a postMessage bridge that only exists when Haven
launches it. To see it for real, deploy it and install the URL in Haven.

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
| `public/haven-app.json` | The install contract Haven reads from the deployed origin |
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
| `public/haven-app.json` | `appId`, `label`, `description` |
| `TASK.md` | the description you typed |

## Docs

- <https://mindoodb.com/llms-full.txt> — the platform, condensed
- <https://github.com/klehmann/MindooDB/blob/main/docs/best-practices.md> — how to design data, queries, and Haven apps
- `node_modules/mindoodb-app-sdk/README.md` — full SDK reference
- <https://github.com/klehmann/mindoodb-app-example> — working code for every SDK feature

## License

Not set. This repository is yours; add the license you want before publishing it.
