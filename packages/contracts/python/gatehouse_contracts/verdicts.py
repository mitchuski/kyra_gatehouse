"""The verdict lexicon. Two vocabularies, one mapping, never a third.

VALIDATED -> fly (deploy), MIRAGE (failed a held-out gate) -> sandbox,
BLOCKED (violated a hard constraint) -> hold.
"""

VERDICTS = ("VALIDATED", "MIRAGE", "BLOCKED")
DECISIONS = ("fly", "sandbox", "hold")

VERDICT_TO_DECISION: dict[str, str] = {
    "VALIDATED": "fly",
    "MIRAGE": "sandbox",
    "BLOCKED": "hold",
}
