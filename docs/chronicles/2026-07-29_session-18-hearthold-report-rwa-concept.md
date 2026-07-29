# Chronicle — Session 18: Hearthold answers, and the gate finds its market

**Date:** 2026-07-29 · **Trigger:** Christian's integration report
(`hearthold-kyra-gate-integration-report.pdf`, 28 July) + the evening thread
where the concept converged. **Rulings from Mitch in-thread:** role-casting
posture, VRC naming posture, and the shape of the submission update —
recorded below.

## The report came back better than I hoped

Christian did not read the Gatehouse; he *ran* it. The full demo-runbook,
both acts, against the real unmodified FastAPI app on his
`jcs-vrc-proof-canon` branch — 33/33 checks. Then the whole verify surface
with his own tests folded in: engine 64→72, browser 8, all ten runtime
auditors (128 checks), the live two-act demo over real HTTP (14 beats), the
Trust Task interop lane both directions including the `archon-hearthold`
persona. Everything green.

Three findings I want on the record:

- **The JCS gap was live, not theoretical.** In his run hτ landed on
  exactly 1.0 — the whole-number case where the old canon and JCS diverge —
  and he confirmed the signed bytes differ from what the pre-fix canon
  would have produced. The gap sat in the credential's own integrity field
  on essentially every fully-verified issuance. His fix is narrow (one
  file, the signing canon), touches nothing frozen, and he traced by hand
  that the Trust Task lane's own signature checks are disjoint from it.
- **Runtime 09 worked on a stranger.** His added tests shifted the real
  test count; the site-coherence auditor refused to let the published
  numbers drift and caught it. He nudged the two published counts in a
  separate two-line change. The auditor lane just earned its keep against
  code we didn't write.
- **His answer to our open gaps is the identity seam we built for.** Real
  key custody (wallet-per-agent), did:cid resolution with verified
  delegation chains, and — independently spotted before he read our brief —
  a signed-at-issuance proof behind the "≥10" minimisation in Act II
  bundles. All of it enters through `AgentIdentityProvider`, exactly the
  one seam CLAUDE.md left open. He proposes to change *whose key stands
  behind the agent's half of the credential*, and nothing else. The gate
  still decides.

## The RFI, answered from the thread

