#!/usr/bin/env python3
"""bake_structures.py — structure bake pipeline for the hard-region holograms.

Molecules: real 3D conformers fetched from PubChem PUG REST (SDF, record_type=3d).
Crystals:  parametric from textbook lattice parameters (sources cited inline).
Devices (MEA stacks, FET chip, core-shell particle) are NOT baked — they are
generated parametrically at runtime inside assets/js/hard-region-holo.js.

Output: assets/js/hr-holo-data.js — per structure: Int8-quantized positions
(unit-sphere normalized, x120), bond index pairs (element-pair distance cutoffs
or explicit cell-frame edges), per-atom size class 0-3 (element identity via
size/brightness — the monochrome hololith rule; never CPK colors).

Run from anywhere:  python3 tools/bake_structures.py
No third-party deps (urllib only). Network failure -> benzene falls back to an
exact hardcoded hexagon; every other molecule is honestly reported as MISSING
and the previous data file is left untouched rather than shipping fake geometry.
"""
import base64, math, os, struct, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'js', 'hr-holo-data.js')
PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/%d/record/SDF?record_type=3d'

# ---------------------------------------------------------------- helpers
def dist(a, b):
    return math.dist(a[:3], b[:3])

def add_bonds(atoms, bonds, rules):
    """rules: list of (elemA, elemB, cutoff). Adds deduped index pairs."""
    have = set(bonds)
    for i in range(len(atoms)):
        for j in range(i + 1, len(atoms)):
            ei, ej = atoms[i][3], atoms[j][3]
            for a, b, cut in rules:
                if {ei, ej} == {a, b} or (a == b == ei == ej):
                    if dist(atoms[i], atoms[j]) <= cut and (i, j) not in have:
                        bonds.append((i, j)); have.add((i, j))
                    break

def frame_edges(atoms, elem, length, tol=0.05):
    """Explicit cell-frame edges: axis-aligned CORNER pairs of `elem` at `length`."""
    crn = lambda a: all(min(abs(a[k]), abs(a[k] - length)) < tol for k in range(3))
    out = []
    for i in range(len(atoms)):
        if atoms[i][3] != elem or not crn(atoms[i]): continue
        for j in range(i + 1, len(atoms)):
            if atoms[j][3] != elem or not crn(atoms[j]): continue
            d = [abs(atoms[i][k] - atoms[j][k]) for k in range(3)]
            if abs(dist(atoms[i], atoms[j]) - length) < tol and sorted(d)[1] < tol:
                out.append((i, j))
    return out

def jacobi3(m):
    """eigenvectors of a symmetric 3x3 (rows of v = eigvecs, descending eigval)."""
    a = [row[:] for row in m]; v = [[1., 0., 0.], [0., 1., 0.], [0., 0., 1.]]
    for _ in range(24):
        p, q = max(((i, j) for i in range(3) for j in range(i + 1, 3)),
                   key=lambda t: abs(a[t[0]][t[1]]))
        if abs(a[p][q]) < 1e-12: break
        th = 0.5 * math.atan2(2 * a[p][q], a[q][q] - a[p][p])
        c, s = math.cos(th), math.sin(th)
        for k in range(3):
            apk, aqk = a[p][k], a[q][k]
            a[p][k], a[q][k] = c * apk - s * aqk, s * apk + c * aqk
        for k in range(3):
            akp, akq = a[k][p], a[k][q]
            a[k][p], a[k][q] = c * akp - s * akq, s * akp + c * akq
        for k in range(3):
            vkp, vkq = v[k][p], v[k][q]
            v[k][p], v[k][q] = c * vkp - s * vkq, s * vkp + c * vkq
    ev = sorted(range(3), key=lambda i: -a[i][i])
    return [[v[0][i], v[1][i], v[2][i]] for i in ev]

