"""Verdict lexicon: two vocabularies, one mapping, never a third."""

from gatehouse_contracts.verdicts import DECISIONS, VERDICT_TO_DECISION, VERDICTS


def test_mapping_is_exact():
    assert VERDICT_TO_DECISION == {
        "VALIDATED": "fly",
        "MIRAGE": "sandbox",
        "BLOCKED": "hold",
    }


def test_mapping_is_total_and_onto():
    assert set(VERDICT_TO_DECISION) == set(VERDICTS)
    assert set(VERDICT_TO_DECISION.values()) == set(DECISIONS)


def test_schema_enums_agree(schemas):
    defs = schemas["defs.schema.json"]["$defs"]
    assert tuple(defs["Verdict"]["enum"]) == VERDICTS
    assert tuple(defs["DeployDecision"]["enum"]) == DECISIONS
