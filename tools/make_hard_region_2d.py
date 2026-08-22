# make_hard_region_2d.py - plain static 2D rendering of the hard-region map.
# Ports field()/fbm/Perlin verbatim from assets/js/hard-region.js (seed 20260610),
# so the contours match the live interactive map exactly. Repo-only (tools/ is
# excluded from the Jekyll build). Run from the repo root: python3 tools/make_hard_region_2d.py

import math, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.lines import Line2D

for w in ("400","500","700"):
    fm.fontManager.addfont(f"/tmp/hrfont/JetBrainsMono-{w}.ttf")
MONO = "Arial"   # static figure only; the live map keeps JetBrains Mono

# ---- ported verbatim from assets/js/hard-region.js (seed 20260610) ----
def make_noise(seed):
    p = list(range(256)); s = seed & 0xFFFFFFFF
    def rnd():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296
    for i in range(255, 0, -1):
        j = int(rnd() * (i + 1)); p[i], p[j] = p[j], p[i]
    p = p + p
    fade = lambda t: t*t*t*(t*(t*6-15)+10)
    def grad(h, x, y):
        h &= 7
        return (x+y, x-y, -x+y, -x-y, x, -x, y, -y)[h]
    def n(x, y):
        X, Y = int(math.floor(x)) & 255, int(math.floor(y)) & 255
        x -= math.floor(x); y -= math.floor(y)
        u, v = fade(x), fade(y)
        a, b = p[X] + Y, p[X+1] + Y
        lerp = lambda t, a, b: a + t*(b-a)
        return lerp(v, lerp(u, grad(p[a], x, y),   grad(p[b], x-1, y)),
                       lerp(u, grad(p[a+1], x, y-1), grad(p[b+1], x-1, y-1)))
    return n
noise = make_noise(20260610)
def fbm(x, y):
    v = amp = 0.0, 
    v, amp, f, nn = 0.0, 1.0, 1.0, 0.0
    for _ in range(4):
        v += amp * noise(x*f, y*f); nn += amp; amp *= 0.5; f *= 2
    return v/nn*0.5 + 0.5
def smooth(a, b, x):
    x = min(1, max(0, (x-a)/(b-a))); return x*x*(3-2*x)
def field(u, v):
    return fbm(u*3.1+7, v*3.1+3) * (0.28 + 0.92*smooth(0.18, 0.95, (u+v)/2))

LEVELS = [0.26,0.36,0.46,0.56,0.66,0.76,0.86]

# ---- roster (same coordinates as the site) ----
BENCH = [
  # group 1 — small molecules (enumerated / computed single molecules)
  (0.045, 0.055, "PubChem", 0, "mol", "R"), (0.100, 0.115, "QM9", 0, "mol", "R"),
  (0.045, 0.175, "MD17", 1, "mol", "R"),    (0.105, 0.215, "ANI-1x", 1, "mol", "L"),
  (0.048, 0.252, "SPICE", 1, "mol", "R"),   (0.105, 0.292, "PCQM4Mv2", 1, "mol", "L"),
  # group 2 — pure crystals (periodic bulk, computed and experimental)
  (0.175, 0.295, "Materials Project", 0, "xtl", "R"), (0.245, 0.045, "AFLOW", 0, "xtl", "R"),
  (0.180, 0.075, "COD", 1, "xtl", "R"),    (0.262, 0.110, "MatBench", 1, "xtl", "L"),
  (0.178, 0.145, "ICSD", 1, "xtl", "R"),   (0.250, 0.180, "OQMD", 1, "xtl", "R"),
  (0.180, 0.215, "CSD", 1, "xtl", "R"),    (0.255, 0.250, "OMat24", 1, "xtl", "L"),
  # group 3 — simple surfaces (slab + adsorbate)
  (0.325, 0.080, "OC20", 0, "srf", ""), (0.345, 0.155, "OC22", 1, "srf", "L")]
GROUPS = [("small molecules", "mol", -1, (0.000, -0.012)),
          ("pure crystals", "xtl", 1, None),
          ("simple surfaces", "srf", -1, None)]
DISC  = [(0.36,0.36,"perovskites",0,""),(0.50,0.30,"MOFs",0,""),(0.55,0.44,"alloys",0,""),
         (0.37,0.26,"zeolites",0,""),(0.47,0.40,"2D materials",0,""),(0.46,0.24,"battery cathodes",1,"")]
HARD  = [(0.67,0.78,"fuel cell membrane electrode assembly",0,""),(0.80,0.90,"water electrolyzer membrane electrode assembly",0,""),
         (0.94,0.71,"FET sensors",0,""),(0.80,0.68,"water pollutant sensing / adsorption composite membranes",0,""),
         (0.97,0.83,"multimetallic oxides",0,"")]

TEAL, GOLD, MAROON = "#008b7f", "#9a7712", "#a82424"
INK, MUTED, FAINT = "#141413", "#5d574f", "#8a847b"
GRID = "#d5d0c7"

# anonymous data-density dots, same LCG rule as the site
def dust():
    s = 99
    def rnd():
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296
    out, guard = [], 0
    while len(out) < 150 and guard < 4000:
        guard += 1
        u, v = rnd(), rnd()
        if rnd() < (1-u)*(1-v)*1.25 + 0.015: out.append((u, v))
    return out

