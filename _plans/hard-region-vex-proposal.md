# Proposal: "The Magos Walks the Table" — voxel Vex-7 on the 3D hard-region map

> Status: **v1 APPROVED GOAL, 2026-07-06.** Owner rulings: the walking mini Vex-7 must be TRUE 3D
> (the map is drag-orbitable — billboards rejected); map-click (the odradek scan) teleports him to
> the sample site; clicking Vex himself opens the chatbot (same as the page pet); idle → autonomous
> wander. Parent aesthetics: [[hard-region-holograms-proposal.md]] guardrails carry over, with one
> licensed exception: Vex keeps his own sprite palette — he is the one REAL entity on the hololith
> table (the tech-priest walking his own strategium), so he is opaque and lit, not a monochrome
> projection.
> `_plans/` is not rendered by Jekyll.

## Representation: VOXEL (the pixel mascot, dimension-lifted)

- Model: ~16–20 voxels tall Vex-7 built from the existing pixel-art reference
  (magos_pixel_pet.html pixel arrays = front silhouette + palette: dark-red hooded robe, metal
  arms, staff, glowing eye). Authored as layered palette strings IN CODE (no MagicaVoxel/Blender);
  baked at module init into ONE merged mesh (visible faces only, per-vertex flat shade + cheap AO).
- Animation: rigid-part groups (body, head, legs ×2, staff arm, backpack) with a tiny CPU walk
  cycle (leg swing, bob, staff plant); idle sway; look-at head yaw.
- Render: 1–2 draw calls, depth-tested against terrain (occluded by the massif correctly),
  feet glued to field(u,v)·HS. Screen height ~28–44 px at hero distance.

## Behavior

| Trigger | Behavior |
|---|---|
| cursor moves over terrain (not dragging) | Vex walks toward the cursor's terrain point (pickTerrain already exists); flips facing by direction |
| idle (no hover > ~5 s) | wanders — preferentially toward the survey probe's last ping site ("the Magos inspects the survey") |
| map click = odradek scan | **teleport**: per-voxel dissolve-out (noise-ordered voxels scatter/fade), light column flash at target (reuse probe-column vocabulary), dissolve-in at the sample point |
| click Vex himself | opens the chat (window.__askRui.toggle() — same API as the page pet); cursor: pointer; hit-test priority ABOVE nodes/terrain |
| examine mode active | Vex walks to the examined node and idles facing it (dims are for holograms; Vex stays lit) |
| drag/orbit | no retargeting while dragging; he keeps walking to his last target |

## Architecture

- Separate severable module `assets/js/hard-region-vex.js` (**cap 14,336 B** incl. voxel data
  strings; est. ~10–12 KB). Loaded after entrance like the holo module; failure = silent no-op.
- Main module hook: generic extension path alongside loadHolo (import + per-frame draw + pick
  chain + teardown). **Main module cap renegotiated 43,008 → 43,520** (judge-authorized: one
  plugin hook serves holo+vex; main currently 43,005).
- Gating: 3D-only (phones/2D never see him — the page pet remains their Vex). The PAGE pet is
  untouched and coexists (it roams the viewport; mini-Vex lives inside the map).
- Perf: +1–2 draw calls, ≤ ~2k triangles, zero when off-screen; respects main rAF lifecycle.

## Interaction conflicts (must-verify list)

- Clicking Vex must NOT trigger terrain scan/examine (priority hit-test).
- Walking target updates must not fire during camera drag; wheel/engage unaffected.
- Teleport must coexist with the scan ring (both fire on map click — that's the point).
- Splash: identical behavior fullscreen; severed-module run = today's map exactly.

## Verification bar (judge)

Model quality gate FIRST: screenshots of the voxel Vex from 4 orbit angles at map scale BEFORE
wiring behavior — if he doesn't read as Vex-7 at 36 px, iterate the model before anything else.
Then: walk-to-cursor, idle wander to probe site, teleport (mid-dissolve frame captured), chat-open
click, examine-follow, occlusion behind the massif, dark + light themes, splash, severed run,
sizes vs caps, console clean, 2D untouched.
