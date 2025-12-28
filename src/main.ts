import * as THREE from 'three';
import { Globe } from './core/Globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


// --- Initialization ---
const init = () => {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    // Renderer
    const container = document.getElementById('canvas-container');
    if (!container) throw new Error('Container not found');

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Globe
    const globe = new Globe();
    scene.add(globe.container);

    // Loop
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        globe.update(camera);
        renderer.render(scene, camera);
    };

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
    console.log("GenesisForge Active - QuadTree initialized");
};


init();
