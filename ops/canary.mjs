/**
 * What each registry's answer MEANS — the token canary's judgement.
 *
 * Separated from the probing so it can be tested without a network, because the
 * paths that matter are the ones that look like success from the outside:
 *
 * - A Packagist **safe** token answers 403, which reads like the account
 *   lacking rights rather than the token being the wrong KIND.
 * - An npm token scoped to **selected packages** authenticates perfectly and
 *   cannot create a package that does not exist yet. Every friends package is
 *   new, so that fault lands on the very first publish.
 * - Any non-2xx quietly read as "fine" — the same shape as a failed registry
 *   lookup counting as "up to date".
 *
 * Nothing here defaults to ok. An unrecognised answer is a FAILURE, because
 * "nobody could tell" and "it is working" are different states and only one of
 * them should be green.
 */

/**
 * When NPM_TOKEN stops working.
 *
 * A literal, and the ONE place it is written down. Created 2026-08-20 with a
 * 30-day life. PYPI_TOKEN and PACKAGIST_TOKEN have no stated expiry, which is
 * UNVERIFIED rather than "never" — the canary probes them nightly for exactly
 * that reason.
 *
 * Rotating the token means changing this date in the same commit.
 */
export const NPM_TOKEN_EXPIRES = "2026-09-19";

/** How long before an expiry the canary starts failing. */
export const WARN_DAYS = 7;

/**
 * The fix, stated where the failure is read — and stated in FULL.
 *
 * The `gh secret set` line is the easy half. The half that goes wrong is the
 * token pasted into it: a granular token scoped to SELECTED PACKAGES
 * authenticates perfectly, passes `npm whoami`, and cannot create a package
 * that does not exist. Every friends package is new, so that fault first
 * appears on a publish — after a tag has been pushed, which is the one thing
 * that cannot be taken back.
 *
 * Whoever reads this at 3am should not have to go looking for the rest.
 */
export const ROTATE = {
  npm:
    "gh secret set NPM_TOKEN --org Fancy-Friends --visibility all\n" +
    "  The token: npmjs.com -> Access Tokens -> Generate New Token -> GRANULAR.\n" +
    "  Permissions: Read and write. Scope: ALL packages in @particle-academy —\n" +
    "  the SCOPE, not selected packages. A selected-packages token passes\n" +
    "  `npm whoami` identically and cannot create a package that does not exist.",
  pypi: "gh secret set PYPI_TOKEN --org Fancy-Friends --visibility all",
  packagist:
    "gh secret set PACKAGIST_TOKEN --org Fancy-Friends --visibility all\n" +
    "  Take the MAIN API token from packagist.org/profile/ ('Show API Token').\n" +
    "  A SAFE token cannot call create-package and refuses with a 403 that reads\n" +
    "  like a permissions problem in our own code.",
};

/**
 * A secret that did not arrive — a FAILURE, and one that names the likely cause.
 *
 * All four arrived EMPTY on the first real run. They existed, with visibility
 * ALL: organization secrets simply do not reach PRIVATE repositories on the FREE
 * plan, and `gh secret list --org` shows nothing that would tell you. "NPM_TOKEN
 * is not set" would send whoever reads it to re-create a secret that is already
 * correct.
 *
 * The repo is named because whether a secret reaches depends on the REPOSITORY.
 * If the org ends up with some repos public and some private, a red canary in
 * one and a successful publish from another are BOTH correct, and only the repo
 * name makes that legible.
 */
export function missingSecret(registry, name, repo = process.env.GITHUB_REPOSITORY ?? "this repo") {
  const key = name.split(" / ")[0];

  return {
    ok: false,
    registry,
    // NOT a verdict about the token — nothing was checked. Still a failure,
    // because "nobody could tell" must never read as "fine".
    kind: "unreachable",
    detail: `${name} is not set for ${repo}, so nothing was checked`,
    remedy:
      `The secret may well EXIST and still not arrive: organization secrets do not reach PRIVATE ` +
      `repositories on GitHub's FREE plan, whatever visibility they are given. Check whether ${repo} ` +
      `is private and the org is Free before re-creating anything. If it genuinely needs setting: ` +
      `gh secret set ${key} --org Fancy-Friends --visibility all`,
  };
}

