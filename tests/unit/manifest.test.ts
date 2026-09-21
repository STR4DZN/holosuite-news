import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync(path.resolve("module.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(path.resolve("package.json"), "utf8"));

describe("Foundry module manifest", () => {
  it("declares the canonical identity, version, v13 target, socket, and entries", () => {
    expect(manifest).toMatchObject({ id: "holosuite-news", version: packageJson.version, compatibility: { minimum: "13", verified: "13" }, socket: true, esmodules: ["dist/main.js"], styles: ["dist/style.css"] });
  });

  it("requires the verified HoloSuite Core contract", () => {
    expect(manifest.relationships.requires).toContainEqual({ id: "holosuite-core", type: "module", compatibility: { minimum: "1.0.12" } });
  });
});
