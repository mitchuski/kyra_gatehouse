# Chronicle — Session 10: the landing page (and why AURORA)

**Date:** 2026-07-18 · **Trigger:** Mitch: *"why aurora naming? also this
seems quite technically robust we need a landing page."*

## The naming, on the record

AURORA and MIRAGE are a matched pair of **atmospheric-light names**, chosen
in session 8: an aurora is real light in the sky; a mirage is light that
lies. The pair encodes the demo's central argument in its cast — both agents
are striking to look at, both talk fluently, and only the instruments can
tell which one is real. The names are deliberately register-safe (standards
voice, no ecosystem vocabulary at the demo layer) and they are one-line
edits in `app.py`'s `DEMO_AGENTS` if Mitchell wants different ones — with
the note that renaming changes the demo key seeds, so the did:key
identities regenerate (nothing frozen depends on them).

## The landing

`site/index.html` rebuilt as a true front door (`landing.css` new — dark,
wearing the cockpit's colours; the four inner pages keep the calm light
register on `style.css`: the landing sells, the pages inform):

- **Hero:** "The checkpoint where AI agents prove *understanding* — not
  possession of a key," with three CTAs (Enter the gatehouse → `/supervisor/`
  · Watch an agent → `/agent/` · Read the evidence) and a status chip strip.
- **Liveness as design:** the landing fetches `/healthz` and `/demo/agents`
  on the same origin and adds a pulsing "engine live on this origin" chip
  plus the seeded-agent count — the front door demonstrates the claim it
  makes. Graceful no-op when served statically.
- **The tetrahedron strip:** three inline SVGs — standing (det 0.95, flies),
  sinking (0.09, sandboxed), flat (≤0, held) — the whole scoring model in
  one glance.
- **"Two agents walk up to a gate":** the AURORA/MIRAGE pair as cards, with
  the naming logic surfaced as copy (real light / false light) and the
  line — *the instruments are not listening to the talk.*
- **Two acts, both LIVE**, condensed with the eight-station rail (pool now
  a station).
- **"Robust is a claim. Here it is a table."** — the proof strip (157
  checks, PROVEN claims, two real signatures, disclosure ratio < 1) linking
  the technical robustness Mitch named to the evidence page.
- **The CDIR question + one-sentence answer** as the closing band.

Verified live through the running host: landing, stylesheet, and inner
pages all answer on :1337; hero, pair cards, and CTAs render.

## Addendum — the messaging pass + the Kyra recognition (same day)

Mitch: *"i think we need to work on the landing messaging also gatehouse
ky-a is kinda a Kyra Gate?"* — he heard it: **KY-A said aloud is "Kyra."**
The engine descends from the original Kyra assessment work (the platform the
PVM-native probes superseded in session 1), so the acronym has carried the
lineage since the project was named. RULED INTO MESSAGING, deliberately and
quietly:

- **Hero kicker:** `KNOW YOUR AGENT · KY-A — say it aloud` — the reader
  hears it themselves; nothing is spelled out above the fold.
- **Footer naming line:** *"KY-A — pronounced 'Kyra': the gate keeps the
  name of the first agent we ever assessed. What began as one agent's
  self-assessment became the checkpoint every agent walks through."* True,
  register-safe, and the origin story in two sentences.

Copy tightened throughout (one idea per beat): hero is now **"Agents don't
get keys here. They get understood."**; pair-band lede "No interview can
tell them apart. The instruments can."; acts lede "Act I proves an agent.
Act II is the payoff: authorities pooling threat intelligence with nothing
worth stealing in transit."; proof band gains "The gate never says yes or
no off the record." All verified live on :1337.

## State

Local-only, uncommitted, per the standing rulings. The landing is the
note's visual anchor: hero + tetra strip + pair cards are the schematic
material. Doors unchanged (walk, video, note harvest, acceptance).