def pca_orient(atoms):
    """molecules: principal axes -> (x,y,z); flat rings end up horizontal."""
    n = len(atoms)
    cx = [sum(a[k] for a in atoms) / n for k in range(3)]
    cov = [[sum((a[i] - cx[i]) * (a[j] - cx[j]) for a in atoms) / n
            for j in range(3)] for i in range(3)]
    ax = jacobi3(cov)
    return [(sum((a[k] - cx[k]) * ax[0][k] for k in range(3)),
             sum((a[k] - cx[k]) * ax[1][k] for k in range(3)),
             sum((a[k] - cx[k]) * ax[2][k] for k in range(3)), a[3]) for a in atoms]

def pack(atoms, bonds, sizecls):
    """center on bbox, normalize max radius -> 1, quantize Int8 x120."""
    lo = [min(a[k] for a in atoms) for k in range(3)]
    hi = [max(a[k] for a in atoms) for k in range(3)]
    c = [(lo[k] + hi[k]) / 2 for k in range(3)]
    r = max(math.dist((a[0], a[1], a[2]), c) for a in atoms) or 1
    q = []
    for a in atoms:
        for k in range(3):
            q.append(max(-120, min(120, round((a[k] - c[k]) / r * 120))))
    pos = base64.b64encode(struct.pack('%db' % len(q), *q)).decode()
    bl = []
    for i, j in bonds: bl += [i, j]
    assert all(0 <= x < 256 for x in bl)
    bb = base64.b64encode(struct.pack('%dB' % len(bl), *bl)).decode()
    sz = ''.join(str(sizecls(a[3])) for a in atoms)
    return '%s|%s|%s' % (pos, bb, sz)

# ---------------------------------------------------------------- molecules
def fetch_sdf(cid):
    with urllib.request.urlopen(PUG % cid, timeout=30) as r:
        return r.read().decode()

def parse_sdf(txt):
    L = txt.splitlines()
    na, nb = int(L[3][0:3]), int(L[3][3:6])
    atoms = [(float(l[0:10]), float(l[10:20]), float(l[20:30]), l[31:34].strip())
             for l in L[4:4 + na]]
    bonds = [(int(l[0:3]) - 1, int(l[3:6]) - 1) for l in L[4 + na:4 + na + nb]]
    return atoms, bonds

BENZENE_FALLBACK = ([(1.397 * math.cos(k * math.pi / 3), 1.397 * math.sin(k * math.pi / 3), 0, 'C') for k in range(6)] +
                    [(2.484 * math.cos(k * math.pi / 3), 2.484 * math.sin(k * math.pi / 3), 0, 'H') for k in range(6)],
                    [(k, (k + 1) % 6) for k in range(6)] + [(k, k + 6) for k in range(6)])

def mol_size(e):
    return {'H': 0, 'C': 1}.get(e, 2 if e in 'NOF' else 3)

# ---------------------------------------------------------------- crystals
def nacl():   # rock salt, a = 5.64 A (textbook NaCl; MP mp-22862)
    a = 5.64; at = []
    for i in range(3):
        for j in range(3):
            for k in range(3):
                at.append((i * a / 2, j * a / 2, k * a / 2, 'Na' if (i + j + k) % 2 == 0 else 'Cl'))
    b = []; add_bonds(at, b, [('Na', 'Cl', 2.95)])
    return at, b, lambda e: 1 if e == 'Na' else 2

def si():     # diamond cubic, a = 5.43 A (MP mp-149)
    a = 5.43; fc = [(0, 0, 0), (.5, .5, 0), (.5, 0, .5), (0, .5, .5)]
    fr = []
    for base in fc:
        for s in [(0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1), (1, 1, 0), (1, 0, 1), (0, 1, 1), (1, 1, 1)]:
            p = (base[0] + s[0], base[1] + s[1], base[2] + s[2])
            if max(p) <= 1 and p not in fr: fr.append(p)
    fr += [(.25, .25, .25), (.75, .75, .25), (.75, .25, .75), (.25, .75, .75)]
    at = [(p[0] * a, p[1] * a, p[2] * a, 'Si') for p in fr]
    b = []; add_bonds(at, b, [('Si', 'Si', 2.5)])
    b += frame_edges(at, 'Si', a)
    return at, b, lambda e: 1