/* ── npm ──────────────────────────────────────────────────────────────────── */

/**
 * `npm whoami` — proves the token is LIVE, and nothing more.
 *
 * It does not prove the token is scope-wide, and the caveat is returned rather
 * than assumed, so a green run cannot imply more than it checked.
 */
export function classifyNpm({ code, stdout = "", stderr = "" }) {
  const who = stdout.trim();

  if (code === 0 && who) {
    return {
      ok: true,
      registry: "npm",
      detail: `authenticated as ${who}`,
      caveat:
        "This proves the token is LIVE. It does NOT prove its scope. A token limited to " +
        "selected packages answers whoami exactly like this one and cannot create a new package — " +
        "and every friends package is new, so that fault would first appear on a publish.",
    };
  }

  if (code === 0) {
    return {
      ok: false,
      registry: "npm",
      kind: "rejected",
      detail: "whoami exited 0 and printed no username, which is not an answer",
      remedy: ROTATE.npm,
    };
  }

  return {
    ok: false,
    registry: "npm",
    kind: "rejected",
    detail: `whoami exited ${code}: ${(stderr || stdout).trim() || "no output"}`,
    remedy: ROTATE.npm,
  };
}

/* ── Packagist ────────────────────────────────────────────────────────────── */

/**
 * `create-package` against a repository Packagist ALREADY knows.
 *
 * The honest probe: it authenticates and exercises the same UNSAFE endpoint a
 * real registration uses, while creating nothing — because the package is
 * already there and Packagist refuses. The three failure modes are only
 * distinguishable from the response BODY, so the body is kept and quoted.
 */
export function classifyPackagist({ status, body = "" }) {
  const text = String(body);
  const lower = text.toLowerCase();

  if (status >= 200 && status < 300) {
    return {
      ok: false,
      registry: "packagist",
      detail:
        "create-package SUCCEEDED against a repository that is supposed to be already registered — " +
        `so this probe created something. Point it at a registered package. Response: ${text}`,
      remedy: "Fix the probe target in .github/workflows/token-canary.yml.",
    };
  }

  if (lower.includes("already exists") || lower.includes("duplicate") || lower.includes("already been")) {
    return {
      ok: true,
      registry: "packagist",
      detail: `the MAIN token is live — Packagist answered "already exists" (HTTP ${status})`,
      caveat:
        "This proves the token authenticates AND is the main (unsafe-capable) one, which is the " +
        "pair create-package needs.",
    };
  }

  if (status === 403) {
    return {
      ok: false,
      registry: "packagist",
      detail:
        "403 — this is a SAFE token, not the main one. create-package is classed UNSAFE by " +
        `Packagist and refuses a safe token. It reads like a permissions problem and is not. Response: ${text}`,
      remedy: `Take the MAIN token from https://packagist.org/profile/ ("Show API Token"), then: ${ROTATE.packagist}`,
    };
  }

  // Packagist answers 406 for a bad credential, NOT 401 — observed against the
  // live endpoint on 2026-08-20. And 406 is also what "already exists" returns,
  // so the STATUS cannot separate the pass from the failure in either
  // direction. Only the body can, which is why it is kept.
  if (
    status === 401 ||
    lower.includes("username") ||
    lower.includes("apitoken") ||
    lower.includes("credential")
  ) {
    return {
      ok: false,
      registry: "packagist",
      detail:
        `HTTP ${status} — the credential was rejected. Check PACKAGIST_USERNAME as well as the ` +
        `token; the API wants "username:token" and a wrong username fails identically. Response: ${text}`,
      remedy: ROTATE.packagist,
    };
  }

  // Deliberately the safe direction. If Packagist changes its wording, a VALID
  // token reads as unrecognised and this goes RED — a false alarm rather than a
  // false green — and the quoted body is what makes the matcher a one-line fix.
  return {
    ok: false,
    registry: "packagist",
    detail: `unrecognised answer, HTTP ${status}: ${text}`,
    remedy: `If this is transient it will clear on the next run. If it repeats: ${ROTATE.packagist}`,
  };
}

