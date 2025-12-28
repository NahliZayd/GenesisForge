import * as THREE from 'three';
import { QuadNode } from './QuadNode';

export class Globe {
    public container: THREE.Group;
    public radius: number = 2.0;
    public faces: QuadNode[] = [];

    constructor() {
        this.container = new THREE.Group();
        this.initFaces();
    }

    initFaces() {
        // The 6 directions of a cube
        const normals = [
            new THREE.Vector3(1, 0, 0),  // Right
            new THREE.Vector3(-1, 0, 0), // Left
            new THREE.Vector3(0, 1, 0),  // Top
            new THREE.Vector3(0, -1, 0), // Bottom
            new THREE.Vector3(0, 0, 1),  // Front
            new THREE.Vector3(0, 0, -1)  // Back
        ];

        normals.forEach(normal => {
            const rootNode = new QuadNode(
                this,
                null,
                0,
                normal,
                new THREE.Vector2(-1, -1),
                new THREE.Vector2(1, 1)
            );
            this.faces.push(rootNode);
            if (rootNode.mesh) this.container.add(rootNode.mesh);
        });
    }

    update(camera: THREE.Camera) {
        this.faces.forEach(face => face.updateLOD(camera.position));
    }
}
