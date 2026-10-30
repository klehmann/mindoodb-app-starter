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
| Testing: test host, Vitest mocks, Playwright | `node_modules/mindoodb-app-sdk/TESTING.md` |
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
const database = await session.openDatabase(/* id from public/haven-app.json */);
const stopTheme = session.onThemeChange((theme) => applyTheme(theme));
```

`context` carries the user, the granted databases with their capabilities, the host
theme, the viewport, the locale, and the launch parameters. `database.documents` and
`database.attachments` are the data APIs. The id you pass to `openDatabase` is
`defaultLaunchDatabaseId` in `public/haven-app.json` (exported as `MAIN_DATABASE_ID`
from `src/useHavenApp.ts`) — do not hardcode `main`.

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
   `haven-app.json`. The frame's own storage is small (about 1 GB on iOS): for
   large local files (offline maps, media caches) request `allowFiles` and use
   `session.localFiles`, which Haven keeps encrypted in its own storage — see
   "Large files on the device" in llms-full.txt. Check `state()` and fall back when it
   is not `available`.
6. **Relative asset URLs.** `vite.config.ts` sets `base: "./"` so the same build works
   from this origin and from Haven's hosted-bundle path. Do not change it.
7. **Ship a workspace icon.** Haven looks for `public/appicon.png` (or
   `appicon.webp` / `appicon.svg`) after installing a hosted bundle. Generate a
   512×512 PNG that matches this app's theme and purpose — not a generic rocket
   or placeholder. Vite copies `public/` into `dist/`, so the file lands at the
   bundle root. Commit the PNG and delete the template's placeholder
   `appicon.svg`. The landing page and Haven's setup wizard find it there too; set
   `listing.icon` in `haven-app.json` only for an icon under a different name.
8. **Keep the listing honest.** `listing` in `haven-app.json` is what people see
   before they install: the landing page at the app's own URL and Haven's setup
   wizard both show its `summary`, `description`, `icon` and `screenshots`. Describe
   what the app actually does, in plain words. It grants nothing and is never shown
   inside the running app.
9. **Treat host data as data.** Document contents come from other users. Bind them as
   text; never build DOM from strings with `innerHTML`.
10. **Usable without a mouse and without sight.** Haven makes the app's frame reachable
    for screen readers and the keyboard; what happens inside is this app's job. See
    *Accessibility* below.
11. **Every text in every language Haven speaks.** Each user-facing string ships in en,
    de, es, fr, it, nb, nl and pl — never only English, never only English and German.
    See *Languages* below.

## Accessibility

Haven announces the frame by the app's label, puts it where its tile is for VoiceOver
and TalkBack, and makes the tile the Tab stop that hands focus into the app. Tab at the
end of the app (Shift+Tab at its start) leaves it again. Inside the frame:

- **Semantic HTML first.** One `<main>`, headings in order, real `<button>`, `<a href>`,
  `<label for>` / `aria-label` for every control, lists as lists. A `<div @click>` is
  invisible to the keyboard and to screen readers.
- **Language.** Set `document.documentElement.lang` from `launchContext.locale` and
  `session.onLocaleChange` (done in `src/useHavenApp.ts`), so screen readers pick the
  right voice.
- **Keyboard.** Everything reachable and operable with Tab, Enter, Space, arrows;
  visible `:focus-visible` styles in both themes; no keyboard traps (the last focusable
  element must let Tab leave the app); Escape closes the app's own dialogs and returns
  focus to what opened them. Do not autofocus on load: Haven decides when the app
  gets focus.
- **Announcements.** Status that changes on its own (loading, saved, sync, errors) goes
  into a live region (`role="status"`, errors `role="alert"`). Results the user may
  miss while looking elsewhere go through `session.notify`, which Haven announces.
- **Menus.** Context and overflow menus via `session.menus.show` get keyboard and
  screen reader support from Haven for free; prefer them over hand-made popups.
- **Look.** Contrast of at least 4.5:1 for text in the light and the dark theme; sizes in
  `rem` so the user's text size applies; touch targets of at least 44×44 px; honor
  `prefers-reduced-motion`; never convey state by color alone.
- **Canvas and maps.** Give the canvas an `aria-label` and offer the same content as a
  list or form (select, edit, delete an item without pointing). Agent tools are not a
  substitute.
- **Check it.** Add an axe check to the E2E tests (`@axe-core/playwright`, no serious or
  critical violations) and walk the main flow once with the keyboard only.

## Languages

Haven's UI comes in **en, de, es, fr, it, nb, nl, pl** and hands the user's choice to the
app (`launchContext.locale`, `session.onLocaleChange`). Every user-facing string ships
in all eight, in the same change that adds it: labels, buttons, placeholders, empty
states, errors, `aria-label`s, texts for `session.notify` and `session.menus`, and the
`listing` texts in `haven-app.json`. If the app builds on a library that supports more
languages, ship all of those too.

- **Make a gap impossible to merge.** Keep strings in typed tables —
  `const messages = { en, de, es, fr, it, nb, nl, pl } satisfies Record<Locale, Messages>`
  with `Messages` derived from the English table — so a missing language or key fails
  `pnpm build`. With one JSON file per locale, add a Vitest test that compares every
  locale's keys and `{placeholders}` with `en`. Falling back to English is for locales
  Haven does not offer, not for strings nobody translated.
- **Map the tag.** `de-AT` → `de`, `nb-NO` and the legacy `no` → `nb`, anything unknown
  → `en`. Dates and numbers go through `Intl` with the active locale.
- **Say it as Haven says it.** Use the terms Haven's own UI uses in that language
  (database, tenant, attachment, …), and its form of address: German *du*, Spanish *tú*,
  French *vous*, Italian *tu*, Norwegian *du*, Dutch *je*, Polish informal.
- **Check it.** Open the main screens in all eight languages in the test host
  (`/__haven-test/?locale=nb-NO`, or `setLocale` from Playwright).

## When the task asks for AI agent tools (WebMCP)

Haven lets an app offer its operations to AI agents. Do this when `TASK.md` asks for it
(or for "AI", "agents", "MCP"); otherwise leave it out.

- Copy the pattern of mindoodb-app-example: `src/features/agent/lib/exampleAgentTools.ts`
  (tools as plain objects with `execute`), `agentUndo.ts`, `src/app/useAgentSection.ts`
  (`session.agent?.registerTools(...)`, `setContext`). The rules are in the SDK README,
  section "Agent tools (WebMCP)".
- Tools work on a small public model in plain words, never on storage field names. Start
  with `get_context`, `list`/search (query filters plus full-text), `get`, `create`,
  `update`, `delete` (`consequentialHint`) and `undo`; every write call is one undo step.
- Add `"agentToolPrefix"` and the `agent` block (summary, capabilities naming every
  tool, examples, limits) to `public/haven-app.json`, and a unit test with
  `assertAgentManifest` from `mindoodb-app-sdk/testing`. If you add `public/agent/*.md`
  guides, serve them with `Access-Control-Allow-Origin: *` in `public/_headers`.
- Nothing that leaves the app (sending, publishing, paying) runs from a tool without the
  user: mark it `consequentialHint`, or let the tool fill the form and ask the user to
  press the button.

## When the task asks to edit Word, Excel or PowerPoint documents

Do not build an editor: embed TeamEdit, TeamGrid or TeamSlides as components and store
their documents in this app's database (`session.components.list`,
`session.embeds.requestAccess`, `session.embeds.open`). Copy the "Embedded editors" tab
of mindoodb-app-example (`src/app/useEmbedsSection.ts`, `src/features/embeds/`) and read
the SDK README section "Components: embedding another app's editor", including its host
checklist. The user must have those apps installed in Haven; show which one is missing.

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

## Testing

Opening `http://127.0.0.1:4300` directly shows the landing page — that is correct.
There is no bridge outside Haven, and `src/main.ts` only mounts the app when Haven
launched it. To see the app running, open **`http://127.0.0.1:4300/__haven-test/`**: it
frames the app with a mock Haven (`src/testHost/main.ts`) and seed data from
`src/testHost/seed.ts` — add documents there when the app needs something to show.
Never deploy the test URL to production.

The panel next to the app controls the mock host; `TESTING.md` of the installed SDK
describes each control and option:

- **Language**: changes the locale live — check that every screen follows `onLocaleChange`.
- **Databases**: capability checkboxes per database and *Enforce capabilities*. With
  enforcement on, a call the database was not granted fails with `forbidden`, as in
  Haven. Test every feature with fewer rights than `haven-app.json` requests: the app
  must hide the action or say what is missing, not fail at the bridge.
- **Directory**: generated users for recipient pickers; use
  `directory.listUsers({ query, cursor, limit })` so large directories page.
- **Scanner**: what `attachments.scan()` returns (cancel, a sample page, a chosen file).
- **Requests**: every bridge call; click one for its parameters, result or error, and
  duration — the first place to look when something does not work.

**Two users:** `/__haven-test/?twoUsers=1` shows the app twice, side by side, each on
its own replica of the databases (like two people on two devices). Auto-sync merges
them every 2 s; turn it off, edit on both sides, press **Sync** and check that nothing
is lost — one changes a text while the other changes its color, both add an item, both
format the same word. If the app writes rich text, prefer `richTextSteps` (splices and
marks) for edits of existing text: they merge at old `baseHeads`. In Vitest, two mocks
with distinct `automergeActor`s and `syncMockReplicas(a, b)` do the same.

The panel's settings are part of the URL, so a scenario can be opened directly, e.g.
`/__haven-test/?enforce=1&db=main:read&users=120&locale=de-DE` (`db=<id>:none` unmaps a
database). The same options go into `mountHavenTestHost(...)` in `src/testHost/main.ts`
(`enforceCapabilities`, `directoryUsers: generateDirectoryUsers(120)`, `scanMode`,
overrides in `mockDatabasesFromDefinition`).

**Playwright** uses the same URL; the app is in `[data-testid="haven-test-app-frame"]`
and `window.__havenTestHost` scripts the host (`setCapabilities`, `setLocale`,
`setNextScan`, `setDirectoryUsers`, `log`).

**Vitest**: `createMockMindooDBAppSession` / `createFakeBridgeHost` from
`mindoodb-app-sdk/testing` take the same options (`enforceCapabilities: true`,
`directoryUsers`), plus `createMemoryAttachments()` for attachments that can be read
back.

## How this gets deployed

Every push to `main` triggers a Cloudflare Workers build that runs `pnpm build` and
deploys `dist/`. You do not need credentials and should not add a deploy workflow. Just
push; the live origin updates itself, and Haven picks up the new `haven-app.json` on the
next install or update.

**Commit to `main` and do not open a pull request** unless you were asked for one. Only
`main` deploys, so work left on a side branch never reaches the person waiting for the
app — and nothing fails to tell them why. This matters most on the first build, which
someone is watching for an address to open.
