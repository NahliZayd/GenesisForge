import * as THREE from 'three';

import { Globe } from './Globe';
import { WorkerManager } from './WorkerManager';


export class QuadNode {
    public children: QuadNode[] = [];
    public mesh: THREE.Mesh | null = null;

    constructor(
        public globe: Globe,
        public parent: QuadNode | null,
        public level: number,
        public faceNormal: THREE.Vector3,
        public min: THREE.Vector2, // (u, v) min range [-1, 1]
        public max: THREE.Vector2  // (u, v) max range [-1, 1]
    ) {
        this.createMesh();
    }

    async createMesh() {
        const resolution = 16;

        const data = await WorkerManager.getInstance().generateGeometry(
            this.faceNormal,
            this.min,
            this.max,
            resolution,
            this.globe.radius,
            this.globe.params
        );


        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));

        if (data.colors) {
            geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
        }

        geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
        geometry.computeVertexNormals();

        const material = data.colors ?
            new THREE.MeshStandardMaterial({
                vertexColors: true,
                flatShading: false, // Smooth shading to prevent transparency artifacts
                roughness: 0.8,
                metalness: 0.1,
                side: THREE.DoubleSide // Render both sides
            }) :
            new THREE.MeshStandardMaterial({
                color: 0xcccccc, // Fallback color
                flatShading: false,
                roughness: 1.0,
                side: THREE.DoubleSide
            });

        this.mesh = new THREE.Mesh(geometry, material);


        // No need for updateTransform() anymore as positions are generated in world space (relative to valid local origin) in the worker?
        // Wait, the worker generates normalized sphere vectors * radius.
        // That is already in object space relative to the planet center.
        // If "Planet" is at (0,0,0), then we are good.

        if (this.globe.container) this.globe.container.add(this.mesh);
    }

    // Removed updateTransform() as geometry is baked.


    getLevelColor(): number {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff, 0xff00ff];
        return colors[this.level % colors.length];
    }

    // Check if we should split
    updateLOD(cameraPosition: THREE.Vector3) {
        const dist = this.mesh?.position.distanceTo(cameraPosition) || Infinity;

        // Simple heuristic: Split if close enough
        const splitDist = 20.0 / (this.level + 1);

        if (dist < splitDist && this.level < 5) {
            if (this.children.length === 0) this.split();
            this.children.forEach(c => c.updateLOD(cameraPosition));
        } else {
            if (this.children.length > 0) this.merge();
        }
    }

    split() {
        const midX = (this.min.x + this.max.x) / 2;
        const midY = (this.min.y + this.max.y) / 2;

        const quadrants = [
            { min: new THREE.Vector2(this.min.x, this.min.y), max: new THREE.Vector2(midX, midY) }, // Bottom-Left
            { min: new THREE.Vector2(midX, this.min.y), max: new THREE.Vector2(this.max.x, midY) }, // Bottom-Right
            { min: new THREE.Vector2(this.min.x, midY), max: new THREE.Vector2(midX, this.max.y) }, // Top-Left
            { min: new THREE.Vector2(midX, midY), max: new THREE.Vector2(this.max.x, this.max.y) }  // Top-Right
        ];

        this.children = quadrants.map(q => new QuadNode(this.globe, this, this.level + 1, this.faceNormal, q.min, q.max));

        // Add children to scene, remove self
        if (this.mesh) this.mesh.visible = false;
        this.children.forEach(c => {
            if (c.mesh && this.globe.container) this.globe.container.add(c.mesh);
        });
    }

    merge() {
        this.children.forEach(c => {
            if (c.mesh) c.mesh.removeFromParent();
        });
        this.children = [];
        if (this.mesh) this.mesh.visible = true;
    }
}
