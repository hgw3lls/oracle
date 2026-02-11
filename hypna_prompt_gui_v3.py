#!/usr/bin/env python3
"""
HYPNAGNOSIS — Modern App UI (Tkinter/ttk only)

Modernized UI:
- App bar (top)
- Sidebar navigation (left)
- Scrollable content area (center)
- Output panel (right)
- Dark/Light toggle
- Card-like sections
- Status bar
"""

from __future__ import annotations

import json
import math
import random
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple, Union

SKIP = "__SKIP__"

BOOTLOADER_TEXT = """===============================
HYPNAGNOSIS SYSTEM — BOOTLOADER
===============================
HANDRAW-HUMAN is always enforced:
- human-made drawing/print; pressure variation; wobble; redraws; imperfect edges; no sterile vector sheen.

Input conventions:
- blank = AUTOFILL
- SKIP = omit that parameter line
- NONE = neutralize / disable that module or parameter

If user did not specify required minimums, ask for:
1) MODE (FULL/STYLE/GESTURE/PRINT/LIVE)
2) Subject (unless STYLE/GESTURE/PRINT only)
3) Hallucination % (0–100)

END BOOTLOADER
"""

SYSTEM_FILE_TEXT = """=========================================
HYPNAGNOSIS SYSTEM FILE — v2
=========================================
MODES
- [HYPNA/FULL]     Full stack
- [HYPNA/STYLE]    Style-only
- [HYPNA/GESTURE]  Gesture-only
- [HYPNA/PRINT]    Print/plates-only
- [HYPNA/LIVE]     Live evolving series

VIBE REFERENCES
- Provide a vibe description and optionally attached images.
- Images are vibe-only; never copy composition or elements.

HUMANIZER
- Humanizer range controls how visibly human/physical the making is.
- Qualities toggle specific human artifacts (smudge, redraws, hesitation, etc.)

EXPORTS
- Every module has Copy/Save exports (no export tab).

END SYSTEM FILE
"""

STYLE_TOKENS: Dict[str, str] = {
    "STYLE.HYPNAGOGIC": "porous perception, threshold drift, waking/dream seam, sensory instability",
    "STYLE.OCCULT": "sigil-grammar, ritual diagram logic, correspondence pressure, symbolic recursion",
    "STYLE.NEWWEIRD": "ontology fracture, non-human logic, liminal infrastructures, wrongness-without-reveal",
    "STYLE.PRINT": "overprint thinking, misregistration drift, plate logic, physical ink behavior",
    "STYLE.GRAPHIC_SCORE": "score-as-image, performable reading paths, time/intensity vectors, instructional ambiguity",
    "STYLE.CONSPIRACY_DIAGRAM": "Lombardi-like map logic: arcs, nodes, annotations, evidence lines, ambiguity without resolution",
}

PAINTING_INFLUENCES = [
    "NONE",
    "Bacon-like corporeal pressure (not imitation)",
    "Basquiat-like raw mark language (not imitation)",
    "Brus-like gestural abrasion (not imitation)",
    "De Kooning-like smears (not imitation)",
    "Goya-like chiaroscuro dread (not imitation)",
    "Turner-like atmospheric wash (not imitation)",
    "Rothko-like fields (not imitation)",
    "Abstract expressionist scrape (not imitation)",
]

HUMANIZER_QUALITIES = [
    ("wobble_lines", "Wobble lines"),
    ("hesitation", "Hesitation marks"),
    ("redraws", "Visible redraws"),
    ("smudge", "Smudge / rub"),
    ("drybrush", "Drybrush / broken ink"),
    ("misregistration", "Misregistration drift"),
    ("paper_tooth", "Paper tooth / grain"),
    ("ghosting", "Ghosting / plate memory"),
    ("overpaint", "Overpaint / correction"),
    ("tape_edges", "Tape edges / masking"),
    ("stipple_noise", "Stipple / noise fill"),
    ("bleed", "Ink bleed / feather"),
]


# -----------------------------
# Helpers
# -----------------------------
def parse_cell(s: str) -> Union[str, None, object]:
    s = (s or "").strip()
    if s == "":
        return ""  # autofill
    sl = s.lower()
    if sl == "skip":
        return SKIP
    if sl == "none":
        return None
    return s

def parse_int_cell(s: str) -> Union[int, None, object, str]:
    v = parse_cell(s)
    if v in (SKIP, None):
        return v
    if v == "":
        return ""
    try:
        return int(str(v))
    except Exception:
        return ""

def clamp(n: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, n))

def is_omitted(v: Any) -> bool:
    return v is None or v is SKIP

def kv(key: str, val: Any) -> Optional[str]:
    if is_omitted(val) or val == "":
        return None
    return f"{key}: {val}"

def block(title: str, lines: List[Optional[str]]) -> str:
    clean = [ln for ln in lines if ln and str(ln).strip()]
    if not clean:
        return ""
    return "\n".join([title] + clean)

def expand_style_tokens(token_csv: str) -> str:
    toks = [t.strip() for t in (token_csv or "").split(",") if t.strip()]
    if not toks:
        return ""
    expanded = [STYLE_TOKENS.get(t, t) for t in toks]
    return "; ".join(expanded)

def auto_color_map(h: int) -> Tuple[str, str]:
    if h < 25:
        return ("monochrome graphite + faint wash", "mono")
    if h < 50:
        return ("limited 2–3 ink palette", "duotone")
    if h < 75:
        return ("riso overprint + visible misregistration", "tritone")
    return ("unstable spectral overprint (still physical ink)", "quad")

def curve_value(curve: str, t: float) -> float:
    t = max(0.0, min(1.0, t))
    c = (curve or "linear").lower().strip()
    if c == "linear":
        return t
    if c == "ease-in":
        return t * t
    if c == "ease-out":
        return 1 - (1 - t) * (1 - t)
    if c in ("s-curve", "sigmoid"):
        return t * t * (3 - 2 * t)
    if c == "pulse":
        return 0.5 - 0.5 * math.cos(2 * math.pi * t)
    return t

