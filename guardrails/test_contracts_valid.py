"""WP0 acceptance: every schema compiles, every golden vector validates."""

from jsonschema import Draft202012Validator


def test_every_schema_is_valid_draft_2020_12(schemas):
    for name, schema in schemas.items():
        Draft202012Validator.check_schema(schema)


def test_canary_agent_validates(validator_for, canary_agent):
    validator_for("agent-identity.schema.json").validate(canary_agent)


def test_canary_assessment_validates(validator_for, canary_assessment):
    validator_for("assessment-result.schema.json").validate(canary_assessment)


def test_audit_chain_events_validate(validator_for, audit_chain_valid):
    v = validator_for("audit-event.schema.json")
    for event in audit_chain_valid:
        v.validate(event)


def test_every_probe_validates(validator_for, registry):
    v = validator_for("probe.schema.json")
    for probe in registry:
        v.validate(probe)


def test_assessment_rejects_out_of_range_score(validator_for, canary_assessment):
    import copy

    bad = copy.deepcopy(canary_assessment)
    bad["probeResults"][0]["score"] = 1.5
    errors = list(validator_for("assessment-result.schema.json").iter_errors(bad))
    assert errors, "score > 1 must be rejected by the schema"


def test_assessment_rejects_wrong_bit_order(validator_for, canary_assessment):
    import copy

    bad = copy.deepcopy(canary_assessment)
    bad["sovereignty"]["bitOrder"] = ["Value", "Delegation", "Memory", "Connection", "Computation", "Protection"]
    errors = list(validator_for("assessment-result.schema.json").iter_errors(bad))
    assert errors, "non-canonical bitOrder must be rejected (const)"
