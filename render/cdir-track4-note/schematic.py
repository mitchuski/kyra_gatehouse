# Concept-note schematic: the two-act Kyra Gate flow.
# Emits render/cdir-track4-note/out/schematic.png (300 dpi, print-clean).
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from pathlib import Path

OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)

INK = "#1c2733"
COOL = "#e8f0f7"   # engine boxes
WARM = "#fdf1e3"   # human / authority boxes
POOL = "#e9f7ee"   # act II boxes
EDGE = "#5b7288"

fig, ax = plt.subplots(figsize=(12.5, 8.4))
ax.set_xlim(0, 125)
ax.set_ylim(0, 84)
ax.axis("off")

def box(x, y, w, h, title, lines, fc=COOL):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6",
                                fc=fc, ec=EDGE, lw=1.2))
    cy = y + h - 2.8
    ax.text(x + w / 2, cy, title, ha="center", va="center",
            fontsize=10, fontweight="bold", color=INK)
    for ln in lines:
        cy -= 3.0
        ax.text(x + w / 2, cy, ln, ha="center", va="center",
                fontsize=8.2, color=INK)

def arrow(x1, y1, x2, y2, style="-|>"):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                                 mutation_scale=16, lw=1.4, color=EDGE))

# ---- headers ----
ax.text(2, 81.5, "ACT I — THE GATE  (one authority admits one agent)",
        fontsize=11.5, fontweight="bold", color=INK)
ax.text(2, 25.5, "ACT II — THE POOL  (two authorities share AI-threat intelligence)",
        fontsize=11.5, fontweight="bold", color=INK)

# ---- Act I, row 1 ----
box(2, 63, 20, 16, "Agent arrives", [
    "the Emissary",
    "at the gate",
    "did:key / did:cid",
    "spoof → refused"], fc=WARM)
box(28, 63, 22, 16, "Assessment", [
    "24 probes → 4 forces",
    "+ 6 separations σ",
    "Σ (4×4) → det Σ",
    "→ lattice stratum"])
box(56, 63, 22, 16, "Witness draw", [
    "6 deep probes from",
    "sha256 of agent's",
    "OWN submission —",
    "unrehearsable"])
box(84, 63, 22, 16, "Two gates", [
    "human supervisor",
    "approval ∧ passed",
    "understanding h(τ)",
    "— echo scores zero"], fc=WARM)

arrow(22, 71, 28, 71)
arrow(50, 71, 56, 71)
arrow(78, 71, 84, 71)

# ---- Act I, row 2 ----
box(28, 42, 22, 16, "Verdict", [
    "VALIDATED → fly",
    "MIRAGE → sandbox",
    "BLOCKED → hold",
    "scope = f(det Σ)"])
box(56, 42, 22, 16, "Credential (VRC)", [
    "W3C VC 2.0, bilateral",
    "issuer + agent ed25519",
    "on same canonical bytes",
    "revocable status list"])
box(84, 42, 22, 16, "Audit chain", [
    "every transition =",
    "content-addressed",
    "hash-chained event;",
    "integrity h(τ) → 1"])

arrow(39, 63, 39, 58)                    # assessment -> verdict
arrow(95, 63, 69, 58.6)                  # two gates -> credential
ax.text(86.5, 60.9, "both gates pass ∧ det Σ > θ", ha="center", va="center",
        fontsize=7.8, fontstyle="italic", color=INK)
arrow(50, 50, 56, 50)                    # verdict -> credential
arrow(78, 50, 84, 50)                    # credential -> audit

# wire note (clear of the boxes)
ax.text(114, 71, "on the wire:\nToIP Trust Tasks\nagent-admission/*\napply · respond\napprove · issue\nrevoke · status",
        ha="center", va="center", fontsize=7.8, color=INK,
        bbox=dict(boxstyle="round,pad=0.5", fc="#f4f4f0", ec=EDGE, lw=1.0))

# ---- connector Act I -> Act II ----
arrow(67, 42, 67, 22.5)
ax.text(69, 32, "only a flying, credentialed agent\nmay carry intelligence",
        ha="left", va="center", fontsize=8.2, fontstyle="italic", color=INK)

# ---- Act II ----
box(2, 5, 24, 16, "Authority A (gate)", [
    "issues VRC to its agent;",
    "Lexon clauses printed",
    "from live config — the",
    "law a regulator reads"], fc=POOL)
box(32, 5, 32, 16, "Minimised bundle", [
    "17 incidents → \"≥10\" · dates → quarter",
    "lists → cardinalities · files → digest",
    "purpose · lifetime · combinability",
    "declared on the bundle's face"], fc=POOL)
box(70, 5, 26, 16, "Authority B (verifies)", [
    "offline from the bytes",
    "+ one lookup: issuer's",
    "revocation status list"], fc=POOL)

arrow(26, 13, 32, 13)
arrow(64, 13, 70, 13)
arrow(96, 13, 103, 13)
ax.text(112.5, 13, "revocation\npropagates —\nthe pool\nheals itself",
        ha="center", va="center", fontsize=8.4, color=INK, fontweight="bold",
        bbox=dict(boxstyle="round,pad=0.5", fc=WARM, ec=EDGE, lw=1.0))

fig.savefig(OUT / "schematic.png", dpi=300, bbox_inches="tight",
            facecolor="white")
print("wrote", OUT / "schematic.png")
