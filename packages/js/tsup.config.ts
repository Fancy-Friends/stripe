/*
 * GENERATED from weaver's template/packages/js/tsup.config.ts — fix it there.
 *
 * TWO entries, and the second is the point of the split: `./flow` carries the
 * fancy-flow executors, so a plain Node service that just wants to call the API
 * imports `.` and never pulls a workflow engine into its bundle.
 *
 * Everything first-party stays external. Bundling the connector runtime would
 * give a host two copies of it — two transports, two rate-limit states, and two
 * answers to "has this idempotency key been used".
 */
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/flow.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [/^@particle-academy\//],
});