def sto():    # SrTiO3 cubic perovskite Pm-3m, a = 3.905 A (MP mp-5229; NOT CaTiO3)
    a = 3.905
    at = [(i * a, j * a, k * a, 'Sr') for i in (0, 1) for j in (0, 1) for k in (0, 1)]
    at.append((a / 2, a / 2, a / 2, 'Ti'))
    for f in [(.5, .5, 0), (.5, .5, 1), (.5, 0, .5), (.5, 1, .5), (0, .5, .5), (1, .5, .5)]:
        at.append((f[0] * a, f[1] * a, f[2] * a, 'O'))
    b = []; add_bonds(at, b, [('Ti', 'O', 2.1), ('O', 'O', 2.9)])   # TiO6 + octahedron edges
    b += frame_edges(at, 'Sr', a)
    return at, b, lambda e: {'Sr': 3, 'Ti': 1, 'O': 2}[e]

def spinel(): # MgAl2O4 Fd-3m #227 origin 2, a = 8.08 A, u(O) = 0.2626
    # (AFLOW prototype AB2C4_cF56_227_a_d_e). Full cell = 56 atoms -> too busy at
    # 30 px; we ship the [0,a/2] sub-cell: one MgO4 tetrahedron corner-linked to
    # the four surrounding AlO6 octahedra -- the recognizable spinel motif.
    a, d = 8.08, 0.2626 - 0.125
    F = [(0, 0, 0), (0, .5, .5), (.5, 0, .5), (.5, .5, 0)]
    mg8, al16, o32 = [], [], []
    for f in F:
        for m in [(.125, .125, .125), (.875, .875, .875)]:
            mg8.append(tuple((m[k] + f[k]) % 1 for k in range(3)))
        for m in [(.5, .5, .5), (.5, .25, .25), (.25, .5, .25), (.25, .25, .5)]:
            al16.append(tuple((m[k] + f[k]) % 1 for k in range(3)))
    for m in mg8:
        sgn = 1 if abs((m[0] % .5) - .125) < 1e-6 else -1   # diamond sublattice A/B
        for s in [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]:
            o32.append(tuple(m[k] + sgn * s[k] * d for k in range(3)))
    at = []
    for lst, e in [(mg8, 'Mg'), (al16, 'Al'), (o32, 'O')]:
        for p in lst:
            for sh in [(x, y, z) for x in (-1, 0, 1) for y in (-1, 0, 1) for z in (-1, 0, 1)]:
                q = tuple(p[k] + sh[k] for k in range(3))
                if all(-0.03 <= q[k] <= 0.53 for k in range(3)):
                    at.append((q[0] * a, q[1] * a, q[2] * a, e))
    b = []; add_bonds(at, b, [('Mg', 'O', 2.1), ('Al', 'O', 2.15)])
    used = set(i for bp in b for i in bp)
    keep = [i for i, x in enumerate(at) if i in used]
    idx = {o: n for n, o in enumerate(keep)}
    at = [at[i] for i in keep]; b = [(idx[i], idx[j]) for i, j in b]
    return at, b, lambda e: {'Mg': 3, 'Al': 2, 'O': 1}[e]

def sodalite():  # SOD beta-cage: 24 T at truncated-octahedron vertices, O bridges
    # (IZA SOD topology; T-T 3.17 A, T-O 1.61 A, Si-O-Si ~160 deg via radial push)
    s = 3.17 / math.sqrt(2)
    T = []
    for p in [(0, 1, 2), (0, 2, 1), (1, 0, 2), (1, 2, 0), (2, 0, 1), (2, 1, 0)]:
        for s1 in (1, -1):
            for s2 in (1, -1):
                sg = iter((s1, s2))
                t = tuple((x * next(sg) if x else 0) * s for x in p) + ('T',)
                if t not in T: T.append(t)
    at = list(T); b = []
    n = len(T)
    for i in range(n):
        for j in range(i + 1, n):
            if abs(dist(T[i], T[j]) - 3.17) < 0.05:
                m = [(T[i][k] + T[j][k]) / 2 for k in range(3)]
                r = math.hypot(*m); m = [x * (1 + 0.283 / r) for x in m]
                at.append((m[0], m[1], m[2], 'O'))
                oi = len(at) - 1
                b += [(i, oi), (j, oi)]
    return at, b, lambda e: 2 if e == 'T' else 0

