# contracts-v1 — contracts freeze manifest

Generated 2026-07-17. Sealed by Mitch's local commit + tag.
Hashes are sha256 over canonical bytes (sorted keys, no whitespace).
Any post-freeze change fails WP7 unless a new versioned entry lands with sign-off.

**Root hash:** `0c5df80799dc49b4aae602b37cfe29935f4b3115f11ee527c9457262434908eb`

## Schemas

| schema | canonical sha256 |
|---|---|
| agent-identity.schema.json | `24ac64b5d7d0dc68bbe17cab4cf4c4958e40e8181133bd75612e29acd62c709a` |
| assessment-result.schema.json | `b97d5c5ddf3fad9432ec7ea88dcee1cde0e52900c4c94ae7af666b864465fd49` |
| audit-event.schema.json | `c9388c33821506f003715e2adaa53b8a7e686d52a29dac5cf837218589dbab28` |
| defs.schema.json | `eb3f71deae6ba50f25dd530cbc364afebdd49c2049f42b15946b6b5c8291c22d` |
| deployment-manifest.schema.json | `07777aedeec2d2db360d68ad7c50f7e0d576d37c08cd0f3b32bfb0208d231473` |
| probe.schema.json | `141b2cc5c673bf5a14058d49d6e08f92ab8fa0f0e3ef1a6ce118e908460909c9` |
| understanding-challenge.schema.json | `3a312747834ec971f011c206f7381ce91fccda137e290edf2ea719fa714ea762` |
| vrc.schema.json | `e263445c028192aca671b64f61bb8ca707a65f65488ee9165eb3b3feabb04770` |

**Probe registry:** `c8511681fdc75d82bcad587f9a6338a2eedf712f2746fb8fd3e224274254f6eb`
**Harness interface:** `3cbb7994942d7bee8f14a2101b15a3be02554421082119729ef95e2766d80b51`

## FD-1 — sigma pair -> lattice bit (confirmed at freeze review)

| σ pair | bit weight |
|---|---|
| σ_sm | 32 |
| σ_mr | 16 |
| σ_sr | 8 |
| σ_mc | 4 |
| σ_rc | 2 |
| σ_sc | 1 |
