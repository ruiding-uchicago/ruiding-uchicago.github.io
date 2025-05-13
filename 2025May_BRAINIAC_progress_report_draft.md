Progress Report for NSF ACCESS Allocation 
 
1. Executive Summary

During this award period, our team fully delivered on the foundational goals of the BRAINIAC initiative—Broad‐scope Reasoning Artificial Intelligence for Nano-micro Identification, Assessment, and Categorization—by demonstrating that a hybrid neuromorphic pipeline can meaningfully accelerate FET sensor design. The cover article in Molecular Systems Design & Engineering (Issue 5, 2025) provided compelling proof-of-concept: an SGNN model with LLM-assisted text mining achieved 0.89 classification accuracy on curated sensor data and distilled actionable design rules from over 1,400 experiments  . This success not only validates BRAINIAC’s core vision but also lays the groundwork for scaling to hundreds of thousands of publications and extensive simulation studies.
 
2. BRAINIAC Vision & Project Scope

BRAINIAC addresses the critical bottleneck in materials and device innovation: the disconnect between isolated data-centric ML approaches and the associative reasoning of human experts. By integrating:
1.	LLM-Assisted Text Mining to convert vast unstructured literature into structured datasets,
2.	Spiking Graph Neural Networks (SGNNs) to fuse global physicochemical descriptors with sparse molecular fingerprints as spike trains, and
3.	High-Fidelity Simulations (DFT/AIMD) for mechanistic validation,

we emulate cross-disciplinary insight at scale. Our long-term ambition is to process >1.1 million full-text publications—spanning sensors, electrocatalysts, batteries, semiconductors, and more environmental-related frontiers—and generate a multi-fidelity dataset that underpins next-generation discovery workflows  .
 
3. Pipeline Validation & Data Curation
•	Semi-Automated Extraction: Leveraging carefully designed LLM prompts, we ingested and parsed over 1,400 FET sensor reports, extracting key entities (target analyte, probe material, testing medium, conditions) into JSON records. Human curation ensured >99% fidelity against original texts  .
•	Feature Engineering: Each record was augmented with a comprehensive descriptor suite—including topological polar surface area, probe mechanical properties, ionic strength proxies, and device metadata—enabling multidimensional modeling.
•	Quality Assurance: Cross-annotator reviews and consistency checks against original publications established a robust corpus for downstream modeling.
 
4. Model Development & Interpretability
•	SGNN Architecture: We designed a dual-pipeline network (Fig. 4c) wherein:
o	Global Descriptors form a graph input capturing interdependencies of target, probe, medium, and conditions, and
o	Morgan Fingerprint Spike Trains supply sparse topological information to an SNN module .
•	Performance: In an 80:20 train-test split, the SGNN attained 89 % accuracy on discrete lower-detection-limit categories—quadrupling random baselines and outperforming conventional GNNs and gradient-boosting models .
•	Interpretability: Integrated Gradients and SHAP analyses pinpointed critical features—such as molecular polarity, surface charge distribution, and testing pH—offering clear, physics-grounded design rules for probe optimization.
 
5. In-Silico Screening & Computational Confirmation
•	Virtual Screening: Applying our SGNN, we prioritized candidate probe materials for PFAS detection, identifying graphene derivatives and ferrocenecarboxylic acid as top performers.
•	DFT/AIMD Validation: Targeted simulations on selected probe–analyte pairs confirmed predicted binding energetics and adsorption configurations, bridging ML insights and atomistic mechanisms  .
 
6. Dissemination & Impact
•	High-Visibility Publication: The pipeline validation paper was featured as the cover of MSDE (May 2025) https://pubs.rsc.org/en/content/articlelanding/2025/me/d4me00203b
•	Selected as MSDE recent HOT articles, https://pubs.rsc.org/en/journals/articlecollectionlanding?sercode=me&themeid=390f879d-aad5-4aa7-adc8-c3e61ebd3f77. signaling strong community interest .
•	Press Outreach: A University of Chicago news article showcased our results to a broader audience, sparking inquiries from environmental sensor companies and academic collaborators: https://pme.uchicago.edu/news/ai-helps-scientists-design-better-sensors-pollutants-and-beyond
•	Open-Source Release: We published the SGNN codebase, pre-trained weights, and curated dataset on GitHub, fostering transparency and enabling community-driven extensions.
 
7. Challenges & Bottlenecks
•	Manual Curation Overhead: Although LLMs accelerate extraction, maintaining high data quality for >1,400 records required substantial human effort; scaling to millions will demand sophisticated auto-template optimization and active-learning loops  .
•	Computational Throughput: Prototype graph constructions and event-driven simulations highlighted memory and concurrency constraints; full-scale operation will require higher-capacity nodes and optimized scheduling.
•	Dynamic Data Integration: Our current focus on static endpoint metrics must evolve to include time-series sensor response data, necessitating extended model architectures and iterative retraining.
 
8. Next Steps & Scaling Plan
1.	Automated Literature Processing: Expand LLM workflows to ≥500 k publications using refined prompt templates and distillation techniques, with periodic human-in-the-loop validations.
2.	Multimodal Model Extensions: Incorporate experimental kinetics and simulation outputs into hybrid SGNN+ architectures to capture dynamic sensing phenomena.
3.	High-Throughput Simulations: Launch a broad campaign of atomistic DFT/AIMD runs across diverse material families, feeding active-learning loops to prioritize promising candidates.
4.	Experimental Collaboration: Partner with device labs to fabricate and test top in silico candidates, closing the loop between prediction and performance.
5.	API & Portal Deployment: Release a RESTful interface enabling external researchers to query BRAINIAC models for custom probe screening.
 
9. Justification for Supplement

Our initial ACCESS allocation catalyzed a landmark proof-of-concept—culminating in a cover-article, robust SGNN performance, and community-ready codebase. To transition from prototype to platform, we seek supplemental GPU and CPU credits. These resources will unlock:
•	Automated processing of hundreds of thousands of additional publications,
•	Expanded multimodal modeling with dynamic response data, and
•	Extensive simulation campaigns to refine and generalize BRAINIAC models across domains.

By augmenting our proven pipeline with these resources, BRAINIAC will deliver unprecedented acceleration in materials and device discovery, amplifying scientific and societal impact.