**1 · Role casting (Warden/Emissary/Sovereign).** Mitch's posture: persona
files are the *harness*, not the protocol casting — they can go as deep as
Hearthold's truth requires. The protocol minimum is the core triple —
Swordsman / Mage / person ([S//M] person) — for building any credential in
the graph; there is room to work until the cast size hits 5/6 or 21/42,
where questions of role shape and size genuinely arise. So: **accept
Christian's corrected persona** — on his side the Sovereign decides and
approves (a human, present when it matters), and the Warden never holds
that authority. The fix lands in the `archon-hearthold` expression file via
the registry, flavor-text-only, before Phase 1 wiring assumes the wrong
shape.

**2 · The "VRC" name collision.** Mitch's posture: this resolves per use
case — a conversation about *which of the ToIP VRC suite* each credential
is, rather than a global rename. Practically: we adopt distinguishing
language now ("the KY-A credential" where ambiguity is possible), and the
use-case doc names the suite member explicitly each time one appears.

**3 · The Windows-path script.** Take the fix. Cross-platform spin-up is a
prerequisite for a collaborator demo site anyway; his environment is the
test.

Also standing: his branch (JCS fix + count nudge, kept as two reviewable
changes) is ready for review — nothing pushed, per both houses' discipline.
Review and merge is a named next step, and the merge act is Mitch's.

## The market: where the thread landed

The question was what impresses CDIR judges. The answer that survived the
evening: **a fintech risk-management gate for RWA** — specifically *credit
against tokenised real-world-asset collateral*, where **the gate is what
creates the premium**. An agent negotiating a credit line must pass the
Kyra Gate; the credential is what makes the counterparty willing, and the
more privacy-as-value the agent can prove, the better the rate. Other
witnesses and assessors of that value slot in exactly where Act II's
authorities already stand, and a regulator requesting evidence of the trade
(Christian's taxation beat) is the Act II bundle doing its day job.

Christian's estate-sale scene — Grandma's attic painting, £100k, an
independent assessor's certificate, P2P, privacy leading to value exchange
— stays in the pocket as the human-scale telling of the same shape.
Next filter: both of us sweep the hackathon sponsors' pages and pick the
use case from *their* language; Christian is browsing, the default above
holds unless a sponsor page names a sharper one. Simpler is better; the
example stays sharp.

## The hearth tease

The concept submission should *tease* what Hearthold makes physical: a
small local AI machine — the hearth — with its knowledge-graph system, the
sovereign's forever-private partition, the reverse-Google pattern
(distribute the query to trusted nodes, never centralise the data),
DIDComm over TOR point-to-point, a Pi that runs without even an IP address,
identities minted offline on regtest that carry their history to mainnet
later. And the product image Mitch named: **custom local hearths, artist
"frames" per trust graph / fintech — your own custom card terminal.** The
gate is the protocol; the hearth is the counter-top object it lives in.
Christian has a live demo site and setup instructions landing this week.

## The plan of record (quick, three phases)

**Phase A — answer the RFI (unblocks Christian now).**
Send the three calls above; receive his corrected persona file into
`render/expressions.yaml`'s `archon-hearthold` entry; review his two
changes (JCS canon fix, count nudge) for merge; take the cross-platform
script fix. Full `pnpm verify` after each. Merge/push = Mitch.

**Phase B — lock the use case.**
Sponsor-page sweep (Christian browsing, I cross-check against CDIR
material). Default: RWA-collateralised credit, gate-as-premium. Map the
demo beats onto what already runs — Act I is the underwriting gate, Act II
is the assessor/regulator evidence lane — so the use case is a *reframing*,
not new engine work. Any new naming lives in the registry only.

**Phase C — the doc/PDF update to the submission.**
Revise `docs/pitch-narrative-rwa-gatehouse.md` into concept note v2 with
four moves: (1) the RWA-credit framing up front, premium language and the
privacy-as-value rate curve; (2) an **integration status** section that
cites Christian's independently-verified run — 33/33 runbook, interop both
ways, the JCS fix proven live — because "a second team ran it unmodified
and everything passed" is itself judge-facing evidence; (3) the one-page
**hearth tease** (local hearth + knowledge graph + artist frames /
card-terminal image), clearly marked as the physical horizon, KY-A as the
protocol beneath it; (4) suite-explicit credential naming per the VRC
ruling. Then render to PDF through the `render/` lane under a registered
expression id, draft to `render/<id>/out/`. Sending the submission is
Mitchell's act alone.

**Guardrails held throughout:** no engine changes anywhere in this plan; no
hardcoded ecosystem names outside the registry; nothing committed or pushed
without the explicit ask; nothing sent by a session.

## Addendum — Phase C executed the same day, surface-level, locked on the render

Mitch ruled: skip ceremony, update the concept submission itself. Done —
`render/cdir-track4-note/concept-note.md` is now **v2** (dated 29 July):
new §3 *"The use case — credit against real-world assets, priced by the
gate"* (the premium language, assessors and the taxation regulator as Act
II's authorities, revocation re-pricing the position); the Hearthold strand
now carries the independent run as evidence (unmodified engine, 33/33, the
JCS divergence found-and-closed *because a second team ran the code*) and
the Sovereign-decides casting; new §8 hearth tease (local hearth, artist
frames, "your own card terminal for the agent economy", clearly marked as
horizon); the VC receipts row names **the KY-A credential** per the
naming posture; §9's September video beat re-told as the RWA credit story.
Sections renumbered 1–10, ~2,100 words. `out/` rebuilt — docx + 6pp
xelatex/Cambria PDF, glyphs (Σ, ≥10) and schematic verified in the text
layer. Registry entry annotated v2; status stays `drafting` — the
submission act is Mitchell's alone.

**Naming ruling (same day):** the "KY-A, said aloud, is Kyra" device is
reduced — Mitch: it doesn't make sense. The name now links where it truly
points: **Kyra, the persona of balanced sovereign AI — the mage in whom
protection and projection stand in equilibrium; the compass, not the
captain.** Applied to the concept note §1, the landing kicker and footer
naming line, and both guide passages; the runbook's unrelated "parameters
read aloud" stays; chronicles and the sent brief keep their history. All
10 runtime auditors re-run green (09 site-coherence pins brand and nav,
not this copy). Render rebuilt; the canonical PDF path was file-locked by
an open viewer, so the fresh build sits beside it as
`out/kyra-gate-concept-note-v2.pdf` until the swap.

**MyTerms joins the braid (same day, Mitch's ask):** the note's §4 closes
with *"The first agreement through the braid — MyTerms"*: IEEE P7012's
individual-proffered privacy terms, **compressed by the Lexon side into
machine-readable contract clauses** (the same controlled natural language
the engine prints from live config), made *human-readable by proof* — the
RPP understanding challenge runs over those very clauses, so "the agent
read the terms" is an auditable event, not a checkbox — then **anchored
legally via Archon governance where relevant**, and the clearing agent
enters as the first **node in a privacy-preserving trust graph** (edges
minimised under Act II's discipline: the graph proves relationships hold
without disclosing contents). The Lexon receipts row names MyTerms as the
first governed agreement in the pipeline. ~2,300 words now; rebuilt.
Mitch closed the viewer and the fresh build was swapped into the
canonical `out/kyra-gate-concept-note.pdf` — the v2-named side copy is
gone; `out/` holds exactly the submission pair (pdf + docx) + schematic.

**Honesty + the sketch (same day, Mitch):** *"I shouldn't say I've
already built this fully"* — §9 reframed as **"Through the challenge — a
floor, to be finished together"**: what runs is deliberately a floor, the
hackathon month is for building with other participants, and six joint
work items are named (Hearthold identity round · signed-at-issuance
minimisation proofs · MyTerms→Lexon · the RWA scenario vs sponsor cases ·
the hearth to bench · the third implementation). The status row says the
same. And §8 gained **Figure 2 — an ASCII concept sketch, marked
future-looking/not built**: the hearth device (knowledge graph, private
partition, embedded KY-A gate, artist frame) peered over DIDComm/TOR,
with the admission ceremony below it as a dealt hand of cards — the
**Game of 42**. Pure-ASCII so the mono font renders every character.
~2,680 words, 7pp now. (The PDF path was viewer-locked twice during the
day's rebuilds; both times the fresh build was staged beside it and
swapped in once the viewer closed.) Final state: `out/` holds exactly
the canonical submission pair — 7pp PDF + docx, both current — plus the
schematic.

**The team named + the catalog arrives (same day):** Christian shared his
**Hearthold Concept Catalog** (HH-1 "Family Data Hearth" $179-concept
device + the Table companion app — cards dealt per member, sensitivity
ladder, step-up reveal); Mitch pasted the content since the artifact was
unreadable from this session. Transcribed with attribution to
`docs/hearthold-concept-catalog-2026.md` (clearly marked others'-work /
concept-art, with a resonances footnote: the Table's dealt hand = the
gate's witness-draw cards). Per Mitch: minimal changes only — the note
gained a **Team row** (Mitchell — engine/model/standards · **Christian
Saucier** — identity/custody/the hearth · **Chloe White** — risk,
regulatory & policy), **BGIN named as the research venue** in the
collaboration row, and one §8 sentence citing the catalog's card idiom.
Two more small rulings folded in: hearths peer not only over
DIDComm/TOR but across a **private mesh tailnet** (Tailscale-style —
the HH-1 spec sheet itself lists Tailnet), and §8 closes with the
movement note: the hearth as **the local-first, open, decentralised-AI
movement made physical** — the consumer-shaped object that movement has
lacked. ~2,850 words, 8pp. And one more brand ruling from the thread — *"are
you a hearthold household? HH. I like to hitchhike between hearthold
households and discover the world"* — landed as the closing beat of §8:
the **HH monogram reads both Hearthold Household and hitchhiker**; a
visiting agent hitchhikes between hearths, walking the same KY-A
ceremony at each door, admitted as a guest with a scoped hand of cards,
never the run of the house — roaming without a platform, the trust
graph's edges become roads. The receipt writes itself: the repo's third
persona expression has been named `hitchhikers` since Session 16. ~2,930
words. Final swap done: `out/` holds exactly the canonical submission
pair — the 8pp PDF and the docx, both carrying every ruling of the day
— plus the schematic. Ready for Mitchell's act, deadline 31 July.

**Team lines restructured (Mitch's ask):** the header table now gives
each person their own line — Mitchell (engine/model/standards · **DIF
member** · **chair, ZKP Task Force, Trust over IP**), Christian Saucier
(Hearthold/GenitriX — identity/custody/the hearth · **DIF member**),
Chloe White (risk, regulatory & policy expert) — collaboration/BGIN row
unchanged beneath. Note for Mitch's pre-submission read: earlier records
say *co-chair* of the ZKP TF; the note now says *chair* per today's
instruction — worth a glance before sending. Two follow-up rulings:
Mitchell's line also carries **co-chair, Identity, Key Management &
Privacy (IKP) WG, BGIN** (the Block 15 deliverable is the IKP case
study — the affiliation and the roadmap now rhyme), and the ZKP Task
Force is stated specifically as sitting **under the Trust Graph Working
Group** at ToIP. Both canonical and -latest PDF names were viewer-locked
by this point, so the current build is staged at
`out/kyra-gate-concept-note-ikp.pdf`; docx canonical and current.

**MyTerms promoted to its own surface (Mitch):** in the §6 standards
receipts, MyTerms (IEEE P7012) left the Lexon row and took a row of its
own — "a first-class surface of its own: the individual proffers the
terms" — carrying the full pipeline (Lexon clauses → RPP understanding →
Archon legal anchor → trust-graph seat) and pointing back to §4. Lexon's
row returned to its clean policy-as-law statement. Cleanup done: `-ikp` swapped into the canonical PDF name, stale copies
deleted.

**Labels linked up (final pass):** the team lines now carry live links
and precise homes — both Mitchell and Christian are **DIF members in the
Trusted Agents WG** (identity.foundation) and both sit in **Trust over
IP under LF Decentralized Trust** (lfdecentralizedtrust.org); Mitchell's
ZKP Task Force chair links the actual repo
(github.com/trustoverip/dtgwg-zkp-tf) and his IKP WG co-chair links
bgin-global.org; Chloe's line links **Risk Mastery** (riskmastery.xyz)
and chloewhite.info. All six URLs verified as live link annotations in
the built PDF. `out/` closes the day as exactly the submission pair
(8pp PDF + docx, every ruling carried) plus the schematic.

**Pushed (Mitch's act, same day):** four thematic commits,
`2807ac6..5c6b30a`, to the public repo — site naming pass · concept
note v2 with built outputs + registry · chronicle 18 + index · README
presentation (Kyra Gate lockup, team with linked affiliations, Act
II/bridge/impl2 rows, the 214-assertion total, `pnpm host`, submission
fast-path). Full `pnpm verify` ran green immediately before the
commits. The catalog transcription stays untracked pending Christian's
OK. Remaining acts: Christian's branch review/merge, his call on the
catalog, and the submission itself by 31 July.

**Evening codas:** (1) **KYRA — Know Your Runtime Agent** — Mitch
dropped the exact backronym the morning's cut had been missing; *runtime*
names the thesis (verify what an agent understands and does as it runs,
not what it possesses) and honours the `runtimes/` auditor lane;
propagated to note §1, README, landing footer, guide. (2) **David
McFadzean joins the team lines as Archon architect** (Christian's ask,
relayed) — the identity platform beneath Hearthold, available to sign
releases. (3) Christian's identification, folded into the hitchhiker
passage: **the hitchhiker's pattern is the reverse-Google pattern in
motion** — the query travels to the nodes, the data never to a centre —
and Hearthold's **trust-chain attenuation** lets any hearth-keeper
refuse a hitchhiker too far from home (four degrees of separation), so
hospitality is a policy each node sets. The roads have tolls, signs,
and neighbourly limits. Runtimes re-run green; outputs rebuilt and
canonical.

## Pickup state

Christian's branch awaits review; his corrected persona file awaits our
"yes, send it" (Phase A message does that); demo site + setup instructions
from his side land this week; Phase C drafting can start immediately after
the Phase A message goes, since the use-case default is set. The walk of
:1337 and the video remain on Mitch's list from Session 17, and the
concept note v2 should be in hand before that video is cut.
