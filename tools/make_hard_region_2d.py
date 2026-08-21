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
MONO = "JetBrains Mono"

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
BENCH = [(0.10,0.10,"QM9",0),(0.17,0.165,"Materials Project",0),(0.30,0.085,"OC20",0),
         (0.045,0.045,"PubChem",0),(0.235,0.045,"AFLOW",0),
         (0.07,0.21,"OQMD",1),(0.16,0.04,"MD17",1),(0.24,0.20,"MatBench",1)]
DISC  = [(0.36,0.36,"perovskites",0),(0.50,0.30,"MOFs",0),(0.55,0.44,"alloys",0),
         (0.37,0.26,"zeolites",0),(0.47,0.40,"2D materials",0),(0.46,0.24,"battery cathodes",1)]
HARD  = [(0.63,0.74,"fuel cell components",0),(0.76,0.92,"electrolyzer components",0),
         (0.90,0.69,"FET sensors",0),(0.71,0.59,"PFAS sensing / adsorption",0),
         (0.94,0.84,"complex nanomaterials",0)]

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
    fig, ax = plt.subplots(figsize=(13, 7.6), dpi=200)
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
    ax.scatter(dx, dy, s=4.5, c=FAINT, alpha=0.30, linewidths=0, zorder=2)

    def plot(group, color, marker, size, msize, side="right"):
        for u, v, label, minor in group:
            ax.scatter([u], [v], s=size*(0.42 if minor else 1), c=color, marker=marker,
                       linewidths=0, zorder=4)
            if not minor:
                left = side == "left" or u > 0.85   # keep labels inside the frame
                ax.annotate(label, (u, v), xytext=(-11 if left else 11, 0),
                            textcoords="offset points", fontfamily=MONO, fontsize=msize,
                            color=INK, va="center", ha="right" if left else "left", zorder=5)
    plot(BENCH, TEAL,   "o", 62, 12.5)
    plot(DISC,  GOLD,   "D", 56, 12.5)
    plot(HARD,  MAROON, "^", 96, 13.5, side="left")

    zone = dict(fontfamily=MONO, fontsize=14.5, color=MUTED, zorder=5)
    ax.text(0.015, 0.315, "BENCHMARK-RICH", **zone)
    ax.text(0.325, 0.520, "ACTIVE DISCOVERY", **zone)
    ax.text(0.585, 0.985, "THE HARD REGION", **{**zone, "color": INK})

    # qualitative axes: arrows, no ticks
    ax.annotate("", xy=(1.0, -0.035), xytext=(0, -0.035), xycoords=("axes fraction","axes fraction"),
                textcoords=("axes fraction","axes fraction"),
                arrowprops=dict(arrowstyle="-|>", color=FAINT, lw=0.9, shrinkA=0, shrinkB=0))
    ax.annotate("", xy=(-0.022, 1.0), xytext=(-0.022, 0), xycoords=("axes fraction","axes fraction"),
                textcoords=("axes fraction","axes fraction"),
                arrowprops=dict(arrowstyle="-|>", color=FAINT, lw=0.9, shrinkA=0, shrinkB=0))
    ax.text(0.5, -0.075, "SYSTEM COMPLEXITY", transform=ax.transAxes, ha="center",
            fontfamily=MONO, fontsize=12.5, color=MUTED)
    ax.text(-0.052, 0.5, "DATA COST", transform=ax.transAxes, va="center", ha="center",
            rotation=90, fontfamily=MONO, fontsize=12.5, color=MUTED)

    handles = [Line2D([],[],marker=m,color="none",markerfacecolor=c,markeredgecolor="none",markersize=s,label=l)
               for m,c,s,l in [("o",TEAL,8.5,"data-rich  ·  benchmarked"),
                               ("D",GOLD,7.8,"active discovery"),
                               ("^",MAROON,9.5,"data-scarce / unbenchmarked")]]
    leg = ax.legend(handles=handles, loc="lower right", frameon=True,
                    facecolor=bg, edgecolor="none", framealpha=0.92,
                    prop={"family":MONO,"size":11.5}, labelspacing=0.75,
                    handletextpad=0.7, borderpad=0.9)
    leg.set_zorder(6)
    for t in leg.get_texts(): t.set_color(MUTED)

    ax.set_xlim(*XL); ax.set_ylim(*YL)
    ax.set_xticks([]); ax.set_yticks([])
    for sp in ax.spines.values(): sp.set_visible(False)
    fig.subplots_adjust(left=0.075, right=0.99, top=0.985, bottom=0.105)
    for ext in ("svg","png"):
        fig.savefig(f"{path_stem}.{ext}", facecolor=bg, format=ext)
    plt.close(fig)
    print("wrote", path_stem + ".{svg,png}")

draw("#ffffff", "assets/img/hard-region-2d")
