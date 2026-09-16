/**
 * `haven-app.json` is the contract Haven reads when a user installs this app, and it
 * is the one file in this repo that can be wrong without anything failing locally: the
 * app keeps running against whatever it was granted last time, and the mismatch only
 * shows up when someone installs it — an install is also the only moment a wider
 * request can be granted, so getting this file wrong is not something a later deploy
 * quietly fixes.
 *
 * So it gets a test. Keep it passing when you add a database.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateMindooDBAppDefinition } from "mindoodb-app-sdk";
import { describe, expect, it } from "vitest";

import { MAIN_DATABASE_ID } from "@/useHavenApp";

// Resolved from the project root rather than `import.meta.url`: the jsdom environment
// does not give this module a `file:` URL.
const raw: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/haven-app.json"), "utf8"),
);

describe("haven-app.json", () => {
  it("is a valid app definition", () => {
    const { definition, errors } = validateMindooDBAppDefinition(raw);
    expect(errors).toEqual([]);
    expect(definition).not.toBeNull();
  });

  it("declares every database the app opens", () => {
    const { definition } = validateMindooDBAppDefinition(raw);
    const declared = (definition?.databases ?? []).map((entry) => entry.logicalDatabaseId);
    expect(declared).toContain(MAIN_DATABASE_ID);
  });

  it("names the default launch database among the declared ones", () => {
    const { definition } = validateMindooDBAppDefinition(raw);
    if (definition?.defaultLaunchDatabaseId == null) {
      return;
    }
    const declared = (definition.databases ?? []).map((entry) => entry.logicalDatabaseId);
    expect(declared).toContain(definition.defaultLaunchDatabaseId);
  });
});
