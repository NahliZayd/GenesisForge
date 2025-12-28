import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';

const noise3D = createNoise3D();

// Re-implementing cubeToSphere here to avoid import issues in pure worker context without complex setup
// Ideally this is shared, but for MVP this is safer.
function cubeToSphere(faceNormal: Float32Array, u: number, v: number, out: Float32Array) {
    // Let's stick to the robust vector math but scalar to avoid THREE dependency in high-perf loop if possible.
    // Actually, we can just use the vector math.

    // Unoptimized readability for now, can be optimized to flat arrays later.
    const n = new THREE.Vector3().fromArray(faceNormal);
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(n.y) > 0.9) up.set(0, 0, 1);

    const t = new THREE.Vector3().crossVectors(up, n).normalize();
    const b = new THREE.Vector3().crossVectors(n, t).normalize();

    const p = new THREE.Vector3().copy(n)
        .addScaledVector(t, u)
        .addScaledVector(b, v)
        .normalize();

    out[0] = p.x;
    out[1] = p.y;
    out[2] = p.z;
}

self.onmessage = (e) => {
    const { id, faceNormal, min, max, resolution, radius, params } = e.data;


    const vertexCount = (resolution + 1) * (resolution + 1);
    const positions = new Float32Array(vertexCount * 3);
    const indices = []; // Uint16 or Uint32 depending on size

    const fn = new Float32Array(faceNormal);
    const p = new Float32Array(3);

    // Color Buffer (RGB)
    const colors = new Float32Array(vertexCount * 3);

    for (let y = 0; y <= resolution; y++) {
        const v = min.y + (max.y - min.y) * (y / resolution);

        for (let x = 0; x <= resolution; x++) {
            const u = min.x + (max.x - min.x) * (x / resolution);

            cubeToSphere(fn, u, v, p);

            // Noise Parameters
            const frequency = params?.frequency || 1.0;
            const heightMultiplier = params?.heightMultiplier || 0.1;

            // Fractal Brownian Motion (FBM) - Multiple octaves for realistic terrain
            let elevation = 0;
            let amplitude = 1.0;
            let freq = frequency;
            const octaves = 5;
            const persistence = 0.5; // How much each octave contributes
            const lacunarity = 2.0;   // Frequency multiplier per octave

            for (let i = 0; i < octaves; i++) {
                elevation += noise3D(p[0] * freq, p[1] * freq, p[2] * freq) * amplitude;
                amplitude *= persistence;
                freq *= lacunarity;
            }

            elevation *= heightMultiplier;


            // const r = radius * (1 + elevation); // Unused


            // Correction: Real planets have water *above* the crust. 
            // For MVP: Radius = Sea Level. 
            // if elevation > 0 -> Land. if elevation < 0 -> Ocean Depth.

            const finalRadius = radius * (1 + elevation);

            const i = (y * (resolution + 1) + x) * 3;
            positions[i] = p[0] * finalRadius;
            positions[i + 1] = p[1] * finalRadius;
            positions[i + 2] = p[2] * finalRadius;

            // Color Logic (Enhanced Biomes)
            let rCol = 0, gCol = 0, bCol = 0;

            if (elevation < 0) {
                // Sea Floor (Dark Sand / Wet Sand)
                const depth = Math.max(-1.0, elevation * 5.0);
                const colorFactor = 1.0 + depth * 0.5;

                rCol = 0.6 * colorFactor;
                gCol = 0.55 * colorFactor;
                bCol = 0.4 * colorFactor;
            } else if (elevation < 0.005) {
                // Beach (Sand) - Very narrow band
                rCol = 0.93; gCol = 0.87; bCol = 0.69;
            } else if (elevation < 0.02) {
                // Coastal Vegetation (Light Green)
                rCol = 0.5; gCol = 0.7; bCol = 0.3;
            } else if (elevation < 0.04) {
                // Lowland Forest (Rich Green)
                rCol = 0.2; gCol = 0.6; bCol = 0.2;
            } else if (elevation < 0.07) {
                // Highland / Mountain Base (Dark Green to Brown)
                const t = (elevation - 0.04) / 0.03;
                rCol = 0.2 + t * 0.3;
                gCol = 0.5 - t * 0.2;
                bCol = 0.1;
            } else if (elevation < 0.10) {
                // Rocky Mountain (Gray-Brown)
                rCol = 0.5; gCol = 0.45; bCol = 0.4;
            } else {
                // Snow Peaks (White with slight blue tint)
                const snowIntensity = Math.min(1.0, (elevation - 0.10) * 5.0);
                rCol = 0.7 + snowIntensity * 0.3;
                gCol = 0.7 + snowIntensity * 0.3;
                bCol = 0.75 + snowIntensity * 0.25;
            }

            colors[i] = rCol;
            colors[i + 1] = gCol;
            colors[i + 2] = bCol;
        }
    }

    // Indices
    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const a = y * (resolution + 1) + x;
            const b = y * (resolution + 1) + x + 1;
            const c = (y + 1) * (resolution + 1) + x;
            const d = (y + 1) * (resolution + 1) + x + 1;

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const indicesArray = new Uint16Array(indices);

    self.postMessage({
        id,
        positions,
        colors,
        indices: indicesArray
    }, { transfer: [positions.buffer, colors.buffer, indicesArray.buffer] });
};