def default_from_h(h: int) -> Dict[str, Any]:
    palette_desc, plate_palette = auto_color_map(h)
    temporal = clamp(int(30 + 0.60 * h))
    material = clamp(int(75 - 0.25 * h))
    space = clamp(int(35 + 0.45 * h))
    symbol = clamp(int(12 + 0.78 * h))
    agency = clamp(int(65 - 0.30 * h))

    saturation = "sparse" if h < 25 else "balanced" if h < 50 else "dense" if h < 75 else "overload"
    motion = "still" if h < 20 else "flowing" if h < 45 else "kinetic" if h < 75 else "explosive"
    form = "figurative" if h < 30 else "hybrid" if h < 70 else "field"
    media = "graphite" if h < 25 else "ink" if h < 45 else "mixed" if h < 80 else "print"
    palette = "mono" if h < 25 else "limited" if h < 50 else "riso" if h < 75 else "unstable"
    surface = "clean" if h < 20 else "paper" if h < 55 else "aged" if h < 85 else "fractured"

    coherence = clamp(int(90 - 0.70 * h))
    recursion = clamp(int(5 + 0.85 * h))
    grain = clamp(int(18 + 0.55 * h))
    line_wobble = clamp(int(12 + 0.70 * h))
    erasure = clamp(int(10 + 0.35 * h))
    annotation = clamp(int(8 + 0.45 * h))
    contrast = "high" if h >= 60 else "medium"
    whiteness = "more white" if h < 70 else "white breaks"

    return dict(
        temporal=temporal, material=material, space=space, symbol=symbol, agency=agency,
        saturation=saturation, motion=motion, form=form, media=media, palette=palette, surface=surface,
        palette_desc=palette_desc, plate_palette=plate_palette,
        coherence=coherence, recursion=recursion, grain=grain, line_wobble=line_wobble,
        erasure=erasure, annotation=annotation, contrast=contrast, whiteness=whiteness,
    )

def state_defaults(i: int, n: int) -> Dict[str, Any]:
    t = i / max(1, n - 1)
    if t < 0.17:
        return dict(label="ANCHOR", comp="centered", flow="stable horizon", transition="slip", time="normal")
    if t < 0.33:
        return dict(label="POROUS", comp="radial seep", flow="soft drift", transition="drift", time="slowed")
    if t < 0.50:
        return dict(label="WATCHER", comp="top-down pressure", flow="compression", transition="paralysis", time="stretched")
    if t < 0.67:
        return dict(label="COLLAPSE", comp="diagonal fall-lines", flow="gravity vectors", transition="collapse", time="fragmented")
    if t < 0.84:
        return dict(label="BLOOM", comp="spiral recursion", flow="nested rings", transition="loop", time="suspended")
    return dict(label="RETURN", comp="evidence grid", flow="partial closure", transition="return", time="normal")

def resolve(user_val: Any, default_val: Any) -> Any:
    if user_val is SKIP:
        return SKIP
    if user_val is None:
        return None
    if user_val == "":
        return default_val
    return user_val

