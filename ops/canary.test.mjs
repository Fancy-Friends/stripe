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
 * - an npm token scoped to selected packages, which authenticates perfectly and
 *   cannot create a new package — and every friends package is new
 * - any non-2xx quietly treated as "fine"
 *
 * So the workflow shells to a script whose judgement lives here, and every
 * response shape — including each way of being wrong — is asserted. No network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { collectVerdicts, report } from "./token-canary.mjs";
import { annotationTitle } from "./canary.mjs";
import {
  classifyNpm,
  classifyPackagist,
  classifyPypi,
  checkExpiry,
  missingSecret,
  NPM_TOKEN_EXPIRES,
  ROTATE,
} from "./canary.mjs";

/* ── npm ──────────────────────────────────────────────────────────────────── */

test("npm: whoami answering a username is a live token", () => {
  const verdict = classifyNpm({ code: 0, stdout: "particle-academy-ci\n", stderr: "" });

  assert.equal(verdict.ok, true);
  assert.match(verdict.detail, /particle-academy-ci/);
});

test("npm: a green whoami must SAY it does not prove the scope", () => {
  // The likeliest npm fault is a token limited to selected packages. It
  // authenticates perfectly and cannot create a new one — and every friends
  // package is new, so the failure lands on the very first publish. A canary
  // that stayed quiet about that would be claiming coverage it does not have.
  const verdict = classifyNpm({ code: 0, stdout: "particle-academy-ci\n", stderr: "" });

  assert.match(verdict.caveat, /scope/i);
  assert.match(verdict.caveat, /selected packages|new package/i);
});

test("npm: a failed whoami is a failure, with the rotation command", () => {
  const verdict = classifyNpm({ code: 1, stdout: "", stderr: "npm ERR! code E401\n" });

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /E401/);
  assert.match(verdict.remedy, /gh secret set NPM_TOKEN --org Fancy-Friends --visibility all/);
});

test("npm: empty output is NOT a pass", () => {
  // Exit 0 with nothing on stdout would be a green tick over an answer nobody
  // gave — the exact shape this repo keeps refusing.
  const verdict = classifyNpm({ code: 0, stdout: "   \n", stderr: "" });

  assert.equal(verdict.ok, false);
});

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

/* ── Expiry ───────────────────────────────────────────────────────────────── */

test("the npm expiry is warned about BEFORE it lands, not on the day", () => {
  // Discovering it mid-publish is discovering it after a partial release across
  // three registries.
  const soon = checkExpiry(NPM_TOKEN_EXPIRES, new Date("2026-09-14T00:00:00Z"));

  assert.equal(soon.ok, false);
  assert.equal(soon.daysLeft, 5);
  assert.match(soon.remedy, /gh secret set NPM_TOKEN --org Fancy-Friends --visibility all/);
});

test("comfortably before the expiry is fine, and says how long is left", () => {
  const fine = checkExpiry(NPM_TOKEN_EXPIRES, new Date("2026-08-20T00:00:00Z"));

  assert.equal(fine.ok, true);
  assert.equal(fine.daysLeft, 30);
});

test("the day itself, and after it, fail", () => {
  assert.equal(checkExpiry(NPM_TOKEN_EXPIRES, new Date("2026-09-19T00:00:00Z")).ok, false);

  const past = checkExpiry(NPM_TOKEN_EXPIRES, new Date("2026-09-25T00:00:00Z"));
  assert.equal(past.ok, false);
  assert.ok(past.daysLeft < 0);
});

test("exactly at the warning boundary fails — the boundary is inclusive", () => {
  assert.equal(checkExpiry(NPM_TOKEN_EXPIRES, new Date("2026-09-12T00:00:00Z")).ok, false);
  assert.equal(checkExpiry(NPM_TOKEN_EXPIRES, new Date("2026-09-11T00:00:00Z")).ok, true);
});

/* ── The canary must be able to fail ──────────────────────────────────────── */

test("every classifier has a failing path, and none defaults to ok", () => {
  // Guards against the worst version of this file: a classifier edited until it
  // returns ok for everything, which is a canary that reads as coverage and is
  // not.
  const nonsense = { status: 999, body: "" };

  assert.equal(classifyPackagist(nonsense).ok, false);
  assert.equal(classifyPypi(nonsense).ok, false);
  assert.equal(classifyNpm({ code: 137, stdout: "", stderr: "" }).ok, false);
});

