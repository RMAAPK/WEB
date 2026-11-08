import json
import re

json_file = 'src/data/blogs.json'
ts_file = 'src/data/blogs.ts'

new_blogs = [
  {
    "id": "tb-2026-medical",
    "slug": "legend-alpha-nicotinic-targeted-oncology-reversion",
    "title": "The Legend-Alpha: Nicotinic-Targeted Universal Oncology Reversion",
    "category": "Medical",
    "readTime": "5 min read",
    "publishedAt": "2026-09-25",
    "description": "A non-invasive systemic reversion platform designed to treat late-stage metastatic cancer through aerosolized molecular engineering. 2026 Tech Briefs Contest Finalist.",
    "tags": ["Medical", "Tech Briefs 2026", "Oncology", "CRISPR", "Nanoparticles"],
    "keywords": "epigenetic reprogramming, synthetic nicotine analog, pH-responsive lipid shield, CRISPR restoration code",
    "content": "The Legend-Alpha is a non-invasive systemic reversion platform designed to treat late-stage metastatic cancer through aerosolized molecular engineering. Moving beyond traditional cytotoxic chemotherapy, which destroys healthy and malignant cells alike, this innovation focuses on Epigenetic Reprogramming—convincing cancer cells to mature into healthy, functional tissue again.\n\n### The Mechanism\nThe system utilizes a triple-layered nanoparticle delivery vehicle. The core contains a CRISPR-based 'Restoration Code.' This is wrapped in a Synthetic Nicotine Analog which acts as a high-affinity targeting key. Because late-stage cancer cells over-express nicotinic acetylcholine receptors (nAChRs), the nicotine 'homing' molecule ensures the treatment selectively binds to malignant cells.\n\n### The 'Ghost' Shell\nTo ensure zero-touch interaction with healthy tissue, the particles are encapsulated in a pH-responsive lipid shield. This shield remains stable in the slightly alkaline environment of healthy blood (pH 7.4) but dissolves instantly upon encountering the acidic micro-environment of a tumor (pH < 6.8)."
  },
  {
    "id": "tb-2026-energy",
    "slug": "molecular-bond-breaker-plasma-water-injection",
    "title": "The Molecular Bond Breaker: High-Frequency Plasma-Water Injection System",
    "category": "Energy, Power & Propulsion",
    "readTime": "6 min read",
    "publishedAt": "2026-09-25",
    "description": "Micro-Pulsed Plasma Reactor that converts water mist into a high-energy combustion catalyst (HHO) in real-time. 2026 Tech Briefs Contest Finalist.",
    "tags": ["Energy", "Tech Briefs 2026", "Propulsion", "HHO", "Plasma Reactor"],
    "keywords": "micro-pulsed plasma reactor, high-frequency plasma water injection, dipole alignment track, catalytic combustion",
    "content": "The Objective: To bypass traditional fuel constraints by utilizing a Micro-Pulsed Plasma Reactor that converts water mist into a high-energy combustion catalyst (HHO) in real-time.\n\n### Dipole Alignment Track\nUtilizing a 10-foot medical-grade delivery line, the water is subjected to a 10-stage N52 Neodymium Magnetic Gradient. This linear alignment track 'massages' the water clusters, reducing fluid entropy and orienting molecular dipoles. By the time the water reaches the injector, the O-H bonds are in a 'magnetically stressed,' brittle state.\n\n### Plasma-Induced Dissociation\nA high-frequency inverter creates a concentrated 1mm purple plasma arc. Because the droplets are pre-conditioned and the surface-area-to-volume ratio is optimized at the 1mm scale, the plasma 'shatters' the molecular bonds. This triggers localized dissociation into hydrogen and oxygen radicals, injected directly into the engine intake."
  },
  {
    "id": "tb-2026-robotics",
    "slug": "cursor-of-cad-ai-agentic-engine-cnc",
    "title": "Cursor of CAD: An AI-Native Agentic Engine for CNC Geometry",
    "category": "Robotics & Automation",
    "readTime": "4 min read",
    "publishedAt": "2026-09-25",
    "description": "An AI-native geometric engine that replaces manual drawing with an agentic, natural-language-driven workflow. 2026 Tech Briefs Contest Finalist.",
    "tags": ["Robotics", "CAD", "Tech Briefs 2026", "CNC Geometry", "AI Engine"],
    "keywords": "Cursor of CAD, geometric protocol, prompt-to-geometry engine, 1mm precision CNC, infinite resolution tracing",
    "content": "In the modern CNC and manufacturing industry, the design phase remains the most significant bottleneck. Operators still rely on manual vector tracing and legacy CAD software. Cursor of CAD (powered by the Ali CNC Trace It protocol) is an AI-native geometric engine that replaces manual drawing with an agentic, natural-language-driven workflow.\n\n### Prompt-to-Geometry Engine\nBypassing traditional toolbars, the system uses a Python-based logic to generate complex 2D and 2.5D vectors from natural language descriptions or low-resolution image inputs.\n\n### 1mm Precision Guarantee\nBuilt specifically for the manufacturing floor, the engine operates on a strict millimeter-standard, ensuring that AI-generated paths are not just 'visuals' but are mathematically accurate for G-code toolpathing. This democratization reduces design-to-production time by up to 90%."
  },
  {
    "id": "tb-2026-electronics",
    "slug": "vectorvision-geometric-protocol",
    "title": "VectorVision: A Geometric Protocol for Infinite-Resolution Digital Media",
    "category": "Electronics",
    "readTime": "5 min read",
    "publishedAt": "2026-09-25",
    "description": "A revolutionary coordinate-based mathematical protocol (.svgv for video, .svgc for static images) achieving infinite resolution. 2026 Tech Briefs Contest Finalist.",
    "tags": ["Electronics", "Codec", "Tech Briefs 2026", "VectorVision", "Digital Media"],
    "keywords": "VectorVision, geometric protocol, .svgv video codec, infinite resolution media, dynamic motion logic",
    "content": "Traditional digital media relies on rasterization—a grid of pixels (JPG, MP4) inherently limited by resolution. VectorVision introduces a revolutionary coordinate-based mathematical protocol (.svgv for video, .svgc for static images). Unlike traditional codecs that store color values for millions of dots, VectorVision stores the mathematical DNA of the scene.\n\n### Technical Innovation\nBuilt on a custom C++/NDK architecture optimized for mobile. For video (.svgv), the system tracks coordinate transformations rather than redrawing frames, resulting in up to 85% data compression compared to standard H.264/H.265 codecs.\n\n### Infinite Scalability\nBecause images are generated by math, a single VectorVision file scales from a smartphone screen to a billboard without any loss in fidelity or file bloat, drastically redefining telecommunications bandwidth needs."
  },
  {
    "id": "tb-2026-aerospace",
    "slug": "bio-inspired-human-flight-parametric-wing",
    "title": "Bio-Inspired Human Flight: Parametric Multi-Feather Wing System",
    "category": "Aerospace & Defense",
    "readTime": "5 min read",
    "publishedAt": "2026-09-25",
    "description": "A bio-mimetic wing system designed for human-scale flight, modeled with 1mm precision in Onshape. 2026 Tech Briefs Contest Finalist.",
    "tags": ["Aerospace", "Aviation", "Tech Briefs 2026", "Bio-mimetic Wing", "UAV"],
    "keywords": "bio-inspired human flight, parametric multi-feather wing, Onshape variable studios, von Mises stress analysis",
    "content": "This project presents a bio-mimetic wing system designed for human-scale flight, modeled with 1mm precision in Onshape. Unlike rigid traditional wings, this design utilizes a series of 'human feathers' that mimic the skeletal structure and plumage of large birds of prey.\n\n### Parametric Design\nUtilizing Onshape’s variable studios, the wing's aspect ratio and feather pitch are fully adjustable, allowing for optimized lift-to-drag ratios during different flight phases.\n\n### Advanced FEA Simulation\nThe design has undergone von Mises stress analysis to ensure structural integrity under vertical lift loads. The 'Wing Bones' distribute stress across a central spine, preventing material fatigue. This offers a blueprint for the next generation of personal aviation and agile UAVs."
  }
]

with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

data = new_blogs + data

with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

with open(ts_file, 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Replace the array content
# Find the start of the array
start_idx = ts_content.find('export const blogs: BlogPost[] = [')
if start_idx != -1:
    end_idx = ts_content.find('];', start_idx)
    new_ts_content = 'export const blogs: BlogPost[] = ' + json.dumps(data, indent=2) + ';\n'
    ts_content = ts_content[:start_idx] + new_ts_content
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(ts_content)

print('Successfully added the 5 blogs!')