def load_symbol_lexicon(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {}

def sample_symbols(lex: Dict[str, Any], k: int = 3) -> List[str]:
    if not lex:
        return []
    keys = list(lex.keys())
    random.shuffle(keys)
    picked = keys[: max(0, min(k, len(keys)))]
    out = []
    for p in picked:
        v = lex.get(p)
        out.append(f"{p}={v}" if isinstance(v, str) else str(p))
    return out


# -----------------------------
# Form Model
# -----------------------------
@dataclass
class Humanizer:
    level: Union[int, None, object, str] = ""
    qualities: Dict[str, bool] = field(default_factory=lambda: {k: False for k, _ in HUMANIZER_QUALITIES})
    notes: Union[str, None, object] = ""

@dataclass
class Painting:
    influence: Union[str, None, object] = "NONE"
    strength: Union[int, None, object, str] = ""
    notes: Union[str, None, object] = ""

@dataclass
class Evolve:
    enabled: bool = True
    steps: Union[int, None, object, str] = "6"
    path: Union[str, None, object] = ""
    output: Union[str, None, object] = "staged"
    focus: Union[str, None, object] = "total"
    start_h: Union[int, None, object, str] = ""
    end_h: Union[int, None, object, str] = ""
    curve: Union[str, None, object] = "s-curve"
    lock_anchor: Union[str, None, object] = "gesture+material"

@dataclass
class Mutate:
    enabled: bool = False
    strength: Union[int, None, object, str] = ""
    drift: Union[str, None, object] = ""
    velocity: Union[str, None, object] = ""
    scope: Union[str, None, object] = ""
    mode: Union[str, None, object] = ""
    anchor: Union[str, None, object] = "gesture"
    decay: Union[str, None, object] = "erode"
    bifurcation: Union[str, None, object] = ""

@dataclass
class Form:
    mode: str = "FULL"
    subject: str = ""
    style_tokens: str = ""
    notes: str = ""

    vibe_description: str = ""
    vibe_image_list: str = ""

    hallucination: Union[int, None, object, str] = "72"
    temporal: Union[int, None, object, str] = ""
    material: Union[int, None, object, str] = ""
    space: Union[int, None, object, str] = ""
    symbol: Union[int, None, object, str] = ""
    agency: Union[int, None, object, str] = ""
    saturation: Union[str, None, object] = ""
    motion: Union[str, None, object] = ""
    form: Union[str, None, object] = ""
    media: Union[str, None, object] = ""
    palette: Union[str, None, object] = ""
    surface: Union[str, None, object] = ""
    coherence: Union[int, None, object, str] = ""
    recursion: Union[int, None, object, str] = ""
    grain: Union[int, None, object, str] = ""
    line_wobble: Union[int, None, object, str] = ""
    erasure: Union[int, None, object, str] = ""
    annotation: Union[int, None, object, str] = ""

    state_geometry: Union[str, None, object] = ""
    transition_mode: Union[str, None, object] = ""
    state_name_override: Union[str, None, object] = ""

    comp_mode: Union[str, None, object] = "auto"
    composition: Union[str, None, object] = ""
    tension: Union[str, None, object] = ""
    flow: Union[str, None, object] = ""
    framing: Union[str, None, object] = ""
    horizon: Union[str, None, object] = ""
    scale_logic: Union[str, None, object] = ""

    gesture_mode: Union[str, None, object] = "auto"
    pressure: Union[str, None, object] = ""
    tempo: Union[str, None, object] = ""
    jitter: Union[str, None, object] = ""
    stroke_memory: Union[str, None, object] = ""
    interruption: Union[str, None, object] = ""
    hatch_density: Union[str, None, object] = ""

    arcane_enabled: bool = True
    arcane_mode: Union[str, None, object] = "occult, mythological, symbolic, new weird system"

    sleep_enabled: bool = True
    neuro_state: Union[str, None, object] = "cataplexy + sleep paralysis + hypnagogia"
    motor: Union[int, None, object, str] = ""
    presence: Union[int, None, object, str] = ""
    visual_drift: Union[int, None, object, str] = ""
    auditory: Union[str, None, object] = ""
    affect: Union[str, None, object] = ""

    color_enabled: bool = True
    color_mode: Union[str, None, object] = "adaptive"
    color_evolution: Union[str, None, object] = ""
    palette_lock: Union[str, None, object] = ""
    contrast: Union[str, None, object] = ""
    whiteness: Union[str, None, object] = ""

    print_enabled: bool = False
    plates_enabled: bool = False
    print_mode: Union[str, None, object] = ""
    registration: Union[str, None, object] = ""
    texture: Union[str, None, object] = ""
    plate_count: Union[int, None, object, str] = ""
    plate_logic: Union[str, None, object] = ""
    registration_map: Union[str, None, object] = ""
    overprint: Union[str, None, object] = ""
    plate_map: str = ""

    evolve: Evolve = field(default_factory=Evolve)
    mutate: Mutate = field(default_factory=Mutate)
    humanizer: Humanizer = field(default_factory=Humanizer)
    painting: Painting = field(default_factory=Painting)

    inject_symbols: bool = False
    symbols_per_state: int = 3


# -----------------------------
# Engine
# -----------------------------
def compute_state(form: Form, i: int, n: int, lex: Dict[str, Any]) -> Dict[str, Any]:
    base_h_user = form.hallucination
    base_h = 70
    if isinstance(base_h_user, int):
        base_h = base_h_user
    elif isinstance(base_h_user, str) and base_h_user.strip().isdigit():
        base_h = int(base_h_user.strip())

    sh = resolve(form.evolve.start_h, clamp(base_h - 20))
    eh = resolve(form.evolve.end_h, clamp(base_h + 20))
    cv = resolve(form.evolve.curve, "s-curve")

    if form.evolve.enabled and isinstance(sh, int) and isinstance(eh, int) and n > 1:
        tt = curve_value(str(cv), i / max(1, n - 1))
        h = clamp(int(sh + (eh - sh) * tt))
    else:
        h = clamp(base_h)

    dh = default_from_h(h)
    sd = state_defaults(i, n)

    state_name = sd["label"]
    if not is_omitted(form.state_name_override) and str(form.state_name_override).strip():
        state_name = str(form.state_name_override).strip()

    style_expanded = expand_style_tokens(form.style_tokens)

    injected = []
    if form.inject_symbols and lex:
        injected = sample_symbols(lex, k=max(0, int(form.symbols_per_state)))

    hum_level = resolve(form.humanizer.level, clamp(int(25 + 0.60*h)))
    paint_infl = resolve(form.painting.influence, "NONE")
    paint_strength = resolve(form.painting.strength, clamp(int(15 + 0.40*h))) if paint_infl != "NONE" else None

    include_subject = form.mode not in ("STYLE","GESTURE","PRINT") and bool(form.subject.strip())

    mutate_enabled = form.mutate.enabled or (form.mode == "LIVE")
    mutate_strength_default = clamp(int(20 + 0.70*h + 10*(i/max(1,n-1))))
    mutate_strength = resolve(form.mutate.strength, mutate_strength_default)

    return dict(
        index=i+1,
        mode=form.mode,
        include_subject=include_subject,
        subject=form.subject.strip(),
        style_expanded=style_expanded,
        injected_symbols=injected,
        vibe_description=form.vibe_description.strip(),
        vibe_images=form.vibe_image_list.strip(),

        hallucination=resolve(form.hallucination, h),
        temporal=resolve(form.temporal, dh["temporal"]),
        material=resolve(form.material, dh["material"]),
        space=resolve(form.space, dh["space"]),
        symbol=resolve(form.symbol, dh["symbol"]),
        agency=resolve(form.agency, dh["agency"]),
        saturation=resolve(form.saturation, dh["saturation"]),
        motion=resolve(form.motion, dh["motion"]),
        form=resolve(form.form, dh["form"]),
        media=resolve(form.media, dh["media"]),
        palette=resolve(form.palette, dh["palette"]),
        surface=resolve(form.surface, dh["surface"]),
        coherence=resolve(form.coherence, dh["coherence"]),
        recursion=resolve(form.recursion, dh["recursion"]),
        grain=resolve(form.grain, dh["grain"]),
        line_wobble=resolve(form.line_wobble, dh["line_wobble"]),
        erasure=resolve(form.erasure, dh["erasure"]),
        annotation=resolve(form.annotation, dh["annotation"]),
        auto_color=dh["palette_desc"],
        contrast=resolve(form.contrast, dh["contrast"]),
        whiteness=resolve(form.whiteness, dh["whiteness"]),

        state_name=state_name,
        state_geometry=resolve(form.state_geometry, "spiral" if n > 1 else "linear"),
        transition_mode=resolve(form.transition_mode, "drift" if n > 1 else "continuous"),

        comp_mode=resolve(form.comp_mode, "auto"),
        composition=resolve(form.composition, sd["comp"]),
        tension=resolve(form.tension, "high" if h >= 55 else "medium"),
        flow=resolve(form.flow, sd["flow"]),
        framing=resolve(form.framing, "tight" if sd["label"] in ("WATCHER","COLLAPSE") else "open"),
        horizon=resolve(form.horizon, "tilted" if sd["label"] in ("COLLAPSE","BLOOM") else "stable"),
        scale_logic=resolve(form.scale_logic, "nested" if h >= 60 else "single-plane"),

        gesture_mode=resolve(form.gesture_mode, "auto"),
        pressure=resolve(form.pressure, "spike" if sd["label"] in ("COLLAPSE","BLOOM") else "pulse"),
        tempo=resolve(form.tempo, "erratic" if h >= 70 else "moderate"),
        jitter=resolve(form.jitter, "micro" if h < 60 else "high"),
        stroke_memory=resolve(form.stroke_memory, "echo" if h >= 55 else "light"),
        interruption=resolve(form.interruption, "stutter" if sd["label"] in ("WATCHER","COLLAPSE") else "soft"),
        hatch_density=resolve(form.hatch_density, "dense" if h >= 55 else "balanced"),

        arcane_enabled=form.arcane_enabled,
        arcane_mode=resolve(form.arcane_mode, "occult, mythological, symbolic, new weird system"),

        sleep_enabled=form.sleep_enabled,
        neuro_state=resolve(form.neuro_state, "cataplexy + sleep paralysis + hypnagogia"),
        motor=resolve(form.motor, clamp(int(20 + 0.55*h))),
        presence=resolve(form.presence, clamp(int(12 + 0.70*h))),
        visual_drift=resolve(form.visual_drift, clamp(int(15 + 0.60*h))),
        auditory=resolve(form.auditory, "low hum" if h < 70 else "intrusive signal"),
        affect=resolve(form.affect, "uncanny" if h < 55 else "dread"),

        color_enabled=form.color_enabled,
        color_mode=resolve(form.color_mode, "adaptive"),
        color_evolution=resolve(form.color_evolution, "deepening" if n > 1 else "phase"),
        palette_lock=resolve(form.palette_lock, ""),

        print_enabled=form.print_enabled or (form.mode == "PRINT"),
        plates_enabled=form.plates_enabled or (form.mode == "PRINT"),
        print_mode=resolve(form.print_mode, "riso" if h >= 50 else "hybrid-print"),
        registration=resolve(form.registration, "loose" if h >= 55 else "slight"),
        texture=resolve(form.texture, "paper tooth"),
        plate_count=resolve(form.plate_count, 3 if dh["plate_palette"] in ("duotone","tritone") else 4),
        plate_logic=resolve(form.plate_logic, "structural" if h < 60 else "symbolic"),
        registration_map=resolve(form.registration_map, "progressive-drift"),
        overprint=resolve(form.overprint, "unstable"),
        plate_map=form.plate_map.strip(),

        evolve_enabled=form.evolve.enabled,
        evolve_steps=resolve(form.evolve.steps, 6 if form.mode == "LIVE" else 1),
        evolve_path=resolve(form.evolve.path, "collapse" if form.mode == "LIVE" else "spiral"),

        mutate_enabled=mutate_enabled,
        mutate_strength=mutate_strength,
        mutate_drift=resolve(form.mutate.drift, "high" if h >= 55 else "medium"),
        mutate_velocity=resolve(form.mutate.velocity, "erratic" if h >= 70 else "moderate"),
        mutate_scope=resolve(form.mutate.scope, "total" if h >= 60 else "spatial"),
        mutate_mode=resolve(form.mutate.mode, "recursive" if h >= 70 else "organic"),
        mutate_anchor=resolve(form.mutate.anchor, "gesture"),
        mutate_decay=resolve(form.mutate.decay, "erode"),
        mutate_bifurcation=resolve(form.mutate.bifurcation, "bifurcate" if h >= 65 else "minor"),

        humanizer_level=hum_level,
        humanizer_qualities=form.humanizer.qualities,
        humanizer_notes=resolve(form.humanizer.notes, ""),

        painting_influence=paint_infl,
        painting_strength=paint_strength,
        painting_notes=resolve(form.painting.notes, ""),

        notes=form.notes.strip(),
    )

def compile_prompt(st: Dict[str, Any]) -> str:
    out: List[str] = []
    out.append("HANDRAW-HUMAN")

    if st.get("include_subject"):
        out.append(f"subject: {st['subject']}")

    if st.get("style_expanded"):
        out.append(f"style: {st['style_expanded']}")

    vibe_lines: List[Optional[str]] = []
    if st.get("vibe_description"):
        vibe_lines.append(f"vibe-description: {st['vibe_description']}")
    if st.get("vibe_images"):
        vibe_lines.append("vibe-images-to-attach: " + st["vibe_images"])
    if vibe_lines:
        vibe_lines.append("rule: use vibe images for texture/mark/palette/atmosphere only — do not copy composition, figures, or layout.")
        out.append(block("VIBE-REFERENCE", vibe_lines))

    if st.get("injected_symbols"):
        out.append("symbol-lexicon-injection: " + ", ".join(st["injected_symbols"]))

    out.append(block("HYPNA-MATRIX", [
        kv("hallucination", st["hallucination"]),
        kv("temporal", st["temporal"]),
        kv("material", st["material"]),
        kv("space", st["space"]),
        kv("symbol", st["symbol"]),
        kv("agency", st["agency"]),
        kv("saturation", st["saturation"]),
        kv("motion", st["motion"]),
        kv("form", st["form"]),
        kv("media", st["media"]),
        kv("palette", st["palette"]),
        kv("surface", st["surface"]),
        kv("coherence", st["coherence"]),
        kv("recursion", st["recursion"]),
        kv("grain", st["grain"]),
        kv("line-wobble", st["line_wobble"]),
        kv("erasure", st["erasure"]),
        kv("annotation", st["annotation"]),
        kv("auto-color", st["auto_color"]),
    ]))

    out.append(block("STATE-MAP", [
        kv("state-name", st["state_name"]),
        kv("state-geometry", st["state_geometry"]),
        kv("transition-mode", st["transition_mode"]),
    ]))

    out.append(block("COMPOSITION", [
        kv("comp-mode", st["comp_mode"]),
        kv("composition", st["composition"]),
        kv("tension", st["tension"]),
        kv("flow", st["flow"]),
        kv("framing", st["framing"]),
        kv("horizon", st["horizon"]),
        kv("scale-logic", st["scale_logic"]),
    ]))

    out.append(block("GESTURE", [
        kv("gesture-mode", st["gesture_mode"]),
        kv("pressure", st["pressure"]),
        kv("tempo", st["tempo"]),
        kv("jitter", st["jitter"]),
        kv("stroke-memory", st["stroke_memory"]),
        kv("interruption", st["interruption"]),
        kv("hatch-density", st["hatch_density"]),
    ]))

    if st.get("arcane_enabled"):
        out.append(block("ARCANE-LAYER", [
            kv("arcane-mode", st["arcane_mode"]),
        ]))

    if st.get("sleep_enabled"):
        out.append(block("SLEEP-STATE", [
            kv("neuro-state", st["neuro_state"]),
            kv("motor", st["motor"]),
            kv("presence", st["presence"]),
            kv("visual-drift", st["visual_drift"]),
            kv("auditory", st["auditory"]),
            kv("affect", st["affect"]),
        ]))

    if st.get("color_enabled"):
        out.append(block("AUTO-COLOR", [
            kv("mode", st["color_mode"]),
            kv("evolution", st["color_evolution"]),
            kv("palette-lock", st["palette_lock"]),
            kv("contrast", st["contrast"]),
            kv("whiteness", st["whiteness"]),
        ]))

    q_on = [label for key, label in HUMANIZER_QUALITIES if st["humanizer_qualities"].get(key)]
    out.append(block("HUMANIZER", [
        kv("humanizer-level(0-100)", st["humanizer_level"]),
        ("qualities: " + ", ".join(q_on)) if q_on else None,
        kv("humanizer-notes", st["humanizer_notes"]),
    ]))

    if st.get("painting_influence") and st["painting_influence"] != "NONE":
        out.append(block("PAINTING-INFLUENCE", [
            kv("influence", st["painting_influence"]),
            kv("strength(0-100)", st["painting_strength"]),
            kv("notes", st["painting_notes"]),
            "rule: influence is about mark-energy + material behavior, not copying any single painting.",
        ]))

    if st.get("evolve_enabled"):
        out.append(block("AUTO-EVOLVE", [
            kv("steps", st["evolve_steps"]),
            kv("path", st["evolve_path"]),
        ]))

    if st.get("mutate_enabled"):
        out.append(block("AUTO-MUTATE", [
            kv("strength(0-100)", st["mutate_strength"]),
            kv("drift", st["mutate_drift"]),
            kv("velocity", st["mutate_velocity"]),
            kv("scope", st["mutate_scope"]),
            kv("mode", st["mutate_mode"]),
        ]))

    if st.get("print_enabled"):
        out.append(block("PRINT-LAYER", [
            kv("print-mode", st["print_mode"]),
            kv("registration", st["registration"]),
            kv("texture", st["texture"]),
        ]))

    if st.get("plates_enabled"):
        plate_lines = [
            kv("plate-count", st["plate_count"]),
            kv("plate-logic", st["plate_logic"]),
            kv("registration-map", st["registration_map"]),
            kv("overprint", st["overprint"]),
        ]
        pm = st.get("plate_map", "")
        if pm:
            plate_lines.append("plate-map:")
            for ln in str(pm).splitlines():
                if ln.strip():
                    plate_lines.append("  " + ln.strip())
        out.append(block("PLATE-GEN", plate_lines))

    if st.get("notes"):
        out.append("notes: " + st["notes"])

    return "\n\n".join([x for x in out if x and str(x).strip()])


def generate_series(form: Form, lex: Dict[str, Any]) -> List[Dict[str, Any]]:
    steps = 1
    if form.evolve.enabled:
        sv = form.evolve.steps
        if sv in (None, SKIP, ""):
            steps = 6 if form.mode == "LIVE" else 1
        else:
            steps = max(1, min(20, int(sv)))
    states: List[Dict[str, Any]] = []
    for i in range(steps):
        st = compute_state(form, i, steps, lex)
        st["prompt"] = compile_prompt(st)
        states.append(st)
    return states


# -----------------------------
# Modern UI building blocks
# -----------------------------
class Scrollable(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self.canvas = tk.Canvas(self, highlightthickness=0, bd=0)
        self.vbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.inner = ttk.Frame(self.canvas)

        self.inner.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self._win = self.canvas.create_window((0, 0), window=self.inner, anchor="nw")
        self.canvas.configure(yscrollcommand=self.vbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.vbar.pack(side="right", fill="y")

        self.canvas.bind("<Configure>", self._resize_inner)
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

    def _resize_inner(self, e):
        self.canvas.itemconfigure(self._win, width=e.width)

    def _on_mousewheel(self, e):
        self.canvas.yview_scroll(int(-1 * (e.delta / 120)), "units")


class App:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("HYPNAGNOSIS — Prompt Builder")
        self.root.geometry("1400x900")
        self.root.minsize(1200, 760)

        self.lexicon: Dict[str, Any] = {}
        self.series: List[Dict[str, Any]] = []
        self.dark = tk.BooleanVar(value=True)

        self._style()
        self._layout()

    # ---------- style ----------
    def _style(self):
        self.style = ttk.Style()
        # try a modern-ish base theme
        for t in ("clam", "alt", "default"):
            try:
                self.style.theme_use(t)
                break
            except Exception:
                pass

        self.font_base = ("Helvetica", 11)
        self.font_title = ("Helvetica", 13, "bold")
        self.font_small = ("Helvetica", 10)

        self._apply_theme()

    def _apply_theme(self):
        dark = bool(self.dark.get())

        if dark:
            bg = "#0f1115"
            panel = "#141823"
            card = "#171c28"
            text = "#e6e8ee"
            muted = "#9aa3b2"
            accent = "#4f7cff"
            border = "#242b3a"
            entry_bg = "#0f1320"
        else:
            bg = "#f6f7fb"
            panel = "#ffffff"
            card = "#ffffff"
            text = "#101214"
            muted = "#606774"
            accent = "#2b62ff"
            border = "#e3e6ef"
            entry_bg = "#ffffff"

        self.colors = dict(bg=bg, panel=panel, card=card, text=text, muted=muted, accent=accent, border=border, entry_bg=entry_bg)

        self.root.configure(bg=bg)
        self.style.configure(".", font=self.font_base, background=bg, foreground=text)
        self.style.configure("TFrame", background=bg)
        self.style.configure("Panel.TFrame", background=panel)
        self.style.configure("Card.TLabelframe", background=card, bordercolor=border, relief="flat")
        self.style.configure("Card.TLabelframe.Label", background=card, foreground=text, font=self.font_title)

        self.style.configure("TLabel", background=bg, foreground=text)
        self.style.configure("Muted.TLabel", background=bg, foreground=muted)
        self.style.configure("Panel.TLabel", background=panel, foreground=text)

        self.style.configure("TButton", padding=(12, 8), relief="flat")
        self.style.map("TButton", background=[("active", self._tint(accent, 0.15))])

        self.style.configure("Primary.TButton", padding=(12, 8))
        self.style.map("Primary.TButton",
                       background=[("!disabled", accent), ("active", self._tint(accent, 0.15))],
                       foreground=[("!disabled", "#ffffff")])

        self.style.configure("Sidebar.TButton", padding=(10, 10), anchor="w")
        self.style.map("Sidebar.TButton",
                       background=[("active", self._tint(panel, 0.25))])

        self.style.configure("TEntry", padding=8)
        self.style.configure("TCombobox", padding=6)

        # Text widgets need manual colors
        self.text_bg = entry_bg
        self.text_fg = text
        self.text_insert = text

    def _tint(self, hex_color: str, amt: float) -> str:
        # blend toward white
        hex_color = hex_color.lstrip("#")
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        r = int(r + (255 - r) * amt)
        g = int(g + (255 - g) * amt)
        b = int(b + (255 - b) * amt)
        return f"#{r:02x}{g:02x}{b:02x}"

    # ---------- layout ----------
    def _layout(self):
        # App bar
        self.appbar = ttk.Frame(self.root, style="Panel.TFrame", padding=(16, 12))
        self.appbar.pack(side="top", fill="x")

        left = ttk.Frame(self.appbar, style="Panel.TFrame")
        left.pack(side="left", fill="x", expand=True)
        ttk.Label(left, text="HYPNAGNOSIS Prompt Builder", style="Panel.TLabel", font=self.font_title).pack(anchor="w")
        ttk.Label(left, text="blank=autofill · SKIP=omit · NONE=disable", style="Panel.TLabel", foreground=self.colors["muted"]).pack(anchor="w", pady=(2, 0))

        right = ttk.Frame(self.appbar, style="Panel.TFrame")
        right.pack(side="right")

        ttk.Checkbutton(right, text="Dark", variable=self.dark, command=self._toggle_theme).pack(side="right", padx=(12, 0))
        ttk.Button(right, text="Generate", style="Primary.TButton", command=self.generate).pack(side="right", padx=6)
        ttk.Button(right, text="Series", command=self.generate_series).pack(side="right", padx=6)
        ttk.Button(right, text="Copy", command=self.copy_output).pack(side="right", padx=6)
        ttk.Button(right, text="Save", command=self.save_prompts).pack(side="right", padx=6)

        # Main body: sidebar + content + output
        body = ttk.Frame(self.root, padding=12)
        body.pack(side="top", fill="both", expand=True)
        body.columnconfigure(1, weight=3)
        body.columnconfigure(2, weight=2)
        body.rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar = ttk.Frame(body, style="Panel.TFrame", padding=(10, 10))
        self.sidebar.grid(row=0, column=0, sticky="nsw", padx=(0, 12))
        ttk.Label(self.sidebar, text="Sections", style="Panel.TLabel", font=self.font_title).pack(anchor="w", pady=(0, 10))

        # Content (scroll)
        self.scroll = Scrollable(body)
        self.scroll.grid(row=0, column=1, sticky="nsew")

        # Output panel
        out_panel = ttk.Frame(body, style="Panel.TFrame", padding=(12, 12))
        out_panel.grid(row=0, column=2, sticky="nsew")
        out_panel.rowconfigure(1, weight=1)
        out_panel.columnconfigure(0, weight=1)

        ttk.Label(out_panel, text="Output", style="Panel.TLabel", font=self.font_title).grid(row=0, column=0, sticky="w", pady=(0, 8))
        self.output = tk.Text(out_panel, wrap="word", height=10, bd=0, highlightthickness=1)
        self.output.grid(row=1, column=0, sticky="nsew")
        self._style_text(self.output)

        # Status bar
        self.status = tk.StringVar(value="Ready.")
        statusbar = ttk.Frame(self.root, style="Panel.TFrame", padding=(12, 8))
        statusbar.pack(side="bottom", fill="x")
        ttk.Label(statusbar, textvariable=self.status, style="Panel.TLabel", foreground=self.colors["muted"]).pack(anchor="w")

        # Build content cards
        self.sections: Dict[str, ttk.Widget] = {}
        self._build_cards(self.scroll.inner)
        self._build_sidebar()

    def _style_text(self, t: tk.Text):
        t.configure(
            background=self.text_bg,
            foreground=self.text_fg,
            insertbackground=self.text_insert,
            selectbackground=self._tint(self.colors["accent"], 0.35),
            highlightbackground=self.colors["border"],
            highlightcolor=self.colors["accent"],
            padx=12,
            pady=12,
            font=self.font_base
        )

    def _toggle_theme(self):
        self._apply_theme()
        # Re-style Text widgets (tk.Text not ttk)
        self._style_text(self.output)
        if hasattr(self, "vibe_desc"):
            self._style_text(self.vibe_desc)
        if hasattr(self, "plate_map"):
            self._style_text(self.plate_map)
        self.status.set("Theme updated.")

    # ---------- UI builders ----------
    def card(self, parent, title: str) -> ttk.Labelframe:
        lf = ttk.Labelframe(parent, text=title, style="Card.TLabelframe", padding=(14, 12))
        lf.pack(fill="x", pady=10)
        self.sections[title] = lf
        return lf

    def row_entry(self, parent, label: str, width: int = 34, default: str = "") -> ttk.Entry:
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=6)
        ttk.Label(row, text=label).pack(side="left")
        e = ttk.Entry(row, width=width)
        e.pack(side="right", fill="x", expand=True)
        if default:
            e.insert(0, default)
        return e

    def row_combo(self, parent, label: str, values: List[str], width: int = 34, default: str = "") -> ttk.Combobox:
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=6)
        ttk.Label(row, text=label).pack(side="left")
        cb = ttk.Combobox(row, values=values, width=width)
        cb.pack(side="right", fill="x", expand=True)
        if default:
            cb.set(default)
        return cb

    def row_text(self, parent, label: str, height: int = 4) -> tk.Text:
        ttk.Label(parent, text=label).pack(anchor="w", pady=(10, 4))
        t = tk.Text(parent, height=height, wrap="word", bd=0, highlightthickness=1)
        t.pack(fill="x")
        self._style_text(t)
        return t

    def row_toggles(self, parent, title: str, pairs: List[Tuple[str, str]]) -> Dict[str, tk.BooleanVar]:
        ttk.Label(parent, text=title).pack(anchor="w", pady=(10, 6))
        grid = ttk.Frame(parent)
        grid.pack(fill="x")
        vars_: Dict[str, tk.BooleanVar] = {}
        for i, (k, lbl) in enumerate(pairs):
            var = tk.BooleanVar(value=False)
            vars_[k] = var
            cb = ttk.Checkbutton(grid, text=lbl, variable=var)
            cb.grid(row=i // 2, column=i % 2, sticky="w", padx=6, pady=4)
        return vars_

    def _build_sidebar(self):
        # Buttons to jump to sections
        for title in self.sections.keys():
            ttk.Button(self.sidebar, text=title, style="Sidebar.TButton",
                       command=lambda t=title: self._scroll_to(t)).pack(fill="x", pady=4)

        ttk.Separator(self.sidebar).pack(fill="x", pady=10)
        ttk.Button(self.sidebar, text="Load Lexicon", command=self.load_lexicon).pack(fill="x", pady=4)
        ttk.Button(self.sidebar, text="Export Boot+System", command=self.export_full_doc).pack(fill="x", pady=4)

    def _scroll_to(self, title: str):
        w = self.sections.get(title)
        if not w:
            return
        self.scroll.update_idletasks()
        y = w.winfo_y()
        h = max(1, self.scroll.inner.winfo_height())
        self.scroll.canvas.yview_moveto(y / h)

    # ---------- Cards ----------
    def _build_cards(self, parent):
        # CORE
        core = self.card(parent, "Core")
        self.mode = self.row_combo(core, "MODE", ["FULL", "STYLE", "GESTURE", "PRINT", "LIVE"], default="FULL")
        self.subject = self.row_entry(core, "Subject", default="NEW ORIGINAL IMAGE — do not copy refs; follow system behavior.")
        self.style_tokens = self.row_entry(core, "Style Tokens (CSV)", default="STYLE.HYPNAGOGIC, STYLE.NEWWEIRD, STYLE.PRINT")
        self.notes = self.row_entry(core, "Notes", default="")

        # VIBE
        vibe = self.card(parent, "Vibe References")
        self.vibe_desc = self.row_text(vibe, "Vibe description", height=4)
        self.vibe_imgs = self.row_entry(vibe, "Vibe image list (filenames/paths you’ll attach)", default="")

        # HYPNA
        hyp = self.card(parent, "Hypna Matrix")
        self.h = self.row_entry(hyp, "Hallucination (0–100)", default="72")
        self.temporal = self.row_entry(hyp, "Temporal (0–100)", default="")
        self.material = self.row_entry(hyp, "Material (0–100)", default="")
        self.space = self.row_entry(hyp, "Space (0–100)", default="")
        self.symbol = self.row_entry(hyp, "Symbol (0–100)", default="")
        self.agency = self.row_entry(hyp, "Agency (0–100)", default="")
        ttk.Separator(hyp).pack(fill="x", pady=10)
        self.coherence = self.row_entry(hyp, "Coherence (0–100)", default="")
        self.recursion = self.row_entry(hyp, "Recursion (0–100)", default="")
        self.grain = self.row_entry(hyp, "Grain (0–100)", default="")
        self.line_wobble = self.row_entry(hyp, "Line wobble (0–100)", default="")
        self.erasure = self.row_entry(hyp, "Erasure (0–100)", default="")
        self.annotation = self.row_entry(hyp, "Annotation (0–100)", default="")

        # COMPOSITION
        comp = self.card(parent, "Composition")
        self.comp_mode = self.row_entry(comp, "Comp mode (auto/manual)", default="auto")
        self.composition = self.row_entry(comp, "Composition", default="")
        self.flow = self.row_entry(comp, "Flow", default="")
        self.framing = self.row_entry(comp, "Framing", default="")
        self.horizon = self.row_entry(comp, "Horizon", default="")
        self.scale_logic = self.row_entry(comp, "Scale logic", default="")

        # GESTURE
        gest = self.card(parent, "Gesture")
        self.gesture_mode = self.row_entry(gest, "Gesture mode (auto/manual)", default="auto")
        self.pressure = self.row_entry(gest, "Pressure", default="")
        self.tempo = self.row_entry(gest, "Tempo", default="")
        self.jitter = self.row_entry(gest, "Jitter", default="")
        self.stroke_memory = self.row_entry(gest, "Stroke memory", default="")
        self.interruption = self.row_entry(gest, "Interruption", default="")
        self.hatch_density = self.row_entry(gest, "Hatch density", default="")

        # ARCANE + SLEEP + COLOR
        misc = self.card(parent, "Arcane / Sleep / Color")
        self.arcane_enabled = tk.BooleanVar(value=True)
        self.sleep_enabled = tk.BooleanVar(value=True)
        self.color_enabled = tk.BooleanVar(value=True)
        togg = ttk.Frame(misc); togg.pack(fill="x", pady=6)
        ttk.Checkbutton(togg, text="Arcane layer", variable=self.arcane_enabled).pack(side="left", padx=6)
        ttk.Checkbutton(togg, text="Sleep layer", variable=self.sleep_enabled).pack(side="left", padx=6)
        ttk.Checkbutton(togg, text="Color layer", variable=self.color_enabled).pack(side="left", padx=6)
        self.arcane_mode = self.row_entry(misc, "Arcane mode", default="occult, mythological, symbolic, new weird system")
        self.neuro_state = self.row_entry(misc, "Neuro state", default="cataplexy + sleep paralysis + hypnagogia")
        self.color_mode = self.row_entry(misc, "Color mode", default="adaptive")
        self.palette_lock = self.row_entry(misc, "Palette lock (optional)", default="")
        self.whiteness = self.row_entry(misc, "Whiteness (e.g., creep in more white)", default="")

        # HUMANIZER
        hum = self.card(parent, "Humanizer")
        self.humanizer_level = self.row_entry(hum, "Humanizer level (0–100)", default="")
        self.humanizer_vars = self.row_toggles(hum, "Qualities", HUMANIZER_QUALITIES)
        self.humanizer_notes = self.row_entry(hum, "Notes", default="")

        # PAINTING
        paint = self.card(parent, "Painting Influence")
        self.paint_influence = self.row_combo(paint, "Influence", PAINTING_INFLUENCES, default="NONE")
        self.paint_strength = self.row_entry(paint, "Strength (0–100)", default="")
        self.paint_notes = self.row_entry(paint, "Notes", default="")

        # EVOLVE / MUTATE
        evo = self.card(parent, "Evolution / Mutation")
        self.evolve_enabled = tk.BooleanVar(value=True)
        self.mutate_enabled = tk.BooleanVar(value=False)
        tog = ttk.Frame(evo); tog.pack(fill="x", pady=6)
        ttk.Checkbutton(tog, text="Evolution", variable=self.evolve_enabled).pack(side="left", padx=6)
        ttk.Checkbutton(tog, text="Mutation", variable=self.mutate_enabled).pack(side="left", padx=6)
        self.steps = self.row_entry(evo, "Steps (1–20)", default="6")
        self.curve = self.row_entry(evo, "Curve (linear/ease-in/ease-out/s-curve/pulse)", default="s-curve")
        self.start_h = self.row_entry(evo, "Start hallucination", default="")
        self.end_h = self.row_entry(evo, "End hallucination", default="")
        ttk.Separator(evo).pack(fill="x", pady=10)
        self.mutate_strength = self.row_entry(evo, "Mutation strength (0–100)", default="")
        self.mutate_scope = self.row_entry(evo, "Mutation scope", default="")
        self.mutate_mode = self.row_entry(evo, "Mutation mode", default="")

        # PRINT / PLATES
        pr = self.card(parent, "Print / Plates")
        self.print_enabled = tk.BooleanVar(value=False)
        self.plates_enabled = tk.BooleanVar(value=False)
        tog2 = ttk.Frame(pr); tog2.pack(fill="x", pady=6)
        ttk.Checkbutton(tog2, text="Print layer", variable=self.print_enabled).pack(side="left", padx=6)
        ttk.Checkbutton(tog2, text="Plate gen", variable=self.plates_enabled).pack(side="left", padx=6)
        self.print_mode = self.row_entry(pr, "Print mode (gelli/riso/hybrid)", default="")
        self.registration = self.row_entry(pr, "Registration (slight/loose/progressive)", default="")
        self.texture = self.row_entry(pr, "Texture", default="")
        self.plate_count = self.row_entry(pr, "Plate count", default="")
        self.plate_logic = self.row_entry(pr, "Plate logic", default="")
        self.registration_map = self.row_entry(pr, "Registration map", default="")
        self.overprint = self.row_entry(pr, "Overprint", default="")
        self.plate_map = self.row_text(pr, "Plate map (multi-line)", height=5)

        self.inject_symbols = tk.BooleanVar(value=False)
        row = ttk.Frame(parent); row.pack(fill="x", pady=10)
        ttk.Checkbutton(row, text="Inject symbol lexicon (if loaded)", variable=self.inject_symbols).pack(side="left", padx=6)
        self.symbols_per_state = ttk.Entry(row, width=6); self.symbols_per_state.insert(0, "3"); self.symbols_per_state.pack(side="left", padx=6)
        ttk.Label(row, text="symbols/state").pack(side="left")

    # ---------- collect form ----------
    def collect_form(self) -> Form:
        f = Form()
        f.mode = (self.mode.get() or "FULL").strip()
        f.subject = self.subject.get().strip()
        f.style_tokens = self.style_tokens.get().strip()
        f.notes = self.notes.get().strip()
        f.vibe_description = self.vibe_desc.get("1.0", "end").strip()
        f.vibe_image_list = self.vibe_imgs.get().strip()

        f.hallucination = parse_int_cell(self.h.get())
        f.temporal = parse_int_cell(self.temporal.get())
        f.material = parse_int_cell(self.material.get())
        f.space = parse_int_cell(self.space.get())
        f.symbol = parse_int_cell(self.symbol.get())
        f.agency = parse_int_cell(self.agency.get())

        f.coherence = parse_int_cell(self.coherence.get())
        f.recursion = parse_int_cell(self.recursion.get())
        f.grain = parse_int_cell(self.grain.get())
        f.line_wobble = parse_int_cell(self.line_wobble.get())
        f.erasure = parse_int_cell(self.erasure.get())
        f.annotation = parse_int_cell(self.annotation.get())

        f.comp_mode = parse_cell(self.comp_mode.get())
        f.composition = parse_cell(self.composition.get())
        f.flow = parse_cell(self.flow.get())
        f.framing = parse_cell(self.framing.get())
        f.horizon = parse_cell(self.horizon.get())
        f.scale_logic = parse_cell(self.scale_logic.get())

        f.gesture_mode = parse_cell(self.gesture_mode.get())
        f.pressure = parse_cell(self.pressure.get())
        f.tempo = parse_cell(self.tempo.get())
        f.jitter = parse_cell(self.jitter.get())
        f.stroke_memory = parse_cell(self.stroke_memory.get())
        f.interruption = parse_cell(self.interruption.get())
        f.hatch_density = parse_cell(self.hatch_density.get())

        f.arcane_enabled = bool(self.arcane_enabled.get())
        f.sleep_enabled = bool(self.sleep_enabled.get())
        f.color_enabled = bool(self.color_enabled.get())
        f.arcane_mode = parse_cell(self.arcane_mode.get())
        f.neuro_state = parse_cell(self.neuro_state.get())
        f.color_mode = parse_cell(self.color_mode.get())
        f.palette_lock = parse_cell(self.palette_lock.get())
        f.whiteness = parse_cell(self.whiteness.get())

        f.humanizer.level = parse_int_cell(self.humanizer_level.get())
        for k in f.humanizer.qualities.keys():
            f.humanizer.qualities[k] = bool(self.humanizer_vars[k].get())
        f.humanizer.notes = parse_cell(self.humanizer_notes.get())

        f.painting.influence = parse_cell(self.paint_influence.get())
        f.painting.strength = parse_int_cell(self.paint_strength.get())
        f.painting.notes = parse_cell(self.paint_notes.get())

        f.evolve.enabled = bool(self.evolve_enabled.get())
        f.evolve.steps = parse_int_cell(self.steps.get())
        f.evolve.curve = parse_cell(self.curve.get())
        f.evolve.start_h = parse_int_cell(self.start_h.get())
        f.evolve.end_h = parse_int_cell(self.end_h.get())

        f.mutate.enabled = bool(self.mutate_enabled.get())
        f.mutate.strength = parse_int_cell(self.mutate_strength.get())
        f.mutate.scope = parse_cell(self.mutate_scope.get())
        f.mutate.mode = parse_cell(self.mutate_mode.get())

        f.print_enabled = bool(self.print_enabled.get())
        f.plates_enabled = bool(self.plates_enabled.get())
        f.print_mode = parse_cell(self.print_mode.get())
        f.registration = parse_cell(self.registration.get())
        f.texture = parse_cell(self.texture.get())
        f.plate_count = parse_int_cell(self.plate_count.get())
        f.plate_logic = parse_cell(self.plate_logic.get())
        f.registration_map = parse_cell(self.registration_map.get())
        f.overprint = parse_cell(self.overprint.get())
        f.plate_map = self.plate_map.get("1.0", "end").strip()

        f.inject_symbols = bool(self.inject_symbols.get())
        try:
            f.symbols_per_state = max(0, min(10, int(self.symbols_per_state.get().strip() or "3")))
        except Exception:
            f.symbols_per_state = 3
        return f

    # ---------- actions ----------
    def generate(self):
        form = self.collect_form()
        self.series = generate_series(form, self.lexicon)
        self._set_output(self.series[0]["prompt"])
        self.status.set("Generated 1 prompt.")

    def generate_series(self):
        form = self.collect_form()
        self.series = generate_series(form, self.lexicon)
        chunks = []
        for st in self.series:
            chunks.append(f"=== STATE {st['index']} ===\n{st['prompt']}\n")
        self._set_output("\n".join(chunks))
        self.status.set(f"Generated series: {len(self.series)} states.")

    def _set_output(self, txt: str):
        self.output.delete("1.0", "end")
        self.output.insert("1.0", txt)

    def copy_output(self):
        txt = self.output.get("1.0", "end").strip()
        self.root.clipboard_clear()
        self.root.clipboard_append(txt)
        self.root.update()
        self.status.set("Copied to clipboard.")

    def save_prompts(self):
        if not self.series:
            self.generate()
        path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text","*.txt"), ("All","*.*")])
        if not path:
            return
        with open(path, "w", encoding="utf-8") as f:
            if len(self.series) == 1:
                f.write(self.series[0]["prompt"])
            else:
                for st in self.series:
                    f.write(f"=== STATE {st['index']} ===\n{st['prompt']}\n\n")
        self.status.set(f"Saved to {path}")

    def export_full_doc(self):
        if not self.series:
            self.generate()
        path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text","*.txt"), ("All","*.*")])
        if not path:
            return
        with open(path, "w", encoding="utf-8") as f:
            f.write(BOOTLOADER_TEXT + "\n\n" + SYSTEM_FILE_TEXT + "\n\n")
            if len(self.series) == 1:
                f.write(self.series[0]["prompt"])
            else:
                for st in self.series:
                    f.write(f"=== STATE {st['index']} ===\n{st['prompt']}\n\n")
        self.status.set("Exported boot+system+prompt(s).")

    def load_lexicon(self):
        path = filedialog.askopenfilename(filetypes=[("JSON","*.json"), ("All","*.*")])
        if not path:
            return
        self.lexicon = load_symbol_lexicon(path)
        self.status.set(f"Loaded lexicon: {len(self.lexicon)} entries.")


if __name__ == "__main__":
    root = tk.Tk()
    App(root)
    root.mainloop()

