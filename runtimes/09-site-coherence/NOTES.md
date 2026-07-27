# Runtime 09 · site-coherence

**Status: 🟢 standing watch (14/14).** The site's own claims under audit —
the first runtime whose corpus is the PRESENTATION layer, because the site
now asserts things nothing else watched.

Corpus: the six `site/*.html` pages plus the three test suites themselves.
The **Mage** lifts the site's claims (the landing's "N checks green", the
evidence page's per-lane counts); the **Swordsman** re-derives reality:
navigation targets must exist, every page must wear the KYRA GATE lockup
(and the formal Gatehouse KY-A name off-landing), every guide `[[link]]`
must land on a real page and every guide page must be REACHABLE from
Welcome Visitors, evidence-page source references must exist on disk, and —
the sharpest tooth — **the check counts must recompute from the suites**:
`def test_` functions in guardrails, `it(` blocks in the vitest spec,
`check(` calls across every runtime's test.mjs (this file's own included:
the count is self-referential and stable).

Reject reasons: `nav-target-missing`, `brand-lockup-missing`,
`formal-name-missing`, `guide-link-dangling`, `guide-pages-unreachable`,
`landing-check-count-drift`, `evidence-lane-count-drift`,
`evidence-source-dangling`.

Consequence: growing any suite without updating the landing FAILS `pnpm
verify` — the site can no longer silently overstate or understate the
evidence. (This session: 157 → 184, caught and corrected by this very
mechanism during its own construction.)

Door: site copy changes are free (the watch checks structure and numbers,
not prose); renaming the brand or restructuring the guide updates this
runtime's expectations deliberately, in the same change.
