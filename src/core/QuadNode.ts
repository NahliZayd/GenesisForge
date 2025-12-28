import * as THREE from 'three';
import { Globe } from './Globe';
import { MathUtils } from './MathUtils';

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

    createMesh() {
        // Temp visualization: Wireframe plane
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 4, 4), new THREE.MeshBasicMaterial({ wireframe: true, color: this.getLevelColor() }));
        this.updateTransform();
    }

    updateTransform() {
        if (!this.mesh) return;

        // Very basic placement on the cube face (Not spherical yet, just visual debug)
        const centerU = (this.min.x + this.max.x) / 2;
        const centerV = (this.min.y + this.max.y) / 2;

        // Convert screen center to 3D direction
        const direction = MathUtils.cubeToSphere(this.faceNormal, centerU, centerV);

        // Scale by radius
        this.mesh.position.copy(direction).multiplyScalar(this.globe.radius);
        this.mesh.lookAt(new THREE.Vector3(0, 0, 0));
    }

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