def lco():    # LiCoO2 layered R-3m, a = 2.81, c = 14.05: one CoO2 slab + Li plane
    # (MP layered cathode; Co-O 1.92 A parametric; O planes at +-1.03 A, Li at c/6)
    a = 2.81; t = a / math.sqrt(3)
    hexpts = [(0, 0)] + [(a * math.cos(k * math.pi / 3 + math.pi / 6), a * math.sin(k * math.pi / 3 + math.pi / 6)) for k in range(6)]
    at = [(x, y, 0.0, 'Co') for x, y in hexpts]
    seen = set()
    for x, y in hexpts:      # O in the two 3-fold hollow sublattices (up 60deg / down 0deg)
        for base, z in [(math.pi / 3, 1.03), (0.0, -1.03)]:
            for ang in (base, base + 2 * math.pi / 3, base - 2 * math.pi / 3):
                o = (round(x + t * math.cos(ang), 2), round(y + t * math.sin(ang), 2), z)
                if o not in seen and math.hypot(o[0], o[1]) < a * 1.35:
                    seen.add(o); at.append((o[0], o[1], o[2], 'O'))
    at += [(round(x + t, 2), y, 14.05 / 6, 'Li') for x, y in hexpts]   # offset alkali plane
    b = []; add_bonds(at, b, [('Co', 'O', 2.1)])
    return at, b, lambda e: {'Co': 3, 'O': 1, 'Li': 2}[e]

def heusler():  # Cu2MnAl full Heusler L2_1, a = 5.95 A (textbook prototype)
    a = 5.95; at = []
    for i in (0, 1):
        for j in (0, 1):
            for k in (0, 1): at.append((i * a, j * a, k * a, 'Al'))
    for f in [(.5, .5, 0), (.5, .5, 1), (.5, 0, .5), (.5, 1, .5), (0, .5, .5), (1, .5, .5)]:
        at.append((f[0] * a, f[1] * a, f[2] * a, 'Al'))
    at.append((a / 2, a / 2, a / 2, 'Mn'))
    for e in [(.5, 0, 0), (.5, 1, 0), (.5, 0, 1), (.5, 1, 1), (0, .5, 0), (1, .5, 0),
              (0, .5, 1), (1, .5, 1), (0, 0, .5), (1, 0, .5), (0, 1, .5), (1, 1, .5)]:
        at.append((e[0] * a, e[1] * a, e[2] * a, 'Mn'))
    for i in (.25, .75):
        for j in (.25, .75):
            for k in (.25, .75): at.append((i * a, j * a, k * a, 'Cu'))
    b = frame_edges(at, 'Al', a)
    add_bonds(at, b, [('Cu', 'Mn', 2.7)])   # tetrahedral Cu-Mn; Cu-Al left implicit
    return at, b, lambda e: {'Al': 1, 'Mn': 3, 'Cu': 2}[e]

