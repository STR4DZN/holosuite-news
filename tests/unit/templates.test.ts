import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import { describe, expect, it } from "vitest";

describe("Handlebars templates", () => {
  it("parses every Reader and Editorial template", () => {
    const files = readdirSync(path.resolve("templates"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".hbs"))
      .map((entry) => path.join(entry.parentPath, entry.name));

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expect(() => Handlebars.parse(readFileSync(file, "utf8")), file).not.toThrow();
  });
});