/* ── PyPI ─────────────────────────────────────────────────────────────────── */

/**
 * PyPI has no `whoami`, so the probe is the upload endpoint with NOTHING to upload.
 *
 * `POST https://upload.pypi.org/legacy/` authenticates FIRST and validates the
 * form second, which is what makes this a real auth check rather than an invented
 * one:
 *
 * | answer | means |
 * |---|---|
 * | **400** | the token was accepted; the empty upload was refused. The pass. |
 * | 403 | invalid or expired token |
 * | 2xx | something was UPLOADED, which cannot happen with no file attached |
 *
 * Nothing is published: the request carries no distribution file. Said plainly
 * because "we could not check PyPI cheaply, so we checked nothing" would be a
 * canary that cannot fail, and that reads as coverage.
 */
export function classifyPypi({ status, body = "" }) {
  const text = String(body);

  if (status >= 200 && status < 300) {
    return {
      ok: false,
      registry: "pypi",
      detail:
        "the upload endpoint answered 2xx, which would mean something was uploaded — " +
        `but nothing was sent. Treat this as unexplained rather than fine. Response: ${text}`,
      remedy: "Inspect the probe in .github/workflows/token-canary.yml before the next publish.",
    };
  }

  if (status === 400) {
    return {
      ok: true,
      registry: "pypi",
      detail: "the token was accepted — PyPI rejected the empty upload (HTTP 400), which is the pass",
      caveat:
        "This proves the token authenticates. It does NOT prove it is account-scoped, and only an " +
        "account-scoped token can create a project that does not exist yet.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      ok: false,
      registry: "pypi",
      detail: `HTTP ${status} — the token is invalid or expired. Response: ${text}`,
      remedy: ROTATE.pypi,
    };
  }

  return {
    ok: false,
    registry: "pypi",
    detail: `unrecognised answer, HTTP ${status}: ${text}`,
    remedy: `If this repeats: ${ROTATE.pypi}`,
  };
}

/**
 * The annotation title, which is all a triager sees before opening the run.
 *
 * "A token is dead" and "the secret never arrived" are both red and their
 * remedies are opposite: one is a rotation, the other is a repository
 * visibility problem that no amount of re-creating the secret will fix.
 */
export function annotationTitle(verdict) {
  const registry = verdict.registry ?? "expiry";

  if (verdict.ok) return registry;
  if (verdict.kind === "unreachable") return `${registry}: the secret did not arrive — nothing was checked`;

  return `${registry}: rejected`;
}

/* ── Expiry ───────────────────────────────────────────────────────────────── */

const DAY = 24 * 60 * 60 * 1000;

/**
 * Fail BEFORE the expiry, not on it.
 *
 * Discovering a lapsed token mid-publish is discovering it after a partial
 * release across three registries, which is the one state that cannot be undone.
 * The boundary is inclusive: exactly `WARN_DAYS` out already fails.
 */
export function checkExpiry(iso, now = new Date(), warnDays = WARN_DAYS) {
  const expires = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(expires)) {
    return { ok: false, detail: `NPM_TOKEN_EXPIRES is not a date: ${iso}`, remedy: ROTATE.npm };
  }

  const daysLeft = Math.floor((expires - now.getTime()) / DAY);

  if (daysLeft > warnDays) {
    return { ok: true, daysLeft, detail: `NPM_TOKEN expires ${iso} — ${daysLeft} days left` };
  }

  return {
    ok: false,
    daysLeft,
    detail:
      daysLeft < 0
        ? `NPM_TOKEN EXPIRED on ${iso}, ${-daysLeft} days ago. Publishing is broken now.`
        : `NPM_TOKEN expires ${iso} — ${daysLeft} day(s) left. Rotate before it lapses mid-publish.`,
    remedy: `${ROTATE.npm}\n  …then update NPM_TOKEN_EXPIRES in scripts/lib/canary.mjs in the same commit.`,
  };
}