def fcc_random():  # random-occupancy FCC supercell (HEA-style), a = 3.6 A
    a = 3.6; at = []; seed = 20260706
    def rnd():
        nonlocal seed
        seed = (seed * 1664525 + 1013904223) % 2 ** 32
        return seed / 2 ** 32
    for i in range(5):
        for j in range(5):
            for k in range(5):
                if (i + j + k) % 2 == 0:
                    at.append((i * a / 2, j * a / 2, k * a / 2, 'E%d' % int(rnd() * 4)))
    b = []
    for i in range(len(at)):        # supercell box frame only (element = size)
        for j in range(i + 1, len(at)):
            d = [abs(at[i][k] - at[j][k]) for k in range(3)]
            if abs(dist(at[i], at[j]) - 2 * a) < .05 and sorted(d)[1] < .05 and \
               all(min(abs(at[x][k]), abs(at[x][k] - 2 * a)) < .05 for x in (i, j) for k in range(3)):
                b.append((i, j))
    return at, b, lambda e: int(e[1])

def mos2():   # MoS2 1H monolayer flake, a = 3.16 A, S at +-1.56 A (C2DB-style)
    a = 3.16
    a1, a2 = (a, 0), (a / 2, a * math.sqrt(3) / 2)
    mo = [(0, 0)] + [(math.cos(k * math.pi / 3) * a, math.sin(k * math.pi / 3) * a) for k in range(6)]
    at = [(x, y, 0.0, 'Mo') for x, y in mo]
    ssites = set()
    for i in range(-3, 4):
        for j in range(-3, 4):
            p = (i * a1[0] + j * a2[0] + (a1[0] + a2[0]) / 3, i * a1[1] + j * a2[1] + (a1[1] + a2[1]) / 3)
            nb = sum(1 for x, y in mo if math.hypot(p[0] - x, p[1] - y) < a / math.sqrt(3) + .1)
            if nb >= 1: ssites.add((round(p[0], 3), round(p[1], 3)))
    for x, y in sorted(ssites):
        at.append((x, y, 1.56, 'S')); at.append((x, y, -1.56, 'S'))
    b = []; add_bonds(at, b, [('Mo', 'S', 2.55)])
    return at, b, lambda e: 2 if e == 'Mo' else 1

def cu111():  # OC20-style: Cu(111) 3-layer 4x4 slab + one CO atop (parametric)
    nn = 2.556; il = 2.087
    a1, a2 = (nn, 0), (nn / 2, nn * math.sqrt(3) / 2)
    at = []
    for L, off in [(0, 0), (1, 1 / 3), (2, 2 / 3)]:   # ABC stacking
        for i in range(4):
            for j in range(4):
                x = (i + off) * a1[0] + (j + off) * a2[0]
                y = (i + off) * a1[1] + (j + off) * a2[1]
                at.append((x, y, -L * il, 'Cu'))
    tx, ty = 1.5 * a1[0] + 1.5 * a2[0], 1.5 * a1[1] + 1.5 * a2[1]
    ci = min(range(16), key=lambda i: (at[i][0] - tx) ** 2 + (at[i][1] - ty) ** 2)
    cu = at[ci]
    at.append((cu[0], cu[1], 1.86, 'C')); at.append((cu[0], cu[1], 1.86 + 1.15, 'O'))
    b = [(ci, len(at) - 2), (len(at) - 2, len(at) - 1)]
    return at, b, lambda e: 1 if e == 'Cu' else 2

def mof5():   # MOF-5 Zn4O(BDC)3 cage, simplified: Zn4O corners + linker rods
    # (CSD SAHYIK topology; cluster-cluster a/2 = 12.9 A, Zn-O 1.94 A)
    L = 12.9; at = []; b = []
    corners = [(i, j, k) for i in (0, 1) for j in (0, 1) for k in (0, 1)]
    oidx = {}
    for (i, j, k) in corners:
        c = (i * L, j * L, k * L)
        at.append((c[0], c[1], c[2], 'Oc')); oidx[(i, j, k)] = len(at) - 1
        sg = 1 if (i + j + k) % 2 == 0 else -1
        for s in [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]:
            r = 1.94 / math.sqrt(3)
            at.append((c[0] + sg * s[0] * r, c[1] + sg * s[1] * r, c[2] + sg * s[2] * r, 'Zn'))
            b.append((oidx[(i, j, k)], len(at) - 1))
    for (ci, cj) in [(p, q) for p in corners for q in corners
                     if p < q and sum(abs(p[m] - q[m]) for m in range(3)) == 1]:
        A = at[oidx[ci]]; B = at[oidx[cj]]
        i1 = len(at); at.append((A[0] + (B[0] - A[0]) * .4, A[1] + (B[1] - A[1]) * .4, A[2] + (B[2] - A[2]) * .4, 'C'))
        i2 = len(at); at.append((A[0] + (B[0] - A[0]) * .6, A[1] + (B[1] - A[1]) * .6, A[2] + (B[2] - A[2]) * .6, 'C'))
        b += [(oidx[ci], i1), (i1, i2), (i2, oidx[cj])]
    return at, b, lambda e: {'Oc': 3, 'Zn': 2, 'C': 1}[e]

