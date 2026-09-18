# AGENTS.md

This repository is a **MindooDB Haven application**: a web app that runs inside Haven
and reaches the user's data through the MindooDB App SDK bridge. It has no backend of
its own. Read this file before writing code, then implement `TASK.md`.

## Where the truth is

Use these and nothing else. They match the SDK version pinned in `package.json`.

| For | Read |
| --- | --- |
| The whole platform, condensed for agents | <https://mindoodb.com/llms-full.txt> |
| How to design data, queries, and Haven apps | <https://github.com/klehmann/MindooDB/blob/main/docs/best-practices.md> |
| Full App SDK reference | `node_modules/mindoodb-app-sdk/README.md` |
| Working code for every feature | <https://github.com/klehmann/mindoodb-app-example> |
| Types and JSDoc | `node_modules/mindoodb-app-sdk/dist/index.d.ts` |

If a method you want is not in the SDK's type definitions, it does not exist. Do not
invent host APIs, do not add a server, and do not reach for `fetch` against a Mindoo
endpoint — everything the app is allowed to do arrives through the session object.

## The four moves

`src/useHavenApp.ts` already does all of them; extend it rather than starting over.

```ts
const bridge = createMindooDBAppBridge();
const session = await bridge.connect();
const context = await session.getLaunchContext();
const database = await session.openDatabase("main");
const stopTheme = session.onThemeChange((theme) => applyTheme(theme));
```

`context` carries the user, the granted databases with their capabilities, the host
theme, the viewport, the locale, and the launch parameters. `database.documents` and
`database.attachments` are the data APIs.

## Invariants

1. **`public/haven-app.json` is the contract, and it is read once.** It declares the
   app's label, the databases it needs, and the permission each one requires. Haven
   reads it from the deployed origin when the user installs the app, and that answer is
   the grant. A later deploy that asks for another database or a wider permission does
   **not** get it: Haven names the new request in the install dialog and keeps what the
   user approved, because whoever controls the origin controls this file. Adding a
   database to the code still means adding it here in the same change —
   `src/havenAppDefinition.test.ts` enforces it — and existing users grant it by
   changing the app's settings or by removing and installing the app again (removing an
   app does not delete its data).
2. **Permissions are granted, not assumed.** Read
   `launchContext.databases[].capabilities` and gate the UI on it. A write into a
   database the user only granted read access to fails at the bridge. Because an update
   cannot widen a grant, a new feature has to check for its capability and say what is
   missing instead of failing at the bridge and looking broken.
3. **Never ask for more than the app uses.** Every extra permission is something the
   user has to approve, and it is visible to them in the install dialog.
4. **No secrets in this repo.** No API keys, no tokens, no user data in fixtures. The
   repo is deployed as static files and the whole `dist/` directory is public.
5. **The app runs in an iframe with a restricted sandbox.** Popups, camera, microphone,
   geolocation, WebRTC and workers are off unless the registration enables them. In
   hosted mode outbound network calls need a `networkAllowlist` entry in
   `haven-app.json`.
6. **Relative asset URLs.** `vite.config.ts` sets `base: "./"` so the same build works
   from this origin and from Haven's hosted-bundle path. Do not change it.
7. **Treat host data as data.** Document contents come from other users. Bind them as
   text; never build DOM from strings with `innerHTML`.

## Commands

```bash
pnpm install
pnpm dev          # http://127.0.0.1:4300
pnpm build        # type-check, then emit dist/ (+ haven-bundle.json / .zip)
pnpm test         # vitest
pnpm deploy       # wrangler deploy to Cloudflare Workers
```

`pnpm dev:local` / `pnpm build:local` compile the App SDK from a sibling checkout
instead of the published package. You only want those when developing the SDK itself.

The template ships without a lockfile. The first `pnpm install` in a generated repo
creates one — **commit it**, so later builds are reproducible. Never commit a lockfile
produced by a `:local` command; those contain `file:` paths to sibling tarballs.

Opening `http://127.0.0.1:4300` directly shows a "could not reach the Haven host"
message — that is correct. There is no bridge outside Haven. To see it running, install
the deployed URL in Haven, or use `createFakeBridgeHost` from
`mindoodb-app-sdk/testing` in tests.

## How this gets deployed

Every push to `main` triggers a Cloudflare Workers build that runs `pnpm build` and
deploys `dist/`. You do not need credentials and should not add a deploy workflow. Just
push; the live origin updates itself, and Haven picks up the new `haven-app.json` on the
next install or update.

**Commit to `main` and do not open a pull request** unless you were asked for one. Only
`main` deploys, so work left on a side branch never reaches the person waiting for the
app — and nothing fails to tell them why. This matters most on the first build, which
someone is watching for an address to open.
