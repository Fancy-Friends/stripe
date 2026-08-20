#!/usr/bin/env node
/**
 * Nightly: do the four publishing secrets still work?
 *
 * A lapsed token is a silent, total publish outage across every provider repo,
 * and the way it is normally discovered is mid-release — after one of three
 * registries has already taken a version that cannot be taken back.
 *
 * **Nothing here publishes anything.** Each probe authenticates and then does
 * something the registry must refuse:
 *
 * | registry | probe | pass |
 * |---|---|---|
 * | npm | `npm whoami` | a username |
 * | Packagist | `create-package` on an ALREADY-registered repo | "already exists" |
 * | PyPI | upload endpoint with no file | 400 |
 *
 * The judgement lives in `lib/canary.mjs` and is unit-tested against every
 * response shape, including each way of being wrong. That is what makes this a
 * canary rather than a green tick: a canary nobody has seen fail is an untested
 * assertion, and the failures that matter here are the ones that look like
 * success — a Packagist SAFE token answering 403 like a permissions bug, an npm
 * token scoped to selected packages authenticating perfectly and unable to
 * create the new package every friends release needs.
 *
 *   node scripts/token-canary.mjs
 *
 * Exits non-zero if any probe fails or the npm expiry is within a week.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  annotationTitle,
  checkExpiry,
  classifyNpm,
  classifyPackagist,
  classifyPypi,
  missingSecret,
  NPM_TOKEN_EXPIRES,
} from "./canary.mjs";

/**
 * A repository Packagist ALREADY knows.
 *
 * Deliberately a kit package rather than a friends one: it is registered today,
 * so `create-package` is guaranteed to refuse, and the probe therefore cannot
 * create anything even if pointed at a live token.
 */
const PACKAGIST_PROBE_REPO = "https://github.com/Particle-Academy/fancy-connector-core";

const PYPI_UPLOAD = "https://upload.pypi.org/legacy/";

/**
 * `npm whoami` against a throwaway userconfig.
 *
 * The token goes into a temporary `.npmrc` that this function owns and deletes,
 * rather than into an env var npm may or may not map. Two reasons: the
 * `npm_config_//registry…:_authToken` spelling is fragile across npm versions,
 * and pointing `NPM_CONFIG_USERCONFIG` at our own file means the probe cannot
 * accidentally pass because the MACHINE happened to be logged in — which would
 * be a green tick for a token that was never used.
 */
async function probeNpm(token) {
  if (!token) return missingSecret("npm", "NPM_TOKEN");

  const config = join(mkdtempSync(join(tmpdir(), "weaver-canary-")), ".npmrc");
  writeFileSync(config, `//registry.npmjs.org/:_authToken=${token}\n`, "utf8");

  try {
    const result = spawnSync("npm", ["whoami", "--registry", "https://registry.npmjs.org"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, NPM_CONFIG_USERCONFIG: config, NPM_TOKEN: undefined },
    });

    return classifyNpm({ code: result.status ?? 1, stdout: result.stdout, stderr: result.stderr });
  } finally {
    rmSync(dirname(config), { recursive: true, force: true });
  }
}

async function probePackagist(user, token) {
  if (!user || !token) return missingSecret("packagist", "PACKAGIST_USERNAME / PACKAGIST_TOKEN");

  const res = await fetch("https://packagist.org/api/create-package", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${user}:${token}` },
    body: JSON.stringify({ repository: PACKAGIST_PROBE_REPO }),
  });

  // The BODY is what separates a safe token from a dead one from a live one.
  // Keeping only the status would make all three look like "403-ish".
  return classifyPackagist({ status: res.status, body: await res.text() });
}

async function probePypi(token) {
  if (!token) return missingSecret("pypi", "PYPI_TOKEN");

  const form = new FormData();
  // `:action` and nothing else. PyPI authenticates before it validates the form,
  // so a live token reaches the "you sent no file" refusal — and no file is what
  // makes this safe to run nightly.
  form.set(":action", "file_upload");
  form.set("protocol_version", "1");

  const res = await fetch(PYPI_UPLOAD, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`__token__:${token}`).toString("base64")}` },
    body: form,
  });

  return classifyPypi({ status: res.status, body: (await res.text()).slice(0, 400) });
}

/**
 * Every verdict the canary reports, assembled in one place.
 *
 * Exported and injectable so the WIRING can be tested, not just the pieces.
 * `checkExpiry` was thoroughly unit-tested at every boundary while nothing
 * checked that its verdict reached the exit code — drop it from this array and
 * every one of those tests still passes, and the alarm for 2026-09-19 simply
 * never fires. That is the "wired to nothing" shape this repo keeps finding.
 *
 * The clock is a parameter here and NOWHERE else. There is deliberately no env
 * override for the expiry date: a knob that silences the alarm is a knob that
 * will be used to silence the alarm.
 */
export async function collectVerdicts({
  env = process.env,
  now = new Date(),
  probes = { npm: probeNpm, packagist: probePackagist, pypi: probePypi },
} = {}) {
  return [
    { ...checkExpiry(NPM_TOKEN_EXPIRES, now), registry: "expiry" },
    await probes.npm(env.NPM_TOKEN),
    await probes.packagist(env.PACKAGIST_USERNAME, env.PACKAGIST_TOKEN),
    await probes.pypi(env.PYPI_TOKEN),
  ];
}

/**
 * Print the verdicts and return how many FAILED.
 *
 * A caveat on a PASS is the important half: it says what the green tick does
 * NOT cover, so nobody reads more into it than was checked.
 */
export function report(verdicts, out = console) {
  let failed = 0;

  for (const verdict of verdicts) {
    const label = (verdict.registry ?? "expiry").padEnd(10);

    if (verdict.ok) {
      out.log(`ok    ${label} ${verdict.detail}`);
      if (verdict.caveat) out.log(`      ${label} note: ${verdict.caveat}`);
      continue;
    }

    failed++;
    out.error(`FAIL  ${label} ${verdict.detail}`);
    if (verdict.remedy) out.error(`      ${label} fix: ${verdict.remedy}`);
    if (process.env.GITHUB_ACTIONS) {
      out.error(`::error title=${annotationTitle(verdict)}::${verdict.detail}`);
    }
  }

  out.log(`\n${verdicts.length - failed}/${verdicts.length} checks passed.`);

  return failed;
}

async function main() {
  const verdicts = await collectVerdicts();

  if (report(verdicts)) process.exit(1);
}

if (process.argv[1]?.endsWith("token-canary.mjs")) {
  main().catch((error) => {
    console.error(`FAIL  canary    the canary itself threw: ${error.message}`);
    process.exit(1);
  });
}
