import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reads a document that ships with bezel-ui. Rendered at build time, so the
 * site always shows the same text the package publishes.
 */
export function readPackageDoc(name: "PRINCIPLES.md" | "STATES.md") {
  const candidates = [
    join(process.cwd(), "..", "..", "packages", "ui", name),
    join(process.cwd(), "packages", "ui", name),
  ];
  for (const path of candidates) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      /* try the next location */
    }
  }
  throw new Error(`Could not find packages/ui/${name} from ${process.cwd()}.`);
}
