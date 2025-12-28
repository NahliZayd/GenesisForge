# GenesisForge 🪐

**GenesisForge** is a procedural planet generation engine designed to simulate geology, climate, and biosphere on a planetary scale in real-time.

## � Getting Started

### Prerequisites
*   Node.js (v18+)

### Installation
```bash
npm install
npm run dev
```

## 🏗 Tech Stack
*   **Language**: TypeScript
*   **3D Engine**: Three.js
*   **Build**: Vite
*   **Architecture**: Data-Oriented Design with Web Workers for heavy simulation.

## 🗺️ Roadmap Overview

1.  **Phase 1: The Silent Sphere (MVP)**
    *   Setup Project & "Floating Origin" system.
    *   Cube-Sphere Geometry & Quadtree LOD.
    *   Basic Texture/Splatting.
2.  **Phase 2: The Living Planet**
    *   Atmosphere & Water Shaders.
    *   Static Biomes & Climate mapping.
3.  **Phase 3: Deep Time Simulation**
    *   Tectonic movements.
    *   Hydraulic erosion & weather systems.
4.  **Phase 4: Biosphere**
    *   Procedural flora & fauna.

## 📐 Architecture Highlights
The engine separates **Simulation** (Worker threads) from **Visuals** (Main thread/GPU).
*   **Core**: Quadtree Cube-Sphere.
*   **Generation**: Asynchronous chunk generation.
*   **Rendering**: WebGL 2 / WebGPU ready.
