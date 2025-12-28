import * as THREE from 'three';

/**
 * Starfield background generator
 */
export class Starfield {
    private mesh: THREE.Points;

    constructor(count: number = 10000, radius: number = 500) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Random position on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random star color (white to slight blue/yellow tint)
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = colorVariation;
            colors[i * 3 + 1] = colorVariation;
            colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Points(geometry, material);
    }

    getMesh(): THREE.Points {
        return this.mesh;
    }

    update(delta: number) {
        // Slow rotation for parallax effect
        this.mesh.rotation.y += delta * 0.01;
    }
}
