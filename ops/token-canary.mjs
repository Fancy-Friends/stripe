#!/usr/bin/env node
/**
 * Nightly: do the publishing secrets that still exist still work?
 *
 * Two registries still publish with a stored secret — PyPI and Packagist. A
 * lapsed one is a silent publish outage across every provider repo, normally
 * discovered mid-release, after another registry has already taken a version
 * that cannot be taken back.
 *
 * npm is NOT here. It publishes through Trusted Publishing (OIDC), no workflow
 * reads `NPM_TOKEN`, and its arm — a `whoami` probe and an expiry countdown —
 * was retired on the owner's decision on 2026-09-11 rather than left to fail
 * nightly about a credential nothing used. RULES.md, Publishing, has why and
 * what a future token must be.
 *
 * **Nothing here publishes anything.** Each probe authenticates and then does
 * something the registry must refuse:
 *
 * | registry | probe | pass |
 * |---|---|---|
 * | Packagist | `create-package` on an ALREADY-registered repo | "already exists" |
 * | PyPI | upload endpoint with no file | 400 |
 *
 * The judgement lives in `lib/canary.mjs` and is unit-tested against every
 * response shape, including each way of being wrong. That is what makes this a
 * canary rather than a green tick: a canary nobody has seen fail is an untested
 * assertion, and the failures that matter here are the ones that look like
 * success — a Packagist SAFE token answering 403 like a permissions bug.
 *
 *   node scripts/token-canary.mjs
 *
 * Exits non-zero if any probe fails.
 */
import { annotationTitle, classifyPackagist, classifyPypi, missingSecret } from "./canary.mjs";

/**
 * A repository Packagist ALREADY knows.
 *
 * Deliberately a kit package rather than a friends one: it is registered today,
 * so `create-package` is guaranteed to refuse, and the probe therefore cannot
 * create anything even if pointed at a live token.
 */
const PACKAGIST_PROBE_REPO = "https://github.com/Particle-Academy/fancy-connector-core";

const PYPI_UPLOAD = "https://upload.pypi.org/legacy/";

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
 * The retired expiry check was thoroughly unit-tested at every boundary while
 * nothing checked that its verdict reached the exit code — dropping it from
 * this array would have left every one of those tests passing and the alarm
 * silent. That is the "wired to nothing" shape this repo keeps finding, so
 * the set of registries is asserted, not assumed.
 */
export async function collectVerdicts({
  env = process.env,
  probes = { packagist: probePackagist, pypi: probePypi },
} = {}) {
  return [
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
    const label = (verdict.registry ?? "canary").padEnd(10);

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
