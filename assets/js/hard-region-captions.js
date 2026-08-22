/* hard-region-captions.js — one-line descriptions for the hard-region map's
   #hr-info panel, shared by the 2D (hard-region.js) and 3D (hard-region-3d.js)
   renderers via dynamic import, so the prose lives in one place and neither
   renderer's own byte budget carries it. Severable: either renderer works,
   just without hover captions, if this fails to load.

   BENCH_CAP: the sixteen basin datasets, verbatim, every figure verified —
   do not add numbers here that are not already in the string.
   DISC_CAP: the active-discovery six, mirrored verbatim from the roster
   copy already written for the H2 examine mode (hard-region-holo.js CP[]).
   RING_CAP: the three benchmark-rich groups (small molecules / pure
   crystals / simple surfaces), written for this panel. */
export const BENCH_CAP = {
  'PubChem': 'The public chemical index: over 100 million catalogued compounds, the pool most virtual screens draw from.',
  'QM9': '134k small organic molecules with 13 DFT properties each. The first benchmark most molecular models are measured on.',
  'MD17': 'DFT trajectories for ten small molecules. The reference training set for machine-learned interatomic potentials.',
  'ANI-1x': '~5M DFT calculations on off-equilibrium organic conformations, gathered by active learning for transferable potentials.',
  'SPICE': 'Over 1.1M conformations of small molecules, dimers, peptides and solvated amino acids, for potentials that must handle biomolecules.',
  'PCQM4Mv2': 'The OGB large-scale HOMO-LUMO regression task. The leaderboard graph neural networks are measured on.',
  'Materials Project': '150k+ computed inorganic crystals behind one API. The reference atlas of crystal space.',
  'AFLOW': '~3.5M computed compounds plus a prototype encyclopedia. Crystal space by enumeration.',
  'OQMD': '~1.2M DFT formation energies. Thermodynamic stability as a table lookup.',
  'ICSD': 'The standard curated record of experimentally determined inorganic crystal structures.',
  'CSD': 'The curated record of experimentally determined organic and metal-organic crystal structures.',
  'COD': 'An open repository of experimentally determined crystal structures: the free counterpart to ICSD and the CSD.',
  'OMat24': 'Over 100M DFT calculations with relaxation trajectories, built to train foundation-model interatomic potentials.',
  'MatBench': '13 standard tasks for crystal property prediction. Leaderboards here are close to saturation.',
  'OC20': '1.3M DFT relaxations of adsorbate-catalyst surfaces. Adsorption-energy prediction at industrial scale.',
  'OC22': "62k DFT relaxations on oxide surfaces: OC20's harder sibling, where lattice oxygen and charge transfer matter."
};
export const DISC_CAP = {
  'perovskites': 'high-throughput synthesis and large optoelectronic datasets. the screening playbook is established — no longer the hard part.',
  'MOFs': 'hundreds of thousands of structures in CoRE-MOF and hMOF; GCMC screening is routine. a vast design space with a charted pipeline.',
  'alloys': 'CALPHAD plus high-throughput DFT settle phase stability at scale. composition space yields to enumeration.',
  'zeolites': '~250 known frameworks, millions hypothesized, one curated atlas (IZA). templated synthesis is codified — the first step out of the lowlands.',
  '2D materials': 'C2DB and friends catalog thousands of monolayers. the isolated flake is charted; the device around it is not.',
  'battery cathodes': 'decades of curated electrochemistry, routine HT-DFT screening. intercalation chemistry has its playbook.'
};
export const RING_CAP = {
  'small molecules': 'Single organic compounds — the cheapest data on the map, catalogued or computed one molecule at a time.',
  'pure crystals': 'One composition, one periodic structure — enumerable by machine, so these databases run to the millions.',
  'simple surfaces': 'One clean facet plus one adsorbate: still a DFT slab calculation, but a standardised one.'
};
