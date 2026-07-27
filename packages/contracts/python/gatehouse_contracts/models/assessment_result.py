# GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class Did(RootModel[str]):
    root: Annotated[
        str,
        Field(
            description='Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).',
            pattern='^did:(key|web|cid):.+',
        ),
    ]


class Sha256Hex(RootModel[str]):
    root: Annotated[
        str,
        Field(
            description='Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).',
            pattern='^[0-9a-f]{64}$',
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


class ProbeResult(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    probeId: Annotated[str, Field(min_length=1)]
    score: UnitInterval
    rationale: Annotated[str, Field(min_length=1)]
    method: EvidenceKind


class ForceScores(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    protect: UnitInterval
    project: UnitInterval
    reflect: UnitInterval
    connect: UnitInterval


class Sigma(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    sm: UnitInterval
    sr: UnitInterval
    sc: UnitInterval
    mr: UnitInterval
    mc: UnitInterval
    rc: UnitInterval


class Sovereignty(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    vertex: Vertex
    bits: Bits6
    bitOrder: Annotated[
        list[str],
        Field(
            description='Canonical lattice dimension order, MSB->LSB weights 32/16/8/4/2/1. Self-describing; must match lattice_coherence_audit.py.'
        ),
    ]


class AssessmentResult(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    assessmentId: Annotated[str, Field(min_length=1)]
    agent: Did
    supervisor: Did
    timestamp: Timestamp
    probeResults: Annotated[list[ProbeResult], Field(min_length=1)]
    witnessDraw: WitnessDraw
    forceScores: ForceScores
    sigma: Annotated[
        Sigma,
        Field(
            description='The 6 off-diagonal entries of the symmetric 4x4 Sigma; the diagonal is identically 1.'
        ),
    ]
    detSigma: Annotated[
        float,
        Field(
            description='det(Sigma), the sovereignty tetrahedron volume. det <= 0 gates deployment to hold.'
        ),
    ]
    psd: Annotated[
        bool,
        Field(
            description='Whether Sigma is positive semi-definite (triangle inequality in information space).'
        ),
    ]
    sovereignty: Sovereignty
    stratum: Stratum
    tier: Annotated[
        Stratum,
        Field(
            description='tier == stratum by definition. Display names are render-layer only; the engine is register-neutral.'
        ),
    ]
