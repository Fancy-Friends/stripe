/*
 * GENERATED from weaver's template/packages/ui/tsup.config.ts — fix it there.
 *
 * The ui package has ONE entry. `@particle-academy/fancy-flow` is external
 * because it is a peer: bundling it would give a host two copies of the engine,
 * and two registries that disagree about which kinds exist.
 */
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["@particle-academy/fancy-flow"],
});
