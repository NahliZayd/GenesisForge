import * as THREE from 'three';

import { QuadNode } from './QuadNode';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders/atmosphere';
import { CloudLayer } from '../effects/CloudLayer';

export class Globe {
    public radius: number = 10;
    public container: THREE.Object3D;
    public children: QuadNode[] = [];
    public params: any = { frequency: 1.0, heightMultiplier: 0.1, seed: 42 };
    public cloudLayer: CloudLayer | null = null;
    public autoRotate: boolean = false;
    public rotationSpeed: number = 0.1;

    constructor(radius: number) {
        this.radius = radius;
        this.container = new THREE.Group();
        this.initialize();
    }

    initialize() {
        // Atmosphere Glow (rendered first, behind everything)
        const atmosphereGeo = new THREE.IcosahedronGeometry(this.radius * 1.15, 5);
        const atmosphereMat = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            uniforms: {
                glowColor: { value: new THREE.Color(0x88ccff) },
                coefficient: { value: 0.5 },
                power: { value: 3.5 }
            },
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        this.container.add(atmosphereMesh);

        // Water Sphere
        const waterGeo = new THREE.IcosahedronGeometry(this.radius, 4); // High detail sphere
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x1a5fb4, // Deep ocean blue
            transparent: false, // Fully opaque to avoid render order issues
            roughness: 0.3,
            metalness: 0.2,
            flatShading: false
        });

        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.container.add(waterMesh);

        // Cloud Layer
        this.cloudLayer = new CloudLayer(this.radius);
        this.container.add(this.cloudLayer.getMesh());
        this.cloudLayer.setVisible(false); // Hidden by default


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
            this.children.push(rootNode);
            if (rootNode.mesh) this.container.add(rootNode.mesh);
        });
    }

    update(camera: THREE.Camera, delta: number = 0, sunDirection?: THREE.Vector3) {
        this.children.forEach(face => face.updateLOD(camera.position));

        // Auto rotation
        if (this.autoRotate) {
            this.container.rotation.y += delta * this.rotationSpeed;
        }

        // Update clouds
        if (this.cloudLayer && sunDirection) {
            this.cloudLayer.update(delta, sunDirection);
        }
    }

    rebuild() {
        // Simple rebuild: clear children and re-init
        // Clean up meshes
        // Clear everything including water
        while (this.container.children.length > 0) {
            const obj = this.container.children[0];
            this.container.remove(obj);
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                (obj.material as THREE.Material).dispose();
            }
        }
        this.children = [];

        // Re-init
        this.initialize();
    }
}
