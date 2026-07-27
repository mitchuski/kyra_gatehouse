# Vendored trust-task schemas — provenance

These files are **data, not contracts** (contracts-v1 stays frozen). They are
byte-identical copies of the `agent-admission/*` Trust Task family payload
schemas plus the framework `Ext` schema, taken from the local DTG workbench:

- **Source repo:** clone of `trustoverip/dtgwg-trust-tasks-tf`
  (local workbench `~/dtgwg-trust-tasks-tf-mage`)
- **Upstream base commit:** `894fcc6bcaf968eb652bc43b0a24057933fb59fc`
- **Family status there:** local additions (untracked), `npm run validate`
  green: 176 specs / 34 shared schemas (repo baseline 166/33)
- **Vendored:** 2026-07-18 · session 14 lane TT-1 (chronicle
  `docs/chronicles/2026-07-18_session-14-toip-trust-tasks-lane.md`)

Directory layout is flattened (`<task>.0.1.payload.schema.json`); the files'
bytes are untouched, so their internal relative `$ref`s
(`../../_shared/0.1/admission.schema.json`, `../../../_framework/0.1/framework.schema.json`)
do not resolve on disk here. The envelope module's validator resolves them via
an explicit ref map instead — see `../envelope.mjs`. Do not rewrite the refs in
place: byte-identity is what makes the digests below meaningful.

## Digests (sha256)

| File | Digest |
|---|---|
| `agent-admission/apply.0.1.payload.schema.json` | `f46add3dfec77732edbe1ed9e998f2d5091ccad30f1bf671626051b3eb644694` |
| `agent-admission/respond.0.1.payload.schema.json` | `5fcbde8d46962d7aa751bffd98e829441f975240fb5001d535e30429b7c31b76` |
| `agent-admission/approve.0.1.payload.schema.json` | `e15afb5fea436cc49679ac8fd0881b0a83f8da0b6bc7b06eac8ffe4d7f7a4900` |
| `agent-admission/issue.0.1.payload.schema.json` | `3c073b636b0c4e3fb6d25e5bfbcbf1b832da65eeea4e4cfc0a23ada87bbfb3a2` |
| `agent-admission/revoke.0.1.payload.schema.json` | `abe8bed162f56fc28db2a122f422ebe096b49982c37ece69204b7e01cafdb898` |
| `agent-admission/status.0.1.payload.schema.json` | `2b5ba0bf81c121f6cb9041f115a506f49054dda224b10a41b29ac5cfe786d7f2` |
| `agent-admission/_shared/admission.0.1.schema.json` | `d1a2f3c2a83814f24e3826d1b520c6d59a096b4139c4999ac21d75eff9779367` |
| `_framework/framework.0.1.schema.json` | `777a5777b7a092848ef77fa175031e1ca86ce367888f77fcd9efb0317a165b8e` |

Drift check: re-hash against the workbench copies before any refresh; a digest
change here without a matching workbench change is tampering, not drift.
