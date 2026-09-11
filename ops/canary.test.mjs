/**
 * The token canary's judgement, tested offline.
 *
 * ## Why the classification is a separate, testable thing
 *
 * A canary nobody has seen fail is an untested assertion. Proving this one can
 * fail by running it against a deliberately wrong token proves ONE path; the
 * paths that matter most are the ones that look like success:
 *
 * - a Packagist SAFE token, which answers 403 and reads like a permissions bug
 * - a PyPI token that authenticates and is not account-scoped, which cannot
 *   create a project that does not exist yet
 * - any non-2xx quietly treated as "fine"
 *
 * So the workflow shells to a script whose judgement lives here, and every
 * response shape — including each way of being wrong — is asserted. No network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { collectVerdicts, report } from "./token-canary.mjs";
import { annotationTitle } from "./canary.mjs";
import { classifyPackagist, classifyPypi, missingSecret, ROTATE } from "./canary.mjs";

/* ── Packagist ────────────────────────────────────────────────────────────── */

test("packagist: an already-registered repo answering 'exists' proves a live MAIN token", () => {
  const verdict = classifyPackagist({
    status: 406,
    body: JSON.stringify({ status: "error", message: "Package already exists" }),
  });

  assert.equal(verdict.ok, true);
  assert.match(verdict.detail, /already exists/i);
});

test("packagist: a SAFE token is diagnosed as a SAFE token, not as a permissions bug", () => {
  // This is the fault that wastes the most time, because 403 reads like the
  // account lacking rights rather than the token being the wrong KIND.
  const verdict = classifyPackagist({
    status: 403,
    body: JSON.stringify({ status: "error", message: "Token not allowed to perform this action" }),
  });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /safe token/i);
  assert.match(verdict.detail, /create-package is classed UNSAFE/i);
  assert.match(verdict.remedy, /Show API Token/i);
});

test("packagist: a dead or wrong credential is diagnosed as auth", () => {
  const verdict = classifyPackagist({
    status: 401,
    body: JSON.stringify({ status: "error", message: "Invalid credentials" }),
  });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /credential/i);
});

test("packagist: an unknown status is a FAILURE, never 'fine'", () => {
  for (const status of [500, 502, 418]) {
    const verdict = classifyPackagist({ status, body: "gateway is sad" });

    assert.equal(verdict.ok, false, `HTTP ${status} must not pass`);
    assert.match(verdict.detail, /gateway is sad/, "the body is kept, not just the status");
  }
});

test("packagist: a 2xx against an already-registered repo is ALARMING, not a pass", () => {
  // The probe targets a package Packagist already knows. A success means it
  // created something, which means the probe is pointed at the wrong repo — and
  // a canary that quietly creates packages is worse than none.
  const verdict = classifyPackagist({ status: 201, body: '{"status":"success"}' });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /already registered|created/i);
});

/* ── PyPI ─────────────────────────────────────────────────────────────────── */

test("pypi: 400 means the token was ACCEPTED and the upload refused — the pass", () => {
  const verdict = classifyPypi({ status: 400, body: "Include at least one package file" });

  assert.equal(verdict.ok, true);
  assert.match(verdict.detail, /accepted/i);
});

test("pypi: 403 is an invalid or expired token", () => {
  const verdict = classifyPypi({
    status: 403,
    body: "Invalid or non-existent authentication information.",
  });

  assert.equal(verdict.ok, false);
  assert.match(verdict.remedy, /gh secret set PYPI_TOKEN/);
});

test("pypi: a 2xx would mean something was UPLOADED", () => {
  const verdict = classifyPypi({ status: 200, body: "" });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /uploaded|nothing was sent/i);
});

test("pypi: an unknown status is a failure", () => {
  const verdict = classifyPypi({ status: 503, body: "maintenance" });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /maintenance/);
});

/* ── The canary must be able to fail ──────────────────────────────────────── */

test("every classifier has a failing path, and none defaults to ok", () => {
  // Guards against the worst version of this file: a classifier edited until it
  // returns ok for everything, which is a canary that reads as coverage and is
  // not.
  const nonsense = { status: 999, body: "" };

  assert.equal(classifyPackagist(nonsense).ok, false);
  assert.equal(classifyPypi(nonsense).ok, false);
});

