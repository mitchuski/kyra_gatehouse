"""Real ed25519 keys and did:key identities for the demo parties.

Every proof in the demo is a REAL ed25519 signature over canonical bytes.
DIDs are real did:key identifiers: multicodec 0xed01 + the 32-byte public
key, base58btc, multibase prefix 'z' (so verification needs no resolver —
the DID IS the key).

Custody note (honest): demo agent keys are held by this service ("custodial
demo signer"). Production custody belongs to the identity adapter lane in
apps/agent-client — the interface is already seated; the ceremony would then
countersign client-side. The SIGNATURES are real either way; only the custody
is demo-grade. Keys derive deterministically from a demo seed so ledgers and
credentials reproduce across restarts.
"""

import hashlib

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from gatehouse_contracts.canon import canonical_bytes

_B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, "big")
    out = ""
    while n:
        n, r = divmod(n, 58)
        out = _B58[r] + out
    pad = len(data) - len(data.lstrip(b"\x00"))
    return "1" * pad + out


def b58decode(text: str) -> bytes:
    n = 0
    for ch in text:
        n = n * 58 + _B58.index(ch)
    raw = n.to_bytes((n.bit_length() + 7) // 8, "big")
    pad = len(text) - len(text.lstrip("1"))
    return b"\x00" * pad + raw


class Keypair:
    """A real ed25519 keypair with its did:key identity."""

    def __init__(self, seed32: bytes):
        self._sk = Ed25519PrivateKey.from_private_bytes(seed32)
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

        self.public_bytes = self._sk.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
        # did:key for ed25519: multicodec varint 0xed 0x01 + raw key, base58btc, 'z' prefix
        self.public_key_multibase = "z" + b58encode(b"\xed\x01" + self.public_bytes)
        self.did = f"did:key:{self.public_key_multibase}"

    @classmethod
    def from_seed(cls, label: str) -> "Keypair":
        return cls(hashlib.sha256(f"gatehouse-demo-seed:{label}".encode()).digest())

    def sign(self, obj) -> str:
        """Sign canonical bytes; multibase (z + base58btc) signature."""
        return "z" + b58encode(self._sk.sign(canonical_bytes(obj)))


def verify_signature(did_or_multibase: str, obj, signature_multibase: str) -> bool:
    """Verify a multibase ed25519 signature against a did:key (no resolver needed)."""
    try:
        mb = did_or_multibase.split("did:key:")[-1]
        decoded = b58decode(mb[1:]) if mb.startswith("z") else None
        if not decoded or decoded[:2] != b"\xed\x01" or len(decoded) != 34:
            return False
        pub = Ed25519PublicKey.from_public_bytes(decoded[2:])
        sig = b58decode(signature_multibase[1:]) if signature_multibase.startswith("z") else None
        if not sig:
            return False
        pub.verify(sig, canonical_bytes(obj))
        return True
    except Exception:
        return False