test("the rotation command is the FIRST line, so it can be copied straight out", () => {
  // Whoever reads the failure should not have to go looking for the fix — and
  // should not have to pick the command out of a paragraph either. The command
  // is line one; everything after it says what token to put in it.
  assert.equal(
    ROTATE.npm.split("\n")[0],
    "gh secret set NPM_TOKEN --org Fancy-Friends --visibility all",
  );

  for (const key of ["npm", "pypi", "packagist"]) {
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
  // "NPM_TOKEN is not set" would send whoever reads it to re-create a secret
  // that is already correct.
  const verdict = missingSecret("npm", "NPM_TOKEN");

  assert.equal(verdict.ok, false);
  assert.match(verdict.detail, /NPM_TOKEN/);
  assert.match(verdict.remedy, /private/i);
  assert.match(verdict.remedy, /free/i);
  assert.match(verdict.remedy, /gh secret set NPM_TOKEN/);
});

test("the canary says which repo it is checking from", () => {
  // Whether a secret reaches depends on the REPOSITORY, so a verdict that does
  // not name one is a verdict nobody can act on — especially if the org ends up
  // with some repos public and some private, where a red canary in one and a
  // green publish in another are both correct.
  const verdict = missingSecret("npm", "NPM_TOKEN", "Fancy-Friends/weaver.agi");

  assert.match(verdict.detail, /Fancy-Friends\/weaver\.agi/);
});

/* ── The alert has to be actionable at 3am ────────────────────────────────── */

/**
 * Whoever reads this alert should not have to go looking.
 *
 * `gh secret set NPM_TOKEN` alone is not enough: the command is the easy half,
 * and the half that goes wrong is the token you paste into it. A granular token
 * scoped to SELECTED PACKAGES authenticates perfectly, passes `npm whoami`, and
 * cannot create a package that does not exist — and every friends package is
 * new, so that fault first appears on a publish, after a tag has been pushed.
 *
 * So the remedy carries the scope requirement in the same breath as the
 * command, because they are one instruction and not two.
 */
test("the npm remedy says what KIND of token, not just where to put it", () => {
  const remedy = ROTATE.npm;

  assert.match(remedy, /gh secret set NPM_TOKEN --org Fancy-Friends --visibility all/);
  assert.match(remedy, /granular/i, "does not say which kind of npm token to create");
  assert.match(remedy, /read and write/i, "does not say what permission it needs");
  assert.match(remedy, /@particle-academy/, "does not name the scope");
  assert.match(
    remedy,
    /not.*selected packages|scope, not/i,
    "does not warn against the selected-packages token, which is the fault that passes whoami",
  );
});

test("an expiring token's remedy carries the same instruction, plus the date", () => {
  // The expiry path is the one that fires on a schedule with nobody watching,
  // so it is the one that most needs to be self-contained.
  const soon = checkExpiry("2026-09-19", new Date("2026-09-15T00:00:00Z"));

  assert.equal(soon.ok, false);
  assert.match(soon.remedy, /granular/i);
  assert.match(soon.remedy, /@particle-academy/);
  assert.match(
    soon.remedy,
    /NPM_TOKEN_EXPIRES/,
    "does not say to update the date in the same commit, so the next run alerts again",
  );
});

test("every registry's remedy names its own secret, and none names another's", () => {
  // A copy-paste error here sends someone to rotate a credential that was fine
  // — which is the same wasted afternoon the missing-secret message avoids.
  for (const [registry, remedy] of Object.entries(ROTATE)) {
    const expected = { npm: "NPM_TOKEN", pypi: "PYPI_TOKEN", packagist: "PACKAGIST_TOKEN" }[registry];

    assert.match(remedy, new RegExp(`gh secret set ${expected}\\b`), `${registry} names the wrong secret`);

    for (const other of ["NPM_TOKEN", "PYPI_TOKEN", "PACKAGIST_TOKEN"].filter((s) => s !== expected)) {
      assert.doesNotMatch(remedy, new RegExp(`gh secret set ${other}\\b`), `${registry} also names ${other}`);
    }
  }
});

/* ── The alarm has to reach the exit code ─────────────────────────────────── */

/**
 * `checkExpiry` is unit-tested at every boundary above. None of those tests
 * would notice if its verdict stopped being COLLECTED — delete one line from
 * `collectVerdicts` and the whole suite still passes while the alarm for
 * 2026-09-19 never fires. That is the difference between testing a part and
 * testing that the part is plugged in.
 */
const HEALTHY = {
  npm: async () => ({ ok: true, registry: "npm", detail: "authenticated as someone" }),
  packagist: async () => ({ ok: true, registry: "packagist", detail: "refused as expected" }),
  pypi: async () => ({ ok: true, registry: "pypi", detail: "refused as expected" }),
};

/** A console that records instead of printing. */
function recorder() {
  const lines = [];

  return { lines, log: (l) => lines.push(String(l)), error: (l) => lines.push(String(l)) };
}

test("an expiring token fails the canary even when all three tokens are healthy", async () => {
  // The scenario this exists for: 2026-09-19 approaches, nothing is broken yet,
  // and the run must go RED anyway so somebody rotates it in time.
  const verdicts = await collectVerdicts({
    env: {},
    now: new Date("2026-09-15T00:00:00Z"),
    probes: HEALTHY,
  });

  const out = recorder();
  const failed = report(verdicts, out);

  assert.equal(failed, 1, "a token four days from expiry did not fail the run");
  assert.match(out.lines.join("\n"), /expires 2026-09-19/);
  assert.match(out.lines.join("\n"), /granular/i, "the alert did not carry the fix");
});

test("comfortably before the expiry, healthy tokens are a clean pass", async () => {
  const verdicts = await collectVerdicts({
    env: {},
    now: new Date("2026-08-20T00:00:00Z"),
    probes: HEALTHY,
  });

  const out = recorder();

  assert.equal(report(verdicts, out), 0);
  assert.match(out.lines.join("\n"), /4\/4 checks passed/);
});

test("the expiry is always one of the verdicts, whatever the probes say", async () => {
  const verdicts = await collectVerdicts({ env: {}, now: new Date("2026-08-20T00:00:00Z"), probes: HEALTHY });

  assert.equal(verdicts.length, 4, "a probe was dropped from the canary");
  assert.ok(
    verdicts.some((v) => v.registry === "expiry"),
    "no expiry verdict — the 2026-09-19 alarm is wired to nothing",
  );
});

test("a green run SAYS what it did not check", async () => {
  // A canary that implies more than it verified is worse than none. `npm
  // whoami` proves the token is LIVE and says nothing about its SCOPE — and a
  // selected-packages token passes it identically while being unable to create
  // any of the packages this org publishes.
  const verdicts = await collectVerdicts({
    env: {},
    now: new Date("2026-08-20T00:00:00Z"),
    probes: {
      ...HEALTHY,
      npm: async () => classifyNpm({ code: 0, stdout: "particle-academy\n" }),
    },
  });

  const out = recorder();

  assert.equal(report(verdicts, out), 0);

  const printed = out.lines.join("\n");
  assert.match(printed, /note:/, "the pass printed no caveat at all");
  assert.match(printed, /does NOT prove its scope/i);
  assert.match(printed, /selected packages/i);
});

/* ── Two different reds ───────────────────────────────────────────────────── */

/**
 * "A token is dead" and "the secret never arrived" are both failures and they
 * are not the same failure. One means publishing is broken; the other means the
 * canary could not see anything, which is why it must NOT go green — but the
 * remedies are opposite, and the second one has been red nightly in weaver.agi
 * since the day the org's secrets stopped reaching a private repo on the Free
 * plan.
 *
 * The body already says which. The ANNOTATION title is what a triager reads
 * first, so it has to say it too.
 */
test("a missing secret and a rejected token get different annotation titles", () => {
  const missing = missingSecret("npm", "NPM_TOKEN");
  const rejected = classifyNpm({ code: 1, stderr: "npm error code E401" });

  assert.equal(missing.ok, false);
  assert.equal(rejected.ok, false);

  assert.equal(missing.kind, "unreachable", "a secret that never arrived is not a token verdict");
  assert.equal(rejected.kind, "rejected");
  assert.notEqual(annotationTitle(missing), annotationTitle(rejected));

  assert.match(annotationTitle(missing), /did not arrive|unreachable/i);
  assert.match(annotationTitle(rejected), /rejected/i);
});

test("an unreachable secret still FAILS — it did not check anything", () => {
  // The one thing that must not happen: "nobody could tell" reading as "fine".
  assert.equal(missingSecret("pypi", "PYPI_TOKEN").ok, false);
});
