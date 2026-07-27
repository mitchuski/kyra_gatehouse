# GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, RootModel


class Type(BaseModel):
    pass


class Type1(StrEnum):
    UnderstandingChallengeAttempt = 'UnderstandingChallengeAttempt'
    SupervisorApproval = 'SupervisorApproval'


class Evidence(BaseModel):
    pass


class CredentialStatus(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    type: Literal['RevocationList2026']
    statusListRef: Annotated[str, Field(min_length=1)]
    statusListIndex: Annotated[int, Field(ge=0)]


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


class Relationship(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    tauCount: Annotated[int, Field(ge=0)]
    hTau: UnitInterval
    aTau: Annotated[float, Field(ge=0.0)]
    proverbCommitment: Sha256Hex
    visibilityRatio: UnitInterval


class CredentialSubject(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    id: Did
    tier: Stratum
    stratum: Stratum
    assessmentDigest: Sha256Hex
    relationship: Annotated[
        Relationship,
        Field(description='The A(tau) record: A(tau) = alpha * ln(1+|tau|) * h(tau).'),
    ]


class EvidenceItem(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    type: Type1
    auditEventHash: Sha256Hex


class ProofItem(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    type: Annotated[str, Field(min_length=1)]
    verificationMethod: Annotated[str, Field(min_length=1)]
    created: Timestamp
    proofPurpose: Annotated[str, Field(min_length=1)]
    proofValue: Annotated[str, Field(min_length=1)]


class VerifiableRelationshipCredential(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    field_context: Annotated[
        list[str],
        Field(
            alias='@context',
            description='Must begin with https://www.w3.org/ns/credentials/v2',
            min_length=1,
        ),
    ]
    type: list[str] | Type
    issuer: Did
    validFrom: Timestamp
    validUntil: Timestamp | None = None
    credentialSubject: CredentialSubject
    evidence: Annotated[list[EvidenceItem] | Evidence, Field(min_length=2)]
    credentialStatus: CredentialStatus
    proof: Annotated[
        list[ProofItem],
        Field(
            description='BILATERAL: exactly two proofs - issuer (supervisor authority) and subject (agent). Unforgeable alone.',
            max_length=2,
            min_length=2,
        ),
    ]