# ---------------------------------------------------------------- main
def main():
    rows = []; data = {}

    def put(key, atoms, bonds, sizecls, source):
        data[key] = pack(atoms, bonds, sizecls)
        rows.append((key, len(atoms), len(bonds), source))

    for key, cid, name in [('bz', 241, 'benzene'), ('caf', 2519, 'caffeine'),
                           ('asp', 2244, 'aspirin'), ('pfoa', 9554, 'PFOA')]:
        try:
            atoms, bonds = parse_sdf(fetch_sdf(cid))
            put(key, pca_orient(atoms), bonds, mol_size, 'PubChem CID %d 3D SDF (real)' % cid)
        except Exception as e:
            if key == 'bz':
                put(key, BENZENE_FALLBACK[0], BENZENE_FALLBACK[1], mol_size,
                    'FALLBACK exact hexagon (network: %s)' % e)
            else:
                rows.append((key, 0, 0, 'MISSING - network failed (%s), NOT baked' % e))

    put('nacl', *nacl(), 'parametric rock salt a=5.64')
    put('si', *si(), 'parametric diamond cubic a=5.43')
    put('sto', *sto(), 'parametric SrTiO3 Pm-3m a=3.905')
    put('spn', *spinel(), 'parametric spinel #227 a=8.08 u=.2626 (sub-cell)')
    put('sod', *sodalite(), 'parametric SOD beta-cage T-T 3.17')
    put('lco', *lco(), 'parametric layered R-3m a=2.81 c=14.05')
    put('heu', *heusler(), 'parametric Heusler L2_1 a=5.95')
    put('fcc', *fcc_random(), 'parametric random-occupancy FCC 2a box')
    put('mos2', *mos2(), 'parametric 1H monolayer a=3.16')
    put('cu111', *cu111(), 'parametric Cu(111) 4x4x3 + CO atop')
    put('mof', *mof5(), 'parametric MOF-5 cage, cluster pitch 12.9')

    missing = [r for r in rows if r[1] == 0]
    if missing and os.path.exists(OUT):
        print('NETWORK FAILURE - data file NOT rewritten; missing:', [r[0] for r in missing])
    else:
        body = ',\n'.join('%s:"%s"' % (k, v) for k, v in data.items())
        js = ('/* GENERATED by tools/bake_structures.py — do not hand-edit.\n'
              '   Real PubChem 3D conformers (CIDs 241/2519/2244/9554) + parametric\n'
              '   textbook crystals. Format per structure: "b64(Int8 xyz×n, unit-sphere\n'
              '   normalized ×120)|b64(Uint8 bond index pairs)|size classes 0-3".  */\n'
              'export const D={\n' + body + '\n};\n')
        with open(OUT, 'w') as f:
            f.write(js)

    print('%-6s %5s %5s  %s' % ('key', 'atoms', 'bonds', 'source'))
    for k, na, nb, src in rows:
        print('%-6s %5d %5d  %s' % (k, na, nb, src))
    print('total atoms %d, bonds %d' % (sum(r[1] for r in rows), sum(r[2] for r in rows)))
    if os.path.exists(OUT):
        print('%s: %d bytes' % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT)))

if __name__ == '__main__':
    main()
