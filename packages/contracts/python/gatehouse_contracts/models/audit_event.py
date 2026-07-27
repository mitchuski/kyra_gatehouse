# GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class Sha256Hex(RootModel[str]):
    root: Annotated[
        str,
        Field(
            description='Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).',
            pattern='^[0-9a-f]{64}$',
        ),
    ]


class Did(RootModel[str]):
    root: Annotated[
        str,
        Field(
            description='Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).',
            pattern='^did:(key|web|cid):.+',
        ),
    ]


class GenesisHash(
    RootModel[
        Literal['0000000000000000000000000000000000000000000000000000000000000000']
    ]
):
    root: Annotated[
        Literal['0000000000000000000000000000000000000000000000000000000000000000'],
        Field(description='The priorHash of the first event in a chain.'),
    ]


class UnitInterval(RootModel[float]):
    root: Annotated[float, Field(ge=0.0, le=1.0)]


class Timestamp(RootModel[AwareDatetime]):
    root: AwareDatetime


class ForceName(StrEnum):
    protect = 'protect'
    project = 'project'
    reflect = 'reflect'
    connect = 'connect'


class SigmaPair(StrEnum):
    sm = 'sm'
    sr = 'sr'
    sc = 'sc'
    mr = 'mr'
    mc = 'mc'
    rc = 'rc'


class Stratum(RootModel[int]):
    root: Annotated[
        int,
        Field(
            description='Popcount of the 6 sovereignty bits. Strata sizes 1,6,15,20,15,6,1.',
            ge=0,
            le=6,
        ),
    ]


class Vertex(RootModel[int]):
    root: Annotated[
        int,
        Field(
            description='Vertex of the 64-vertex Boolean sovereignty lattice {0,1}^6.',
            ge=0,
            le=63,
        ),
    ]


class Bits6(RootModel[str]):
    root: Annotated[
        str,
        Field(
            description='The 6 sovereignty bits MSB-first in canonical dimension order (Protection, Delegation, Memory, Connection, Computation, Value).',
            pattern='^[01]{6}$',
        ),
    ]


class Verdict(StrEnum):
    VALIDATED = 'VALIDATED'
    MIRAGE = 'MIRAGE'
    BLOCKED = 'BLOCKED'


class DeployDecision(StrEnum):
    fly = 'fly'
    sandbox = 'sandbox'
    hold = 'hold'


class EvidenceKind(StrEnum):
    declared = 'declared'
    witnessed = 'witnessed'
    deep = 'deep'


class WitnessDraw(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    canonHash: Sha256Hex
    registryHash: Sha256Hex
    algorithm: Literal['sha256-canon-v1']
    drawnProbeIds: list[str]


class AuditEvent(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    contentHash: Sha256Hex
    actor: Did
    action: Annotated[
        str,
        Field(
            description='Namespaced action, e.g. gate.approach, assessment.completed, challenge.attempted, vrc.issued, vrc.revoked. Known actions live in audit-actions.json (data, not frozen) so new transitions never force a schema re-freeze.',
            pattern='^[a-z]+\\.[a-z_]+$',
        ),
    ]
    subject: Did | None = None
    payloadDigest: Annotated[
        Sha256Hex,
        Field(
            description='sha256 of the canonicalised payload the event refers to (assessment, challenge attempt, credential, ...).'
        ),
    ]
    priorHash: Sha256Hex | GenesisHash
    timestamp: Timestamp
    rationale: Annotated[
        str,
        Field(
            description='Why this transition happened. Required on every decision (auditability guardrail).',
            min_length=1,
        ),
    ]