def draw(bg, path_stem):
    fig, ax = plt.subplots(figsize=(16.5, 7.4), dpi=200)
    fig.patch.set_facecolor(bg); ax.set_facecolor(bg)

    # evaluate slightly past the frame so the wash bleeds off-edge instead of
    # ending on a visible rectangle
    XL, YL = (-0.02, 1.02), (-0.02, 1.06)
    N = 360
    gx = np.linspace(*XL, N); gy = np.linspace(*YL, int(N*0.62))
    Z = np.array([[field(u, v) for u in gx] for v in gy])
    # pale hypsometric wash: one hue, monotonically deeper as difficulty rises
    WASH = ["#ffffff","#fbf6f4","#f7efec","#f2e6e2","#ece0da","#e5d5ce","#ddc9c1","#d4bcb3","#cbafa5"]
    ax.contourf(gx, gy, Z, levels=[-1]+LEVELS+[2], colors=WASH, zorder=0)
    ax.contour(gx, gy, Z, levels=LEVELS, colors=GRID, linewidths=0.7, zorder=1)

    dx, dy = zip(*dust())
    ax.scatter(dx, dy, s=6.0, c=FAINT, alpha=0.30, linewidths=0, zorder=2)

    from matplotlib.patches import Ellipse
    PAD = 0.025
    for gname, key, up, at in GROUPS:                      # basin sub-regions by system type
        pts = [(b[0], b[1]) for b in BENCH if b[4] == key]
        us, vs = [p[0] for p in pts], [p[1] for p in pts]
        cx, cy = (min(us)+max(us))/2, (min(vs)+max(vs))/2
        w, h = (max(us)-min(us))+2*PAD, (max(vs)-min(vs))+2*PAD
        ax.add_patch(Ellipse((cx, cy), w, h, fill=False, edgecolor=TEAL,
                             linewidth=1.0, linestyle=(0, (5, 4)), alpha=0.55, zorder=3))
        gx, gy = at if at else (cx, cy + up*(h/2 + (0.022 if up > 0 else 0.052)))
        ax.text(gx, gy, gname.upper(),
                ha="left" if at else "center",
                va="bottom" if (at or up > 0) else "top",
                fontfamily=MONO, fontsize=15.9, color=INK, zorder=5)

    def plot(group, color, marker, size, lsize, lcol, side="right", flat=False):
        for u, v, label, minor, *rest in group:
            sec = rest[1] if len(rest) > 1 else ""
            ax.scatter([u], [v], s=size*(1 if flat or not minor else 0.42), c=color,
                       marker=marker, linewidths=0, zorder=4)
            left = sec == "L" or (not sec and (side == "left" or u > 0.85))
            ax.annotate(label, (u, v), xytext=(-11 if left else 11, 0),
                        textcoords="offset points", fontfamily=MONO, fontsize=lsize,
                        color=lcol, va="center", ha="right" if left else "left", zorder=5)

    # level 3 — the basin's dataset names: one uniform small grey
    plot(BENCH, TEAL,   "o", 56, 12.5, MUTED, flat=True)
    # level 2 — system labels, same rank as the group names below
    plot(DISC,  GOLD,   "D", 84, 15.9, INK, flat=True)
    plot(HARD,  MAROON, "^", 142, 15.9, INK, side="left")

    zone = dict(fontfamily=MONO, fontsize=18.5, zorder=5)
    ax.text(0.020, 0.470, "BENCHMARK-RICH DOMAINS", color=TEAL, **zone)
    ax.text(0.325, 0.520, "ACTIVE DISCOVERY DOMAINS", color=GOLD, **zone)
    ax.text(1.000, 1.010, "THE HARD REGION:", ha="right", color=MAROON, **zone)
    ax.text(1.000, 0.958, "COMPLEX FUNCTIONAL MATERIALS / DEVICES", ha="right",
            fontfamily=MONO, fontsize=15.5, color=MAROON, zorder=5)

    # qualitative axes: arrows, no ticks
    ax.annotate("", xy=(1.0, -0.035), xytext=(0, -0.035), xycoords=("axes fraction","axes fraction"),
                textcoords=("axes fraction","axes fraction"),
                arrowprops=dict(arrowstyle="-|>", color=FAINT, lw=0.9, shrinkA=0, shrinkB=0))
    ax.annotate("", xy=(-0.022, 1.0), xytext=(-0.022, 0), xycoords=("axes fraction","axes fraction"),
                textcoords=("axes fraction","axes fraction"),
                arrowprops=dict(arrowstyle="-|>", color=FAINT, lw=0.9, shrinkA=0, shrinkB=0))
    ax.text(0.5, -0.075, "SYSTEM COMPLEXITY", transform=ax.transAxes, ha="center",
            fontfamily=MONO, fontsize=15.5, color=MUTED)
    ax.text(-0.052, 0.5, "DATA COST", transform=ax.transAxes, va="center", ha="center",
            rotation=90, fontfamily=MONO, fontsize=15.5, color=MUTED)

    ax.set_xlim(*XL); ax.set_ylim(*YL)
    ax.set_xticks([]); ax.set_yticks([])
    for sp in ax.spines.values(): sp.set_visible(False)
    fig.subplots_adjust(left=0.075, right=0.99, top=0.985, bottom=0.105)
    for ext in ("svg","png"):
        fig.savefig(f"{path_stem}.{ext}", facecolor=bg, format=ext)
    plt.close(fig)
    print("wrote", path_stem + ".{svg,png}")

draw("#ffffff", "assets/img/hard-region-2d")
