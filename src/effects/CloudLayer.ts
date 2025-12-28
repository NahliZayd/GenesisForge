import * as THREE from 'three';


/**
 * Procedural cloud layer
 */
export class CloudLayer {
    private mesh: THREE.Mesh;
    private material: THREE.ShaderMaterial;
    private time: number = 0;

    constructor(radius: number) {
        const geometry = new THREE.IcosahedronGeometry(radius * 1.05, 5);

        this.material = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 sunDirection;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                // Simplex noise function (simplified)
                float noise(vec3 p) {
                    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                }
                
                void main() {
                    vec3 pos = normalize(vPosition);
                    
                    // Animated cloud noise
                    float n = noise(pos * 3.0 + time * 0.1);
                    n += noise(pos * 6.0 + time * 0.15) * 0.5;
                    n += noise(pos * 12.0 + time * 0.2) * 0.25;
                    n /= 1.75;
                    
                    // Cloud threshold
                    float cloudDensity = smoothstep(0.4, 0.6, n);
                    
                    // Lighting
                    float light = max(0.0, dot(vNormal, sunDirection)) * 0.5 + 0.5;
                    
                    vec3 cloudColor = vec3(1.0) * light;
                    
                    gl_FragColor = vec4(cloudColor, cloudDensity * 0.6);
                }
            `,
            uniforms: {
                time: { value: 0 },
                sunDirection: { value: new THREE.Vector3(1, 0.5, 0.5).normalize() }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
    }

    getMesh(): THREE.Mesh {
        return this.mesh;
    }

    update(delta: number, sunDirection: THREE.Vector3) {
        this.time += delta;
        this.material.uniforms.time.value = this.time;
        this.material.uniforms.sunDirection.value.copy(sunDirection);
    }

    setVisible(visible: boolean) {
        this.mesh.visible = visible;
    }
}
