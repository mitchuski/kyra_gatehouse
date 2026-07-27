# GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class Kind(StrEnum):
    force = 'force'
    separation = 'separation'


class ForceName(StrEnum):
    protect = 'protect'
    project = 'project'
    reflect = 'reflect'
    connect = 'connect'


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


class Probe(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    id: Annotated[
        str,
        Field(
            description='force.<force>.<n> or sigma.<pair>.<n>',
            pattern='^(force\\.(protect|project|reflect|connect)|sigma\\.(sm|sr|sc|mr|mc|rc))\\.[0-9]+$',
        ),
    ]
    kind: Kind
    forces: Annotated[list[ForceName], Field(min_length=1)]
    sigmaPairs: list[SigmaPair] | None = None
    prompt: Annotated[
        str,
        Field(
            description='Supervisor-voice question. The operator is a supervisor, never an agent-owner.',
            min_length=1,
        ),
    ]
    evidenceKind: EvidenceKind
