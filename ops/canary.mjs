/**
 * What each registry's answer MEANS — the token canary's judgement.
 *
 * Separated from the probing so it can be tested without a network, because the
 * paths that matter are the ones that look like success from the outside:
 *
 * - A Packagist **safe** token answers 403, which reads like the account
 *   lacking rights rather than the token being the wrong KIND.
 * - npm is NOT probed. It publishes through Trusted Publishing (OIDC) and no
 *   workflow reads `NPM_TOKEN`; see RULES.md, Publishing, for why that arm
 *   was retired rather than kept, and what a future token must be.
 * - Any non-2xx quietly read as "fine" — the same shape as a failed registry
 *   lookup counting as "up to date".
 *
 * Nothing here defaults to ok. An unrecognised answer is a FAILURE, because
 * "nobody could tell" and "it is working" are different states and only one of
 * them should be green.
 */

/**
 * The fix, stated where the failure is read — and stated in FULL.
 *
 * The `gh secret set` line is the easy half. The half that goes wrong is the
 * token pasted into it — Packagist's SAFE token is the example that bit: it
 * authenticates, and then refuses the one endpoint a registration needs.
 *
 * Whoever reads this at 3am should not have to go looking for the rest.
 */
export const ROTATE = {
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
 * plan, and `gh secret list --org` shows nothing that would tell you. "PYPI_TOKEN
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
  const registry = verdict.registry ?? "canary";

  if (verdict.ok) return registry;
  if (verdict.kind === "unreachable") return `${registry}: the secret did not arrive — nothing was checked`;

  return `${registry}: rejected`;
}