test("the rotation command is the FIRST line, so it can be copied straight out", () => {
  // Whoever reads the failure should not have to go looking for the fix — and
  // should not have to pick the command out of a paragraph either. The command
  // is line one; everything after it says what token to put in it.
  for (const key of ["pypi", "packagist"]) {
    assert.match(ROTATE[key].split("\n")[0], /^gh secret set \w+ --org Fancy-Friends --visibility all$/);
  }
});

test("packagist: 406 with an auth message is diagnosed as AUTH, not as 'unrecognised'", () => {
  // Observed against the live endpoint on 2026-08-20 with a deliberately wrong
  // token. Packagist answers 406 — not 401 — and only the BODY says why. A
  // status-only classifier reported this as unrecognised, which is red for the
  // right reason and the wrong explanation, and the explanation is the whole
  // value of a canary.
  const verdict = classifyPackagist({
    status: 406,
    body: '{"status":"error","message":"Missing or invalid username\/apiToken in request"}',
  });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /credential|username|apiToken/i);
  assert.match(verdict.remedy, /gh secret set PACKAGIST_TOKEN/);
  assert.doesNotMatch(verdict.detail, /unrecognised/i);
});

test("packagist: the BODY decides, because one status carries several meanings", () => {
  // 406 is both "already exists" (the pass) and "bad credential" (a failure).
  // Classifying on status alone cannot tell them apart in either direction.
  const exists = classifyPackagist({ status: 406, body: '{"message":"Package already exists"}' });
  const badAuth = classifyPackagist({ status: 406, body: '{"message":"Missing or invalid username"}' });

  assert.equal(exists.ok, true);
  assert.equal(badAuth.ok, false);
});

test("packagist: an unrecognised body still fails, and quotes what it got", () => {
  // The safe direction. If Packagist ever changes its wording, a VALID token
  // reads as unrecognised and goes red — a false alarm rather than a false
  // green, with the exact text needed to fix the matcher in one line.
  const verdict = classifyPackagist({ status: 406, body: '{"message":"something new"}' });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /something new/);
});

test("a missing secret explains the cause that actually bit, not just the absence", () => {
  // All four arrived EMPTY on the first real run. The secrets existed, with
  // visibility ALL — organization secrets simply do not reach PRIVATE
  // repositories on the Free plan, which `gh secret list --org` cannot show you.
  //
  // "PYPI_TOKEN is not set" would send whoever reads it to re-create a secret
  // that is already correct.
  const verdict = missingSecret("pypi", "PYPI_TOKEN");

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /PYPI_TOKEN/);
  assert.match(verdict.remedy, /private/i);
  assert.match(verdict.remedy, /free/i);
  assert.match(verdict.remedy, /gh secret set PYPI_TOKEN/);
});

test("the canary says which repo it is checking from", () => {
  // Whether a secret reaches depends on the REPOSITORY, so a verdict that does
  // not name one is a verdict nobody can act on — especially if the org ends up
  // with some repos public and some private, where a red canary in one and a
  // green publish in another are both correct.
  const verdict = missingSecret("pypi", "PYPI_TOKEN", "Fancy-Friends/weaver.agi");

  assert.match(verdict.detail, /Fancy-Friends\/weaver\.agi/);
});

/* ── The alert has to be actionable at 3am ────────────────────────────────── */

/**
 * Whoever reads this alert should not have to go looking — and a copy-paste
 * error in a remedy sends them to rotate a credential that was fine, which is
 * the same wasted afternoon the missing-secret message exists to avoid.
 */
test("every registry's remedy names its own secret, and none names another's", () => {
  for (const [registry, remedy] of Object.entries(ROTATE)) {
    const expected = { pypi: "PYPI_TOKEN", packagist: "PACKAGIST_TOKEN" }[registry];
    assert.ok(expected, `ROTATE carries a remedy for "${registry}", which the canary does not probe`);

    assert.match(remedy, new RegExp(`gh secret set ${expected}\\b`), `${registry} names the wrong secret`);

    for (const other of ["NPM_TOKEN", "PYPI_TOKEN", "PACKAGIST_TOKEN"].filter((x) => x !== expected)) {
      assert.doesNotMatch(remedy, new RegExp(`gh secret set ${other}\\b`), `${registry} also names ${other}`);
    }
  }
});

