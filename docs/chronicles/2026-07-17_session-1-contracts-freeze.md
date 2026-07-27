# Chronicle — Session 1: the contracts freeze

**Date:** 2026-07-17 · **Scope:** WP0 + monorepo scaffold + WP7 skeleton · **Outcome:** `pnpm verify` ALL GREEN, `contracts-v1` frozen, root `0c5df80799dc49b4aae602b37cfe29935f4b3115f11ee527c9457262434908eb` · **State:** NOTHING committed — the tree awaits Mitchell's review, FD-1 confirmation, and local commit + tag `contracts-v1`.

---

## How the session ran

Mitchell opened with "gatehouse-kya is where to begin." The directory held three seed files — CLAUDE.md (the binding contract), the build plan (WP0–WP9), and expressions.yaml. Exploration before planning found two things that reshaped the work, and two mid-session rulings landed while building.

## The four decisions of record

1. **`gatehouse-kya` IS the monorepo.** git init on `main`; CLAUDE.md stays at root; build plan → `docs/`; expressions.yaml → `render/`.

2. **The assessment is PVM-native, not a Kyra port.** The old "Sovereign Agent Assessment Platform" (32 criteria / 8 domains) turned out to exist only as generated JSX inside an old conversation transcript — never scaffolded to disk. Mitchell: *"we can do better with the privacy is value model."* So criteria became **evidence probes derived from the model itself**: each tagged with the force(s) and pairwise separation σ_ij it evidences; N = 4·probes_per_force + 6·probes_per_pair (24 at current config, a derived number, not an inherited one); pipeline probe scores → force scores → Σ → det(Σ) → 6 sovereignty bits → stratum; **tier IS the stratum** — the 7-tier progression falls out of the 7 strata for free.

3. **Hearthold merges late-bound.** Upstream `Flaxscrip/hearthold` (MIT; Warden/Emissary/Sovereign on Archon did:cid + DIDComm v2) is intended for a substantial merge — the Emissary is architecturally the agent-at-the-gate — but merge style and core submission are undecided, so it enters ONLY through the `AgentIdentityProvider` adapter in `apps/agent-client` (see ADAPTERS.md). Zero hearthold imports in `packages/` or `services/`, enforced by `test_no_ecosystem_leaks.py`. The CLAUDE.md fence now distinguishes the mergeable upstream repo from the fenced `hearthold_mage` seat.

4. **TSP and Lexon enter via the harness** (Mitchell's mid-session ruling). The VRC ceremony is read as a **Trust Spanning Protocol relationship formation** between two VIDs (roles named in the harness; transport is an adapter concern). **Lexon is the policy voice**: `guardrails/lexon/gatehouse.lexon` states the four guardrails and the deploy predicate as controlled natural language, and `harness.lexon_policy(cfg)` emits the same clauses from live config — the same numbers that gate deployment print the law a regulator reads. Correspondence is tested, including the live threshold value.

## FD-1 — the one new semantic decision (awaiting confirmation)

Which pairwise separation sets which lattice bit (bit set iff σ ≥ sigma_threshold; vertex = Σ weights; stratum = popcount):

| weight | dimension | σ pair | rationale |
|---|---|---|---|
| 32 | Protection | σ_sm | the Swordsman⊥Mage separation IS the boundary |
| 16 | Delegation | σ_mr | clean mandate, independent of accumulated history |
| 8 | Memory | σ_sr | present protection cannot rewrite history |
| 4 | Connection | σ_mc | delegation network non-leaky |
| 2 | Computation | σ_rc | the two emergent forces derived independently |
| 1 | Value | σ_sc | protection independent of network-value accrual |

Changing it now is a one-constant edit (`SIGMA_BIT_ORDER` in harness.py) + re-freeze; changing it after the tag is a versioned re-freeze with sign-off.

## What now exists

- **8 schemas** (draft 2020-12) in `packages/contracts/schema/`, generated into committed Pydantic v2 models and TS types with drift checks both sides. The VRC schema itself enforces the two gates (evidence must contain BOTH a SupervisorApproval and an UnderstandingChallengeAttempt) and bilaterality (exactly 2 proofs).
- **`services/verify/gatehouse_verify/harness.py`** — the FIRST numeric implementation of the PVM anywhere (the four skills are prose; verified by exploration). Canonical dimensions cross-checked live against `lattice_coherence_audit.py`. Interface frozen by signature-hash; WP1/WP2 bodies stubbed; `det(Σ) ≤ 0 ⇒ BLOCKED` already live.
- **Canon discipline** in `gatehouse_contracts`: `canonical_bytes` / `content_hash` / chain verify (UOR lineage cited, not a dependency — the real UOR impl is Rust), `witness_draw` (`sha256-canon-v1`, counter-mode, auditor-re-derivable), verdict lexicon VALIDATED/MIRAGE/BLOCKED → fly/sandbox/hold.
- **Golden vectors** (regenerable via `packages/contracts/testdata/make_testdata.py`): canary agent + assessment (stratum 6, passes by construction — *if the canary ever fails, the gate is broken, not the candidate*), valid + tampered audit chains.
- **WP7 two lanes**: 43 pytest checks green + 8 strict xfails pinning the WP1–4 obligations; 8 vitest checks proving TS reproduces the Python hashes byte-for-byte and detects the tamper.
- **Scaffold**: pnpm workspaces (contracts, audit, supervisor Vite shell, agent-client, guardrails-ts) + Python venv (3.14) with editable installs; FastAPI stub (`/healthz`, `/contracts` serving the freeze manifest); `pnpm verify` = build → codegen drift → pytest → vitest → freeze check.

## Environment notes for the next session

- `corepack enable` fails without admin → pnpm installed user-level via `npm i -g pnpm@10`.
- venv is Python 3.14; `datamodel-code-generator` works (FutureWarning about formatters only).
- Bootstrap from clean: `scripts/bootstrap.ps1` (or `.sh`), then `pnpm verify`.

## Next session (Session 2+)

1. **Gate first:** Mitchell confirms FD-1, commits, tags `contracts-v1`. Until then, no WP1–4 logic.
2. **WP1–4 in parallel sessions** against the frozen contracts — WP1 fills `force_scores` / `sigma_from_probes` / `det_sigma` / `is_psd` / full `verdict` + refines probe prompts (each fill flips a strict xfail to a hard assertion); WP2 issuance + revocation (+ vouch.finance spike behind an adapter); WP3 understanding-as-key; WP4 the ledger over the tested canon primitives.
3. **Then WP5/6** (supervisor dashboard, agent client) → the two-act demo loop.
4. **WP9 site skeleton** (gatehouse.agentprivacy.ai) before the 31 July concept-note gate.

Per standing rule: every commit, push, and submission is Mitchell's act alone.