/* ── The alarm has to reach the exit code ─────────────────────────────────── */

/**
 * A classifier can be tested at every boundary and still be wired to nothing.
 * The retired npm expiry check was the example: thoroughly unit-tested, and
 * dropping its line from `collectVerdicts` would have left every test passing
 * and the alarm silent. So the SET of registries is asserted, not assumed.
 */
const HEALTHY = {
  packagist: async () => ({ ok: true, registry: "packagist", detail: "refused as expected" }),
  pypi: async () => ({ ok: true, registry: "pypi", detail: "refused as expected" }),
};

/** A console that records instead of printing. */
function recorder() {
  const lines = [];

  return { lines, log: (l) => lines.push(String(l)), error: (l) => lines.push(String(l)) };
}

test("healthy tokens are a clean pass", async () => {
  const out = recorder();

  assert.equal(report(await collectVerdicts({ env: {}, probes: HEALTHY }), out), 0);
  assert.match(out.lines.join("\n"), /2\/2 checks passed/);
});

test("the canary probes exactly PyPI and Packagist — npm is retired, and stays retired", async () => {
  // npm publishes through Trusted Publishing and no workflow reads NPM_TOKEN.
  // Its arm — a whoami probe and an expiry countdown — was retired on the
  // owner's decision on 2026-09-11 rather than left to fail every night about
  // a credential nothing used. A stale alarm SUMMONS someone on a schedule,
  // which is worse than a stale comment that waits to be read.
  //
  // Asserted rather than left to absence: a probe quietly reappearing here
  // would bring the nightly false alarm back with it.
  const verdicts = await collectVerdicts({ env: {}, probes: HEALTHY });

  assert.deepEqual(
    verdicts.map((v) => v.registry).sort(),
    ["packagist", "pypi"],
    `the canary probes ${verdicts.length} registries: ${verdicts.map((v) => v.registry).join(", ")}`,
  );
  assert.deepEqual(Object.keys(ROTATE).sort(), ["packagist", "pypi"], "a remedy exists for a registry nothing probes");
});

test("a green run SAYS what it did not check", async () => {
  // A canary that implies more than it verified is worse than none. PyPI's
  // probe proves the token AUTHENTICATES and says nothing about whether it is
  // account-scoped — and only an account-scoped token can create a project.
  const out = recorder();
  const verdicts = await collectVerdicts({
    env: {},
    probes: { ...HEALTHY, pypi: async () => classifyPypi({ status: 400, body: "" }) },
  });

  assert.equal(report(verdicts, out), 0);

  const printed = out.lines.join("\n");
  assert.match(printed, /note:/, "the pass printed no caveat at all");
  assert.match(printed, /does NOT prove/i);
  assert.match(printed, /account-scoped/i);
});

/* ── Two different reds ───────────────────────────────────────────────────── */

/**
 * "A token is dead" and "the secret never arrived" are both failures and they
 * are not the same failure. The second means the canary could not see
 * anything, which is why it must NOT go green — but the remedies are opposite:
 * one is a rotation, the other a repository-visibility problem no rotation fixes.
 *
 * The body already says which. The ANNOTATION title is what a triager reads
 * first, so it has to say it too.
 */
test("a missing secret and a rejected token get different annotation titles", () => {
  const missing = missingSecret("pypi", "PYPI_TOKEN");
  const rejected = classifyPypi({ status: 403, body: "Invalid or non-existent authentication information." });

  assert.equal(missing.ok, false);
  assert.equal(rejected.ok, false);

  assert.equal(missing.kind, "unreachable", "a secret that never arrived is not a token verdict");
  assert.notEqual(annotationTitle(missing), annotationTitle(rejected));

  assert.match(annotationTitle(missing), /did not arrive|unreachable/i);
  assert.match(annotationTitle(rejected), /rejected/i);
});

test("an unreachable secret still FAILS — it did not check anything", () => {
  // The one thing that must not happen: "nobody could tell" reading as "fine".
  assert.equal(missingSecret("pypi", "PYPI_TOKEN").ok, false);
});
